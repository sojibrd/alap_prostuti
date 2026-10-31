CREATE TABLE "preparations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"want" text DEFAULT '' NOT NULL,
	"opening_line" text DEFAULT '' NOT NULL,
	"their_reply" text DEFAULT '' NOT NULL,
	"my_reply" text DEFAULT '' NOT NULL,
	"outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preparations_text_length" CHECK (char_length("preparations"."want") <= 2000 and char_length("preparations"."opening_line") <= 2000 and char_length("preparations"."their_reply") <= 2000 and char_length("preparations"."my_reply") <= 2000 and char_length("preparations"."outcome") <= 2000)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"google_sub" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
CREATE TABLE "web_vitals" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "web_vitals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"metric" text NOT NULL,
	"value" double precision NOT NULL,
	"rating" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "web_vitals_metric" CHECK ("web_vitals"."metric" in ('LCP', 'INP', 'CLS', 'FCP', 'TTFB')),
	CONSTRAINT "web_vitals_rating" CHECK ("web_vitals"."rating" in ('good', 'needs-improvement', 'poor'))
);
--> statement-breakpoint
ALTER TABLE "preparations" ADD CONSTRAINT "preparations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "preparations_user_id_created_at_idx" ON "preparations" USING btree ("user_id","created_at" DESC NULLS LAST);