import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertDuoProfileSchema, insertLikeSchema, insertMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configure multer for photo uploads
const storage_config = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Serve uploaded photos
  app.use('/uploads', (req, res, next) => {
    // Add CORS headers for image requests
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
  app.use('/uploads', require('express').static(path.join(process.cwd(), 'uploads')));

  // Photo upload route
  app.post("/api/upload-photo", upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No photo uploaded" });
    }

    // Return the URL path to the uploaded file
    const photoUrl = `/uploads/${req.file.filename}`;
    res.json({ photoUrl });
  });

  // Duo Profile routes
  app.post("/api/duo-profiles", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const profileData = insertDuoProfileSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Check if user already has a profile
      const existingProfile = await storage.getDuoProfileByUserId(req.user!.id);
      if (existingProfile) {
        return res.status(400).json({ message: "User already has a duo profile" });
      }

      const profile = await storage.createDuoProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid profile data", error });
    }
  });

  app.get("/api/duo-profiles/me", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const profile = await storage.getDuoProfileByUserId(req.user!.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  });

  app.put("/api/duo-profiles/me", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const profile = await storage.getDuoProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const updates = insertDuoProfileSchema.partial().parse(req.body);
      const updatedProfile = await storage.updateDuoProfile(profile.id, updates);
      res.json(updatedProfile);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data", error });
    }
  });

  // Browse profiles
  app.get("/api/duo-profiles/browse", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userProfile = await storage.getDuoProfileByUserId(req.user!.id);
    if (!userProfile) {
      return res.status(400).json({ message: "User must have a profile to browse" });
    }

    const profiles = await storage.getActiveProfiles(req.user!.id, 20);
    res.json(profiles);
  });

  // Like/Pass routes
  app.post("/api/likes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userProfile = await storage.getDuoProfileByUserId(req.user!.id);
      if (!userProfile) {
        return res.status(400).json({ message: "User must have a profile" });
      }

      const { toDuoProfileId } = req.body;
      if (!toDuoProfileId) {
        return res.status(400).json({ message: "toDuoProfileId is required" });
      }

      // Check if already liked
      const existingLike = await storage.getLike(userProfile.id, toDuoProfileId);
      if (existingLike) {
        return res.status(400).json({ message: "Already liked this profile" });
      }

      // Create the like
      const like = await storage.createLike({
        fromDuoProfileId: userProfile.id,
        toDuoProfileId,
      });

      // Check if the other profile has liked back
      const reciprocalLike = await storage.getLike(toDuoProfileId, userProfile.id);
      
      let match = null;
      if (reciprocalLike) {
        // Create a match
        match = await storage.createMatch({
          duoProfile1Id: Math.min(userProfile.id, toDuoProfileId),
          duoProfile2Id: Math.max(userProfile.id, toDuoProfileId),
          isMatched: true,
        });
      }

      res.json({ like, match });
    } catch (error) {
      res.status(400).json({ message: "Error creating like", error });
    }
  });

  // Matches routes
  app.get("/api/matches", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userProfile = await storage.getDuoProfileByUserId(req.user!.id);
    if (!userProfile) {
      return res.status(400).json({ message: "User must have a profile" });
    }

    const matches = await storage.getMatchesByDuoProfileId(userProfile.id);
    res.json(matches);
  });

  // Messages routes
  app.get("/api/matches/:matchId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { matchId } = req.params;
    const match = await storage.getMatch(parseInt(matchId));
    
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    const userProfile = await storage.getDuoProfileByUserId(req.user!.id);
    if (!userProfile) {
      return res.status(400).json({ message: "User must have a profile" });
    }

    // Verify user is part of this match
    if (match.duoProfile1Id !== userProfile.id && match.duoProfile2Id !== userProfile.id) {
      return res.status(403).json({ message: "Not authorized to view these messages" });
    }

    const messages = await storage.getMessagesByMatchId(parseInt(matchId));
    res.json(messages);
  });

  app.post("/api/matches/:matchId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { matchId } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const match = await storage.getMatch(parseInt(matchId));
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      const userProfile = await storage.getDuoProfileByUserId(req.user!.id);
      if (!userProfile) {
        return res.status(400).json({ message: "User must have a profile" });
      }

      // Verify user is part of this match
      if (match.duoProfile1Id !== userProfile.id && match.duoProfile2Id !== userProfile.id) {
        return res.status(403).json({ message: "Not authorized to send messages to this match" });
      }

      const message = await storage.createMessage({
        matchId: parseInt(matchId),
        fromDuoProfileId: userProfile.id,
        content: content.trim(),
      });

      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Error creating message", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
