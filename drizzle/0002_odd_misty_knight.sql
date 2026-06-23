CREATE TYPE "public"."donation_fund" AS ENUM('general', 'tithe', 'missions', 'building', 'other');--> statement-breakpoint
CREATE TYPE "public"."donation_method" AS ENUM('cash', 'transfer', 'promptpay', 'other');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('member', 'regular', 'visitor', 'inactive');--> statement-breakpoint
CREATE TABLE "class_attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_offering_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid,
	"donor_name" text,
	"fund" "donation_fund" DEFAULT 'general' NOT NULL,
	"amount" integer NOT NULL,
	"method" "donation_method" DEFAULT 'cash' NOT NULL,
	"received_at" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid,
	"user_id" uuid,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"birth_date" date,
	"photo_url" text,
	"status" "member_status" DEFAULT 'visitor' NOT NULL,
	"joined_at" date,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_userId_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "class_attendances" ADD CONSTRAINT "class_attendances_class_offering_id_class_offerings_id_fk" FOREIGN KEY ("class_offering_id") REFERENCES "public"."class_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_attendances" ADD CONSTRAINT "class_attendances_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "class_attendances_offering_member_date_unq" ON "class_attendances" USING btree ("class_offering_id","member_id","session_date");