import {
  users,
  listings,
  messages,
  type User,
  type UpsertUser,
  type Listing,
  type InsertListing,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, and, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Listing operations
  getAllListings(): Promise<Listing[]>;
  getListingById(id: string): Promise<Listing | undefined>;
  getUserListings(userId: string): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, userId: string, data: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: string, userId: string): Promise<boolean>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(listingId: string, userId: string): Promise<Message[]>;
  getUserConversations(userId: string): Promise<any>;

  // Admin operations
  getAdminStats(): Promise<{
    totalUsers: number;
    totalListings: number;
    soldListings: number;
    activeListings: number;
    totalConversations: number;
    totalMessages: number;
    recentSignups: { date: string; count: number }[];
    recentListings: { date: string; count: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Listing operations
  async getAllListings(): Promise<Listing[]> {
    const allListings = await db
      .select()
      .from(listings)
      .orderBy(desc(listings.createdAt));
    return allListings;
  }

  async getListingById(id: string): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async getUserListings(userId: string): Promise<Listing[]> {
    const userListings = await db
      .select()
      .from(listings)
      .where(eq(listings.userId, userId))
      .orderBy(desc(listings.createdAt));
    return userListings;
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const [newListing] = await db.insert(listings).values(listing).returning();
    return newListing;
  }

  async updateListing(
    id: string,
    userId: string,
    data: Partial<InsertListing>
  ): Promise<Listing | undefined> {
    const [updated] = await db
      .update(listings)
      .set(data)
      .where(and(eq(listings.id, id), eq(listings.userId, userId)))
      .returning();
    return updated;
  }

  async deleteListing(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(listings)
      .where(and(eq(listings.id, id), eq(listings.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getConversationMessages(
    listingId: string,
    userId: string
  ): Promise<Message[]> {
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.listingId, listingId),
          or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(messages.sentAt);
    return conversationMessages;
  }

  async getUserConversations(userId: string): Promise<any> {
    // Get all messages where user is sender or receiver
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(messages.sentAt);

    // Group by listing
    const conversationMap = new Map();

    for (const message of userMessages) {
      if (!conversationMap.has(message.listingId)) {
        conversationMap.set(message.listingId, []);
      }
      conversationMap.get(message.listingId).push(message);
    }

    return conversationMap;
  }

  // Admin operations
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalListings: number;
    soldListings: number;
    activeListings: number;
    totalConversations: number;
    totalMessages: number;
    recentSignups: { date: string; count: number }[];
    recentListings: { date: string; count: number }[];
  }> {
    // Get total counts
    const [userCount] = await db.select({ count: count() }).from(users);
    const [listingCount] = await db.select({ count: count() }).from(listings);
    const [soldCount] = await db
      .select({ count: count() })
      .from(listings)
      .where(eq(listings.status, "Sold"));
    const [activeCount] = await db
      .select({ count: count() })
      .from(listings)
      .where(eq(listings.status, "Active"));
    const [messageCount] = await db.select({ count: count() }).from(messages);

    // Count unique conversations (unique listing-buyer combinations)
    const uniqueConversations = await db
      .selectDistinct({
        listingId: messages.listingId,
        participantId: sql<string>`LEAST(${messages.senderId}, ${messages.receiverId})`,
      })
      .from(messages);

    // Get signups over last 7 days
    const recentSignups = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})::text`,
        count: count(),
      })
      .from(users)
      .where(sql`${users.createdAt} >= NOW() - INTERVAL '7 days'`)
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    // Get listings over last 7 days
    const recentListings = await db
      .select({
        date: sql<string>`DATE(${listings.createdAt})::text`,
        count: count(),
      })
      .from(listings)
      .where(sql`${listings.createdAt} >= NOW() - INTERVAL '7 days'`)
      .groupBy(sql`DATE(${listings.createdAt})`)
      .orderBy(sql`DATE(${listings.createdAt})`);

    return {
      totalUsers: userCount.count,
      totalListings: listingCount.count,
      soldListings: soldCount.count,
      activeListings: activeCount.count,
      totalConversations: uniqueConversations.length,
      totalMessages: messageCount.count,
      recentSignups,
      recentListings,
    };
  }
}

export const storage = new DatabaseStorage();
