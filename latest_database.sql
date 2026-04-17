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
-- Table structure for table `github_settings`
--

DROP TABLE IF EXISTS `github_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `github_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `github_token` varchar(255) DEFAULT NULL,
  `repo_url` varchar(255) DEFAULT NULL,
  `branch_name` varchar(100) DEFAULT 'main',
  `sync_targets` varchar(255) DEFAULT 'database,source',
  `schedule_type` varchar(50) DEFAULT 'daily',
  `schedule_days` varchar(50) DEFAULT '0',
  `schedule_time` time DEFAULT '05:00:00',
  `is_active` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `github_settings`
--

LOCK TABLES `github_settings` WRITE;
/*!40000 ALTER TABLE `github_settings` DISABLE KEYS */;
INSERT INTO `github_settings` VALUES (1,'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','https://github.com/palmsadoot-commits/ma-bigdata','main','database,source','daily','','15:35:00',1);
/*!40000 ALTER TABLE `github_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `project_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_name` varchar(150) NOT NULL,
  `project_contract` varchar(100) DEFAULT NULL,
  `contract_value` decimal(15,2) DEFAULT 0.00,
  `penalty_rate` decimal(10,4) DEFAULT 0.0010,
  `description` text DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`project_id`),
  KEY `fk_projects_vendor` (`vendor_id`),
  CONSTRAINT `fk_projects_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`vendor_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'MA BIGDATA','19/2569',0.00,0.0010,'ระบบหลัก',1,'2026-03-25 09:47:07'),(2,'NLIC','87/2121',0.00,0.0010,'ฟหก',NULL,'2026-03-28 14:14:16');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `source_backup_logs`
--

DROP TABLE IF EXISTS `source_backup_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `source_backup_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `target_folders` varchar(255) DEFAULT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `source_backup_logs`
--

LOCK TABLES `source_backup_logs` WRITE;
/*!40000 ALTER TABLE `source_backup_logs` DISABLE KEYS */;
INSERT INTO `source_backup_logs` VALUES (5,'src_31-03-2026_15-30-00.zip','frontend,backend','0.23 MB','Success','Auto Schedule','2026-03-31 08:30:02'),(7,'src_01-04-2026_14-30-00.zip','frontend,backend','0.23 MB','Success','Auto Schedule','2026-04-01 07:30:03'),(8,'src_02-04-2026_14-30-00.zip','frontend,backend','0.24 MB','Success','Auto Schedule','2026-04-02 07:30:04'),(9,'src_03-04-2026_14-30-00.zip','frontend,backend','0.25 MB','Success','Auto Schedule','2026-04-03 07:30:02'),(11,'src_18-04-2026_1776451775713.zip','frontend,backend','0.28 MB','Success','Admin (Manual)','2026-04-17 18:49:44');
/*!40000 ALTER TABLE `source_backup_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `source_backup_settings`
--

DROP TABLE IF EXISTS `source_backup_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `source_backup_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `target_folders` varchar(255) DEFAULT 'frontend,backend',
  `schedule_type` varchar(50) DEFAULT 'weekly',
  `schedule_days` varchar(50) DEFAULT '0',
  `schedule_time` time DEFAULT '04:00:00',
  `is_active` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `source_backup_settings`
--

LOCK TABLES `source_backup_settings` WRITE;
/*!40000 ALTER TABLE `source_backup_settings` DISABLE KEYS */;
INSERT INTO `source_backup_settings` VALUES (1,'frontend,backend','daily','','14:30:00',1);
/*!40000 ALTER TABLE `source_backup_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `system_name` varchar(255) DEFAULT 'LIMS Big Data',
  `agency_name` varchar(255) DEFAULT 'Agency Name',
  `system_logo` varchar(255) DEFAULT NULL,
  `line_notify_token` varchar(255) DEFAULT NULL,
  `line_group_id` varchar(255) DEFAULT NULL,
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_port` varchar(10) DEFAULT NULL,
  `smtp_user` varchar(255) DEFAULT NULL,
  `smtp_pass` varchar(255) DEFAULT NULL,
  `admin_email` varchar(255) DEFAULT NULL,
  `default_sla_hours` int(11) DEFAULT 2,
  `default_penalty_rate` decimal(10,4) DEFAULT 0.0010,
  `allowed_file_types` varchar(255) DEFAULT 'jpeg,jpg,png,gif,pdf,doc,docx,xls,xlsx,zip,rar',
  `max_file_size_mb` int(11) DEFAULT 10,
  `security_strict_mode` tinyint(1) DEFAULT 1,
  `notify_new_ticket` tinyint(1) DEFAULT 1,
  `notify_status_change` tinyint(1) DEFAULT 1,
  `enable_line` tinyint(1) DEFAULT 1,
  `enable_email` tinyint(1) DEFAULT 1,
  `sla_hardware_hours` int(11) DEFAULT 6,
  `sla_software_hours` int(11) DEFAULT 6,
  `sla_app_hours` int(11) DEFAULT 12,
  `ack_limit_hours` int(11) DEFAULT 2,
  `msg_template_new` text DEFAULT NULL,
  `msg_template_update` text DEFAULT NULL,
  `maintenance_mode` tinyint(1) DEFAULT 0,
  `theme_mode` varchar(20) DEFAULT 'light',
  `primary_color` varchar(20) DEFAULT '#1677ff',
  `system_font` varchar(50) DEFAULT 'Inter',
  `system_favicon` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'ระบบแจ้งปัญหาบำรุงรักษา','สำนักงานปลัดกระทรวงแรงงาน','1775414213141.png',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,0.0010,NULL,5,1,0,0,0,0,6,6,12,2,NULL,NULL,0,'light','#18da0e','Sarabun',NULL);
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theme_settings`
--

DROP TABLE IF EXISTS `theme_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `theme_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `theme_mode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'light',
  `primary_color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'blue',
  `layout_style` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'sidebar',
  `border_radius` int(11) DEFAULT 8,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theme_settings`
--

LOCK TABLES `theme_settings` WRITE;
/*!40000 ALTER TABLE `theme_settings` DISABLE KEYS */;
INSERT INTO `theme_settings` VALUES (1,'auto','green','sidebar',8,'2026-04-06 08:21:02');
/*!40000 ALTER TABLE `theme_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_attachments`
--

DROP TABLE IF EXISTS `ticket_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket_attachments` (
  `attachment_id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `uploaded_by` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`attachment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_attachments`
--

LOCK TABLES `ticket_attachments` WRITE;
/*!40000 ALTER TABLE `ticket_attachments` DISABLE KEYS */;
INSERT INTO `ticket_attachments` VALUES (1,5,'à¸à¸±à¸à¸à¸¶à¸à¸£à¸²à¸¢à¸à¸²à¸à¸ªà¸£à¸¸à¸à¸à¸²à¸£à¸à¸£à¸°à¸à¸¸à¸¡à¸à¸²à¸£à¹à¸à¹à¸à¸£à¸°à¹à¸¢à¸à¸à¹.doc','1774457474051.doc','undefined','2026-03-25 16:51:14'),(2,5,'801153.jpg','1774457568379.jpg','2','2026-03-25 16:52:48');
/*!40000 ALTER TABLE `ticket_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_logs`
--

DROP TABLE IF EXISTS `ticket_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `actor_name` varchar(100) DEFAULT NULL,
  `detail` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_logs`
--

LOCK TABLES `ticket_logs` WRITE;
/*!40000 ALTER TABLE `ticket_logs` DISABLE KEYS */;
INSERT INTO `ticket_logs` VALUES (1,4,'ส่งตรวจสอบ','ช่างใหม่ ไฟแรง','รายละเอียดที่แก้ไข: mvlld','2026-03-25 15:26:54'),(2,4,'ตีกลับให้แก้ไขใหม่','แจ้ง งาน','ผู้แจ้งตรวจสอบพบว่ายังใช้งานไม่ได้ ส่งให้ช่างแก้ใหม่','2026-03-25 15:29:04'),(3,4,'ส่งตรวจสอบ','ช่างใหม่ ไฟแรง','รายละเอียดที่แก้ไข: mvlldasdsasd','2026-03-25 15:30:11'),(4,4,'ตีกลับให้แก้ไขใหม่','แจ้ง งาน','ผู้แจ้งตรวจสอบพบว่ายังใช้งานไม่ได้ ส่งให้ช่างแก้ใหม่','2026-03-25 15:39:43'),(5,4,'ส่งตรวจสอบ','ช่างใหม่ ไฟแรง','รายละเอียด: mvlld','2026-03-25 15:40:03'),(6,5,'รับงาน','ช่างใหม่ ไฟแรง','ช่างกดรับผิดชอบงานนี้เข้าตัวเอง','2026-03-25 15:41:42'),(7,5,'ส่งตรวจสอบ','ช่างใหม่ ไฟแรง','วิธีแก้ไข: แก้ไขครั้งที่ 1\n[แนบไฟล์: Firewall Policy.docx]','2026-03-25 15:59:27'),(8,5,'ตีกลับให้แก้ไขใหม่','แจ้ง งาน','เหตุผลที่ตีกลับ: ยังเข้าไม่ได้เลย\n[แนบไฟล์เพิ่มเติม: 1774457474051.doc]','2026-03-25 16:51:14'),(9,5,'ส่งตรวจสอบ','ช่างใหม่ ไฟแรง','วิธีแก้ไข: แก้ไขครั้งที่ 2 ตรวจสอบอีกครั้งครับ\n[แนบไฟล์: 1774457568379.jpg]','2026-03-25 16:52:48'),(10,5,'ปิดเคสสมบูรณ์','แจ้ง งาน','ผู้แจ้งตรวจสอบและยืนยันการปิดงาน','2026-03-25 17:15:23'),(11,4,'ปิดเคสสมบูรณ์','นายวุฒิไกร พรหมเรือง','ผู้แจ้งตรวจสอบและยืนยันการปิดงาน','2026-03-28 14:29:43'),(12,3,'มอบหมายงาน','นายวุฒิไกร พรหมเรือง','จ่ายงานให้: ช่างใหม่ ไฟแรง','2026-03-29 09:47:41'),(13,3,'อัปเดตงาน (Resolved)','นายวุฒิไกร พรหมเรือง','วิธีแก้ไข: ๆสสไไำสา่หๆสา้นๆร นืหก่้ดนฟยหนกบๆไ่กฟาหกฟส าห่กฟาห่ก ๆนืไำกสฟืสหกืฟน ่หกร่ๆร กๆืืดนฟรกฟ ืหกาืฟสหากฟนหรก่ฟสหากสฟหก่ฟยหนก่ๆยาไทกืฟสาืห \n\nฟห่กฟาห่กา่ๆ่ไกาสฟหสาก่ ๆร่ๆาไ่ำาๆื ทืฟมหวฟากๆไราำบๆยไ','2026-03-29 09:48:39'),(14,3,'ตีกลับให้แก้ไขใหม่','นายวุฒิไกร พรหมเรือง','เหตุผลที่ตีกลับ: ไำๆไำผป(แฤฆฏ๐\"ฎ','2026-03-29 09:49:17'),(15,2,'รับงาน','ช่างใหม่ ไฟแรง','ช่างกดรับผิดชอบงานนี้เข้าตัวเอง','2026-04-02 10:31:30'),(16,4,'รับงาน','ช่างใหม่ ไฟแรง','ช่างกดรับผิดชอบงานนี้เข้าตัวเอง','2026-04-05 12:59:57');
/*!40000 ALTER TABLE `ticket_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_resolutions`
--

DROP TABLE IF EXISTS `ticket_resolutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket_resolutions` (
  `resolution_id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `technician_id` int(11) NOT NULL,
  `root_cause_and_solution` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `resolved_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`resolution_id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `technician_id` (`technician_id`),
  CONSTRAINT `ticket_resolutions_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`ticket_id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_resolutions_ibfk_2` FOREIGN KEY (`technician_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_resolutions`
--

LOCK TABLES `ticket_resolutions` WRITE;
/*!40000 ALTER TABLE `ticket_resolutions` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_resolutions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_statuses`
--

DROP TABLE IF EXISTS `ticket_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket_statuses` (
  `status_id` int(11) NOT NULL AUTO_INCREMENT,
  `status_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '#1890ff',
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`status_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_statuses`
--

LOCK TABLES `ticket_statuses` WRITE;
/*!40000 ALTER TABLE `ticket_statuses` DISABLE KEYS */;
INSERT INTO `ticket_statuses` VALUES (1,'Pending','red',1),(2,'In Progress','orange',2),(3,'Resolved','green',3),(4,'Closed','blue',4);
/*!40000 ALTER TABLE `ticket_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tickets` (
  `ticket_id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `equipment_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `software_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `problem_detail` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `attachment` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_cm` tinyint(1) DEFAULT 0,
  `sla_hours` int(11) DEFAULT 0,
  `acknowledged_at` datetime DEFAULT NULL COMMENT 'เวลาที่ช่างกดรับงาน (เช็คเงื่อนไข 2 ชม.)',
  `resolved_at` datetime DEFAULT NULL COMMENT 'เวลาที่แก้ไขเสร็จจริง',
  `sla_deadline` datetime DEFAULT NULL COMMENT 'เวลาที่ต้องเสร็จ (เช็คเงื่อนไข 6 หรือ 12 ชม.)',
  `is_sla_breached` tinyint(1) DEFAULT 0 COMMENT 'หลุด SLA หรือไม่? (0=ไม่, 1=หลุด)',
  `penalty_amount` decimal(10,2) DEFAULT 0.00 COMMENT 'ค่าปรับที่ระบบคำนวณได้ (บาท)',
  PRIMARY KEY (`ticket_id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `reporter_id` (`reporter_id`),
  KEY `category_id` (`category_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `fk_tickets_vendor` (`vendor_id`),
  CONSTRAINT `fk_tickets_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`vendor_id`) ON DELETE SET NULL,
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`),
  CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES (1,'1/2569',1,NULL,22,1,'',NULL,'<p>เพิ่มชุดข้อมูล</p>','Pending','2026-04-02 07:11:55','2026-04-02 07:11:55',NULL,0,0,NULL,NULL,NULL,0,0.00),(2,'2/2569',1,2,6,1,'',NULL,'<p>เครื่องดับ</p>','In Progress','2026-04-02 07:12:14','2026-04-02 10:31:30',NULL,1,6,'2026-04-02 17:31:30',NULL,'2026-04-02 20:12:14',1,10000.00),(3,'3/2569',1,NULL,7,1,'',NULL,'<p>ทดสอบ</p>','Pending','2026-04-02 08:43:48','2026-04-02 08:43:48',NULL,1,6,NULL,NULL,'2026-04-02 21:43:48',0,0.00),(4,'4/2569',1,2,22,1,'',NULL,'<p></p>','In Progress','2026-04-02 09:41:13','2026-04-05 12:59:57',NULL,1,12,'2026-04-05 19:59:57',NULL,'2026-04-03 04:41:13',0,0.00),(5,'5/2569',1,NULL,2,1,'S/N: ACM028T387',NULL,'<p></p>','Pending','2026-04-06 09:58:29','2026-04-06 09:58:29','1775469509080.jpg',1,6,NULL,NULL,'2026-04-06 22:58:29',0,0.00);
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_key` char(32) DEFAULT NULL,
  `username` varchar(64) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(128) DEFAULT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `mobile` varchar(50) DEFAULT NULL,
  `first_name` varchar(64) NOT NULL,
  `last_name` varchar(64) NOT NULL,
  `agency` varchar(100) DEFAULT NULL,
  `position` varchar(150) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `user_line` varchar(50) DEFAULT NULL,
  `user_photo` varchar(255) DEFAULT 'noimg.jpg',
  `role` enum('user','technician','head_technician','admin') DEFAULT 'user',
  `project_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `user_key` (`user_key`),
  KEY `project_id` (`project_id`),
  KEY `fk_users_vendor` (`vendor_id`),
  CONSTRAINT `fk_users_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`vendor_id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'admin','$2b$10$rSspn/qZ1wpaySaW6.VatO6om/JnDHw6lpEJ5Yh3QaTGp40e8h4H6','wuttikai.p@mol.mail.go.th','','','นายวุฒิไกร','พรหมเรือง','ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร','นักวิชาการคอมพิวเตอร์',NULL,NULL,'avatar-1-1774607043832.png','admin',1,NULL,'active','2026-03-25 10:43:50'),(2,NULL,'repair','$2b$10$ZLlxcoEfUZh84ND9XQAypOO/X5TahB5QqvhqWqruLs.kSAd7uwwRa',NULL,NULL,NULL,'ช่างใหม่','ไฟแรง','บริษัท โอพีที',NULL,NULL,NULL,'noimg.jpg','technician',1,1,'active','2026-03-25 11:34:11'),(3,NULL,'pm','$2b$10$vRMcyAo2g8Ba8aCHlU3PEurNXsknVGRWTS/4Q8YB7B438NJas9Dk.',NULL,NULL,NULL,'PM','AJ','บริษัท โอพีที',NULL,NULL,NULL,'noimg.jpg','head_technician',1,1,'active','2026-03-25 13:08:05'),(5,NULL,'user','$2b$10$ee5eoxPHHRhRt/s01vjZQOmb7cq6dwRYXFXErvCw2USUPiBjXsS4G',NULL,NULL,NULL,'แจ้ง','งาน',NULL,NULL,NULL,NULL,'noimg.jpg','user',1,NULL,'active','2026-03-25 14:18:24');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendors` (
  `vendor_id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES (1,'บริษัท โอเพ่น เทคโนโลยี่ จำกัด (มหาชน)','นางสาวอัจจิมา ปะโปตินัง',NULL,NULL,'2026-04-02 07:01:47');
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-18  1:49:50
