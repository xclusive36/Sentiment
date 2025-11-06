import fs from 'fs';
import path from 'path';

const ORDER_FILE = '.sentiment-order.json';

export interface FolderOrder {
  [folderPath: string]: {
    files: string[];
    folders: string[];
  };
}

// Get the order config file path
function getOrderFilePath(): string {
  return path.join(process.cwd(), 'markdown', ORDER_FILE);
}

// Load order configuration
export function loadOrder(): FolderOrder {
  const orderPath = getOrderFilePath();
  
  if (!fs.existsSync(orderPath)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(orderPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading order file:', error);
    return {};
  }
}

// Save order configuration
export function saveOrder(order: FolderOrder): boolean {
  const orderPath = getOrderFilePath();
  
  try {
    fs.writeFileSync(orderPath, JSON.stringify(order, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving order file:', error);
    return false;
  }
}

// Update order for a specific folder
export function updateFolderOrder(
  folderPath: string,
  files: string[],
  folders: string[]
): boolean {
  const order = loadOrder();
  
  order[folderPath] = {
    files,
    folders,
  };
  
  return saveOrder(order);
}

// Get order for a specific folder
export function getFolderOrder(folderPath: string): { files: string[]; folders: string[] } | null {
  const order = loadOrder();
  return order[folderPath] || null;
}

// Apply order to file structure
export function applyOrder<T extends { id: string }>(
  items: T[],
  orderedIds: string[]
): T[] {
  if (orderedIds.length === 0) {
    return items;
  }
  
  const itemMap = new Map(items.map(item => [item.id, item]));
  const ordered: T[] = [];
  const unordered: T[] = [];
  
  // Add items in the specified order
  orderedIds.forEach(id => {
    const item = itemMap.get(id);
    if (item) {
      ordered.push(item);
      itemMap.delete(id);
    }
  });
  
  // Add any items not in the order list (new files)
  itemMap.forEach(item => {
    unordered.push(item);
  });
  
  return [...ordered, ...unordered];
}
