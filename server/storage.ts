import { type User, type InsertUser, type File, type InsertFile, type RecentFile, type InsertRecentFile } from "@shared/schema";

// Define storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByUser(userId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<File>): Promise<File>;
  deleteFile(id: number): Promise<void>;
  
  // Recent files operations
  getRecentFilesByUser(userId: number): Promise<RecentFile[]>;
  addRecentFile(recentFile: InsertRecentFile): Promise<RecentFile>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File>;
  private recentFiles: Map<number, RecentFile>;
  private currentUserId: number;
  private currentFileId: number;
  private currentRecentFileId: number;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.recentFiles = new Map();
    this.currentUserId = 1;
    this.currentFileId = 1;
    this.currentRecentFileId = 1;
    
    // Add a default user for testing
    this.createUser({
      username: "demo",
      password: "password"
    });
    
    // Add some demo files
    this.createFile({
      name: "src",
      path: "/src",
      type: "directory",
      content: null,
      parentId: null,
      userId: 1
    });
    
    this.createFile({
      name: "components",
      path: "/src/components",
      type: "directory",
      content: null,
      parentId: 1,
      userId: 1
    });
    
    this.createFile({
      name: "App.jsx",
      path: "/src/components/App.jsx",
      type: "file",
      content: "// Sample React component",
      parentId: 2,
      userId: 1
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // File operations
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }
  
  async getFilesByUser(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId
    );
  }
  
  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const file: File = { ...insertFile, id };
    this.files.set(id, file);
    return file;
  }
  
  async updateFile(id: number, fileUpdate: Partial<File>): Promise<File> {
    const existingFile = await this.getFile(id);
    if (!existingFile) {
      throw new Error("File not found");
    }
    
    const updatedFile = { ...existingFile, ...fileUpdate };
    this.files.set(id, updatedFile);
    return updatedFile;
  }
  
  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
  }
  
  // Recent files operations
  async getRecentFilesByUser(userId: number): Promise<RecentFile[]> {
    return Array.from(this.recentFiles.values())
      .filter(rf => rf.userId === userId)
      .sort((a, b) => {
        // Sort by most recently opened
        return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
      });
  }
  
  async addRecentFile(insertRecentFile: InsertRecentFile): Promise<RecentFile> {
    // First, check if this file is already in recent files
    const existingRecentFile = Array.from(this.recentFiles.values()).find(
      rf => rf.fileId === insertRecentFile.fileId && rf.userId === insertRecentFile.userId
    );
    
    if (existingRecentFile) {
      // Update the openedAt timestamp
      const updatedRecentFile = {
        ...existingRecentFile,
        openedAt: insertRecentFile.openedAt
      };
      this.recentFiles.set(existingRecentFile.id, updatedRecentFile);
      return updatedRecentFile;
    }
    
    // Add as a new recent file
    const id = this.currentRecentFileId++;
    const recentFile: RecentFile = { ...insertRecentFile, id };
    this.recentFiles.set(id, recentFile);
    return recentFile;
  }
}

export const storage = new MemStorage();
