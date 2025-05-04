CREATE TABLE `posts_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`authorId` integer NOT NULL,
	FOREIGN KEY (`authorId`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE no action
);
