CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `system_name` varchar(255) DEFAULT 'LIMS Big Data',
  `agency_name` varchar(255) DEFAULT 'Agency Name',
  `system_logo` varchar(255) DEFAULT NULL,
  `line_notify_token` varchar(255) DEFAULT NULL,
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_port` varchar(10) DEFAULT NULL,
  `smtp_user` varchar(255) DEFAULT NULL,
  `smtp_pass` varchar(255) DEFAULT NULL,
  `default_sla_hours` int(11) DEFAULT 2,
  `default_penalty_rate` decimal(10,4) DEFAULT 0.0010,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `system_settings` (`id`, `system_name`, `agency_name`) VALUES (1, 'LIMS Big Data', 'Your Agency');
