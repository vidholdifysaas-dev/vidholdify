import { pgTable, serial, varchar, timestamp, integer, json, boolean, uuid, text, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from "drizzle-orm";

export const Users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull().unique(),
  image_url: varchar('image_url').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  stripe_customer_id: varchar('stripe_customer_id'),
  stripe_subscription_id: varchar('stripe_subscription_id'),
  stripe_price_id: varchar('stripe_price_id'),
  subscription_status: varchar('subscription_status').default('inactive'),
  subscription_active: boolean('subscription_active').notNull().default(false),
  plan_tier: varchar('plan_tier').default('free'),
  current_period_start: timestamp('current_period_start'),
  current_period_end: timestamp('current_period_end'),

  // Legacy fields (kept for backward compatibility)
  credits_allowed: integer('credits_allowed').default(0),
  credits_used: integer('credits_used').default(0),
  carryover: integer('carryover').default(0),
  carryover_expiry: timestamp('carryover_expiry'),
  // Credit reset tracking
  credit_reset_day: integer('credit_reset_day'),
  next_credit_reset: timestamp('next_credit_reset'),
});



// TopView workflow tracking - tracks each step in the video generation process
export const TopviewTasks = pgTable("topview_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(), // Clerk user ID

  // Step 1: Background Removal
  productImageFileId: varchar("product_image_file_id"),
  bgRemovalTaskId: varchar("bg_removal_task_id"),
  bgRemovedImageFileId: varchar("bg_removed_image_file_id"),
  bgRemovedImageUrl: varchar("bg_removed_image_url"),

  // Step 2: Image Replacement
  templateImageFileId: varchar("template_image_file_id"),
  avatarId: varchar("avatar_id"), // Optional: use saved avatar instead of template
  replaceProductTaskId: varchar("replace_product_task_id"),
  generateImageMode: varchar("generate_image_mode"), // "auto" or "manual"
  imageEditPrompt: varchar("image_edit_prompt", { length: 1000 }),
  location: json("location"), // Manual mode coordinates
  replaceProductResults: json("replace_product_results"), // Array of generated images
  selectedImageId: varchar("selected_image_id"), // User's chosen image from results

  // Step 3: Video Generation
  videoTaskId: varchar("video_task_id"),
  script: varchar("script", { length: 5000 }),
  voiceId: varchar("voice_id"),
  captionStyleId: varchar("caption_style_id"),
  mode: varchar("mode"), // "pro" or "standard"
  finishedVideoUrl: varchar("finished_video_url"),

  // Overall status tracking
  currentStep: integer("current_step").default(1), // 1, 2, or 3
  status: varchar("status").default("in_progress"), // in_progress, completed, failed
  errorMessage: varchar("error_message", { length: 1000 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Updated TopView Video table with user tracking
export const TopviewVideo = pgTable("topview_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskTableId: uuid("task_table_id"),
  aiavatarId: varchar("aiavatar_id"),
  aiavatarName: varchar("aiavatar_name"),
  gender: varchar("gender"),
  productName: varchar("product_name"),
  taskId: varchar("task_id"), // Final video generation task ID
  status: varchar("status").default("pending"),
  videoUrl: varchar("video_url"),
  videoCoverUrl: varchar("video_cover_url"),
  duration: varchar("duration"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// MANUAL VIDEO GENERATION ENUMS
// ============================================

/**
 * Job status enum representing the state machine for video generation
 * CREATED → GENERATING_IMAGE → IMAGE_READY → PLANNED → SCENES_GENERATING → SCENES_READY → STITCHING → DONE
 * Any state can transition to FAILED
 */
export const videoJobStatusEnum = pgEnum("video_job_status", [
  "CREATED",            // Initial state after job creation
  "GENERATING_IMAGE",   // Nano Banana is generating the reference image
  "IMAGE_READY",        // Reference image generated
  "PLANNED",            // Script generated and scenes planned
  "SCENES_GENERATING",  // Veo is generating scene videos (with audio)
  "SCENES_READY",       // All scene videos are generated
  "STITCHING",          // FFmpeg is stitching the final video
  "DONE",               // Final video is ready
  "FAILED",             // Job failed at some step
]);

/**
 * Supported video platforms for aspect ratio and optimization
 */
export const videoPlatformEnum = pgEnum("video_platform", [
  "tiktok",
  "instagram_reels",
  "youtube_shorts",
  "general",
]);

/**
 * Target video lengths in seconds
 */
export const videoLengthEnum = pgEnum("video_length", ["15", "30", "45"]);

// ============================================
// MANUAL VIDEO GENERATION TABLES
// ============================================

/**
 * Main table for tracking video generation jobs
 * 
 * Flow:
 * 1. User provides prompt describing avatar + product + background
 * 2. Nano Banana generates reference image from prompt
 * 3. AI generates script and scene plan
 * 4. Veo generates scene videos WITH audio (no separate TTS)
 * 5. FFmpeg stitches scenes with crossfades
 * 6. Final video uploaded to S3
 */
export const videoJobs = pgTable("video_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(), // Clerk user ID

  // Job configuration
  status: videoJobStatusEnum("status").notNull().default("CREATED"),
  targetLength: videoLengthEnum("target_length").notNull(),
  platform: videoPlatformEnum("platform").notNull().default("tiktok"),

  // Product information
  productName: varchar("product_name", { length: 255 }).notNull(),
  productDescription: text("product_description").notNull(),

  // Image Upload URLs (user uploaded images)
  avatarImageUrl: varchar("avatar_image_url", { length: 1000 }),       // Uploaded avatar image
  productImageUrl: varchar("product_image_url", { length: 1000 }),     // Uploaded product image

  // Nano Banana Image Generation
  imagePrompt: text("image_prompt"),                                   // Full prompt for Nano Banana
  avatarDescription: text("avatar_description"),                       // Avatar appearance
  productHoldingDescription: text("product_holding_description"),      // How avatar holds product
  backgroundDescription: text("background_description"),               // Background/scene description

  // Nano Banana Task Tracking
  nanoBananaTaskId: varchar("nano_banana_task_id", { length: 255 }),   // Task ID for image generation
  referenceImageUrl: varchar("reference_image_url", { length: 1000 }), // Generated reference image

  // Final Output
  finalVideoUrl: varchar("final_video_url", { length: 1000 }), // Final stitched video

  // Generated content
  fullScript: text("full_script"), // Complete generated script

  // Error tracking
  errorMessage: text("error_message"),
  failedAt: varchar("failed_at", { length: 50 }), // Which step failed

  // Metadata
  totalDuration: integer("total_duration"), // Actual video duration in seconds
  sceneCount: integer("scene_count"), // Number of scenes generated

  // Aspect ratio for image and video (from Step 1)
  aspectRatio: varchar("aspect_ratio", { length: 10 }).default("9:16"), // 9:16, 16:9, 1:1, etc.

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

/**
 * Scenes table for tracking individual scene generation
 * Each video job has multiple scenes that are generated separately and stitched together
 * 
 * NOTE: Veo 3.1 generates video WITH audio, so no separate TTS is needed
 */
export const scenes = pgTable("scenes", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoJobId: uuid("video_job_id")
    .notNull()
    .references(() => videoJobs.id, { onDelete: "cascade" }),

  // Scene metadata
  sceneIndex: integer("scene_index").notNull(), // 0-indexed order
  plannedDuration: integer("planned_duration").notNull(), // Target duration in seconds
  generatedDuration: integer("generated_duration"), // Actual Veo output duration

  // Scene content
  script: text("script").notNull(), // Scene-specific script/narration for Veo to speak
  visualPrompt: text("visual_prompt"), // Visual description for Veo
  motionDescription: text("motion_description"), // Description of avatar motion

  // Veo generation tracking
  veoTaskId: varchar("veo_task_id", { length: 255 }), // External Veo task ID
  veoStatus: varchar("veo_status", { length: 50 }).default("pending"), // pending, generating, completed, failed

  // S3 URLs
  rawVideoUrl: varchar("raw_video_url", { length: 1000 }), // Direct Veo output (includes audio)
  trimmedVideoUrl: varchar("trimmed_video_url", { length: 1000 }), // After FFmpeg trimming

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const videoJobsRelations = relations(videoJobs, ({ many }) => ({
  scenes: many(scenes),
}));

export const scenesRelations = relations(scenes, ({ one }) => ({
  videoJob: one(videoJobs, {
    fields: [scenes.videoJobId],
    references: [videoJobs.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type VideoJob = typeof videoJobs.$inferSelect;
export type NewVideoJob = typeof videoJobs.$inferInsert;
export type Scene = typeof scenes.$inferSelect;
export type NewScene = typeof scenes.$inferInsert;

export type VideoJobStatus =
  | "CREATED"
  | "GENERATING_IMAGE"
  | "IMAGE_READY"
  | "PLANNED"
  | "SCENES_GENERATING"
  | "SCENES_READY"
  | "STITCHING"
  | "DONE"
  | "FAILED";

export type VideoPlatform =
  | "tiktok"
  | "instagram_reels"
  | "youtube_shorts"
  | "general";

export type VideoLength = "15" | "30" | "45";

// ============================================
// SCENE PLAN TYPE (for AI planner output)
// ============================================

export interface ScenePlan {
  sceneIndex: number;
  duration: number; // 4, 6, or 8 seconds (Veo supported durations)
  script: string; // Narration text that Veo will speak
  visualPrompt: string;
  motionDescription: string;
}

export interface VideoGenerationPlan {
  fullScript: string;
  scenes: ScenePlan[];
  totalDuration: number;
}

