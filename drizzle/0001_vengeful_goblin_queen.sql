CREATE TABLE "player_fee_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"month_key" varchar(7) NOT NULL,
	"expected_amount" numeric(12, 2) DEFAULT '10.00' NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(50) DEFAULT 'unpaid' NOT NULL,
	"paid_at" date,
	"note" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_match_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"match_date" varchar(10) NOT NULL,
	"match_title" varchar(255),
	"dhanka_goolka" integer DEFAULT 0 NOT NULL,
	"caawinta" integer DEFAULT 0 NOT NULL,
	"anshaxa_ciyaarta" integer DEFAULT 0 NOT NULL,
	"kalsoonida" integer DEFAULT 0 NOT NULL,
	"la_dhaqanka_macalinka" integer DEFAULT 0 NOT NULL,
	"la_dhaqanka_ciyaartoyda_kale" integer DEFAULT 0 NOT NULL,
	"shaqada_loo_diray" integer DEFAULT 0 NOT NULL,
	"waajibaadka_booska" integer DEFAULT 0 NOT NULL,
	"masuuliyadda" integer DEFAULT 0 NOT NULL,
	"taktikada" integer DEFAULT 0 NOT NULL,
	"overall_rating" varchar(10) DEFAULT '0.0' NOT NULL,
	"coach_notes" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_monthly_stats" ADD COLUMN "training_score" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "player_monthly_stats" ADD COLUMN "errors_major" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "player_monthly_stats" ADD COLUMN "errors_medium" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "player_monthly_stats" ADD COLUMN "errors_severe" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_entries" ADD COLUMN "event_type" varchar(50) DEFAULT 'tababar' NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_entries" ADD COLUMN "opponent" varchar(255);--> statement-breakpoint
ALTER TABLE "schedule_entries" ADD COLUMN "match_date" varchar(10);--> statement-breakpoint
ALTER TABLE "player_fee_records" ADD CONSTRAINT "player_fee_records_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_ratings" ADD CONSTRAINT "player_match_ratings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "player_fee_month_idx" ON "player_fee_records" USING btree ("player_id","month_key");--> statement-breakpoint
CREATE UNIQUE INDEX "player_match_date_unique" ON "player_match_ratings" USING btree ("player_id","match_date");--> statement-breakpoint
CREATE INDEX "player_ratings_player_idx" ON "player_match_ratings" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_ratings_date_idx" ON "player_match_ratings" USING btree ("match_date");