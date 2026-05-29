import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  doublePrecision,
  integer,
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

export type UserRole = (typeof userRole.enumValues)[number];
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type EnrollmentStatus = (typeof enrollmentStatus.enumValues)[number];
export type ClassKind = (typeof classKind.enumValues)[number];
export type AttendanceMethod = (typeof attendanceMethod.enumValues)[number];
