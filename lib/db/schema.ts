import {
  bigint,
  boolean,
  customType,
  integer,
  jsonb,
  pgEnum,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

function byteaFromDriver(value: unknown): Buffer | null {
  if (value == null) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") {
    if (value.startsWith("\\x")) return Buffer.from(value.slice(2), "hex");
    return Buffer.from(value, "base64");
  }
  throw new Error("Imagem inválida no banco.");
}

const bytea = customType<{ data: Buffer | null; driverData: unknown }>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value) {
    return byteaFromDriver(value);
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

export const guestStatusEnum = pgEnum("guest_status", [
  "pending",
  "confirmed",
  "declined",
]);

export const guestGroups = pgTable("guest_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const guests = pgTable(
  "guests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
    groupId: uuid("group_id").references(() => guestGroups.id, {
      onDelete: "set null",
    }),
    status: guestStatusEnum("status").notNull().default("pending"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("guests_name_normalized_idx").on(table.nameNormalized)],
);

export const unmatchedRsvps = pgTable(
  "unmatched_rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    typedName: text("typed_name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
    attending: boolean("attending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("unmatched_rsvps_name_normalized_idx").on(table.nameNormalized),
  ],
);
