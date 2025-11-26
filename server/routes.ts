import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertListingSchema, insertMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import express from "express";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve textbook images from attached_assets folder
  app.use("/images/textbooks", express.static(path.join(process.cwd(), "attached_assets/generated_images")));

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Listing routes (public - no auth required for viewing)
  app.get("/api/listings", async (req: any, res) => {
    try {
      const allListings = await storage.getAllListings();
      
      // Fetch user data for each listing
      const listingsWithUsers = await Promise.all(
        allListings.map(async (listing) => {
          const user = await storage.getUser(listing.userId);
          return { ...listing, user };
        })
      );
      
      res.json(listingsWithUsers);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/:id", async (req: any, res) => {
    try {
      const listing = await storage.getListingById(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      const user = await storage.getUser(listing.userId);
      res.json({ ...listing, user });
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.get("/api/my-listings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listings = await storage.getUserListings(userId);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.post("/api/listings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertListingSchema.parse({
        ...req.body,
        userId,
      });
      
      const newListing = await storage.createListing(validatedData);
      res.status(201).json(newListing);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: fromZodError(error).message 
        });
      }
      console.error("Error creating listing:", error);
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  app.patch("/api/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updated = await storage.updateListing(req.params.id, userId, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: "Listing not found or unauthorized" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  app.delete("/api/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteListing(req.params.id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Listing not found or unauthorized" });
      }
      
      res.json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  // Message and conversation routes
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { listingId, content } = req.body;
      
      // Get listing to determine receiver
      const listing = await storage.getListingById(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Get all messages for this listing involving the current user
      const existingMessages = await storage.getConversationMessages(listingId, userId);
      
      // Determine receiver: if user is the seller, find the buyer; otherwise receiver is the seller
      let receiverId: string;
      if (userId === listing.userId) {
        // Current user is the seller, find the other person in the conversation
        const otherMessage = existingMessages.find(
          (msg) => msg.senderId !== userId
        );
        if (otherMessage) {
          receiverId = otherMessage.senderId;
        } else {
          return res.status(400).json({ message: "No conversation started yet" });
        }
      } else {
        // Current user is the buyer, receiver is the seller
        receiverId = listing.userId;
      }
      
      const validatedData = insertMessageSchema.parse({
        senderId: userId,
        receiverId,
        listingId,
        content,
      });
      
      const newMessage = await storage.createMessage(validatedData);
      res.status(201).json(newMessage);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: fromZodError(error).message 
        });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { listingId } = req.body;
      
      // Get listing to determine seller
      const listing = await storage.getListingById(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (userId === listing.userId) {
        return res.status(400).json({ message: "Cannot message your own listing" });
      }
      
      // Check if conversation already exists
      const existingMessages = await storage.getConversationMessages(listingId, userId);
      
      if (existingMessages.length === 0) {
        // Create initial message to start conversation
        const validatedData = insertMessageSchema.parse({
          senderId: userId,
          receiverId: listing.userId,
          listingId,
          content: "Hi, I'm interested in this textbook!",
        });
        
        await storage.createMessage(validatedData);
      }
      
      res.status(200).json({ message: "Conversation started" });
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationMap = await storage.getUserConversations(userId);
      
      // Build conversation data with listing and user info
      const conversations: Record<string, any> = {};
      
      for (const [listingId, msgs] of conversationMap.entries()) {
        const listing = await storage.getListingById(listingId);
        if (!listing) continue;
        
        const listingUser = await storage.getUser(listing.userId);
        
        // Determine the other user in the conversation
        const otherUserId = userId === listing.userId
          ? msgs.find((m: any) => m.senderId !== userId)?.senderId
          : listing.userId;
        
        if (!otherUserId) continue;
        
        const otherUser = await storage.getUser(otherUserId);
        
        // Get messages with user data
        const messagesWithUsers = await Promise.all(
          msgs.map(async (msg: any) => {
            const sender = await storage.getUser(msg.senderId);
            const receiver = await storage.getUser(msg.receiverId);
            return { ...msg, sender, receiver };
          })
        );
        
        conversations[listingId] = {
          listing: { ...listing, user: listingUser },
          otherUser,
          messages: messagesWithUsers,
        };
      }
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Object storage routes (for image uploads)
  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ url: uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.put("/api/listing-images", isAuthenticated, async (req: any, res) => {
    try {
      const { imageURL } = req.body;
      const userId = req.user?.claims?.sub;
      
      if (!imageURL) {
        return res.status(400).json({ message: "Image URL is required" });
      }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      // Set the ACL policy for public visibility (since listing images should be public)
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageURL,
        {
          owner: userId,
          visibility: "public",
        }
      );
      
      res.json({ objectPath });
    } catch (error) {
      console.error("Error processing image:", error);
      res.status(500).json({ message: "Failed to process image" });
    }
  });

  // Serve object entities (for accessing uploaded images)
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const { ObjectPermission } = await import("./objectAcl");
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(401);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Admin routes
  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
