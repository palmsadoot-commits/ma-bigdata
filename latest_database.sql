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
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'SYSTEM_SETTINGS_UPDATED','User updated system global settings','::ffff:127.0.0.1','2026-04-05 18:36:53'),(2,1,'PROFILE_UPDATED','User updated their own profile','::ffff:127.0.0.1','2026-04-05 18:47:58'),(3,1,'SYSTEM_SETTINGS_UPDATED','User updated system global settings','::ffff:127.0.0.1','2026-04-05 19:07:30'),(4,1,'SYSTEM_SETTINGS_UPDATED','User updated system global settings','::ffff:127.0.0.1','2026-04-05 19:09:15'),(5,1,'SYSTEM_SETTINGS_UPDATED','User updated system global settings','::ffff:127.0.0.1','2026-04-05 19:09:23'),(6,1,'SYSTEM_SETTINGS_UPDATED','User updated system global settings','::ffff:127.0.0.1','2026-04-05 19:18:27'),(7,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-05 19:53:39'),(8,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-05 22:28:44'),(9,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-05 22:29:11'),(10,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:04:55'),(11,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:08:07'),(12,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-06 08:09:38'),(13,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-06 08:13:56'),(14,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:14:07'),(15,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:17:34'),(16,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:31:53'),(17,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:31:58'),(18,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:32:17'),(19,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 08:32:22'),(20,1,'TICKET_CREATED','Ticket 5/2569 created','::ffff:127.0.0.1','2026-04-06 09:58:29'),(21,1,'LOGIN_SUCCESS','User admin logged in','::ffff:127.0.0.1','2026-04-06 17:37:59'),(22,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:19:23'),(23,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:19:39'),(24,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:20:15'),(25,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:30:31'),(26,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:30:45'),(27,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:30:58'),(28,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:31:04'),(29,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:31:12'),(30,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:31:33'),(31,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:31:51'),(32,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:33:39'),(33,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:36:27'),(34,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:36:41'),(35,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:37:10'),(36,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:37:35'),(37,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:37:41'),(38,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 19:37:47'),(39,1,'SYSTEM_SETTINGS_UPDATED','User updated system settings','::ffff:127.0.0.1','2026-04-06 20:04:31');
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
INSERT INTO `backup_logs` VALUES (20,'backup_31-03-2026_15-30-00.sql','database','0.02 MB','2026-03-31 15:30:00','Success','Auto Schedule'),(21,'backup_01-04-2026_14-30-00.sql','database','0.03 MB','2026-04-01 14:30:01','Success','Auto Schedule'),(22,'backup_02-04-2026_14-30-00.sql','database','0.03 MB','2026-04-02 14:30:01','Success','Auto Schedule'),(23,'backup_03-04-2026_14-30-00.sql','database','0.03 MB','2026-04-03 14:30:02','Success','Auto Schedule'),(26,'backup_06-04-2026_01-54-37.sql','database','0.04 MB','2026-04-06 01:54:38','Success','Admin (Manual)'),(27,'backup_06-04-2026_03-23-08.sql','database','0.04 MB','2026-04-06 03:23:09','Success','Admin (Manual)');
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
