import fs from 'fs';
import path from 'path';

const TEMPLATES_FILE = path.join(process.cwd(), 'markdown', '.sentiment-templates.json');

export interface TemplateField {
  name: string;
  type: 'string' | 'date' | 'array' | 'number' | 'boolean';
  required: boolean;
  default?: any;
  description?: string;
  options?: string[]; // For select-type fields
}

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  fields: TemplateField[];
  bodyTemplate: string;
  createdAt: string;
  isBuiltIn?: boolean;
}

export interface TemplatesData {
  templates: Record<string, NoteTemplate>;
  lastUpdated: string;
}

/**
 * Built-in templates that come with the system
 */
export const BUILT_IN_TEMPLATES: Omit<NoteTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Meeting Notes',
    description: 'Template for meeting minutes and action items',
    icon: '📋',
    color: '#3B82F6',
    isBuiltIn: true,
    fields: [
      { name: 'date', type: 'date', required: true, description: 'Meeting date' },
      { name: 'attendees', type: 'array', required: true, description: 'List of attendees' },
      { name: 'project', type: 'string', required: false, description: 'Related project' },
      { name: 'duration', type: 'string', required: false, description: 'Meeting duration (e.g., 1h)' },
    ],
    bodyTemplate: `## Agenda

1. 
2. 
3. 

## Discussion Notes



## Decisions Made

- 

## Action Items

- [ ] 
- [ ] 

## Next Meeting

Date: 
Topics: `,
  },
  {
    name: 'Project',
    description: 'Template for project documentation',
    icon: '🎯',
    color: '#10B981',
    isBuiltIn: true,
    fields: [
      { name: 'status', type: 'string', required: true, description: 'Project status', options: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'] },
      { name: 'start-date', type: 'date', required: false, description: 'Project start date' },
      { name: 'deadline', type: 'date', required: false, description: 'Project deadline' },
      { name: 'team', type: 'array', required: false, description: 'Team members' },
      { name: 'priority', type: 'string', required: false, description: 'Priority level', options: ['Low', 'Medium', 'High', 'Critical'] },
    ],
    bodyTemplate: `## Overview



## Goals

- 
- 

## Requirements



## Timeline

- **Start:** 
- **Milestones:**
  - 
- **Deadline:** 

## Resources

- 

## Risks & Challenges



## Notes

`,
  },
  {
    name: 'Person',
    description: 'Template for person/contact information',
    icon: '👤',
    color: '#8B5CF6',
    isBuiltIn: true,
    fields: [
      { name: 'email', type: 'string', required: false, description: 'Email address' },
      { name: 'phone', type: 'string', required: false, description: 'Phone number' },
      { name: 'company', type: 'string', required: false, description: 'Company/Organization' },
      { name: 'role', type: 'string', required: false, description: 'Role/Title' },
      { name: 'location', type: 'string', required: false, description: 'Location' },
    ],
    bodyTemplate: `## About



## Interactions

### [Date] - [Topic]



## Projects Together

- 

## Notes

`,
  },
  {
    name: 'Article/Reference',
    description: 'Template for articles, papers, and references',
    icon: '📄',
    color: '#F59E0B',
    isBuiltIn: true,
    fields: [
      { name: 'author', type: 'string', required: false, description: 'Author name' },
      { name: 'url', type: 'string', required: false, description: 'URL to article' },
      { name: 'published', type: 'date', required: false, description: 'Publication date' },
      { name: 'source', type: 'string', required: false, description: 'Source/Publication' },
      { name: 'rating', type: 'number', required: false, description: 'Rating (1-5)' },
    ],
    bodyTemplate: `## Summary



## Key Points

- 
- 
- 

## Quotes

> 

## My Thoughts



## Related

- `,
  },
  {
    name: 'Book Notes',
    description: 'Template for book summaries and notes',
    icon: '📚',
    color: '#EC4899',
    isBuiltIn: true,
    fields: [
      { name: 'author', type: 'string', required: true, description: 'Book author' },
      { name: 'isbn', type: 'string', required: false, description: 'ISBN number' },
      { name: 'published', type: 'string', required: false, description: 'Publication year' },
      { name: 'genre', type: 'string', required: false, description: 'Book genre' },
      { name: 'rating', type: 'number', required: false, description: 'Your rating (1-5)' },
      { name: 'status', type: 'string', required: false, description: 'Reading status', options: ['To Read', 'Reading', 'Completed', 'Abandoned'] },
    ],
    bodyTemplate: `## Summary



## Key Takeaways

1. 
2. 
3. 

## Favorite Quotes

> 

## Chapter Notes

### Chapter 1: 



## Personal Reflections



## Recommended For

`,
  },
  {
    name: 'Decision Log',
    description: 'Template for documenting important decisions',
    icon: '⚖️',
    color: '#06B6D4',
    isBuiltIn: true,
    fields: [
      { name: 'date', type: 'date', required: true, description: 'Decision date' },
      { name: 'decision-makers', type: 'array', required: true, description: 'Who made the decision' },
      { name: 'status', type: 'string', required: false, description: 'Decision status', options: ['Proposed', 'Approved', 'Implemented', 'Reversed'] },
      { name: 'impact', type: 'string', required: false, description: 'Impact level', options: ['Low', 'Medium', 'High'] },
    ],
    bodyTemplate: `## Context



## Problem Statement



## Options Considered

### Option 1: 
**Pros:**
- 
**Cons:**
- 

### Option 2: 
**Pros:**
- 
**Cons:**
- 

## Decision



## Rationale



## Consequences

- 

## Follow-up Actions

- [ ] `,
  },
];

/**
 * Load templates from disk
 */
export function loadTemplates(): TemplatesData {
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      const content = fs.readFileSync(TEMPLATES_FILE, 'utf8');
      const data = JSON.parse(content);
      
      // Merge with built-in templates
      const builtInMap: Record<string, NoteTemplate> = {};
      BUILT_IN_TEMPLATES.forEach(template => {
        const id = template.name.toLowerCase().replace(/\s+/g, '-');
        builtInMap[id] = {
          ...template,
          id,
          createdAt: new Date().toISOString(),
        };
      });
      
      // User templates override built-in
      return {
        templates: { ...builtInMap, ...data.templates },
        lastUpdated: data.lastUpdated,
      };
    }
  } catch (error) {
    console.error('Error loading templates:', error);
  }
  
  // Return built-in templates
  const builtInMap: Record<string, NoteTemplate> = {};
  BUILT_IN_TEMPLATES.forEach(template => {
    const id = template.name.toLowerCase().replace(/\s+/g, '-');
    builtInMap[id] = {
      ...template,
      id,
      createdAt: new Date().toISOString(),
    };
  });
  
  return {
    templates: builtInMap,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save templates to disk
 */
export function saveTemplates(data: TemplatesData): void {
  try {
    const dir = path.dirname(TEMPLATES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Only save user templates (exclude built-in)
    const userTemplates: Record<string, NoteTemplate> = {};
    Object.entries(data.templates).forEach(([id, template]) => {
      if (!template.isBuiltIn) {
        userTemplates[id] = template;
      }
    });
    
    const saveData = {
      templates: userTemplates,
      lastUpdated: new Date().toISOString(),
    };
    
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(saveData, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving templates:', error);
  }
}

/**
 * Get all templates
 */
export function getAllTemplates(): NoteTemplate[] {
  const data = loadTemplates();
  return Object.values(data.templates).sort((a, b) => {
    // Built-in templates first
    if (a.isBuiltIn && !b.isBuiltIn) return -1;
    if (!a.isBuiltIn && b.isBuiltIn) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): NoteTemplate | null {
  const data = loadTemplates();
  return data.templates[id] || null;
}

/**
 * Create custom template
 */
export function createTemplate(
  name: string,
  description: string,
  fields: TemplateField[],
  bodyTemplate: string,
  options?: { icon?: string; color?: string }
): NoteTemplate {
  const data = loadTemplates();
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  const template: NoteTemplate = {
    id,
    name,
    description,
    icon: options?.icon || '📝',
    color: options?.color || '#6B7280',
    fields,
    bodyTemplate,
    createdAt: new Date().toISOString(),
    isBuiltIn: false,
  };
  
  data.templates[id] = template;
  saveTemplates(data);
  
  return template;
}

/**
 * Update template
 */
export function updateTemplate(id: string, updates: Partial<Omit<NoteTemplate, 'id' | 'createdAt' | 'isBuiltIn'>>): NoteTemplate | null {
  const data = loadTemplates();
  
  if (!data.templates[id] || data.templates[id].isBuiltIn) {
    return null; // Can't update built-in templates
  }
  
  data.templates[id] = {
    ...data.templates[id],
    ...updates,
  };
  
  saveTemplates(data);
  return data.templates[id];
}

/**
 * Delete template
 */
export function deleteTemplate(id: string): boolean {
  const data = loadTemplates();
  
  if (!data.templates[id] || data.templates[id].isBuiltIn) {
    return false; // Can't delete built-in templates
  }
  
  delete data.templates[id];
  saveTemplates(data);
  return true;
}

/**
 * Generate frontmatter from template and values
 */
export function generateFrontmatter(template: NoteTemplate, values: Record<string, any>): string {
  const lines = ['---'];
  
  // Always include title
  lines.push(`title: ${values.title || 'Untitled'}`);
  
  // Add template fields
  template.fields.forEach(field => {
    const value = values[field.name] || field.default;
    
    if (value !== undefined && value !== null && value !== '') {
      if (field.type === 'array') {
        lines.push(`${field.name}: [${Array.isArray(value) ? value.join(', ') : value}]`);
      } else {
        lines.push(`${field.name}: ${value}`);
      }
    }
  });
  
  // Add tags if provided
  if (values.tags) {
    const tagsArray = Array.isArray(values.tags) ? values.tags : [values.tags];
    lines.push(`tags: [${tagsArray.join(', ')}]`);
  }
  
  lines.push('---\n');
  return lines.join('\n');
}

/**
 * Validate values against template
 */
export function validateTemplate(template: NoteTemplate, values: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  template.fields.forEach(field => {
    if (field.required && !values[field.name]) {
      errors.push(`Field "${field.name}" is required`);
    }
    
    if (values[field.name]) {
      const value = values[field.name];
      
      switch (field.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`Field "${field.name}" must be a number`);
          }
          break;
        case 'date':
          if (isNaN(Date.parse(value))) {
            errors.push(`Field "${field.name}" must be a valid date`);
          }
          break;
        case 'array':
          if (!Array.isArray(value) && typeof value !== 'string') {
            errors.push(`Field "${field.name}" must be an array`);
          }
          break;
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
