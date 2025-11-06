# Managed Hosting Implementation Guide

Complete guide to offering managed MarkItUp hosting as a service.

## 🎯 Overview

This guide covers everything needed to launch a managed hosting service for MarkItUp, from infrastructure to billing to customer onboarding.

## 📋 Table of Contents

 1. [Infrastructure Setup](#infrastructure-setup)
 2. [Automation & Orchestration](#automation--orchestration)
 3. [Billing & Subscription Management](#billing--subscription-management)
 4. [Customer Portal](#customer-portal)
 5. [Deployment Automation](#deployment-automation)
 6. [Monitoring & Alerts](#monitoring--alerts)
 7. [Backup & Recovery](#backup--recovery)
 8. [Support System](#support-system)
 9. [Scaling Strategy](#scaling-strategy)
10. [Cost Analysis](#cost-analysis)

---

## 🏗️ Infrastructure Setup

### Phase 1: Single Server Setup (0-50 customers)

**Recommended Provider:** Hetzner (best price/performance)

**Server Specs:**

- **CPX41** (8 vCPU, 16GB RAM, 240GB NVMe) - €24.90/month
- Can host 30-50 instances comfortably
- High-performance AMD EPYC processors

**Alternative Providers:**

- **DigitalOcean** - $96/month (8 vCPU, 16GB RAM)
- **Linode** - $96/month (8 vCPU, 16GB RAM)
- **Vultr** - $96/month (8 vCPU, 16GB RAM)

### Infrastructure Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Load Balancer                       │
│              (Caddy or Traefik)                      │
│         - Auto SSL (Let's Encrypt)                   │
│         - Reverse Proxy                              │
│         - HTTP/2, HTTP/3                             │
└─────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼─────┐  ┌──────▼─────┐
│  Instance 1  │  │ Instance 2  │  │ Instance N  │
│ customer1.   │  │ customer2.  │  │ customerN.  │
│ markitup.io  │  │ markitup.io │  │ markitup.io │
│              │  │             │  │             │
│ Docker       │  │ Docker      │  │ Docker      │
│ Container    │  │ Container   │  │ Container   │
└──────────────┘  └─────────────┘  └─────────────┘
```

### Server Setup Script

```bash
#!/bin/bash
# setup-server.sh - Initial server configuration

set -e

echo "🚀 Setting up MarkItUp Hosting Server..."

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Caddy (reverse proxy with auto SSL)
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy -y

# Install monitoring tools
apt-get install -y htop iotop nethogs ncdu

# Create directory structure
mkdir -p /opt/markitup/{customers,backups,scripts,logs}
mkdir -p /opt/markitup/caddy/{config,data}

# Set up firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create management user
useradd -m -s /bin/bash markitup
usermod -aG docker markitup

echo "✅ Server setup complete!"
echo "Next steps:"
echo "1. Configure DNS for *.markitup.io"
echo "2. Deploy management API"
echo "3. Set up billing integration"
```

---

## 🤖 Automation & Orchestration

### Customer Instance Manager API

Create a management API to handle customer lifecycle:

```typescript
// src/app/api/hosting/provision/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import Stripe from 'stripe';

const execAsync = promisify(exec);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface ProvisionRequest {
  customerId: string;
  subdomain: string;
  plan: 'personal' | 'team' | 'pro';
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProvisionRequest = await request.json();
    
    // Validate subdomain availability
    const available = await checkSubdomainAvailable(body.subdomain);
    if (!available) {
      return NextResponse.json(
        { error: 'Subdomain not available' },
        { status: 400 }
      );
    }

    // Create customer instance
    const instance = await provisionInstance(body);
    
    // Set up DNS
    await configureDNS(body.subdomain);
    
    // Create Stripe subscription
    const subscription = await createSubscription(body);
    
    // Send welcome email
    await sendWelcomeEmail(body.email, instance);
    
    return NextResponse.json({
      success: true,
      instance,
      subscription: subscription.id,
    });
  } catch (error) {
    console.error('Provisioning error:', error);
    return NextResponse.json(
      { error: 'Provisioning failed' },
      { status: 500 }
    );
  }
}

async function provisionInstance(config: ProvisionRequest) {
  const { subdomain, plan, customerId } = config;
  
  // Generate instance configuration
  const instanceConfig = {
    subdomain,
    customerId,
    plan,
    port: await getAvailablePort(),
    createdAt: new Date().toISOString(),
  };
  
  // Create customer directory
  const customerPath = `/opt/markitup/customers/${customerId}`;
  await execAsync(`mkdir -p ${customerPath}/{markdown,uploads,config}`);
  
  // Generate docker-compose.yml
  const composeFile = generateDockerCompose(instanceConfig);
  await execAsync(`echo '${composeFile}' > ${customerPath}/docker-compose.yml`);
  
  // Generate environment file
  const envFile = generateEnvFile(instanceConfig);
  await execAsync(`echo '${envFile}' > ${customerPath}/.env`);
  
  // Start instance
  await execAsync(`cd ${customerPath} && docker-compose up -d`);
  
  // Wait for health check
  await waitForHealthy(instanceConfig.port);
  
  // Save instance metadata
  await saveInstanceMetadata(instanceConfig);
  
  return instanceConfig;
}

function generateDockerCompose(config: any): string {
  return `
version: '3.8'

services:
  markitup:
    image: ghcr.io/xclusive36/markitup:latest
    container_name: markitup_${config.customerId}
    restart: unless-stopped
    ports:
      - "${config.port}:3000"
    volumes:
      - ./markdown:/app/markdown
      - ./uploads:/app/uploads
      - ./config:/app/config
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - CUSTOMER_ID=${config.customerId}
      - PLAN=${config.plan}
    labels:
      - "markitup.customer=${config.customerId}"
      - "markitup.subdomain=${config.subdomain}"
      - "markitup.plan=${config.plan}"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    mem_limit: ${getPlanMemoryLimit(config.plan)}
    cpus: ${getPlanCPULimit(config.plan)}
  `.trim();
}

function generateEnvFile(config: any): string {
  return `
NODE_ENV=production
CUSTOMER_ID=${config.customerId}
PLAN=${config.plan}
STORAGE_LIMIT=${getPlanStorageLimit(config.plan)}
USER_LIMIT=${getPlanUserLimit(config.plan)}
  `.trim();
}

function getPlanMemoryLimit(plan: string): string {
  const limits = {
    personal: '512m',
    team: '1g',
    pro: '2g',
  };
  return limits[plan as keyof typeof limits] || '512m';
}

function getPlanCPULimit(plan: string): string {
  const limits = {
    personal: '0.5',
    team: '1.0',
    pro: '2.0',
  };
  return limits[plan as keyof typeof limits] || '0.5';
}

function getPlanStorageLimit(plan: string): number {
  const limits = {
    personal: 5 * 1024 * 1024 * 1024, // 5GB
    team: 25 * 1024 * 1024 * 1024, // 25GB
    pro: 100 * 1024 * 1024 * 1024, // 100GB
  };
  return limits[plan as keyof typeof limits] || limits.personal;
}

function getPlanUserLimit(plan: string): number {
  const limits = {
    personal: 1,
    team: 5,
    pro: 20,
  };
  return limits[plan as keyof typeof limits] || 1;
}

async function getAvailablePort(): Promise<number> {
  // Start from port 4000 and find first available
  const usedPorts = await getUsedPorts();
  for (let port = 4000; port < 5000; port++) {
    if (!usedPorts.includes(port)) {
      return port;
    }
  }
  throw new Error('No available ports');
}

async function getUsedPorts(): Promise<number[]> {
  // Query Docker containers for used ports
  const { stdout } = await execAsync(
    "docker ps --format '{{.Ports}}' | grep -oP '\\d+(?=->3000)' || true"
  );
  return stdout.split('\n').filter(Boolean).map(Number);
}

async function waitForHealthy(port: number, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.ok) return;
    } catch (error) {
      // Continue retrying
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Instance failed to become healthy');
}

async function checkSubdomainAvailable(subdomain: string): Promise<boolean> {
  // Check against database of existing subdomains
  // This is a placeholder - implement with your database
  const { stdout } = await execAsync(
    `grep -r "${subdomain}" /opt/markitup/customers/*/config/metadata.json || echo "available"`
  );
  return stdout.includes('available');
}

async function configureDNS(subdomain: string): Promise<void> {
  // Configure DNS with your provider
  // Example for Cloudflare API:
  const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflareToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'A',
      name: subdomain,
      content: process.env.SERVER_IP,
      ttl: 1,
      proxied: true,
    }),
  });
}

async function createSubscription(config: ProvisionRequest) {
  const prices = {
    personal: process.env.STRIPE_PRICE_PERSONAL,
    team: process.env.STRIPE_PRICE_TEAM,
    pro: process.env.STRIPE_PRICE_PRO,
  };
  
  const subscription = await stripe.subscriptions.create({
    customer: config.customerId,
    items: [{ price: prices[config.plan] }],
    metadata: {
      subdomain: config.subdomain,
      plan: config.plan,
    },
  });
  
  return subscription;
}

async function saveInstanceMetadata(instance: any): Promise<void> {
  const metadata = JSON.stringify(instance, null, 2);
  await execAsync(
    `echo '${metadata}' > /opt/markitup/customers/${instance.customerId}/config/metadata.json`
  );
}

async function sendWelcomeEmail(email: string, instance: any): Promise<void> {
  // Implement with your email service (SendGrid, Postmark, etc.)
  console.log(`Sending welcome email to ${email} for ${instance.subdomain}`);
}
```

### Caddy Configuration for Auto-SSL

```caddyfile
# /etc/caddy/Caddyfile

{
  email admin@markitup.io
}

# Wildcard for all customer subdomains
*.markitup.io {
  @customer {
    host_regexp subdomain ^([a-z0-9-]+)\.markitup\.io$
  }
  
  handle @customer {
    reverse_proxy {re.subdomain.1}:* {
      # Route to correct port based on customer metadata
      to unix//var/run/markitup-router.sock
    }
  }
  
  # Logging
  log {
    output file /opt/markitup/logs/caddy-access.log
    format json
  }
}

# Main marketing site
markitup.io {
  reverse_proxy localhost:3000
}

# Customer portal
portal.markitup.io {
  reverse_proxy localhost:3001
}
```

### Smart Routing Script

```python
#!/usr/bin/env python3
# /opt/markitup/scripts/router.py
# Routes requests to correct customer instance port

import json
import os
import socket
from http.server import BaseHTTPRequestHandler, HTTPServer

CUSTOMERS_DIR = '/opt/markitup/customers'
ROUTER_SOCKET = '/var/run/markitup-router.sock'

def get_customer_port(subdomain):
    """Get port for customer subdomain"""
    for customer_dir in os.listdir(CUSTOMERS_DIR):
        metadata_path = f'{CUSTOMERS_DIR}/{customer_dir}/config/metadata.json'
        if os.path.exists(metadata_path):
            with open(metadata_path) as f:
                data = json.load(f)
                if data.get('subdomain') == subdomain:
                    return data.get('port')
    return None

class RouterHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        subdomain = self.headers.get('Host', '').split('.')[0]
        port = get_customer_port(subdomain)
        
        if port:
            self.send_response(200)
            self.send_header('X-Backend-Port', str(port))
            self.end_headers()
            self.wfile.write(f'localhost:{port}'.encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    # Remove existing socket
    if os.path.exists(ROUTER_SOCKET):
        os.remove(ROUTER_SOCKET)
    
    server = HTTPServer(ROUTER_SOCKET, RouterHandler)
    server.serve_forever()
```

---

## 💳 Billing & Subscription Management

### Stripe Integration

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

// Pricing (in cents)
export const PRICING = {
  personal: {
    monthly: 799, // $7.99/month
    yearly: 7990, // $79.90/year (2 months free)
  },
  team: {
    monthly: 1999, // $19.99/month
    yearly: 19990, // $199.90/year
  },
  pro: {
    monthly: 7999, // $79.99/month
    yearly: 79990, // $799.90/year
  },
};

// Create checkout session
export async function createCheckoutSession(
  customerId: string,
  plan: keyof typeof PRICING,
  interval: 'monthly' | 'yearly'
) {
  const priceId = await getOrCreatePrice(plan, interval);
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: {
      plan,
      interval,
    },
  });
  
  return session;
}

// Webhook handler
export async function handleWebhook(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subdomain = session.metadata?.subdomain;
  const plan = session.metadata?.plan;
  
  // Provision instance
  await fetch(`${process.env.INTERNAL_API_URL}/api/hosting/provision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: session.customer,
      subdomain,
      plan,
      email: session.customer_email,
    }),
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Handle plan upgrades/downgrades
  const customerId = subscription.customer as string;
  const newPlan = subscription.metadata?.plan;
  
  await updateInstancePlan(customerId, newPlan);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Grace period of 7 days
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
  
  await scheduleInstanceDeletion(customerId, gracePeriodEnd);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Send payment reminder email
  await sendPaymentReminderEmail(customerId);
  
  // Suspend instance after 3 failed payments
  if (invoice.attempt_count >= 3) {
    await suspendInstance(customerId);
  }
}

async function getOrCreatePrice(
  plan: keyof typeof PRICING,
  interval: 'monthly' | 'yearly'
): Promise<string> {
  // Store price IDs in environment or database
  const priceKey = `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`;
  return process.env[priceKey]!;
}

async function updateInstancePlan(customerId: string, plan: string) {
  // Update instance resources
  console.log(`Updating ${customerId} to ${plan}`);
}

async function scheduleInstanceDeletion(customerId: string, date: Date) {
  // Schedule deletion job
  console.log(`Scheduling deletion for ${customerId} on ${date}`);
}

async function suspendInstance(customerId: string) {
  // Stop Docker container but keep data
  console.log(`Suspending instance for ${customerId}`);
}

async function sendPaymentReminderEmail(customerId: string) {
  // Send email
  console.log(`Sending payment reminder to ${customerId}`);
}
```

### Webhook Endpoint

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleWebhook } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    await handleWebhook(event);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
```

---

## 🎨 Customer Portal

### Dashboard Component

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Instance {
  subdomain: string;
  plan: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  storage: {
    used: number;
    limit: number;
  };
  users: {
    current: number;
    limit: number;
  };
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadInstance();
  }, []);
  
  async function loadInstance() {
    const response = await fetch('/api/hosting/instance');
    const data = await response.json();
    setInstance(data);
    setLoading(false);
  }
  
  if (loading) return <div>Loading...</div>;
  if (!instance) return <div>No instance found</div>;
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your MarkItUp Instance</h1>
      
      {/* Instance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Instance URL</h3>
          <a
            href={`https://${instance.subdomain}.markitup.io`}
            className="text-xl font-bold text-blue-600 hover:underline"
            target="_blank"
          >
            {instance.subdomain}.markitup.io
          </a>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Plan</h3>
          <p className="text-xl font-bold capitalize">{instance.plan}</p>
          <button className="mt-2 text-sm text-blue-600 hover:underline">
            Upgrade Plan
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            instance.status === 'active' ? 'bg-green-100 text-green-800' :
            instance.status === 'suspended' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {instance.status}
          </span>
        </div>
      </div>
      
      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Storage Usage</h3>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>{formatBytes(instance.storage.used)}</span>
              <span>{formatBytes(instance.storage.limit)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(instance.storage.used / instance.storage.limit) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Users</h3>
          <div className="text-3xl font-bold">
            {instance.users.current} / {instance.users.limit}
          </div>
          <button className="mt-4 text-sm text-blue-600 hover:underline">
            Manage Users
          </button>
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Instance Management</h3>
        <div className="space-y-4">
          <button className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Download Backup
          </button>
          <button className="w-full md:w-auto px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 md:ml-4">
            View Logs
          </button>
          <button className="w-full md:w-auto px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 md:ml-4">
            Restart Instance
          </button>
          <button className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 md:ml-4">
            Delete Instance
          </button>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
```

---

## 📊 Monitoring & Alerts

### Prometheus + Grafana Setup

```yaml
# /opt/markitup/monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: markitup-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    container_name: markitup-grafana
    restart: unless-stopped
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  node-exporter:
    image: prom/node-exporter:latest
    container_name: markitup-node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: markitup-cadvisor
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro

volumes:
  prometheus-data:
  grafana-data:
```

### Alert Script

```bash
#!/bin/bash
# /opt/markitup/scripts/health-monitor.sh

# Monitor all customer instances and alert on issues

LOG_FILE="/opt/markitup/logs/health-monitor.log"
ALERT_WEBHOOK="${SLACK_WEBHOOK_URL}"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

alert() {
  local message="$1"
  log "ALERT: $message"
  
  # Send to Slack
  curl -X POST "$ALERT_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"🚨 MarkItUp Alert: $message\"}"
}

check_instance() {
  local customer_id="$1"
  local port="$2"
  local subdomain="$3"
  
  # Health check
  if ! curl -sf "http://localhost:$port/api/health" > /dev/null; then
    alert "Instance $subdomain ($customer_id) is unhealthy"
    
    # Attempt restart
    docker restart "markitup_$customer_id"
    sleep 10
    
    # Recheck
    if ! curl -sf "http://localhost:$port/api/health" > /dev/null; then
      alert "Instance $subdomain ($customer_id) failed to restart"
    else
      log "Instance $subdomain recovered after restart"
    fi
  fi
  
  # Check resource usage
  local mem_usage=$(docker stats "markitup_$customer_id" --no-stream --format "{{.MemPerc}}" | sed 's/%//')
  if (( $(echo "$mem_usage > 90" | bc -l) )); then
    alert "Instance $subdomain ($customer_id) using ${mem_usage}% memory"
  fi
}

# Check all instances
for customer_dir in /opt/markitup/customers/*; do
  if [ -d "$customer_dir" ]; then
    metadata_file="$customer_dir/config/metadata.json"
    if [ -f "$metadata_file" ]; then
      customer_id=$(basename "$customer_dir")
      port=$(jq -r '.port' "$metadata_file")
      subdomain=$(jq -r '.subdomain' "$metadata_file")
      
      check_instance "$customer_id" "$port" "$subdomain"
    fi
  fi
done

log "Health check completed"
```

Add to crontab:

```bash
# Run every 5 minutes
*/5 * * * * /opt/markitup/scripts/health-monitor.sh
```

---

## 💾 Backup & Recovery

### Automated Backup Script

```bash
#!/bin/bash
# /opt/markitup/scripts/backup-all.sh

BACKUP_ROOT="/opt/markitup/backups"
RETENTION_DAYS=30
S3_BUCKET="s3://markitup-backups"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

backup_instance() {
  local customer_id="$1"
  local customer_dir="/opt/markitup/customers/$customer_id"
  local timestamp=$(date +%Y%m%d_%H%M%S)
  local backup_file="$BACKUP_ROOT/$customer_id/backup_$timestamp.tar.gz"
  
  log "Backing up $customer_id..."
  
  # Create backup directory
  mkdir -p "$BACKUP_ROOT/$customer_id"
  
  # Create compressed backup
  tar -czf "$backup_file" \
    -C "$customer_dir" \
    markdown/ \
    uploads/ \
    config/
  
  # Upload to S3
  if [ -n "$S3_BUCKET" ]; then
    aws s3 cp "$backup_file" "$S3_BUCKET/$customer_id/"
    log "Uploaded to S3: $backup_file"
  fi
  
  # Clean old backups
  find "$BACKUP_ROOT/$customer_id" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
  
  log "Backup completed: $backup_file"
}

# Backup all customers
for customer_dir in /opt/markitup/customers/*; do
  if [ -d "$customer_dir" ]; then
    customer_id=$(basename "$customer_dir")
    backup_instance "$customer_id"
  fi
done

log "All backups completed"
```

### Restore Script

```bash
#!/bin/bash
# /opt/markitup/scripts/restore-instance.sh

if [ $# -lt 2 ]; then
  echo "Usage: $0 <customer_id> <backup_file>"
  exit 1
fi

CUSTOMER_ID="$1"
BACKUP_FILE="$2"
CUSTOMER_DIR="/opt/markitup/customers/$CUSTOMER_ID"

# Stop instance
docker stop "markitup_$CUSTOMER_ID"

# Backup current state (just in case)
mv "$CUSTOMER_DIR" "${CUSTOMER_DIR}.pre-restore"

# Restore from backup
mkdir -p "$CUSTOMER_DIR"
tar -xzf "$BACKUP_FILE" -C "$CUSTOMER_DIR"

# Restart instance
docker start "markitup_$CUSTOMER_ID"

echo "Restore completed for $CUSTOMER_ID"
```

---

## 📈 Scaling Strategy

### Multi-Server Architecture (50+ customers)

```
┌─────────────────────────────────────────────┐
│          Global Load Balancer                │
│        (Cloudflare / AWS Route53)            │
└─────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼─────┐ ┌────▼────┐
│  Region US   │ │Region EU│ │Region AS│
│              │ │         │ │         │
│  Server 1-N  │ │Server N │ │Server N │
└──────────────┘ └─────────┘ └─────────┘
```

### Database for Management

```sql
-- PostgreSQL schema for instance management

CREATE TABLE customers (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE instances (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  server_id VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE backups (
  id UUID PRIMARY KEY,
  instance_id UUID REFERENCES instances(id),
  filename VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  s3_key VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_instances_customer ON instances(customer_id);
CREATE INDEX idx_instances_subdomain ON instances(subdomain);
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
```

---

## 💰 Cost Analysis

### Single Server Economics (Hetzner CPX41)

**Server Cost:** €24.90/month (\~$27/month)

**Capacity:** 40 Personal plan customers

**Pricing:**

- Personal: $7.99/month
- Revenue per server: $319.60/month
- Profit margin: \~92%

**Additional Costs:**

- Domain: $12/year
- SSL: Free (Let's Encrypt)
- Monitoring: Free (self-hosted)
- Backups (S3): \~$5/month
- Email service: $10/month
- **Total monthly overhead:** \~$52

**Break-even:** 7 customers **Target:** 30 customers per server = $211/month profit

### Scaling Economics

| Customers | Servers | Monthly Revenue | Monthly Costs | Profit | Margin |
| --- | --- | --- | --- | --- | --- |
| 10 | 1 | $79.90 | $52 | $27.90 | 35% |
| 30 | 1 | $239.70 | $52 | $187.70 | 78% |
| 50 | 2 | $399.50 | $104 | $295.50 | 74% |
| 100 | 3 | $799.00 | $156 | $643.00 | 80% |
| 250 | 7 | $1,997.50 | $364 | $1,633 | 82% |
| 500 | 13 | $3,995.00 | $676 | $3,319 | 83% |

---

## 🚀 Launch Checklist

### Pre-Launch (Week 1-2)

- [ ] Set up infrastructure server

- [ ] Configure DNS (\*.markitup.io)

- [ ] Install Caddy with auto-SSL

- [ ] Create provisioning scripts

- [ ] Set up Stripe account and products

- [ ] Build customer portal

- [ ] Create pricing page

- [ ] Set up monitoring (Prometheus + Grafana)

- [ ] Configure backup system

- [ ] Write documentation

### Soft Launch (Week 3-4)

- [ ] Deploy beta pricing page

- [ ] Offer 50% off to first 20 customers

- [ ] Post on r/selfhosted about hosted option

- [ ] Create demo video

- [ ] Set up support email

- [ ] Monitor closely for issues

- [ ] Gather feedback

### Public Launch (Week 5+)

- [ ] Full marketing push

- [ ] Post on all relevant subreddits

- [ ] ProductHunt launch

- [ ] HackerNews Show HN

- [ ] Email list announcement

- [ ] Social media campaign

- [ ] Scale servers as needed

---

## 🎯 Marketing Landing Page

Create `/pricing` page:

```typescript
// src/app/pricing/page.tsx
export default function Pricing() {
  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Self-host for free, or let us handle it for you
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Personal */}
          <PricingCard
            name="Personal"
            price="$7.99"
            features={[
              '1 user',
              '5GB storage',
              'Daily backups',
              'Email support',
              'All features included',
              'Custom subdomain',
            ]}
          />
          
          {/* Team */}
          <PricingCard
            name="Team"
            price="$19.99"
            popular
            features={[
              'Up to 5 users',
              '25GB storage',
              'Real-time collaboration',
              'Priority support',
              'Advanced analytics',
              'Custom subdomain',
            ]}
          />
          
          {/* Pro */}
          <PricingCard
            name="Pro"
            price="$79.99"
            features={[
              'Up to 20 users',
              '100GB storage',
              'SSO integration',
              '24/7 support',
              'Custom domain',
              'API access',
            ]}
          />
        </div>
        
        <div className="text-center">
          <p className="text-lg mb-4">
            Want complete control? 
          </p>
          <a
            href="https://github.com/xclusive36/MarkItUp"
            className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Self-Host for Free →
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## 📞 Support System

### Help Desk Integration

Use tools like:

- **Crisp** - Free tier, live chat + email
- **Intercom** - More features, $39/month
- **Plain** - Developer-friendly, $29/month

### Knowledge Base

Create `/docs/help` with:

- Getting started guide
- Common issues
- Backup/restore
- Upgrade/downgrade
- Billing questions

---

## ✅ Summary

You now have everything needed to launch managed hosting:

1. **Infrastructure** - Hetzner server, Caddy, Docker
2. **Automation** - Provisioning API, lifecycle management
3. **Billing** - Stripe integration, webhooks
4. **Portal** - Customer dashboard
5. **Monitoring** - Health checks, alerts
6. **Backups** - Automated daily backups
7. **Scaling** - Multi-server architecture ready

**Next Steps:**

1. Set up single Hetzner server
2. Deploy provisioning system
3. Create Stripe products
4. Build pricing page
5. Launch beta with 50% discount for first 20 customers
6. Monitor and iterate

**Expected Timeline:**

- Setup: 1-2 weeks
- Beta: 2-4 weeks
- First paying customer: Week 3-4
- Break-even (7 customers): Month 2-3
- Profitable (30+ customers): Month 4-6

Good luck with your managed hosting service! 🚀