CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`week_key` text NOT NULL,
	`day_index` integer NOT NULL,
	`slot` integer NOT NULL,
	`organisation` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_uniq` ON `bookings` (`room_id`,`week_key`,`day_index`,`slot`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`floor` text NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0
);
