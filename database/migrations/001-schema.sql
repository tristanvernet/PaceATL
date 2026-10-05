-- Based on Jacob's original MySQL 8.4 schema. Creates missing tables only.
-- Existing tables are extended by backend/src/database-upgrade.js.
-- No DROP TABLE, row deletion, or server-level GTID changes.

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` date DEFAULT (curdate()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `tutorials` (
  `tut_id` varchar(20) NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `category` varchar(30) DEFAULT NULL,
  `difficulty_level` varchar(20) DEFAULT NULL,
  `target_muscle_group` varchar(50) DEFAULT NULL,
  `estimated_duration_mins` int DEFAULT NULL,
  `description` text,
  `video_url` varchar(2048) DEFAULT NULL,
  `created_at` date DEFAULT (curdate()),
  PRIMARY KEY (`tut_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `tutorial_steps` (
  `step_id` varchar(20) NOT NULL,
  `tut_id` varchar(20) DEFAULT NULL,
  `step_number` int DEFAULT NULL,
  `instruction_text` text,
  `tip_notes` text,
  PRIMARY KEY (`step_id`),
  UNIQUE KEY `tutorial_step_order` (`tut_id`,`step_number`),
  KEY `fk_step_id` (`tut_id`),
  CONSTRAINT `fk_step_id` FOREIGN KEY (`tut_id`) REFERENCES `tutorials` (`tut_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `completed_tutorials` (
  `completion_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tut_id` varchar(20) DEFAULT NULL,
  `completed_at` date DEFAULT (curdate()),
  PRIMARY KEY (`completion_id`),
  KEY `fk_tut_id` (`tut_id`),
  CONSTRAINT `fk_completed_tutorial_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_tut_id` FOREIGN KEY (`tut_id`) REFERENCES `tutorials` (`tut_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `rewards_challenges` (
  `challenge_id` int NOT NULL AUTO_INCREMENT,
  `challenge_title` varchar(50) DEFAULT NULL,
  `challenge_desc` text,
  PRIMARY KEY (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `completed_challenges` (
  `completion_id` int NOT NULL AUTO_INCREMENT,
  `challenge_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `completion_date` date DEFAULT (curdate()),
  PRIMARY KEY (`completion_id`),
  KEY `fk_challenge_id` (`challenge_id`),
  KEY `fk_user_id` (`user_id`),
  CONSTRAINT `fk_challenge_id` FOREIGN KEY (`challenge_id`) REFERENCES `rewards_challenges` (`challenge_id`),
  CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `workouts` (
  `workout_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `workout_desc` text,
  `workout_date` date DEFAULT NULL,
  PRIMARY KEY (`workout_id`),
  KEY `fk_user_id_2` (`user_id`),
  CONSTRAINT `fk_user_id_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Stores hashes of session tokens, never raw tokens. Used by the authentication implementation.
CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash CHAR(64) NOT NULL,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY session_user (user_id),
  KEY session_expiry (expires_at),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
