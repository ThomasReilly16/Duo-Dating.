import { 
  users, 
  duoProfiles, 
  matches, 
  likes, 
  messages,
  type User, 
  type InsertUser,
  type DuoProfile,
  type InsertDuoProfile,
  type Match,
  type InsertMatch,
  type Like,
  type InsertLike,
  type Message,
  type InsertMessage
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, or } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Duo profiles
  getDuoProfile(id: number): Promise<DuoProfile | undefined>;
  getDuoProfileByUserId(userId: number): Promise<DuoProfile | undefined>;
  createDuoProfile(profile: InsertDuoProfile): Promise<DuoProfile>;
  updateDuoProfile(id: number, profile: Partial<InsertDuoProfile>): Promise<DuoProfile>;
  getActiveProfiles(excludeUserId?: number, limit?: number): Promise<DuoProfile[]>;
  
  // Likes
  createLike(like: InsertLike): Promise<Like>;
  getLike(fromId: number, toId: number): Promise<Like | undefined>;
  
  // Matches
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchesByDuoProfileId(duoProfileId: number): Promise<(Match & { profile: DuoProfile })[]>;
  getMatch(id: number): Promise<Match | undefined>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByMatchId(matchId: number): Promise<Message[]>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getDuoProfile(id: number): Promise<DuoProfile | undefined> {
    const [profile] = await db.select().from(duoProfiles).where(eq(duoProfiles.id, id));
    return profile || undefined;
  }

  async getDuoProfileByUserId(userId: number): Promise<DuoProfile | undefined> {
    const [profile] = await db.select().from(duoProfiles).where(eq(duoProfiles.userId, userId));
    return profile || undefined;
  }

  async createDuoProfile(insertProfile: InsertDuoProfile): Promise<DuoProfile> {
    const [profile] = await db
      .insert(duoProfiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async updateDuoProfile(id: number, updates: Partial<InsertDuoProfile>): Promise<DuoProfile> {
    const [profile] = await db
      .update(duoProfiles)
      .set(updates)
      .where(eq(duoProfiles.id, id))
      .returning();
    return profile;
  }

  async getActiveProfiles(excludeUserId?: number, limit: number = 10): Promise<DuoProfile[]> {
    const profiles = await db
      .select()
      .from(duoProfiles)
      .where(eq(duoProfiles.isActive, true))
      .limit(limit);
    
    return profiles.filter(profile => profile.userId !== excludeUserId);
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values(insertLike)
      .returning();
    return like;
  }

  async getLike(fromId: number, toId: number): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(
        eq(likes.fromDuoProfileId, fromId),
        eq(likes.toDuoProfileId, toId)
      ));
    return like || undefined;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(insertMatch)
      .returning();
    return match;
  }

  async getMatchesByDuoProfileId(duoProfileId: number): Promise<(Match & { profile: DuoProfile })[]> {
    const userMatches = await db
      .select()
      .from(matches)
      .where(and(
        eq(matches.isMatched, true),
        or(
          eq(matches.duoProfile1Id, duoProfileId),
          eq(matches.duoProfile2Id, duoProfileId)
        )
      ));

    const enrichedMatches = await Promise.all(
      userMatches.map(async (match) => {
        const otherProfileId = match.duoProfile1Id === duoProfileId 
          ? match.duoProfile2Id 
          : match.duoProfile1Id;
        const [profile] = await db.select().from(duoProfiles).where(eq(duoProfiles.id, otherProfileId));
        return { ...match, profile };
      })
    );

    return enrichedMatches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessagesByMatchId(matchId: number): Promise<Message[]> {
    const messageList = await db
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.createdAt);
    return messageList;
  }
}

export const storage = new DatabaseStorage();
