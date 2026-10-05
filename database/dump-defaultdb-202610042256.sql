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
9ea20fd6-c020-11f1-bf06-16a90920bdb5:1-27';

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
  `completion_id` int NOT NULL,
  `tut_id` varchar(20) DEFAULT NULL,
  `completed_at` date DEFAULT (curdate()),
  PRIMARY KEY (`completion_id`),
  KEY `fk_tut_id` (`tut_id`),
  CONSTRAINT `fk_tut_id` FOREIGN KEY (`tut_id`) REFERENCES `tutorials` (`tut_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `completed_tutorials`
--

LOCK TABLES `completed_tutorials` WRITE;
/*!40000 ALTER TABLE `completed_tutorials` DISABLE KEYS */;
/*!40000 ALTER TABLE `completed_tutorials` ENABLE KEYS */;
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
  UNIQUE KEY `step_number` (`step_number`),
  KEY `fk_step_id` (`tut_id`),
  CONSTRAINT `fk_step_id` FOREIGN KEY (`tut_id`) REFERENCES `tutorials` (`tut_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutorial_steps`
--

LOCK TABLES `tutorial_steps` WRITE;
/*!40000 ALTER TABLE `tutorial_steps` DISABLE KEYS */;
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
  PRIMARY KEY (`tut_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutorials`
--

LOCK TABLES `tutorials` WRITE;
/*!40000 ALTER TABLE `tutorials` DISABLE KEYS */;
/*!40000 ALTER TABLE `tutorials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` date DEFAULT (curdate()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
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

-- Dump completed on 2026-10-04 22:57:08
