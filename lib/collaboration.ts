import fs from 'fs';
import path from 'path';

const COLLAB_FILE = '.sentiment-collaboration.json';

export interface Comment {
  id: string;
  fileSlug: string;
  author: string;
  content: string;
  timestamp: Date;
  resolved: boolean;
  parentId?: string; // For threaded replies
  reactions: Record<string, string[]>; // emoji -> usernames
}

export interface Activity {
  id: string;
  type: 'create' | 'edit' | 'delete' | 'comment' | 'tag' | 'link';
  fileSlug: string;
  fileName: string;
  author: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface CollaborationData {
  comments: Comment[];
  activities: Activity[];
  users: Record<string, UserProfile>;
}

export interface UserProfile {
  username: string;
  displayName: string;
  avatar?: string;
  lastActive: Date;
  notesCreated: number;
  commentsPosted: number;
}

/**
 * Load collaboration data
 */
export function loadCollaborationData(): CollaborationData {
  const filePath = path.join(process.cwd(), COLLAB_FILE);
  
  if (!fs.existsSync(filePath)) {
    return {
      comments: [],
      activities: [],
      users: {},
    };
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Parse dates
    data.comments = data.comments.map((c: any) => ({
      ...c,
      timestamp: new Date(c.timestamp),
    }));
    
    data.activities = data.activities.map((a: any) => ({
      ...a,
      timestamp: new Date(a.timestamp),
    }));
    
    Object.keys(data.users).forEach(username => {
      data.users[username].lastActive = new Date(data.users[username].lastActive);
    });
    
    return data;
  } catch (error) {
    console.error('Error loading collaboration data:', error);
    return {
      comments: [],
      activities: [],
      users: {},
    };
  }
}

/**
 * Save collaboration data
 */
export function saveCollaborationData(data: CollaborationData): void {
  const filePath = path.join(process.cwd(), COLLAB_FILE);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create user profile
 */
export function getOrCreateUser(username: string, displayName?: string): UserProfile {
  const data = loadCollaborationData();
  
  if (!data.users[username]) {
    data.users[username] = {
      username,
      displayName: displayName || username,
      lastActive: new Date(),
      notesCreated: 0,
      commentsPosted: 0,
    };
    saveCollaborationData(data);
  }
  
  return data.users[username];
}

/**
 * Update user last active time
 */
export function updateUserActivity(username: string): void {
  const data = loadCollaborationData();
  
  if (data.users[username]) {
    data.users[username].lastActive = new Date();
    saveCollaborationData(data);
  }
}

/**
 * Add a comment
 */
export function addComment(
  fileSlug: string,
  author: string,
  content: string,
  parentId?: string
): Comment {
  const data = loadCollaborationData();
  
  const comment: Comment = {
    id: generateId(),
    fileSlug,
    author,
    content,
    timestamp: new Date(),
    resolved: false,
    parentId,
    reactions: {},
  };
  
  data.comments.push(comment);
  
  // Update user stats
  if (data.users[author]) {
    data.users[author].commentsPosted++;
    data.users[author].lastActive = new Date();
  }
  
  // Add activity
  addActivity({
    type: 'comment',
    fileSlug,
    fileName: fileSlug,
    author,
    description: parentId ? 'replied to a comment' : 'added a comment',
  });
  
  saveCollaborationData(data);
  return comment;
}

/**
 * Get comments for a file
 */
export function getCommentsForFile(fileSlug: string): Comment[] {
  const data = loadCollaborationData();
  return data.comments
    .filter(c => c.fileSlug === fileSlug)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Get all comments
 */
export function getAllComments(): Comment[] {
  const data = loadCollaborationData();
  return data.comments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Resolve/unresolve a comment
 */
export function toggleCommentResolution(commentId: string): boolean {
  const data = loadCollaborationData();
  const comment = data.comments.find(c => c.id === commentId);
  
  if (comment) {
    comment.resolved = !comment.resolved;
    saveCollaborationData(data);
    return comment.resolved;
  }
  
  return false;
}

/**
 * Delete a comment
 */
export function deleteComment(commentId: string): boolean {
  const data = loadCollaborationData();
  const index = data.comments.findIndex(c => c.id === commentId);
  
  if (index !== -1) {
    data.comments.splice(index, 1);
    saveCollaborationData(data);
    return true;
  }
  
  return false;
}

/**
 * Add reaction to comment
 */
export function addReaction(commentId: string, emoji: string, username: string): boolean {
  const data = loadCollaborationData();
  const comment = data.comments.find(c => c.id === commentId);
  
  if (comment) {
    if (!comment.reactions[emoji]) {
      comment.reactions[emoji] = [];
    }
    
    if (!comment.reactions[emoji].includes(username)) {
      comment.reactions[emoji].push(username);
      saveCollaborationData(data);
      return true;
    }
  }
  
  return false;
}

/**
 * Remove reaction from comment
 */
export function removeReaction(commentId: string, emoji: string, username: string): boolean {
  const data = loadCollaborationData();
  const comment = data.comments.find(c => c.id === commentId);
  
  if (comment && comment.reactions[emoji]) {
    const index = comment.reactions[emoji].indexOf(username);
    if (index !== -1) {
      comment.reactions[emoji].splice(index, 1);
      if (comment.reactions[emoji].length === 0) {
        delete comment.reactions[emoji];
      }
      saveCollaborationData(data);
      return true;
    }
  }
  
  return false;
}

/**
 * Add an activity
 */
export function addActivity(params: {
  type: Activity['type'];
  fileSlug: string;
  fileName: string;
  author: string;
  description: string;
  metadata?: Record<string, any>;
}): Activity {
  const data = loadCollaborationData();
  
  const activity: Activity = {
    id: generateId(),
    ...params,
    timestamp: new Date(),
  };
  
  data.activities.push(activity);
  
  // Keep only last 1000 activities
  if (data.activities.length > 1000) {
    data.activities = data.activities.slice(-1000);
  }
  
  saveCollaborationData(data);
  return activity;
}

/**
 * Get recent activities
 */
export function getRecentActivities(limit: number = 50): Activity[] {
  const data = loadCollaborationData();
  return data.activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get activities for a file
 */
export function getActivitiesForFile(fileSlug: string, limit: number = 20): Activity[] {
  const data = loadCollaborationData();
  return data.activities
    .filter(a => a.fileSlug === fileSlug)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get activities by user
 */
export function getActivitiesByUser(username: string, limit: number = 50): Activity[] {
  const data = loadCollaborationData();
  return data.activities
    .filter(a => a.author === username)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get all users
 */
export function getAllUsers(): UserProfile[] {
  const data = loadCollaborationData();
  return Object.values(data.users).sort((a, b) => 
    b.lastActive.getTime() - a.lastActive.getTime()
  );
}

/**
 * Get user statistics
 */
export function getUserStats(username: string) {
  const data = loadCollaborationData();
  const user = data.users[username];
  
  if (!user) return null;
  
  const userActivities = data.activities.filter(a => a.author === username);
  const userComments = data.comments.filter(c => c.author === username);
  
  return {
    ...user,
    totalActivities: userActivities.length,
    totalComments: userComments.length,
    activeDays: new Set(userActivities.map(a => 
      a.timestamp.toISOString().split('T')[0]
    )).size,
  };
}

/**
 * Get collaboration statistics
 */
export function getCollaborationStats() {
  const data = loadCollaborationData();
  
  const totalUsers = Object.keys(data.users).length;
  const totalComments = data.comments.length;
  const unresolvedComments = data.comments.filter(c => !c.resolved).length;
  const totalActivities = data.activities.length;
  
  // Active users (active in last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const activeUsers = Object.values(data.users).filter(u => 
    u.lastActive >= weekAgo
  ).length;
  
  return {
    totalUsers,
    activeUsers,
    totalComments,
    unresolvedComments,
    totalActivities,
  };
}
