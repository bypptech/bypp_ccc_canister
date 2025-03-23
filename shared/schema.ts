import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// File schema for file explorer
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull().unique(),
  type: text("type").notNull(), // 'file' or 'directory'
  content: text("content"),
  parentId: integer("parent_id"),
  userId: integer("user_id").notNull(),
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true,
  path: true,
  type: true,
  content: true,
  parentId: true,
  userId: true,
});

// Recent files schema
export const recentFiles = pgTable("recent_files", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull(),
  userId: integer("user_id").notNull(),
  openedAt: text("opened_at").notNull(), // ISO date string
});

export const insertRecentFileSchema = createInsertSchema(recentFiles).pick({
  fileId: true,
  userId: true,
  openedAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertRecentFile = z.infer<typeof insertRecentFileSchema>;
export type RecentFile = typeof recentFiles.$inferSelect;
