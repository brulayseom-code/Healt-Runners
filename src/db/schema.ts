import { pgTable, uuid, text, integer, real, boolean, timestamp, date, serial, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const profiles = pgTable("gym_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().default("Isabella Costa"),
  email: text("email").notNull().default(""),
  authEmail: text("auth_email"),
  passwordHash: text("password_hash"),
  avatar: text("avatar").notNull().default("isabella"),
  waterGoal: integer("water_goal").notNull().default(2000),
  baseXp: integer("base_xp").notNull().default(1000),
  joinedChallenges: jsonb("joined_challenges").$type<string[]>().notNull().default(["water-week", "colorful-plate"]),
  groupCode: text("group_code").notNull().default("RATSDOBEM"),
  reminders: boolean("reminders").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("gym_profiles_auth_email").on(table.authEmail)]);

export const profilePhotos = pgTable("gym_profile_photos", {
  profileId: uuid("profile_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  imageData: text("image_data").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dailyLogs = pgTable("gym_daily_logs", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  habits: jsonb("habits").$type<string[]>().notNull().default([]),
  waterMl: integer("water_ml").notNull().default(0),
  sleepHours: real("sleep_hours"),
  sleepQuality: integer("sleep_quality").notNull().default(0),
  mood: text("mood"),
  energy: integer("energy").notNull().default(60),
  stress: text("stress"),
  checkIn: boolean("check_in").notNull().default(false),
  note: text("note").notNull().default(""),
}, (table) => [uniqueIndex("gym_daily_profile_date").on(table.profileId, table.date)]);

export const meals = pgTable("gym_meals", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: text("type").notNull(),
  components: jsonb("components").$type<string[]>().notNull().default([]),
  colors: jsonb("colors").$type<string[]>().notNull().default([]),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activities = pgTable("gym_activities", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: text("type").notNull(),
  duration: integer("duration").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groups = pgTable("gym_groups", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
  category: text("category").notNull().default("friends"),
});

export const challengeAwards = pgTable("gym_challenge_awards", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  challengeId: text("challenge_id").notNull(),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("gym_unique_challenge_award").on(table.profileId, table.challengeId)]);

export const customChallenges = pgTable("gym_custom_challenges", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  metric: text("metric").notNull(),
  target: integer("target").notNull(),
  windowDays: integer("window_days").notNull(),
  reward: integer("reward").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groupMembers = pgTable("gym_demo_members", {
  id: serial("id").primaryKey(),
  groupCode: text("group_code").notNull().references(() => groups.code, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  weeklyPoints: integer("weekly_points").notNull(),
});
