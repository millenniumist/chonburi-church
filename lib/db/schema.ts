import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Drizzle schema — the single source of truth for the data model.
 * Column names are derived as snake_case from the camelCase keys
 * (see `casing: 'snake_case'` in drizzle.config.ts and the db client).
 * See CONTEXT.md for the domain meaning of each table.
 */

// ── Enums ──────────────────────────────────────────────────────────────────

export const userRole = pgEnum('user_role', ['admin', 'staff', 'member', 'visitor']);
export const orderStatus = pgEnum('order_status', [
  'pending',
  'preparing',
  'ready',
  'completed',
  'cancelled',
]);
export const enrollmentStatus = pgEnum('enrollment_status', ['enrolled', 'waitlisted', 'cancelled']);
export const classKind = pgEnum('class_kind', ['english', 'guitar', 'japanese']);
export const attendanceMethod = pgEnum('attendance_method', ['gps', 'staff', 'qr']);

// CRM directory, giving & class attendance (see ADR-0005)
export const memberStatus = pgEnum('member_status', ['member', 'regular', 'visitor', 'inactive']);
export const donationFund = pgEnum('donation_fund', ['general', 'tithe', 'missions', 'building', 'other']);
export const donationMethod = pgEnum('donation_method', ['cash', 'transfer', 'promptpay', 'other']);

// ── Identity & access ────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  phone: text(),
  passwordHash: text().notNull(),
  role: userRole().notNull().default('visitor'),
  // The ordering gate. Members are born `true`; visitors flip to `true`
  // after one verified attendance. Always enforced server-side.
  orderingEnabled: boolean().notNull().default(false),
  locale: text().notNull().default('th'),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  // The SHA-256 hash of the session token. The raw token only lives in the cookie.
  id: text().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// ── Attendance & qualification ───────────────────────────────────────────────

export const services = pgTable('services', {
  id: uuid().defaultRandom().primaryKey(),
  nameTh: text().notNull(),
  nameEn: text().notNull(),
  dayOfWeek: integer().notNull(), // 0 = Sunday … 6 = Saturday
  startTime: time().notNull(),
  endTime: time().notNull(),
  active: boolean().notNull().default(true),
});

export const attendances = pgTable(
  'attendances',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    serviceId: uuid().references(() => services.id, { onDelete: 'set null' }),
    serviceDate: date().notNull(), // calendar day (Asia/Bangkok) of the service
    checkedInAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    latitude: doublePrecision().notNull(),
    longitude: doublePrecision().notNull(),
    distanceMeters: doublePrecision().notNull(),
    verified: boolean().notNull().default(false),
    method: attendanceMethod().notNull().default('gps'),
  },
  (t) => [uniqueIndex('attendances_user_service_date_unq').on(t.userId, t.serviceDate)],
);

// Single-row config (id is pinned to 1). Anchor point for the GPS check.
export const siteConfig = pgTable('site_config', {
  id: integer().primaryKey().default(1),
  churchLat: doublePrecision().notNull(),
  churchLng: doublePrecision().notNull(),
  checkinRadiusMeters: integer().notNull().default(150),
  addressTh: text(),
  addressEn: text(),
  mapEmbedUrl: text(),
  phone: text(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// ── Café menu & orders (free — no money anywhere) ────────────────────────────

export const menuItems = pgTable('menu_items', {
  id: uuid().defaultRandom().primaryKey(),
  slug: text().notNull().unique(),
  nameTh: text().notNull(),
  nameEn: text().notNull(),
  descriptionTh: text(),
  descriptionEn: text(),
  imageUrl: text(),
  category: text().notNull().default('coffee'),
  available: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: orderStatus().notNull().default('pending'),
  pickupCode: text().notNull(),
  note: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  readyAt: timestamp({ withTimezone: true }),
  completedAt: timestamp({ withTimezone: true }),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid().defaultRandom().primaryKey(),
  orderId: uuid()
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: uuid().references(() => menuItems.id, { onDelete: 'set null' }),
  // Snapshot the name so an order reads correctly even if the menu item changes.
  nameSnapshotTh: text().notNull(),
  nameSnapshotEn: text().notNull(),
  quantity: integer().notNull().default(1),
  note: text(),
});

// ── Saturday classes ─────────────────────────────────────────────────────────

export const classOfferings = pgTable('class_offerings', {
  id: uuid().defaultRandom().primaryKey(),
  slug: text().notNull().unique(),
  kind: classKind().notNull(),
  nameTh: text().notNull(),
  nameEn: text().notNull(),
  descriptionTh: text(),
  descriptionEn: text(),
  imageUrl: text(),
  level: text(), // e.g. "P1-P6", "basic"
  dayOfWeek: integer().notNull().default(6), // Saturday
  startTime: time().notNull(),
  endTime: time().notNull(),
  capacity: integer(), // null = unlimited
  active: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
});

export const enrollments = pgTable('enrollments', {
  id: uuid().defaultRandom().primaryKey(),
  classOfferingId: uuid()
    .notNull()
    .references(() => classOfferings.id, { onDelete: 'cascade' }),
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }),
  guestName: text(),
  guestPhone: text(),
  status: enrollmentStatus().notNull().default('enrolled'),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// ── CMS: editable editorial content & announcements (ADR-0004) ────────────────

/**
 * One row per editable editorial/church section, keyed by section id
 * (e.g. 'hero', 'gospel', 'church'). The bilingual structured content lives as
 * validated JSON in `value` — the shape per key is defined by the section
 * registry in `lib/cms/sections.ts`, which also supplies the runtime fallback
 * from `content/site.ts`. The public site must NEVER break: the read layer
 * (`lib/cms/read.ts`) parses `value` with the registry schema and degrades to
 * the registry default on a missing or invalid row.
 */
export const siteContent = pgTable('site_content', {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/**
 * Church/café news & events the admin can publish, reorder, and retire on its
 * own. `publishedOnly` reads filter to `active && publishedAt != null &&
 * publishedAt <= now`; the public ordering is `sortOrder`, then `publishedAt`.
 * Images are URL references (`imageUrl`), matching the `menuItems` pattern.
 */
export const announcements = pgTable('announcements', {
  id: uuid().defaultRandom().primaryKey(),
  slug: text().unique(),
  titleTh: text().notNull(),
  titleEn: text().notNull(),
  bodyTh: text().notNull(),
  bodyEn: text().notNull(),
  imageUrl: text(),
  publishedAt: timestamp({ withTimezone: true }),
  active: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// ── CRM: directory, giving & class attendance (ADR-0005) ─────────────────────

/**
 * A household grouping. Several directory members share a family's address and
 * phone. Names here are operational data, not translated content (CONTEXT
 * invariant 9) — a single `name` field, not th/en.
 */
export const families = pgTable('families', {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  address: text(),
  phone: text(),
  notes: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/**
 * A person in the church directory — independent of a login. Most members
 * (children, visitors) have no `users` row; `userId` is an optional, unique
 * link for those who do log in. Archived via `active`, never hard-deleted.
 */
export const members = pgTable('members', {
  id: uuid().defaultRandom().primaryKey(),
  familyId: uuid().references(() => families.id, { onDelete: 'set null' }),
  userId: uuid()
    .references(() => users.id, { onDelete: 'set null' })
    .unique(),
  name: text().notNull(),
  email: text(),
  phone: text(),
  birthDate: date(),
  photoUrl: text(),
  status: memberStatus().notNull().default('visitor'),
  joinedAt: date(),
  notes: text(),
  active: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/**
 * A recorded gift. `amount` is in **satang** (THB minor units) — integer, never
 * float (CONTEXT invariant 8). `memberId` is nullable for anonymous/cash gifts;
 * `donorName` snapshots the giver so a receipt stays correct if the member is
 * later edited. There is NO online payment processing — admins record gifts the
 * church received out-of-band.
 */
export const donations = pgTable('donations', {
  id: uuid().defaultRandom().primaryKey(),
  memberId: uuid().references(() => members.id, { onDelete: 'set null' }),
  donorName: text(),
  fund: donationFund().notNull().default('general'),
  amount: integer().notNull(), // satang (THB minor unit)
  method: donationMethod().notNull().default('cash'),
  receivedAt: date().notNull(), // gift date; giving statements group by calendar year
  note: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/**
 * A class-attendance register row: a directory member was present at a class
 * offering on a given date. One row per person per class per day.
 */
export const classAttendances = pgTable(
  'class_attendances',
  {
    id: uuid().defaultRandom().primaryKey(),
    classOfferingId: uuid()
      .notNull()
      .references(() => classOfferings.id, { onDelete: 'cascade' }),
    memberId: uuid()
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    sessionDate: date().notNull(),
    note: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('class_attendances_offering_member_date_unq').on(
      t.classOfferingId,
      t.memberId,
      t.sessionDate,
    ),
  ],
);

// ── Relations (for the Drizzle query API) ────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  attendances: many(attendances),
  orders: many(orders),
  enrollments: many(enrollments),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  user: one(users, { fields: [attendances.userId], references: [users.id] }),
  service: one(services, { fields: [attendances.serviceId], references: [services.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
}));

export const classOfferingsRelations = relations(classOfferings, ({ many }) => ({
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  classOffering: one(classOfferings, {
    fields: [enrollments.classOfferingId],
    references: [classOfferings.id],
  }),
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
}));

export const familiesRelations = relations(families, ({ many }) => ({
  members: many(members),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  family: one(families, { fields: [members.familyId], references: [families.id] }),
  user: one(users, { fields: [members.userId], references: [users.id] }),
  donations: many(donations),
  classAttendances: many(classAttendances),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  member: one(members, { fields: [donations.memberId], references: [members.id] }),
}));

export const classAttendancesRelations = relations(classAttendances, ({ one }) => ({
  classOffering: one(classOfferings, {
    fields: [classAttendances.classOfferingId],
    references: [classOfferings.id],
  }),
  member: one(members, { fields: [classAttendances.memberId], references: [members.id] }),
}));

// ── Inferred types ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Attendance = typeof attendances.$inferSelect;
export type SiteConfig = typeof siteConfig.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ClassOffering = typeof classOfferings.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type SiteContent = typeof siteContent.$inferSelect;
export type NewSiteContent = typeof siteContent.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
export type ClassAttendance = typeof classAttendances.$inferSelect;
export type NewClassAttendance = typeof classAttendances.$inferInsert;

export type UserRole = (typeof userRole.enumValues)[number];
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type EnrollmentStatus = (typeof enrollmentStatus.enumValues)[number];
export type ClassKind = (typeof classKind.enumValues)[number];
export type AttendanceMethod = (typeof attendanceMethod.enumValues)[number];
export type MemberStatus = (typeof memberStatus.enumValues)[number];
export type DonationFund = (typeof donationFund.enumValues)[number];
export type DonationMethod = (typeof donationMethod.enumValues)[number];
