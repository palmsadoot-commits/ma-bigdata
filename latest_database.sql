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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_logs`
--

LOCK TABLES `backup_logs` WRITE;
/*!40000 ALTER TABLE `backup_logs` DISABLE KEYS */;
INSERT INTO `backup_logs` VALUES (12,'backup_30-03-2026_15-05-43.sql','database','0.02 MB','2026-03-30 15:05:44','Success','Admin (Manual)'),(13,'backup_30-03-2026_15-31-10.sql','database','0.02 MB','2026-03-30 15:31:11','Success','Admin (Manual)'),(14,'backup_31-03-2026_11-09-01.sql','database','Restore','2026-03-31 11:09:08','Success','Admin (Restore)'),(15,'backup_31-03-2026_14-00-39.sql','database','0.02 MB','2026-03-31 14:00:40','Success','Admin (Manual)'),(16,'backup_31-03-2026_14-10-38.sql','database','0.03 MB','2026-03-31 14:10:39','Success','Admin (Manual)'),(17,'backup_31-03-2026_14-48-39.sql','database','0.02 MB','2026-03-31 14:48:39','Success','Auto (Before Git Push)'),(18,'backup_31-03-2026_14-50-24.sql','database','0.02 MB','2026-03-31 14:50:25','Success','Auto (Before Git Push)');
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
INSERT INTO `backup_settings` VALUES (1,'daily','1,2,3,4,5,6,0','02:00:00',1,'2026-03-30 11:30:58');
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `github_sync_logs`
--

LOCK TABLES `github_sync_logs` WRITE;
/*!40000 ALTER TABLE `github_sync_logs` DISABLE KEYS */;
INSERT INTO `github_sync_logs` VALUES (12,'database,source','ล้มเหลว: To https://github.com/palmsadoot-commits/ma-bigdata.git\n!	refs/heads/main:refs/heads/main	[remote rejected] (push declined due to repository rule viol','Admin (Manual)','2026-03-31 07:48:42'),(13,'database,source','ล้มเหลว: To https://github.com/palmsadoot-commits/ma-bigdata.git\n!	refs/heads/main:refs/heads/main	[remote rejected] (push declined due to repository rule viol','Admin (Manual)','2026-03-31 07:50:28'),(14,'database,source','สำเร็จ','Admin (Manual)','2026-03-31 08:07:09');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
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
INSERT INTO `source_backup_settings` VALUES (1,'frontend,backend','weekly','0','04:00:00',0);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_resolutions`
--

LOCK TABLES `ticket_resolutions` WRITE;
/*!40000 ALTER TABLE `ticket_resolutions` DISABLE KEYS */;
INSERT INTO `ticket_resolutions` VALUES (1,1,1,'ok','2026-03-25 05:39:47'),(2,4,2,'mvlld','2026-03-25 14:59:16'),(3,4,2,'mvlld','2026-03-25 15:26:54'),(4,4,2,'mvlldasdsasd','2026-03-25 15:30:11'),(5,4,2,'mvlld','2026-03-25 15:40:03'),(6,5,2,'แก้ไขครั้งที่ 2 ตรวจสอบอีกครั้งครับ','2026-03-25 16:52:48'),(7,3,1,'ๆสสไไำสา่หๆสา้นๆร นืหก่้ดนฟยหนกบๆไ่กฟาหกฟส าห่กฟาห่ก ๆนืไำกสฟืสหกืฟน ่หกร่ๆร กๆืืดนฟรกฟ ืหกาืฟสหากฟนหรก่ฟสหากสฟหก่ฟยหนก่ๆยาไทกืฟสาืห \r\n\r\nฟห่กฟาห่กา่ๆ่ไกาสฟหสาก่ ๆร่ๆาไ่ำาๆื ทืฟมหวฟากๆไราำบๆยไ','2026-03-29 09:48:39');
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
INSERT INTO `ticket_statuses` VALUES (1,'Pending','red',1),(2,'In Progress','orange',2),(3,'Resolved','green',3),(4,'Closed','gray',4);
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
  `equipment_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `software_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `problem_detail` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `attachment` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ticket_id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `reporter_id` (`reporter_id`),
  KEY `category_id` (`category_id`),
  KEY `assigned_to` (`assigned_to`),
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
INSERT INTO `tickets` VALUES (1,'1/2569',1,NULL,3,'LASD',NULL,'123123','Closed','2026-03-25 05:39:08','2026-03-25 05:40:17',NULL),(2,'2/2569',1,NULL,1,'asss',NULL,'asdasd','Pending','2026-03-25 06:06:09','2026-03-25 06:06:09',NULL),(3,'3/2569',1,2,7,'BI01',NULL,'ooooqweqwe','In Progress','2026-03-25 09:01:44','2026-03-29 09:49:17','1774429304006.jpg'),(4,'4/2569',1,2,2,'LLL',NULL,'sss','Closed','2026-03-25 11:55:50','2026-03-28 14:29:43',NULL),(5,'5/2569',5,2,13,'OAPDSLDKLSD',NULL,'เวลาเข้าระบบหน้าจอขาว ขึ้น','Closed','2026-03-25 15:41:16','2026-03-26 09:28:07','1774453276493.pdf');
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
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `user_key` (`user_key`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'admin','$2b$10$rSspn/qZ1wpaySaW6.VatO6om/JnDHw6lpEJ5Yh3QaTGp40e8h4H6','','','','นายวุฒิไกร','พรหมเรือง','ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร','นักวิชาการคอมพิวเตอร์',NULL,NULL,'avatar-1-1774607043832.png','admin',1,'active','2026-03-25 10:43:50'),(2,NULL,'repair','$2b$10$ZLlxcoEfUZh84ND9XQAypOO/X5TahB5QqvhqWqruLs.kSAd7uwwRa',NULL,NULL,NULL,'ช่างใหม่','ไฟแรง','บริษัท โอพีที',NULL,NULL,NULL,'noimg.jpg','technician',1,'active','2026-03-25 11:34:11'),(3,NULL,'pm','$2b$10$vRMcyAo2g8Ba8aCHlU3PEurNXsknVGRWTS/4Q8YB7B438NJas9Dk.',NULL,NULL,NULL,'PM','AJ','บริษัท โอพีที',NULL,NULL,NULL,'noimg.jpg','head_technician',1,'active','2026-03-25 13:08:05'),(5,NULL,'user','$2b$10$ee5eoxPHHRhRt/s01vjZQOmb7cq6dwRYXFXErvCw2USUPiBjXsS4G',NULL,NULL,NULL,'แจ้ง','งาน',NULL,NULL,NULL,NULL,'noimg.jpg','user',1,'active','2026-03-25 14:18:24');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-31 15:08:29
