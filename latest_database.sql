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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_logs`
--

LOCK TABLES `backup_logs` WRITE;
/*!40000 ALTER TABLE `backup_logs` DISABLE KEYS */;
INSERT INTO `backup_logs` VALUES (16,'backup_31-03-2026_14-10-38.sql','database','0.03 MB','2026-03-31 14:10:39','Success','Admin (Manual)'),(17,'backup_31-03-2026_14-48-39.sql','database','0.02 MB','2026-03-31 14:48:39','Success','Auto (Before Git Push)'),(18,'backup_31-03-2026_14-50-24.sql','database','0.02 MB','2026-03-31 14:50:25','Success','Auto (Before Git Push)'),(19,'backup_31-03-2026_15-08-29.sql','database','0.02 MB','2026-03-31 15:08:29','Success','Admin (Manual)');
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
INSERT INTO `backup_settings` VALUES (1,'daily','','15:30:00',1,'2026-03-31 15:29:31');
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
  `category_type` enum('Hardware','Software','Application','Other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`category_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,1,'Hardware','อุปกรณ์ฮาร์ดแวร์ทั่วไป'),(2,1,'Software','ซอฟต์แวร์ทั่วไป'),(3,1,'Software','ซอฟต์แวร์สนับสนุนการเชื่อมโยงและแลกเปลี่ยนข้อมูล'),(4,1,'Application','เว็บไซต์ Web Portal ระบบวิเคราะห์ข้อมูลขนาดใหญ่ด้านแรงงานฯ'),(5,1,'Application','แพลตฟอร์มการเชื่อมโยงแลกเปลี่ยนข้อมูล (Open Data)'),(6,1,'Application','ระบบสนับสนุนการนำเข้าข้อมูลเพื่อระบบงานข้อมูลขนาดใหญ่'),(7,1,'Application','ระบบการวิเคราะห์อัจฉริยะ Business Intelligence'),(8,1,'Application','ระบบสนับสนุนการวิเคราะห์และนำเสนอข้อมูล Data Visualization'),(9,1,'Application','ระบบปัญญาประดิษฐ์ AI (Artificial Intelligence) และพัฒนาระบบวิเคราะห์ด้าน AI'),(10,1,'Application','ระบบรวบรวมข้อมูลออนไลน์ (Crawler)'),(11,1,'Application','ระบบจัดเก็บข้อมูลขนาดใหญ่ (DATA LAKE)'),(12,1,'Application','ระบบบัญชีข้อมูลภาครัฐ Government Data Catalog (CKAN)'),(13,1,'Other','ระบบอื่นๆ');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `github_sync_logs`
--

LOCK TABLES `github_sync_logs` WRITE;
/*!40000 ALTER TABLE `github_sync_logs` DISABLE KEYS */;
INSERT INTO `github_sync_logs` VALUES (17,'database,source','สำเร็จ','Auto Schedule','2026-03-31 08:29:02');
/*!40000 ALTER TABLE `github_sync_logs` ENABLE KEYS */;
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
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'MA BIGDATA','19/2569','ระบบหลัก','2026-03-25 09:47:07'),(3,'NLIC','87/2121','ฟหก','2026-03-28 14:14:16');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `source_backup_logs`
--

LOCK TABLES `source_backup_logs` WRITE;
/*!40000 ALTER TABLE `source_backup_logs` DISABLE KEYS */;
INSERT INTO `source_backup_logs` VALUES (1,'src_31-03-2026_14-00-44.zip','frontend,backend','0.23 MB','Success','Admin (Manual)','2026-03-31 07:00:47'),(2,'src_31-03-2026_14-10-32.zip','frontend,backend','0.23 MB','Success','Admin (Manual)','2026-03-31 07:10:34'),(3,'src_31-03-2026_15-08-14.zip','frontend,backend','0.23 MB','Success','Admin (Manual)','2026-03-31 08:08:17');
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
INSERT INTO `source_backup_settings` VALUES (1,'frontend,backend','daily','','15:30:00',1);
/*!40000 ALTER TABLE `source_backup_settings` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_logs`
--

LOCK TABLES `ticket_logs` WRITE;
/*!40000 ALTER TABLE `ticket_logs` DISABLE KEYS */;
INSERT INTO `ticket_logs` VALUES (1,4,'ส่งตรวจสอบ','ช่างใหม่ ไฟแรง','รายละเอียดที่แก้ไข: mvlld','2026-03-25 15:26:54'),(2,4,'ตีกลับให้แก้ไขใหม่','แจ้ง งาน','ผู้แจ้งตรวจสอบพบว่ายังใช้งานไม่ได้ ส่งให้ช่างแก้ใหม่','2026-03-25 15:29:04'),(3,4,'ส่งตรวจสอบ','ช่างใหม่ ไฟแรง','รายละเอียดที่แก้ไข: mvlldasdsasd','2026-03-25 15:30:11'),(4,4,'ตีกลับให้แก้ไขใหม่','แจ้ง งาน','ผู้แจ้งตรวจสอบพบว่ายังใช้งานไม่ได้ ส่งให้ช่างแก้ใหม่','2026-03-25 15:39:43'),(5,4,'ส่งตรวจสอบ','ช่างใหม่ ไฟแรง','รายละเอียด: mvlld','2026-03-25 15:40:03'),(6,5,'รับงาน','ช่างใหม่ ไฟแรง','ช่างกดรับผิดชอบงานนี้เข้าตัวเอง','2026-03-25 15:41:42'),(7,5,'ส่งตรวจสอบ','ช่างใหม่ ไฟแรง','วิธีแก้ไข: แก้ไขครั้งที่ 1\n[แนบไฟล์: Firewall Policy.docx]','2026-03-25 15:59:27'),(8,5,'ตีกลับให้แก้ไขใหม่','แจ้ง งาน','เหตุผลที่ตีกลับ: ยังเข้าไม่ได้เลย\n[แนบไฟล์เพิ่มเติม: 1774457474051.doc]','2026-03-25 16:51:14'),(9,5,'ส่งตรวจสอบ','ช่างใหม่ ไฟแรง','วิธีแก้ไข: แก้ไขครั้งที่ 2 ตรวจสอบอีกครั้งครับ\n[แนบไฟล์: 1774457568379.jpg]','2026-03-25 16:52:48'),(10,5,'ปิดเคสสมบูรณ์','แจ้ง งาน','ผู้แจ้งตรวจสอบและยืนยันการปิดงาน','2026-03-25 17:15:23'),(11,4,'ปิดเคสสมบูรณ์','นายวุฒิไกร พรหมเรือง','ผู้แจ้งตรวจสอบและยืนยันการปิดงาน','2026-03-28 14:29:43'),(12,3,'มอบหมายงาน','นายวุฒิไกร พรหมเรือง','จ่ายงานให้: ช่างใหม่ ไฟแรง','2026-03-29 09:47:41'),(13,3,'อัปเดตงาน (Resolved)','นายวุฒิไกร พรหมเรือง','วิธีแก้ไข: ๆสสไไำสา่หๆสา้นๆร นืหก่้ดนฟยหนกบๆไ่กฟาหกฟส าห่กฟาห่ก ๆนืไำกสฟืสหกืฟน ่หกร่ๆร กๆืืดนฟรกฟ ืหกาืฟสหากฟนหรก่ฟสหากสฟหก่ฟยหนก่ๆยาไทกืฟสาืห \n\nฟห่กฟาห่กา่ๆ่ไกาสฟหสาก่ ๆร่ๆาไ่ำาๆื ทืฟมหวฟากๆไราำบๆยไ','2026-03-29 09:48:39'),(14,3,'ตีกลับให้แก้ไขใหม่','นายวุฒิไกร พรหมเรือง','เหตุผลที่ตีกลับ: ไำๆไำผป(แฤฆฏ๐\"ฎ','2026-03-29 09:49:17');
