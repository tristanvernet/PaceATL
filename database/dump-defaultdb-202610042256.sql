-- MySQL dump 10.13  Distrib 9.6.0, for Win64 (x86_64)
--
-- Host: mysql-48e104f-swe-project-fall26.c.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '8dcbebec-bdb5-11f1-8832-2aa6ac2dcb92:1-37,
9ea20fd6-c020-11f1-bf06-16a90920bdb5:1-97,
e519597d-c82a-11f1-82a8-3ac768f62c14:1-16';

--
-- Table structure for table `completed_challenges`
--

DROP TABLE IF EXISTS `completed_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `completed_challenges` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `completed_challenges`
--

LOCK TABLES `completed_challenges` WRITE;
/*!40000 ALTER TABLE `completed_challenges` DISABLE KEYS */;
/*!40000 ALTER TABLE `completed_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `completed_tutorials`
--

DROP TABLE IF EXISTS `completed_tutorials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `completed_tutorials` (
  `completion_id` int NOT NULL AUTO_INCREMENT,
  `tut_id` varchar(20) DEFAULT NULL,
  `completed_at` date DEFAULT (curdate()),
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`completion_id`),
  KEY `fk_tut_id` (`tut_id`),
  KEY `fk_completed_tutorial_user` (`user_id`),
  CONSTRAINT `fk_completed_tutorial_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_tut_id` FOREIGN KEY (`tut_id`) REFERENCES `tutorials` (`tut_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `completed_tutorials`
--

LOCK TABLES `completed_tutorials` WRITE;
/*!40000 ALTER TABLE `completed_tutorials` DISABLE KEYS */;
/*!40000 ALTER TABLE `completed_tutorials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reward_activity_events`
--

DROP TABLE IF EXISTS `reward_activity_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reward_activity_events` (
  `activity_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `activity_type` varchar(10) NOT NULL,
  `distance_miles` decimal(7,2) NOT NULL,
  `duration_minutes` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`activity_id`),
  KEY `reward_activity_user` (`user_id`),
  CONSTRAINT `fk_reward_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reward_activity_events`
--

LOCK TABLES `reward_activity_events` WRITE;
/*!40000 ALTER TABLE `reward_activity_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `reward_activity_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rewards_challenges`
--

DROP TABLE IF EXISTS `rewards_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rewards_challenges` (
  `challenge_id` int NOT NULL AUTO_INCREMENT,
  `challenge_title` varchar(50) DEFAULT NULL,
  `challenge_desc` text,
  PRIMARY KEY (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rewards_challenges`
--

LOCK TABLES `rewards_challenges` WRITE;
/*!40000 ALTER TABLE `rewards_challenges` DISABLE KEYS */;
/*!40000 ALTER TABLE `rewards_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_routes`
--

DROP TABLE IF EXISTS `saved_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_routes` (
  `route_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(80) NOT NULL,
  `points` json NOT NULL,
  `distance_meters` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`route_id`),
  KEY `saved_routes_user_created` (`user_id`,`created_at`),
  CONSTRAINT `fk_saved_route_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_routes`
--

LOCK TABLES `saved_routes` WRITE;
/*!40000 ALTER TABLE `saved_routes` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutorial_steps`
--

DROP TABLE IF EXISTS `tutorial_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutorial_steps` (
  `step_id` varchar(20) NOT NULL,
  `tut_id` varchar(20) DEFAULT NULL,
  `step_number` int DEFAULT NULL,
  `instruction_text` text,
  `tip_notes` text,
  PRIMARY KEY (`step_id`),
  UNIQUE KEY `tutorial_step_order` (`tut_id`,`step_number`),
  CONSTRAINT `fk_step_id` FOREIGN KEY (`tut_id`) REFERENCES `tutorials` (`tut_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutorial_steps`
--

LOCK TABLES `tutorial_steps` WRITE;
/*!40000 ALTER TABLE `tutorial_steps` DISABLE KEYS */;
INSERT INTO `tutorial_steps` VALUES ('tut-01-s1','tut-01',1,'MORE HELP: Start with short, manageable workouts and gradually increase your exercise time.',NULL),('tut-01-s2','tut-01',2,'MORE HELP:  Maintain a steady pace instead of exercising at maximum intensity.','You have no one to impress but yourself. Start slow and consistent!'),('tut-01-s3','tut-01',3,'MORE HELP: Take short recovery breaks when needed and increase workout difficulty over time.',NULL),('tut-02-s1','tut-02',1,'10 Forward Leg Swings per leg.','Hold a wall for balance.'),('tut-02-s2','tut-02',2,'60 seconds walking lunges with torso twists.',NULL),('tut-02-s3','tut-02',3,'30 seconds high knees.',NULL),('tut-02-s4','tut-02',4,'Perform dynamic stretches such as leg swings and arm circles.','Start slowly with few reps, then increase your pace.'),('tut-02-s5','tut-02',5,'Complete 10 walking lunges with a gentle torso twist on each side.',NULL),('tut-02-s6','tut-02',6,'Do 10 arm circles forward and 10 backward.','Keep your shoulders relaxed.'),('tut-02-s7','tut-02',7,'Perform high knees for 30 seconds.',NULL),('tut-02-s8','tut-02',8,'Finish this with 1-2 minutes of light jogging','The overall goal is to get your heart pumping and ready to exercise. Not to be tired!!!'),('tut-03-s1','tut-03',1,'MORE HELP: Hold standing quad stretch for 30 seconds each side.','MORE HELP:  Drink water in between or after these steps to ensure hydration and recovery of the body. '),('tut-03-s2','tut-03',2,'MORE HELP:  Seated hamstring fold held for 45 seconds.',NULL),('tut-03-s3','tut-03',3,'MORE HELP:  Standing calf stretch against wall for 30 seconds.',NULL);
/*!40000 ALTER TABLE `tutorial_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutorials`
--

DROP TABLE IF EXISTS `tutorials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutorials` (
  `tut_id` varchar(20) NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `category` varchar(30) DEFAULT NULL,
  `difficulty_level` varchar(20) DEFAULT NULL,
  `target_muscle_group` varchar(50) DEFAULT NULL,
  `estimated_duration_mins` int DEFAULT NULL,
  `description` text,
  `created_at` date DEFAULT (curdate()),
  `video_url` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`tut_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutorials`
--

LOCK TABLES `tutorials` WRITE;
/*!40000 ALTER TABLE `tutorials` DISABLE KEYS */;
INSERT INTO `tutorials` VALUES ('tut-01','How to Improve Your Running Endurance?','Form Tips','Beginner','Full Body',12,'Prevent fatigue and joint strain with a proper warmup before performing activities.','2026-10-05','https://youtu.be/Hr6FbA3xr7I?si=RkurLNUgaqZhaX7u'),('tut-02','How to Properly Warm Up Before a Workout?','Warmup','Beginner','Legs & Core',15,'Prepare muscles and joints before tackling high-elevation routes.','2026-10-05',NULL),('tut-03','How to Recover your lower body after a run?','Recovery','Intermediate','Hamstrings & Calves',12,'Minimize muscle soreness and improve recovery time after long workouts.','2026-10-05','https://youtu.be/bKLn7xp-q48?si=dwAby6tcZZVecJkO');
/*!40000 ALTER TABLE `tutorials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_achievements`
--

DROP TABLE IF EXISTS `user_achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_achievements` (
  `user_id` int NOT NULL,
  `achievement_key` varchar(50) NOT NULL,
  `earned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`achievement_key`),
  CONSTRAINT `fk_achievement_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_achievements`
--

LOCK TABLES `user_achievements` WRITE;
/*!40000 ALTER TABLE `user_achievements` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `token_hash` char(64) NOT NULL,
  `user_id` int NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_hash`),
  KEY `session_user` (`user_id`),
  KEY `session_expiry` (`expires_at`),
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
INSERT INTO `user_sessions` VALUES ('7b162c39a12d9a4dffcce5baeae1c9861f539b45597c5837d31b42a9cc4fd9e7',5,'2026-10-12 12:48:21','2026-10-05 12:48:21');
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` date DEFAULT (curdate()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (5,'TESTER','jonesburner69@gmail.com','scrypt$65536$8$2$e079541fe4fdfe13e1cbc243f76f2858$0b4fd0c1d0f8d946c35e88edd16353ce37f7bb5b9546092bdc3c660d9ae3d5404ff3729a91d359f2e613ccda3a3d37d76d14533e10e10a7dc5dd035542bd64ad','2026-10-05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workouts`
--

DROP TABLE IF EXISTS `workouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workouts` (
  `workout_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `workout_desc` text,
  `workout_date` date DEFAULT NULL,
  PRIMARY KEY (`workout_id`),
  KEY `fk_user_id_2` (`user_id`),
  CONSTRAINT `fk_user_id_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workouts`
--

LOCK TABLES `workouts` WRITE;
/*!40000 ALTER TABLE `workouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `workouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'defaultdb'
--
--
-- WARNING: can't read the INFORMATION_SCHEMA.libraries table. It's most probably an old server 8.4.8.
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-18 21:49:48
