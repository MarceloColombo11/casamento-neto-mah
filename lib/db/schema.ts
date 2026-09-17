import {
  bigint,
  boolean,
  customType,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value) {
    if (value == null) return value as unknown as Buffer;
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    if (typeof value === "string") {
      if (value.startsWith("\\x")) return Buffer.from(value.slice(2), "hex");
      return Buffer.from(value, "base64");
    }
    throw new Error("Imagem inválida no banco.");
  },
});

export const mediaSourceEnum = pgEnum("media_source", [
  "static",
  "drive",
  "db",
]);
export const photoCollectionEnum = pgEnum("photo_collection", [
  "hero",
  "historia",
]);

export const siteMedia = pgTable("site_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: mediaSourceEnum("source").notNull(),
  staticPath: text("static_path"),
  driveFileId: text("drive_file_id"),
  mime: text("mime").notNull(),
  byteSize: integer("byte_size").notNull(),
  bytes: bytea("bytes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const gifts = pgTable("gifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pix: text("pix"),
  suggestedValue: text("suggested_value"),
  mediaId: uuid("media_id").references(() => siteMedia.id, {
    onDelete: "set null",
  }),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sitePhotos = pgTable("site_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  collection: photoCollectionEnum("collection").notNull(),
  mediaId: uuid("media_id")
    .notNull()
    .references(() => siteMedia.id),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const siteTextBlocks = pgTable("site_text_blocks", {
  key: text("key").primaryKey(),
  payload: jsonb("payload").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminLoginAttempts = pgTable("admin_login_attempts", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  ipHash: text("ip_hash").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  success: boolean("success").notNull(),
});

export const contentSeed = pgTable("content_seed", {
  id: text("id").primaryKey(),
  seededAt: timestamp("seeded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
