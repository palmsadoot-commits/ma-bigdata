-- MariaDB dump 10.18  Distrib 10.4.16-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: ma_bigdata
-- ------------------------------------------------------
-- Server version	10.4.16-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `detail` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'SYSTEM_SETTINGS_UPDATED','User updated system global settings','::ffff:127.0.0.1','2026-04-05 18:36:53'),(2,1,'PROFILE_UPDATED','User updated their own profile','::ffff:127.0.0.1','2026-04-05 18:47:58'),(3,1,'SYSTEM_SETTINGS_UPDATED','User updated system global settings','::ffff:127.0.0.1','2026-04-05 19:07:30'),(4,1,'SYSTEM_SETTINGS_UPDATED','User updated system global settings','::ffff:127.0.0.1','2026-04-05 19:09:15'),(5,1,'SYSTEM_SETTINGS_UPDATED','User updated system global settings','::ffff:127.0.0.1','2026-04-05 19:09:23'),(6,1,'SYSTEM_SETTINGS_UPDATED','User updated system global settings','::ffff:127.0.0.1','2026-04-05 19:18:27'),(7,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-05 19:53:39'),(8,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-05 22:28:44'),(9,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-05 22:29:11'),(10,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:04:55'),(11,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:08:07'),(12,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-06 08:09:38'),(13,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-06 08:13:56'),(14,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:14:07'),(15,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:17:34'),(16,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:31:53'),(17,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:31:58'),(18,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:32:17'),(19,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:32:22'),(20,1,'TICKET_CREATED','Ticket 5/2569 created','::ffff:127.0.0.1','2026-04-06 09:58:29'),(21,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-06 17:37:59'),(22,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:19:23'),(23,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:19:39'),(24,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:20:15'),(25,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:30:31'),(26,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:30:45'),(27,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:30:58'),(28,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:31:04'),(29,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:31:12'),(30,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:31:33'),(31,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:31:51'),(32,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:33:39'),(33,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:36:27'),(34,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:36:41'),(35,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:37:10'),(36,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:37:35'),(37,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:37:41'),(38,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:37:47'),(39,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 20:04:31'),(40,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-10 05:42:00'),(41,2,'LOGIN_SUCCESS','User repair logged in','::ffff:127.0.0.1','2026-04-10 05:43:17'),(42,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-10 05:43:30'),(43,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-10 05:43:43'),(44,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-10 08:40:22'),(45,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-10 08:40:43'),(46,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-10 09:46:02'),(47,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-10 09:57:23'),(48,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-10 10:06:07'),(49,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-10 10:07:10'),(50,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-10 16:01:25'),(51,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-17 15:34:11'),(52,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-17 15:34:30'),(53,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-17 15:34:46'),(54,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-17 15:35:26'),(55,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-17 16:08:08'),(56,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-17 16:44:34');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_logs`
--

DROP TABLE IF EXISTS `backup_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backup_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT 'database',
  `file_size` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'Success',
  `created_by` varchar(100) DEFAULT 'System',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_logs`
--

LOCK TABLES `backup_logs` WRITE;
/*!40000 ALTER TABLE `backup_logs` DISABLE KEYS */;
INSERT INTO `backup_logs` VALUES (20,'backup_31-03-2026_15-30-00.sql','database','0.02 MB','2026-03-31 15:30:00','Success','Auto Schedule'),(21,'backup_01-04-2026_14-30-00.sql','database','0.03 MB','2026-04-01 14:30:01','Success','Auto Schedule'),(22,'backup_02-04-2026_14-30-00.sql','database','0.03 MB','2026-04-02 14:30:01','Success','Auto Schedule'),(23,'backup_03-04-2026_14-30-00.sql','database','0.03 MB','2026-04-03 14:30:02','Success','Auto Schedule'),(26,'backup_06-04-2026_01-54-37.sql','database','0.04 MB','2026-04-06 01:54:38','Success','Admin (Manual)');
/*!40000 ALTER TABLE `backup_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_settings`
--

DROP TABLE IF EXISTS `backup_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backup_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_type` varchar(50) DEFAULT 'daily',
  `schedule_days` varchar(100) DEFAULT '1,2,3,4,5,6,0',
  `schedule_time` time DEFAULT '02:00:00',
  `is_active` tinyint(1) DEFAULT 1,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_settings`
--

LOCK TABLES `backup_settings` WRITE;
/*!40000 ALTER TABLE `backup_settings` DISABLE KEYS */;
INSERT INTO `backup_settings` VALUES (1,'daily','','14:30:00',1,'2026-04-01 14:16:51');
/*!40000 ALTER TABLE `backup_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) DEFAULT NULL,
  `category_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weighting_factor` decimal(5,2) NOT NULL DEFAULT 1.00 COMMENT 'ค่าตัวถ่วงน้ำหนัก',
  PRIMARY KEY (`category_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,1,'Hardware','เครื่องแม่ข่ายสำหรับระบบงานฐานข้อมูล (DB Server)',1.00),(2,1,'Hardware','อุปกรณ์สำหรับจัดเก็บข้อมูลแบบภายนอก (External Storage) SAN',1.00),(3,1,'Hardware','อุปกรณ์กระจายสัญญาณ SAN Switch',1.00),(4,1,'Hardware','เครื่องแม่ข่ายสำหรับสนับสนุนแอพพลิเคชั่นโปรแกรมประยุกต์ (App Server)',1.00),(5,1,'Hardware','เครื่องแม่ข่ายสำหรับงานข้อมูลขนาดใหญ่ (Big Data Server)',1.00),(6,1,'Hardware','อุปกรณ์กระจายสัญญาณ (L3 Switch)',1.00),(7,1,'Hardware','เครื่องแม่ข่ายระบบงานวิเคราะห์และนำเสนอข้อมูล (Analytics Server)',1.00),(8,1,'Software','ซอฟต์แวร์ HCI Sangfor V6.1.0',1.00),(9,1,'Software','ระบบปฏิบัติการ Operating System (OS)',1.00),(10,1,'Software','ซอฟต์แวร์ระบบบริหารจัดการฐานข้อมูลสัมพันธ์ (Oracle Database / RAC)',1.00),(11,1,'Software','ซอฟต์แวร์สนับสนุนการทำงานโปรแกรมประยุกต์ (Oracle Web Logic Suite)',1.00),(12,1,'Software','ซอฟต์แวร์สนับสนุนการเชื่อมโยงและแลกเปลี่ยนข้อมูล (Oracle SOA Suite)',1.00),(13,1,'Software','ซอฟต์แวร์สนับสนุนการนำเข้าข้อมูลเพื่อระบบงานข้อมูลขนาดใหญ่ (ODI, Cloudera)',1.00),(14,1,'Software','ซอฟต์แวร์ระบบการวิเคราะห์และนำเสนอข้อมูล (Oracle Analytics Server)',1.00),(15,1,'Software','ซอฟต์แวร์ระบบการวิเคราะห์อัจฉริยะ (Oracle ESSBASE Plus)',1.00),(16,1,'Application','Web Portal ระบบวิเคราะห์ข้อมูลขนาดใหญ่ด้านแรงงาน (Labour Big Data Analytics)',1.00),(17,1,'Application','แพลตฟอร์มการเชื่อมโยงแลกเปลี่ยนข้อมูล (Open Data)',1.00),(18,1,'Application','ระบบสนับสนุนการนำเข้าข้อมูลเพื่อระบบงานข้อมูลขนาดใหญ่',1.00),(19,1,'Application','ระบบการวิเคราะห์และประมวลผลอัจฉริยะ Oracle Analytics',1.00),(20,1,'Application','ระบบบริการเชื่อมโยงและแลกเปลี่ยนข้อมูล (MOL Data Exchange) กระทรวงแรงงาน',1.00),(21,1,'Application','ระบบบริหารการประชุม (Meeting Management System)',1.00),(22,1,'Application','ระบบบัญชีข้อมูลภาครัฐ Agency Data Catalog (CKAN)',1.00),(23,1,'Application','ระบบรวบรวมข้อมูลออนไลน์',1.00),(24,1,'Application','ระบบจัดเก็บข้อมูลขนาดใหญ่ (DATA LAKE)',1.00),(25,1,'Service','ด้านข้อมูล',1.00),(26,1,'Service','Query Data',1.00),(27,1,'Service','Database',1.00),(28,1,'Service','งานเชื่อมโยงข้อมูล API',1.00),(29,1,'Service','รายงาน',1.00),(30,1,'Service','บทวิเคราะห์',1.00);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_types`
--

DROP TABLE IF EXISTS `category_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category_types` (
  `type_id` int(11) NOT NULL AUTO_INCREMENT,
  `type_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `type_code` (`type_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_types`
--

LOCK TABLES `category_types` WRITE;
/*!40000 ALTER TABLE `category_types` DISABLE KEYS */;
INSERT INTO `category_types` VALUES (1,'Hardware','คอมพิวเตอร์แม่ข่ายและอุปกรณ์ (Hardware)'),(2,'Software','ซอฟต์แวร์สำหรับระบบคอมพิวเตอร์แม่ข่าย (Software)'),(3,'Application','ระบบสารสนเทศ (Application)'),(4,'Service','งานบริการ (Service Job)');
/*!40000 ALTER TABLE `category_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contracts` (
  `contract_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `contract_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contract_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contract_value` decimal(15,2) DEFAULT 0.00,
  `penalty_rate` decimal(10,5) DEFAULT 0.00100,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`contract_id`),
  KEY `project_id` (`project_id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `contracts_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`vendor_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contracts`
--

LOCK TABLES `contracts` WRITE;
/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
INSERT INTO `contracts` VALUES (1,1,1,'19/2569',NULL,0.00,0.00100,NULL,NULL,1,'2026-04-05 21:56:58'),(2,2,NULL,'87/2121',NULL,0.00,0.00100,NULL,NULL,1,'2026-04-05 21:56:58');
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipments`
--

DROP TABLE IF EXISTS `equipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipments` (
  `equipment_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `equipment_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serial_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Active','Inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  PRIMARY KEY (`equipment_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `equipments_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipments`
--

LOCK TABLES `equipments` WRITE;
/*!40000 ALTER TABLE `equipments` DISABLE KEYS */;
INSERT INTO `equipments` VALUES (1,1,'HPE ProLiant D360 Gen10','SGH031WCZZ','Active'),(2,1,'HPE ProLiant D360 Gen10','SGH031WD01','Active'),(3,2,'HPE MSA 2050','ACM028T387','Active'),(4,3,'HPE SN3600B','CZC018WZ73','Active'),(5,3,'HPE SN3600B','CZC018WZ0D','Active'),(6,4,'HPE ProLiant DL380 Gen10','SGH031WD20','Active'),(7,4,'HPE ProLiant DL380 Gen10','SGH031WD22','Active'),(8,5,'HPE ProLiant DL380 Gen10','SGH031W5SX','Active'),(9,5,'HPE ProLiant DL380 Gen10','SGH031W5SW','Active'),(10,5,'HPE ProLiant DL380 Gen10','SGH031W5SV','Active'),(11,5,'HPE ProLiant DL380 Gen10','SGH031W5ST','Active'),(12,5,'HPE ProLiant DL380 Gen10','SGH031W5SS','Active'),(13,5,'HPE ProLiant DL380 Gen10','SGH031W5SR','Active'),(14,5,'HPE ProLiant DL380 Gen10','SGH031W5SQ','Active'),(15,5,'HPE ProLiant DL380 Gen10','SGH031W5SP','Active'),(16,6,'Aruba 5406R zl2','SG03G4904L','Active'),(17,6,'Aruba 5406R zl2','SG03G49035','Active'),(18,7,'HPE ProLiant DL380 Gen10','SGH031WD14','Active'),(19,7,'HPE ProLiant DL380 Gen10','SGH031WD16','Active'),(20,8,'ซอฟต์แวร์ HCI Sangfor V6.1.0','A1AE7D521B014413','Active'),(21,9,'ระบบปฏิบัติการ Operating System (OS)','G3J29AAE','Active'),(22,10,'Oracle Database Enterprise Edition','A90611','Active'),(23,10,'Oracle Database Enterprise Edition','A90619','Active'),(24,10,'Oracle Real Application Cluster',NULL,'Active'),(25,11,'Oracle Web Logic Suite','L59008','Active'),(26,12,'Oracle SOA Suite','L17426','Active'),(27,13,'Oracle Data Integrator','L42186','Active'),(28,13,'Oracle Big Data Connector','L93999','Active'),(29,13,'Cloudera Database Enterprise Edition','G7M30AAE','Active'),(30,14,'Oracle Analytics Server','L104371','Active'),(31,15,'Oracle ESSBASE Plus','L61300','Active'),(32,15,'Oracle Analytics Server','L104371','Active'),(33,16,'Web Portal ระบบวิเคราะห์ข้อมูลขนาดใหญ่ด้านแรงงาน','https://bigdata.mol.go.th/','Active'),(34,17,'แพลตฟอร์มการเชื่อมโยงแลกเปลี่ยนข้อมูล (Open Data)','https://api-bigdata.mol.go.th/','Active'),(35,18,'ระบบสนับสนุนการนำเข้าข้อมูลเพื่อระบบงานข้อมูลขนาดใหญ่',NULL,'Active'),(36,19,'ระบบการวิเคราะห์และประมวลผลอัจฉริยะ Oracle Analytics','https://dv-bigdata.mol.go.th/','Active'),(37,20,'ระบบบริการเชื่อมโยงและแลกเปลี่ยนข้อมูล (MOL Data Exchange)','https://data-exchange.mol.go.th/','Active'),(38,21,'ระบบบริหารการประชุม (Meeting Management System)','https://e-meeting.mol.go.th/','Active'),(39,22,'ระบบบัญชีข้อมูลภาครัฐ Agency Data Catalog (CKAN)','https://mol.gdcatalog.go.th/','Active'),(40,23,'ระบบรวบรวมข้อมูลออนไลน์',NULL,'Active'),(41,24,'ระบบจัดเก็บข้อมูลขนาดใหญ่ (DATA LAKE)',NULL,'Active');
/*!40000 ALTER TABLE `equipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `github_sync_logs`
--

DROP TABLE IF EXISTS `github_sync_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `github_sync_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `sync_targets` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `github_sync_logs`
--

LOCK TABLES `github_sync_logs` WRITE;
/*!40000 ALTER TABLE `github_sync_logs` DISABLE KEYS */;
INSERT INTO `github_sync_logs` VALUES (18,'database,source','สำเร็จ','Auto Schedule','2026-03-31 08:30:03'),(20,'database,source','สำเร็จ','Admin (Manual)','2026-04-05 12:23:39');
