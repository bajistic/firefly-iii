/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.11-MariaDB, for debian-linux-gnu (aarch64)
--
-- Host: localhost    Database: finance
-- ------------------------------------------------------
-- Server version	10.11.11-MariaDB-0+deb12u1

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
-- Table structure for table `2fa_tokens`
--

DROP TABLE IF EXISTS `2fa_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `2fa_tokens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `expires_at` datetime NOT NULL,
  `token` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `2fa_tokens_token_unique` (`token`),
  KEY `2fa_tokens_user_id_foreign` (`user_id`),
  CONSTRAINT `2fa_tokens_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `2fa_tokens`
--

LOCK TABLES `2fa_tokens` WRITE;
/*!40000 ALTER TABLE `2fa_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `2fa_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_balances`
--

DROP TABLE IF EXISTS `account_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_balances` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `transaction_currency_id` int(10) unsigned NOT NULL,
  `date` date DEFAULT NULL,
  `date_tz` varchar(50) DEFAULT NULL,
  `transaction_journal_id` int(10) unsigned DEFAULT NULL,
  `balance` decimal(32,12) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_account_currency` (`account_id`,`transaction_currency_id`,`transaction_journal_id`,`date`,`title`),
  KEY `account_balances_transaction_journal_id_foreign` (`transaction_journal_id`),
  KEY `account_balances_transaction_currency_id_foreign` (`transaction_currency_id`),
  CONSTRAINT `account_balances_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `account_balances_transaction_currency_id_foreign` FOREIGN KEY (`transaction_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `account_balances_transaction_journal_id_foreign` FOREIGN KEY (`transaction_journal_id`) REFERENCES `transaction_journals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_balances`
--

LOCK TABLES `account_balances` WRITE;
/*!40000 ALTER TABLE `account_balances` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_meta`
--

DROP TABLE IF EXISTS `account_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_meta` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `account_id` int(10) unsigned NOT NULL,
  `name` varchar(191) NOT NULL,
  `data` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `account_meta_account_id_index` (`account_id`),
  CONSTRAINT `account_meta_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_meta`
--

LOCK TABLES `account_meta` WRITE;
/*!40000 ALTER TABLE `account_meta` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_meta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_piggy_bank`
--

DROP TABLE IF EXISTS `account_piggy_bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_piggy_bank` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int(10) unsigned NOT NULL,
  `piggy_bank_id` int(10) unsigned NOT NULL,
  `current_amount` decimal(32,12) NOT NULL DEFAULT 0.000000000000,
  `native_current_amount` decimal(32,12) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_piggy_save` (`account_id`,`piggy_bank_id`),
  KEY `account_piggy_bank_piggy_bank_id_foreign` (`piggy_bank_id`),
  CONSTRAINT `account_piggy_bank_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `account_piggy_bank_piggy_bank_id_foreign` FOREIGN KEY (`piggy_bank_id`) REFERENCES `piggy_banks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_piggy_bank`
--

LOCK TABLES `account_piggy_bank` WRITE;
/*!40000 ALTER TABLE `account_piggy_bank` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_piggy_bank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_types`
--

DROP TABLE IF EXISTS `account_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_types` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_types_type_unique` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_types`
--

LOCK TABLES `account_types` WRITE;
/*!40000 ALTER TABLE `account_types` DISABLE KEYS */;
INSERT INTO `account_types` VALUES
(1,'2025-06-15 15:53:53','2025-06-15 15:53:53','Default account'),
(2,'2025-06-15 15:53:53','2025-06-15 15:53:53','Cash account'),
(3,'2025-06-15 15:53:53','2025-06-15 15:53:53','Asset account'),
(4,'2025-06-15 15:53:54','2025-06-15 15:53:54','Expense account'),
(5,'2025-06-15 15:53:54','2025-06-15 15:53:54','Revenue account'),
(6,'2025-06-15 15:53:54','2025-06-15 15:53:54','Initial balance account'),
(7,'2025-06-15 15:53:55','2025-06-15 15:53:55','Beneficiary account'),
(8,'2025-06-15 15:53:55','2025-06-15 15:53:55','Import account'),
(9,'2025-06-15 15:53:55','2025-06-15 15:53:55','Loan'),
(10,'2025-06-15 15:53:56','2025-06-15 15:53:56','Reconciliation account'),
(11,'2025-06-15 15:53:56','2025-06-15 15:53:56','Debt'),
(12,'2025-06-15 15:53:56','2025-06-15 15:53:56','Mortgage'),
(13,'2025-06-15 15:53:57','2025-06-15 15:53:57','Liability credit account');
/*!40000 ALTER TABLE `account_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `balance` decimal(12,2) DEFAULT 0.00,
  `firefly_id` varchar(255) DEFAULT NULL,
  `order` int(10) unsigned NOT NULL DEFAULT 0,
  `native_virtual_balance` decimal(32,12) DEFAULT NULL,
  `iban` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_uq_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES
(1,'Primary Account','Migrated default account','checking',-85.71,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `attachable_id` int(10) unsigned NOT NULL,
  `attachable_type` varchar(255) NOT NULL,
  `md5` varchar(128) NOT NULL,
  `filename` varchar(1024) NOT NULL,
  `title` varchar(1024) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `mime` varchar(1024) NOT NULL,
  `size` int(10) unsigned NOT NULL,
  `uploaded` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `attachments_user_id_foreign` (`user_id`),
  KEY `attachments_to_ugi` (`user_group_id`),
  CONSTRAINT `attachments_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `attachments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log_entries`
--

DROP TABLE IF EXISTS `audit_log_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log_entries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `auditable_id` int(10) unsigned NOT NULL,
  `auditable_type` varchar(191) NOT NULL,
  `changer_id` int(10) unsigned NOT NULL,
  `changer_type` varchar(191) NOT NULL,
  `action` varchar(255) NOT NULL,
  `before` text DEFAULT NULL,
  `after` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log_entries`
--

LOCK TABLES `audit_log_entries` WRITE;
/*!40000 ALTER TABLE `audit_log_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auto_budgets`
--

DROP TABLE IF EXISTS `auto_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auto_budgets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `budget_id` int(10) unsigned NOT NULL,
  `transaction_currency_id` int(10) unsigned NOT NULL,
  `auto_budget_type` tinyint(3) unsigned NOT NULL DEFAULT 1,
  `amount` decimal(32,12) NOT NULL,
  `period` varchar(50) NOT NULL,
  `native_amount` decimal(32,12) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `auto_budgets_transaction_currency_id_foreign` (`transaction_currency_id`),
  KEY `auto_budgets_budget_id_foreign` (`budget_id`),
  CONSTRAINT `auto_budgets_budget_id_foreign` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `auto_budgets_transaction_currency_id_foreign` FOREIGN KEY (`transaction_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auto_budgets`
--

LOCK TABLES `auto_budgets` WRITE;
/*!40000 ALTER TABLE `auto_budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `auto_budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `available_budgets`
--

DROP TABLE IF EXISTS `available_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `available_budgets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `transaction_currency_id` int(10) unsigned NOT NULL,
  `amount` decimal(32,12) NOT NULL,
  `start_date` date NOT NULL,
  `start_date_tz` varchar(50) DEFAULT NULL,
  `end_date` date NOT NULL,
  `end_date_tz` varchar(50) DEFAULT NULL,
  `native_amount` decimal(32,12) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `available_budgets_transaction_currency_id_foreign` (`transaction_currency_id`),
  KEY `available_budgets_user_id_foreign` (`user_id`),
  KEY `available_budgets_to_ugi` (`user_group_id`),
  CONSTRAINT `available_budgets_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `available_budgets_transaction_currency_id_foreign` FOREIGN KEY (`transaction_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `available_budgets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `available_budgets`
--

LOCK TABLES `available_budgets` WRITE;
/*!40000 ALTER TABLE `available_budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `available_budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bills` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `transaction_currency_id` int(10) unsigned DEFAULT NULL,
  `name` varchar(1024) NOT NULL,
  `match` varchar(1024) NOT NULL,
  `amount_min` decimal(32,12) NOT NULL,
  `amount_max` decimal(32,12) NOT NULL,
  `date` date NOT NULL,
  `date_tz` varchar(50) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `end_date_tz` varchar(50) DEFAULT NULL,
  `extension_date` date DEFAULT NULL,
  `extension_date_tz` varchar(50) DEFAULT NULL,
  `repeat_freq` varchar(30) NOT NULL,
  `skip` smallint(5) unsigned NOT NULL DEFAULT 0,
  `automatch` tinyint(1) NOT NULL DEFAULT 1,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `name_encrypted` tinyint(1) NOT NULL DEFAULT 0,
  `match_encrypted` tinyint(1) NOT NULL DEFAULT 0,
  `order` int(10) unsigned NOT NULL DEFAULT 0,
  `native_amount_min` decimal(32,12) DEFAULT NULL,
  `native_amount_max` decimal(32,12) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bills_user_id_foreign` (`user_id`),
  KEY `bills_transaction_currency_id_foreign` (`transaction_currency_id`),
  KEY `bills_to_ugi` (`user_group_id`),
  CONSTRAINT `bills_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `bills_transaction_currency_id_foreign` FOREIGN KEY (`transaction_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `bills_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budget_limits`
--

DROP TABLE IF EXISTS `budget_limits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_limits` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `budget_id` int(10) unsigned NOT NULL,
  `transaction_currency_id` int(10) unsigned DEFAULT NULL,
  `start_date` date NOT NULL,
  `start_date_tz` varchar(50) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `end_date_tz` varchar(50) DEFAULT NULL,
  `amount` decimal(32,12) NOT NULL,
  `period` varchar(12) DEFAULT NULL,
  `generated` tinyint(1) NOT NULL DEFAULT 0,
  `native_amount` decimal(32,12) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `budget_limits_budget_id_foreign` (`budget_id`),
  KEY `budget_limits_transaction_currency_id_foreign` (`transaction_currency_id`),
  CONSTRAINT `budget_limits_budget_id_foreign` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `budget_limits_transaction_currency_id_foreign` FOREIGN KEY (`transaction_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_limits`
--

LOCK TABLES `budget_limits` WRITE;
/*!40000 ALTER TABLE `budget_limits` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_limits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budget_transaction`
--

DROP TABLE IF EXISTS `budget_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_transaction` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `budget_id` int(10) unsigned NOT NULL,
  `transaction_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `budget_transaction_budget_id_foreign` (`budget_id`),
  KEY `budget_transaction_transaction_id_foreign` (`transaction_id`),
  CONSTRAINT `budget_transaction_budget_id_foreign` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `budget_transaction_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_transaction`
--

LOCK TABLES `budget_transaction` WRITE;
/*!40000 ALTER TABLE `budget_transaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budget_transaction_journal`
--

DROP TABLE IF EXISTS `budget_transaction_journal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_transaction_journal` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `budget_id` int(10) unsigned NOT NULL,
  `budget_limit_id` int(10) unsigned DEFAULT NULL,
  `transaction_journal_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `budget_transaction_journal_budget_id_foreign` (`budget_id`),
  KEY `budget_transaction_journal_transaction_journal_id_foreign` (`transaction_journal_id`),
  KEY `budget_id_foreign` (`budget_limit_id`),
  CONSTRAINT `budget_id_foreign` FOREIGN KEY (`budget_limit_id`) REFERENCES `budget_limits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `budget_transaction_journal_budget_id_foreign` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `budget_transaction_journal_transaction_journal_id_foreign` FOREIGN KEY (`transaction_journal_id`) REFERENCES `transaction_journals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_transaction_journal`
--

LOCK TABLES `budget_transaction_journal` WRITE;
/*!40000 ALTER TABLE `budget_transaction_journal` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_transaction_journal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(1024) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `encrypted` tinyint(1) NOT NULL DEFAULT 0,
  `order` mediumint(8) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `budgets_user_id_index` (`user_id`),
  KEY `budgets_user_group_id_index` (`user_group_id`),
  CONSTRAINT `budgets_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `budgets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `firefly_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_transaction`
--

DROP TABLE IF EXISTS `category_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_transaction` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(10) unsigned NOT NULL,
  `transaction_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_transaction`
--

LOCK TABLES `category_transaction` WRITE;
/*!40000 ALTER TABLE `category_transaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `category_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_transaction_journal`
--

DROP TABLE IF EXISTS `category_transaction_journal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_transaction_journal` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(10) unsigned NOT NULL,
  `transaction_journal_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category_transaction_journal_transaction_journal_id_index` (`transaction_journal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_transaction_journal`
--

LOCK TABLES `category_transaction_journal` WRITE;
/*!40000 ALTER TABLE `category_transaction_journal` DISABLE KEYS */;
/*!40000 ALTER TABLE `category_transaction_journal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuration`
--

DROP TABLE IF EXISTS `configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuration` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `data` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuration`
--

LOCK TABLES `configuration` WRITE;
/*!40000 ALTER TABLE `configuration` DISABLE KEYS */;
INSERT INTO `configuration` VALUES
(1,'2025-06-15 15:51:59','2025-06-15 15:51:59',NULL,'installation_id','\"e540b5c9-0840-46ee-b514-af26b0e62d18\"'),
(2,'2025-06-15 15:51:59','2025-06-15 15:51:59',NULL,'is_demo_site','false'),
(3,'2025-06-15 15:52:01','2025-06-15 15:52:02',NULL,'db_version','25'),
(4,'2025-06-15 15:52:02','2025-06-15 15:52:02',NULL,'ff3_version','\"6.2.17\"'),
(5,'2025-06-15 16:27:39','2025-06-15 17:20:52',NULL,'is_decrypted_accounts','true'),
(6,'2025-06-15 17:20:52','2025-06-15 17:20:53',NULL,'is_decrypted_attachments','true'),
(7,'2025-06-15 17:20:54','2025-06-15 17:20:54',NULL,'is_decrypted_bills','true'),
(8,'2025-06-15 17:20:55','2025-06-15 17:20:55',NULL,'is_decrypted_budgets','true'),
(9,'2025-06-15 17:20:56','2025-06-15 17:20:57',NULL,'is_decrypted_categories','true'),
(10,'2025-06-15 17:20:57','2025-06-15 17:20:58',NULL,'is_decrypted_piggy_banks','true'),
(11,'2025-06-15 17:20:58','2025-06-15 17:20:59',NULL,'is_decrypted_preferences','true'),
(12,'2025-06-15 17:20:59','2025-06-15 17:21:00',NULL,'is_decrypted_tags','true'),
(13,'2025-06-15 17:21:00','2025-06-15 17:21:01',NULL,'is_decrypted_transaction_journals','true'),
(14,'2025-06-15 17:21:01','2025-06-15 17:31:25',NULL,'is_decrypted_transactions','true'),
(15,'2025-06-15 17:31:25','2025-06-15 17:31:26',NULL,'is_decrypted_journal_links','true'),
(16,'2025-06-15 17:31:26','2025-06-15 17:33:10',NULL,'480_transaction_identifier','true'),
(17,'2025-06-15 17:33:10','2025-06-15 17:33:11',NULL,'480_migrated_to_groups','true'),
(18,'2025-06-15 17:33:11','2025-06-15 17:33:12',NULL,'480_account_currencies','true'),
(19,'2025-06-15 17:33:12','2025-06-15 17:33:13',NULL,'480_transfer_currencies','true'),
(20,'2025-06-15 17:33:13','2025-06-15 17:33:14',NULL,'480_other_currencies','true'),
(21,'2025-06-15 17:33:14','2025-06-15 17:33:15',NULL,'480_migrate_notes','true'),
(22,'2025-06-15 17:33:15','2025-06-15 17:33:16',NULL,'480_migrate_attachments','true'),
(23,'2025-06-15 17:33:16','2025-06-15 17:33:17',NULL,'480_bills_to_rules','true'),
(24,'2025-06-15 17:33:17','2025-06-15 17:33:18',NULL,'480_bl_currency','true'),
(25,'2025-06-15 17:33:18','2025-06-15 17:33:19',NULL,'480_cc_liabilities','true'),
(26,'2025-06-15 17:33:20','2025-06-15 17:33:21',NULL,'480_back_to_journals','true'),
(27,'2025-06-15 17:33:21','2025-06-15 17:33:23',NULL,'480_rename_account_meta','true'),
(28,'2025-06-15 17:33:24','2025-06-15 17:33:24',NULL,'481_migrate_recurrence_meta','true'),
(29,'2025-06-15 17:33:25','2025-06-15 17:33:25',NULL,'500_migrate_tag_locations','true'),
(30,'2025-06-15 17:33:26','2025-06-15 17:33:26',NULL,'560_upgrade_liabilities','true'),
(31,'2025-06-15 17:33:27','2025-06-15 17:33:27',NULL,'600_upgrade_liabilities','true'),
(32,'2025-06-15 17:33:28','2025-06-15 17:33:28',NULL,'550_budget_limit_periods','true'),
(33,'2025-06-15 17:33:29','2025-06-15 17:33:30',NULL,'610_migrate_rule_actions','true'),
(34,'2025-06-15 17:33:30','2025-06-15 17:33:30',NULL,'610_correct_balances','false'),
(35,'2025-06-15 17:33:31','2025-06-15 17:33:31',NULL,'610_upgrade_currency_prefs','true'),
(36,'2025-06-15 17:33:32','2025-06-15 17:33:33',NULL,'620_make_multi_piggies','true'),
(37,'2025-06-15 17:33:33','2025-06-15 17:33:34',NULL,'620_native_amounts','true'),
(38,'2025-06-15 17:33:34','2025-06-15 17:33:34',NULL,'oauth_private_key','\"eyJpdiI6ImdhSFh4NDgwWitCVkxGbEF4SjRUaWc9PSIsInZhbHVlIjoiTGN3cVFlYUtEalF1aE9DTGo0MUpVaXFNY1dCMTRlRGVVem9CRHF1UWRDdDJsS1lMOFE0NHUvY01FZ1c2elFOS2o4Yld0QkdYT0wrMG9lcWh0NEJFK2JLcnkzRWlVMlpWT09ZeFRCamZMMi9KREtNcUNTSGtseWZIRExCUllDQnQ0SGNJc0VYN1l0Qi9RVnBZK0hVdUJMMkFWZTkva09zc1Z2Ym9GRDk2L3d4Q2dCR2FYOEF6OXRvN1h3ZGhUbmtVUXFxL0dMZXNZZGJHa3RLSDFTZm1OYVFDanlRZVc3SFZIR0hjOWdnZVZEaFVWVFp0U1lGbEkvSm9aejdEb0RDTUxwMTlPYVJVYlFNRFpQVGd6Y2N1YWtKN25ZRGxCUWQrekh6NWlDSktjSjNnaCtUbUl0UW16cG9tdjR5ckR4akJXU21ERVFIZWdjb2hmZHFISysxazBESG5lRXA3cWtya2h1c05BWFdZSzZvSWkxdDhEUlc4Q2lQMXRmQ21rQzUzaC9CK25WUmM1SDZBTEowRkRiYnVjdGxHRS9adGtYYllVMmszTkdkR3lHdVcxd0xlWEF5NFdFc1dHMzdYZHRSazVvd0pqR2RpUGNCRW4weS9XemNmdllDV2txK09tSVE1SFowejRhdUhUQk9ueHlkaXJhOHM3V29ZbU56bFY1UFR3Mm52THVYZkRDK3Q0UGRjLzdiOXQ0ZUJVWTBBSWd5Y2FPQU45YkNLVVBjbXV0RDF0WmRobDNxbTNsTEtlbDJOYU9jQ3g2cDhPcnZZVkpUeS9WVjZ5cXNlcVJ6VzNObjI1a2xIR3M4dTJOL0M4dENZdU1OUmlmbkJlWnQzZXEvdmtISm5CYXVVMnl2cGZNclNzNlErcS9jRW52Yy9TdUE4Vk9heEtlU0lOZWRyaTRXYTR4Rml1TGE5azNEa3RkcEtES01Kb2F4R2FGcDJ3Z0pBTVovRkR5TVVib3p4WHBwL1B1cm4zUE1uT2dEUXluSENzVjVFa0g3SzNueitTNDRvRTNyR2FUUXVabnpaQkQ1TzFXaW1oMkRWbnlHUTd3YnRSSkM1M0xXa0ZhS1N1QXJuRktlNDJtRDNHUGRzbmxpVE5kb21xQVlLd053YnBMb29CUFJvbnJzM0QxOXI4RXRoMVZEK3duelVCTHhpNkRMZHRPS2ljVzdZM2RLVGllbTZPcnVTaGxCN0IvNW44V1RxNy9qWURmRVpmQ00zSW5DTmEwRmhUS3BybWY5ME9panQ5eGxKWWpVNXI1RFZmWmxvMUVCZWg2VGY0VjJzanJsWEpjWmRnSDRpNmdzUDVJV1Ywa0Q0ZVphckQyZm5GQllmWVVGMHNJeUw2WkFUQmdJT3JwNWZiNVNQNFRlYUtzVElQTzExWlgra2RJYmt0WWdBRjVEaFpsRjZHNzJYZFd6Nkd2U2ZOWGFxakFZTXlHRWFsa0wyQlNCei9GMFlsQUlIVmF4R2YvOXdmZzZ6ZTlucGI1NmdXdFRlQzFGZ0MxQ3AraU81RjhxRU1QSFc0TlJKWVVURUlVQTB5c3lxNDFuU2JQY1N5UEo4ZGROOGNTZ0czVlRPRHQrL2N6aDNpdGppc2VnMUlValhXU1h0bURFNE80Y0xwdlV3K0oxSHpnQ1lOOStSU28rc0hTVWxyZ0xjbUtvYW44VEpDVUpvOVowbkdpQjVXRWw2bUVNSFYzd25yZXRvbDlvd1dUUFZlM0hCaU1tTFVZRnpTc3F2OEpIdHNZVXFvOUVxNGJ0Z1lNeGg2bnlLd2kwY0pwVjZpYzc2VExCYXhEalZLSE1OOEdCWHlRbzZnR0o4dUQ1c0IxWGlzb3JXTTA1TU9zSXRLNWlyYXJDTGkvalFjUjA4UnpCOWR4c2Evayt2RllXZWRRVFYvcXM1ZHoyUlpMVXJkUUhRSjM3N1UzY1hjZ1hZNUQvNGVoYlZSSUJrMzhaWVIvb2JIdnpXcy9Fd0g2c2pKOTJ0YlVhQWxobm5NQTI5ajVKY0kwTjM2RTA2YjhQdGRROG5FNTg1U3FyUGFldEpwSGpCNjVUY0c0cDBOQ3FER2hHbzh5WXFwaGU3K1FmQ1Bld0M0eVFrQ0hENVJORzhDWmloeE1PN09uemNwVUlhOHRQRzZYWnBRb09kc1RzRU9BYzdoOGxNUE9sNEV6dXlXeTdqRHhPaUpXVkFxaFRLcnFUaFRuMUJsM2xBMXFWWnEzdC9ycWw4dlJPd3ZFQUs1SlhTc1FjZENJQ29heUVNdzcwQWg0R0NMQ0NITFRDQ2dZQkJFb2sxbkVQOERYcVNITnlrRUlpUTdIL0ozT1h0clZGMWRad0lJWUNlZzBaTHRvdDlEcnJ2c0RKOEJrd2FXZWFrdXQwVmYxTFJSNXdPVE9BN1BlbXhFeVdNckdDazVCTVI3TDNQcWVPQ0FoRzBQSXBZVmlQbFE2dWpmMDZycXNPczJUYysyS2JnSWdEd1pqVUdVR3l0azYwYVJYNnBLeFJQeGQ4MkNBd1kzK1U5SVZhRjRxMFRXcklJMDY5bWF0WFFJK3JhTWJianhRVXZuN090NnR3eDVvemdsS1g2VXVKK29vL3Jza0NpQjJ5RjNxZTYrTFVRTmdTYWxqSXZITDVpL2h0WlRaM0hMQW9LN3FjMlRVcURMZ05YSmtUQUVFTEVSS2VhdGZXSzNJYUo0c2RYcFlLQjAweEFjOVEwNmMvVVJHQlo2czIwL01BMy9xZ3ZWNGdmVWVZSklIeHVseU5QWEw3ZjYyL2g5RlpneG1NZ0pTWWlHN0ZMUko3VE5jRXB2dVpqYTFwQjN1NndxZVh0eitPVWhoQnpmV1pzRjhudGwxZE9iMG93RnhOOHNZMEZWd3A4YUw0YzRRYUpqWW5qMExyWU1zcHkvNmh5U1A2Y01tOTVjWlhyOGNCdU4xOHJXNkR2eU0yYjZTSHdhOTR4anhuRnRncURJeVdvUTdlbHdhaHBTS2RKeDA1OGc1S3NWejNoNWM2RHh5MHJZTFZEMWdmYWxpeDRMT2h3S0JtSFdzRkdNaWN6OXJUa1V5TlB4SW1tT0VYNmdXV25sVlhpUEticExxRnJNRnNKa0pFc20zL0ptMWlGOTF5d3hsTDdTZld0M29RRjdHdkJPVzBsOVBqYkpwR3FQZHNxbnhvcVRDRHBVQ2Q4R0pPRVp5N2tMWDdvT3Evbkxrd1lOQzNvL1IyTEwwS0FhR3lUQXlORU8xTDdSWkZTaDBOQ0VBcEZIeGIrZ05vd3JYbVk0b0tDTnhiRnhubVc5cUw0T0NBS2cvcTEzQVUwQm94cnNkSEM5TFJYaGdzVmpYNVdEVnpUQ1FVTDhpNTVkQ2I5THpnZ1Z0UDU0YStjemRMc3Q2djJWWFhoOStJcWsxSXA2V3dCUVJCK0hlNStOOXBnNkFaS3pUazdDeE5CbGp1dHlpalpBakI1UXhoL2VGUDNmRTVTOVRTK0dVbG4zYUIvYnlIMElld2dETjhwVzBCT1JpNC84SmZTWDg1SFQyK2l3U0JYb01NR041SThrcUQvOTlwZTJIRWxQVE4xY3gydHkycHFKaVNnSVl3YWNKTy9HQ0dmVStJaGpYM2s4Y2VKS2dSNWVWTXh2aDFYa3hpNmpHRElTMGhOR3BiY0hWV25nTGRsaE5vS2RCakdjUnFtNjNPeXIyd3lOaVYrMlR5c3NVdFdvdURsZzZFeTVWUCsxd1BuMDVYdVJJTDh5bC8yT2x3SVJFaUQ5K2F1M3lkM1p0Q25SLzV1UVJiYkoyM3FaVXJKaXlPTE9DaGZTNlNqSmxsTGZvTVptUE9HMkV5aTBMQVRPbmNrU3lwTUcvWks1Q1dHN1FWaDYyNjZzVnVWWHZrZEZFbXJyWkdJQVJRRDBzditJaDF3VTUvZjdsc3JPQVEzS2FUeTl0Y3g1TGIxTTV5UVhJVG9qNjkzanNnWXRxZTZkTjcyU2MxN3AvTEZCNHdGbzRGV1I5UkQvMEY5QktoRDBlbmNna0ZNdlBuY3ZHS0x5a280T0FncjhNWFZVZGlOU0dzMDhzczVOeW1UeHVtcnViQ0g5bUVndGwzNGdNTnZyTUVCbVUwbkNYVkR1RUZFeVg2Vks4eHZJV3A1bWtFQ3lkTVh0bERGTTJ5RHZkb0E3VnY2UnpLUGYvcnVab0JVL3ZudEV2aE9GUmgzcll0bmN5eVNFaFpaY3FwNnc2UmQ0Y295ZVM2OU9Tc0JYRjByYXdXcFpyK1liZFYvV25OYk52bU8ya0pGeUQ1UWdHQ3U2RFAyOUNCdU9aNWdjd1pCbU4rVjI1RFNGTlBwT05lN1lJbkdJV0ZIbkorWFZIZzVaTmxlUTIrcmUrY1FaQnBZdENPTnZUem9tSXdIMTdEUTgyTUwzOVc5eUpMbDFXN0NPNWUvTS9McUYwUThjbDR0OURsQlBvSExGU2ZRR2IrTXVTQUxqMTJZM01uNzJ5b0FPcmJ5OEU0eXkvM0NvRWJ3bDVYMjVRblR1cThiTmxlN0M4WE1ldXl3clZUZXJBdXpwcmlnMkdsZ3lSeFQ0TzRpL1dlZTVuZllpMnI5WjFsUWRRYVMvWHQ5elZKeDhXM1IyRGNqQWpOVlhSdjk0UTVQWmR6S2gwNGNObEtwRHkxdWwzZUlkV1BBNTV3RTdtYUFLUDg2cE42VXBnSXpUUzd5eWVFNGQyZ2FDWldDMDJpeEVKaW9vM3FxMlFRcGp0VkJ4TlZFcmhaNlc1RHFhRDR0bVg1UnM1cUUxQ2FrOHd2V0FnY0FMaG5BelY1M2hGVVB4R29JYXBSdk5GVE90UUNOMUwvRTQ5MFZ1ckRjd1RVMS9QQWpvekJaWXF6aTNvUnJadXpxazJwS3ZIUVc2OXlzdzVuN2R6Qk5FZ1N4S0xlK0RuM0lxUzNXTlczNlkxQVVQWHpLZnpOYWd0Y2J0VlBYWVBzZGsyOGk3a0NHT1RhZlJEM2dPTVhRUERmWWJJL3hvckRIZmJKSDhTYkJ5U0QvV3N5eHpPNWwxTHc0SUxINGtRd0tEMjB1d055SjNyUGUyWE9kQ3Jhc0wvSFJjdzU1NjZpclhzejNVdlVIcWh0R0xQdVhIWDQ5WGZJdkVMRExRNHJLSXpQWmppdHN4cFJMdWRqc25CYnpTeUtyQUJUVS9xcUp0RlVXRC9USHFGV2xlUHBDZzN2a0dzc29aaHBhckwzNk9hU3JNcW53clcvcDZKTjdlK3gyUHdqaGhqTlg0eWpuREYvY3JGUjVqVGc0d0ZBeml4dENNdmRFeWlPS0FlbnpuSTB3VGxLTTkvTjlXcGVpWWszVkJiUkxFeVBldlVKVjFIQW9oRDhJTEhPcFZ4dHF5QjArU2NTRnVpMnlsNC9iRnFWb3hpR01uVmE5N2FlYm1mVlNpRlFXdWhFU0lkNXlEOXQxNGJ2L3JualQ1Vm4yQlVxbVJGV0k3L01FcVNHd2FTTm1uT0NQUUJKWXF2OEhTSHRXbkp3S2ZNV2pCOWZ6Mjg4TlJRYUMyN29vQ2pSaUZPQVhGVElYK29WbXIxMTZHT3RaR0VWYXdyYmlnRFNLUlA0VVlCbGsveUJUSjRTcE1jM25KYllRZDNLUk5sb2t3L293eXIvL1hCRXkvbW91Y1JDclVCaTNPR09kRlBXRjl5MGt2VS9IaHc1Vm4ydk5vaW9hZWFSV3lIc1RGYnZydGd5UmNGUi9zK0trS1pNNUU3ejBOSTRSYUZMNko4bVlVMzE0cy9QcVp1V3NFRTJwUTlXVnlVUkxBeXZIeVpSd2w3cytUV0tDMjFLUmVKZEhNL1JrdEYwV3orTjk2MWorU3RZSHpjRkw0RktCSTdqUUtXMlJJTC9lcTI1cERNMUhITGFsZUlTRm1UMnNsWnpJTXJpQjZyVWNZcUtrcDdsYStvVDd1VENQdXZOSCszazJiWk9rVmdhb0ZUREd2NG1FSSt6WXpNYz0iLCJtYWMiOiJlNTg5ODViY2E3OWM0OGU2ZGQ1NTZlYWEyMDJlZmFiZmI2YjFhN2FkMGFlYTJkNWM4MjdmNTg2M2MzZDAxYmY2IiwidGFnIjoiIn0=\"'),
(39,'2025-06-15 17:33:35','2025-06-15 17:33:35',NULL,'oauth_public_key','\"eyJpdiI6Ind5RUxSajVkeEpOeWYwVS9NTzVOOWc9PSIsInZhbHVlIjoiRFllakFtTEVMd1FiVWQ1UDgxY0JPZlNkTi85YmxqbnJBNlRidG5xcjRqNE1JRE5QeERPK0o0azR5ekZiTWZ0QkVUWFgwSVlBZ3FUNXdQZ0g5ZXByMGtiWGV1WDBqbzB0V1V1dUplbC9Qc3BJUEtnem1ISjhnK3dUcFFacnNPNEk2SlExY0IwNnFnK1ozTHBMU1BpcGF6TFJpZE1oaEVBWDNwL3o0Mis0aU8zcEVqUnhhMURWaVdVS056QVl4S3d6eXV2UmVRU1p2L2RsUlBlZUNSVVJPaW5xeTgzaFNXanVNc2plYmVYbUNsbWpYbEJtb2htdzBqanFFa0ZpVzZjQS9ERUNZbHdWTndqT3pmWTdJbHlDaWRzcGZNd1pPUk1Tb3hyZVVleUF0T2RFYnllKyt6NW50eERDNGY1M3RjeUZvOUoxSXE0OVJBZE5tWEswTDVUNEd3MlhZTW1pNXNHS1dCMCtoMjNZYWRWRVhWK3JkNFJNTVN2TlBZYXFvYUl6ZFJ1aTdOU3RxbWdQbGJ4d1B1aFdiWlNMay94SXEzQmtEWU16eklmTEt2K24veExKVE1kdVJyY3ZNTjJiZGxYTldHMFNRZkFEY2dNWE1ySDFONHRBTDJ0UVB3M3d3eksveWZ1TjhNbGoxM3ZTaVNBRUllcXJnaEtNVWpsc1IvbEUrY2xOMkthZ1o5YmVxNnFyUGYxRVRzMmlJcmRxdUNNeVpBNjlkRm5HNVVaSGdzUlp3UXlzU1pGVTVXN1J1cWpRaUpkWWQzbEhiUFRXeWZWcEtRT2MrSW5OSjNmbVRSVUdVeDRrOHh3Slc5L3luK0lFQ3NDNGFMTC90cmdKSjFhUExHZHJSSHBIRy9CYmNTSXl4MXc2WVhRL0R0THlnVHRVN0dEWC9jMFN5N0NjTEMwTW4wSldWTVpFcUp4aWJSa1VBd0R2TnUwTktqbkwvaWErMndjcVhQRW1ISGNGTXhhd0xZWnJZRHQxR2VCM051VFk5NE5TYUROcFhrVEdGdWVOd25sNGRRS242eGdiS3daN1I5VjJzNnAweEVtcUFkdjBOSGhTK3J4ekdyL1J1TVJhYVcwM3NPN3NiTUdOelJOYVI0bnRITFZQRy84WGNvWVBwMjYzeXhUMXR1dEx1NlphZXd4bkw1V2k0M3hsYnJJRWlRbGlmV0J4cFdrb2tJZzJqZVlWa21NeXlzdDV6T2Q1RXZuVUlURXhpZjVxOTVCRjI0ZHJzYWd3WGszK25IUDcxZmZVK0V4WmRnKzU1bzI5NThsSkFJdWhFSGN6UngvSC9XRGhkOGFncEE2eDRkc2FFMUd6S1ZGck5RU0k2b3VsU3ExbmxxOWkxYjBMNDM0MXJEMnpTNEJ3MkZCZkp0SG8xSFpqSEtibzJUODloTXBXNFcrN0pweURnK0V5dFpPaHg2N2xPbGdNa2FLV01Nd0x4UWxmd25KaTcrOVdsNmVQQWRDcGxnPT0iLCJtYWMiOiIxOTY2M2JiNzlkNThkNTM3Mzk5NzVkZmEyODRlMDQ3MmE1NGIyNTI3OWM2NTNjMjdhOTViYjRlZDRjYzQ3Yzk1IiwidGFnIjoiIn0=\"'),
(40,'2025-06-15 17:33:39','2025-06-15 17:33:39',NULL,'utc','false');
/*!40000 ALTER TABLE `configuration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency_exchange_rates`
--

DROP TABLE IF EXISTS `currency_exchange_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency_exchange_rates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `from_currency_id` int(10) unsigned NOT NULL,
  `to_currency_id` int(10) unsigned NOT NULL,
  `date` date NOT NULL,
  `date_tz` varchar(50) DEFAULT NULL,
  `rate` decimal(32,12) NOT NULL,
  `user_rate` decimal(32,12) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `currency_exchange_rates_user_id_foreign` (`user_id`),
  KEY `currency_exchange_rates_from_currency_id_foreign` (`from_currency_id`),
  KEY `currency_exchange_rates_to_currency_id_foreign` (`to_currency_id`),
  KEY `cer_to_ugi` (`user_group_id`),
  CONSTRAINT `cer_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `currency_exchange_rates_from_currency_id_foreign` FOREIGN KEY (`from_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `currency_exchange_rates_to_currency_id_foreign` FOREIGN KEY (`to_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `currency_exchange_rates_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency_exchange_rates`
--

LOCK TABLES `currency_exchange_rates` WRITE;
/*!40000 ALTER TABLE `currency_exchange_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `currency_exchange_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_journals`
--

DROP TABLE IF EXISTS `group_journals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_journals` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_group_id` int(10) unsigned NOT NULL,
  `transaction_journal_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_in_group` (`transaction_group_id`,`transaction_journal_id`),
  KEY `group_journals_transaction_journal_id_foreign` (`transaction_journal_id`),
  CONSTRAINT `group_journals_transaction_group_id_foreign` FOREIGN KEY (`transaction_group_id`) REFERENCES `transaction_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_journals_transaction_journal_id_foreign` FOREIGN KEY (`transaction_journal_id`) REFERENCES `transaction_journals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_journals`
--

LOCK TABLES `group_journals` WRITE;
/*!40000 ALTER TABLE `group_journals` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_journals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_memberships`
--

DROP TABLE IF EXISTS `group_memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_memberships` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned NOT NULL,
  `user_role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_memberships_user_id_user_group_id_user_role_id_unique` (`user_id`,`user_group_id`,`user_role_id`),
  KEY `group_memberships_user_group_id_foreign` (`user_group_id`),
  KEY `group_memberships_user_role_id_foreign` (`user_role_id`),
  CONSTRAINT `group_memberships_user_group_id_foreign` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `group_memberships_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `group_memberships_user_role_id_foreign` FOREIGN KEY (`user_role_id`) REFERENCES `user_roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_memberships`
--

LOCK TABLES `group_memberships` WRITE;
/*!40000 ALTER TABLE `group_memberships` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_memberships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `income`
--

DROP TABLE IF EXISTS `income`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `income` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `date` date NOT NULL,
  `description` text DEFAULT NULL,
  `account_id` int(10) unsigned DEFAULT NULL,
  `firefly_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_income_account` (`account_id`),
  CONSTRAINT `fk_income_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `income`
--

LOCK TABLES `income` WRITE;
/*!40000 ALTER TABLE `income` DISABLE KEYS */;
INSERT INTO `income` VALUES
(1,'salary',2914.35,'2025-05-23','Salary for May',1,NULL);
/*!40000 ALTER TABLE `income` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invited_users`
--

DROP TABLE IF EXISTS `invited_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invited_users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `email` varchar(255) NOT NULL,
  `invite_code` varchar(64) NOT NULL,
  `expires` datetime NOT NULL,
  `expires_tz` varchar(50) DEFAULT NULL,
  `redeemed` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `invited_users_user_id_foreign` (`user_id`),
  CONSTRAINT `invited_users_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invited_users`
--

LOCK TABLES `invited_users` WRITE;
/*!40000 ALTER TABLE `invited_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `invited_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` int(10) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` int(11) DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `discount` double DEFAULT NULL,
  `firefly_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_items_transaction` (`transaction_id`),
  CONSTRAINT `fk_items_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=221 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES
(1,1,'MW USB-C Adapter',1,25.00,'electronics',NULL,NULL),
(2,2,'CERAVE CRE SCHAUM REINIG',1,12.90,'cosmetics',NULL,NULL),
(3,2,'ACCUSOLI AKUT DUO',1,21.98,'cosmetics',NULL,NULL),
(4,3,'Squashies Fizz',2,2.90,'groceries',NULL,NULL),
(5,3,'Snickers Pistazie',1,2.20,'groceries',NULL,NULL),
(6,5,'Squashies Fiz',2,5.90,'groceries',NULL,NULL),
(7,6,'Squashies Fizz',2,5.90,'groceries',NULL,NULL),
(8,7,'Unspecified Item 1',1,5.00,'clothing',NULL,NULL),
(9,7,'Unspecified Item 2',1,6.00,'clothing',NULL,NULL),
(10,7,'Unspecified Item 3',1,5.00,'clothing',NULL,NULL),
(11,7,'Unspecified Item 4',1,2.50,'clothing',NULL,NULL),
(12,7,'Unspecified Item 5',1,2.50,'clothing',NULL,NULL),
(13,8,'Klebeband Papier 5m Monta',1,4.99,'misc',NULL,NULL),
(14,9,'Puzzle-Conserver Permanent VPE6(1/6)',1,13.99,'misc',NULL,NULL),
(15,9,'PAPIERTRAGETASCHE Scancode',1,0.50,'misc',NULL,NULL),
(16,10,'Artikel 1',1,1.50,'misc',NULL,NULL),
(17,10,'Artikel 2',1,1.00,'misc',NULL,NULL),
(18,10,'Artikel 3',1,1.00,'misc',NULL,NULL),
(19,10,'Artikel 4',1,2.50,'misc',NULL,NULL),
(20,10,'Artikel 5',1,2.50,'misc',NULL,NULL),
(21,11,'140 EV 2.0 00W Flash 2',1,80.03,'clothing',NULL,NULL),
(22,11,'Unbekannt 160L',1,15.36,'misc',NULL,NULL),
(23,11,'Tragetasche Snipes',1,0.60,'misc',NULL,NULL),
(24,12,'Sneakers 740 grey Flash 2',1,119.99,'clothing',NULL,NULL),
(25,12,'Tragetasche Snipes',1,0.20,'misc',NULL,NULL),
(26,13,'Istanbul Sandwich Brot',1,9.90,'dining',NULL,NULL),
(27,13,'Chicken Deluxe Sandwich Brotchen',1,9.90,'dining',NULL,NULL),
(28,14,'Istanbul Sandwich Brot',2,9.90,'dining',NULL,NULL),
(29,15,'Acqua Frizzante 0.5L',1,1.95,'dining',NULL,NULL),
(30,16,'Tageskarte Erw.',1,7.40,'transport',NULL,NULL),
(31,17,'Fahrkarte Super Sparpreis, Frankfurt(Main)Hbf → Basel Bad Bf, 2. Klasse, 1 Person (15-26 Jahre)',1,37.49,'transport',NULL,NULL),
(32,18,'birthday candles',1,2.10,'misc',NULL,NULL),
(33,19,'birthday candles',1,2.10,'misc',NULL,NULL),
(34,19,'grusskarten A6, 50 stk. 250g/m2',1,2.95,'misc',NULL,NULL),
(35,20,'schorle',1,2.10,'groceries',NULL,NULL),
(36,20,'poulet schenkel',1,5.80,'groceries',NULL,NULL),
(37,21,'Lunch',1,33.24,'dining',NULL,NULL),
(38,22,'Cornetto Pistacchio',1,1.95,'dining',NULL,NULL),
(39,23,'Betty Bossi Kartoffels',1,2.10,'groceries',NULL,NULL),
(40,23,'Naturfarm PIC-Nic Ei',1,2.70,'groceries',NULL,NULL),
(41,23,'Sapori Cornetto Pistac',1,2.20,'groceries',NULL,NULL),
(42,23,'Semmeli 80G',1,1.80,'groceries',NULL,NULL),
(43,24,'Swizzels Squashies Fiz',1,2.95,'groceries',NULL,NULL),
(44,24,'El Tony Mate 33CL',1,1.95,'groceries',NULL,NULL),
(45,25,'Monthly Rent',1,600.00,'rent',NULL,NULL),
(46,26,'St Pellegrino Water 1L',1,1.20,'groceries',NULL,NULL),
(47,27,'Good Connections RJ45 Ethernet LAN Patchkabel mit Kat.7',1,8.50,'electronics',NULL,NULL),
(48,27,'Raspberry Pi 5 8GB',1,86.00,'electronics',NULL,NULL),
(49,27,'Raspberry Pi Official 5 power supply, 27W USB-C',1,14.90,'electronics',NULL,NULL),
(50,28,'El Tony Mate 33CL',1,1.90,'groceries',NULL,NULL),
(51,28,'Velo Bright Spaerli',1,9.90,'groceries',NULL,NULL),
(52,29,'EL TONY MATE CLASSIC 3',1,1.90,'groceries',NULL,NULL),
(53,30,'Esta Thé Limone 33CL',1,1.50,'dining',NULL,NULL),
(54,31,'Red Bull Summer Edition',1,2.10,'dining',NULL,NULL),
(55,32,'S.Pellegrino mit Kohle',1,1.20,'groceries',NULL,NULL),
(56,33,'Mitsuba Snack Mix Thai',1,3.45,'groceries',NULL,NULL),
(57,34,'Betty Bossi Kartoffels',1,2.70,'groceries',NULL,NULL),
(58,34,'Sapori Cornetto Pistac',1,2.10,'groceries',NULL,NULL),
(59,35,'unspecified item',1,1.50,'misc',NULL,NULL),
(60,36,'EL TONY MATE CLASSIC',1,1.90,'groceries',NULL,NULL),
(61,36,'VELO BRIGHT S MINT 2',1,9.90,'groceries',NULL,NULL),
(62,37,'Haircut',1,30.00,'personal care',NULL,NULL),
(63,38,'General Abonnement/GA (May)',1,260.00,'transport',NULL,NULL),
(64,39,'KVG May 2025 premium',1,327.75,'insurance',NULL,NULL),
(66,41,'Swiss Alp.blau 50cl',1,0.75,'groceries',NULL,NULL),
(67,42,'Esta Thé Limone 33CL',1,1.50,'groceries',NULL,NULL),
(68,43,'Mitsuba Snack Mix Beef',1,3.45,'groceries',NULL,NULL),
(69,43,'Sapori Cornetto Pistac',1,2.10,'groceries',NULL,NULL),
(70,44,'El Tony Mate 33CL',1,1.95,'groceries',NULL,NULL),
(71,44,'S. Pellegrino mit Kohle',1,1.20,'groceries',NULL,NULL),
(72,45,'Cola Dose',1,1.10,'groceries',NULL,NULL),
(73,45,'Redbull Summer Edition 2025',1,2.10,'groceries',NULL,NULL),
(74,46,'Velo Bright Spearmint',1,9.90,'misc',NULL,NULL),
(75,49,'Ferrero Kinder CHOCOfr',1,2.50,'groceries',NULL,NULL),
(76,49,'Esta The Pesca 33CL',1,1.30,'groceries',NULL,NULL),
(77,49,'Mitsuba Snack MX Beef',1,2.45,'groceries',NULL,NULL),
(78,49,'Betty Bossi Kartoffels',1,3.25,'groceries',NULL,NULL),
(79,49,'Seeberger Bananenchips',1,3.75,'groceries',NULL,NULL),
(80,50,'Velo Bright Spearmint 23',1,9.90,'groceries',NULL,NULL),
(81,51,'Lindor Milch Herz',1,7.50,'groceries',NULL,NULL),
(82,51,'El Tony Mate 330ml',1,1.90,'groceries',NULL,NULL),
(83,52,'Club Mate Granatapfel',1,3.00,'dining',NULL,NULL),
(84,53,'Banana Cream Matcha',1,6.00,'dining',3,NULL),
(85,54,'NONGSHIM Kimchi Ramen Big Cup',1,1.75,'groceries',NULL,NULL),
(86,54,'BITGOB Hot & Spicy Tteokbokki Cup',1,2.69,'groceries',NULL,NULL),
(87,54,'Blaubeer Frischkase Shikpang',1,6.90,'groceries',3.45,NULL),
(88,54,'Gimbap Tofu',1,6.90,'groceries',3.45,NULL),
(89,54,'Jeyuk Gimbap Schweinefleisch',1,6.90,'groceries',3.45,NULL),
(90,55,'Auberginen',1,0.69,'groceries',NULL,NULL),
(91,55,'Cocktailtom',1,1.29,'groceries',NULL,NULL),
(92,55,'SanBenedetto',1,1.51,'groceries',NULL,NULL),
(93,55,'Pfand',1,0.25,'misc',NULL,NULL),
(94,55,'SanBenedetto (Pfand)',1,1.50,'groceries',NULL,NULL),
(95,55,'Pfand 2',1,0.25,'misc',NULL,NULL),
(96,55,'Gurke',1,0.55,'groceries',NULL,NULL),
(97,55,'Gurke 2',1,0.55,'groceries',NULL,NULL),
(98,55,'Hefe Würfel',1,0.29,'groceries',NULL,NULL),
(99,55,'Apfelschorle 500ml',1,0.89,'groceries',NULL,NULL),
(100,55,'Vermentini',1,8.99,'groceries',NULL,NULL),
(101,56,'.XYZ Domainregistrierung (bajstic.xyz), 1 Jahr',1,0.82,'electronics',NULL,NULL),
(102,56,'Steuern',1,0.08,'misc',NULL,NULL),
(103,56,'Gebühren',1,0.16,'misc',NULL,NULL),
(104,57,'LOSCHER CLUBMATE',2,1.09,'groceries',NULL,NULL),
(105,57,'PFAND',2,0.15,'deposit',NULL,NULL),
(106,58,'Tageskarte Erw.',1,7.40,'transport',NULL,NULL),
(107,59,'SPIESSBR-BROETCH',1,2.90,'groceries',NULL,NULL),
(108,59,'PIZ FLEISCHK.BRO',1,2.70,'groceries',NULL,NULL),
(109,59,'SENF KETCHUP MAJ',1,1.09,'groceries',NULL,NULL),
(110,59,'COCA COLA',1,0.19,'groceries',NULL,NULL),
(111,59,'FENDA 0.15 EUR',1,0.15,'groceries',NULL,NULL),
(112,59,'APPLE PLUS 60X',1,0.25,'groceries',NULL,NULL),
(113,59,'PFAND 0.25 EUR',1,0.25,'groceries',NULL,NULL),
(114,59,'BRILLENPUTZTUECH',1,1.00,'misc',NULL,NULL),
(115,60,'Fahrkarte Super Sparpreis Young, Frankfurt(Main)Hbf - Basel Bad Bf, 2. Klasse, 1 Person (15-26 Jahre)',1,41.99,'transport',NULL,NULL),
(116,61,'Gerolsteiner medium 1.5l',1,3.49,'beverage',NULL,NULL),
(117,61,'Pfand 0.25 EUR',1,0.25,'deposit',NULL,NULL),
(118,61,'Club Mate 0.5l MW',1,3.49,'beverage',NULL,NULL),
(119,61,'Pfand 0.15 EUR',1,0.15,'deposit',NULL,NULL),
(120,62,'Sapori Cornetto Pistac',1,2.10,'groceries',NULL,NULL),
(121,63,'Esta Thé Pesca 33CL',1,1.50,'groceries',NULL,NULL),
(122,64,'S.Pellegrino mit Kohle',1,1.00,'groceries',NULL,NULL),
(124,66,'Auto-recharge credits',1,5.01,'misc',NULL,NULL),
(125,67,'Auto-recharge credits',1,5.06,'misc',NULL,NULL),
(126,68,'SAN PELLEGRINO 50CL',1,1.20,'groceries',NULL,NULL),
(127,68,'VELO BRIGHT S\'MINT 2 S',1,9.90,'groceries',NULL,NULL),
(128,69,'Esta Thé Pesca 33CL',1,1.50,'groceries',NULL,NULL),
(129,69,'Sapori Corneto Pistac',1,2.10,'groceries',NULL,NULL),
(130,70,'Bilz Panaché alkoholfrei',1,1.65,'groceries',NULL,NULL),
(131,70,'Betty Bossi Kartoffels',1,2.70,'groceries',NULL,NULL),
(132,71,'El Tony Mate 33CL',1,1.95,'dining',NULL,NULL),
(133,71,'S.Pellegrino mit Kohle',1,1.20,'dining',NULL,NULL),
(134,71,'Sapori Cornetto Pistac',1,2.10,'dining',NULL,NULL),
(135,72,'Ticket: Basel Bad Bf to Frankfurt (Main) Süd (1 Adult)',1,17.00,'transport',NULL,NULL),
(136,72,'Service Fee',1,1.00,'transport',NULL,NULL),
(137,73,'Ragusa Tafel Noir 100G',1,3.20,'groceries',NULL,NULL),
(138,73,'El Tony Mate 33CL',1,1.95,'groceries',NULL,NULL),
(139,73,'Sapori Cornetto Pistac',1,2.10,'groceries',NULL,NULL),
(140,74,'Velo Bright Spearmint',1,9.90,'misc',NULL,NULL),
(141,75,'S. Pellegrino mit Kohle',1,1.20,'groceries',NULL,NULL),
(142,76,'Volvic Essence Limette',1,1.95,'groceries',NULL,NULL),
(143,77,'Snickers 2er Pack 80g',1,2.10,'groceries',NULL,NULL),
(144,78,'Fahrkarte Super Sparpreis Europa Young, Zürich HB → Frankfurt(Main)Hbf, 2. Klasse, 1 Person (15-26 Jahre)',1,33.00,'transport',NULL,NULL),
(145,79,'AQUA VIVA Kola 500ml',1,1.65,'groceries',NULL,NULL),
(146,79,'Schwedentorte klein',1,14.90,'groceries',NULL,NULL),
(147,80,'Dinner with girlfriend',1,49.00,'dining',NULL,NULL),
(165,82,'Matzip Mayo/Ketchup',1,0.79,'groceries',NULL,NULL),
(166,82,'Thunf. Röstkart.',1,2.99,'groceries',NULL,NULL),
(167,82,'Baguette Krustbrot',1,0.99,'groceries',NULL,NULL),
(168,82,'Pfand (Baguette)',1,0.25,'groceries',NULL,NULL),
(169,82,'Salat junger Spinat',1,1.99,'groceries',NULL,NULL),
(170,82,'Pfand (Spinat)',1,0.25,'groceries',NULL,NULL),
(171,82,'Coca-Cola 0,5l',2,0.75,'beverages',NULL,NULL),
(172,82,'Franzbröt. Bard',1,1.29,'bakery',NULL,NULL),
(173,82,'Bio Eier',1,2.69,'groceries',NULL,NULL),
(174,82,'Kokosnuss Flakes',1,1.69,'groceries',NULL,NULL),
(175,82,'Zucchini 400g',1,0.95,'groceries',NULL,NULL),
(176,82,'Paprika rot 1kg',1,2.99,'groceries',NULL,NULL),
(177,82,'Mini Kiwis 3x40g',1,1.79,'groceries',NULL,NULL),
(178,82,'Küchentücher 3lag',1,2.55,'household',NULL,NULL),
(179,82,'Spül Nackts 800',1,0.85,'household',NULL,NULL),
(180,82,'Naturtrübes Radler',1,2.29,'beverages',NULL,NULL),
(181,82,'Pfand (Radler)',1,0.25,'beverages',NULL,NULL),
(196,84,'Pfand',1,8.25,'groceries',NULL,NULL),
(197,84,'Weizenmehl',1,0.49,'groceries',NULL,NULL),
(198,84,'Jasmin Reis 1kg',1,2.29,'groceries',NULL,NULL),
(199,84,'Puderzucker',1,0.49,'groceries',NULL,NULL),
(200,84,'Eier Bodenh. 18er',1,3.39,'groceries',NULL,NULL),
(201,84,'Philadelphia Fr',1,1.99,'groceries',NULL,NULL),
(202,84,'TK -Kids Mix',1,1.79,'groceries',NULL,NULL),
(203,84,'MU Kefir w. Ayran',1,0.79,'groceries',NULL,NULL),
(204,84,'Handelsmarke Pfand',1,0.25,'groceries',NULL,NULL),
(205,84,'H-Milch 3.5% 1L',1,1.09,'groceries',NULL,NULL),
(206,84,'Ananas Stk',1,1.99,'groceries',NULL,NULL),
(207,84,'MU Kefir w. Ayran',1,0.79,'groceries',NULL,NULL),
(208,84,'Handelsmarke Pfand',1,0.25,'groceries',NULL,NULL),
(209,84,'Handelsmarke Pfand',1,0.25,'groceries',NULL,NULL),
(210,84,'Galiamelone lose',1,3.26,'groceries',NULL,NULL),
(211,84,'Karotte kl. 2 kg',1,2.62,'groceries',NULL,NULL),
(212,84,'Bio-Karotten kg',1,1.59,'groceries',NULL,NULL),
(213,84,'Kartoffeln Bio 750g',1,1.49,'groceries',NULL,NULL),
(214,84,'Zwiebeln weiß Beutel200g',1,0.99,'groceries',NULL,NULL),
(215,84,'Gurke Bio Stk',2,0.95,'groceries',NULL,NULL),
(216,84,'Paprika Abdr. Stk',1,0.49,'groceries',NULL,NULL),
(217,84,'Min Auberginen Stk',1,0.77,'groceries',NULL,NULL),
(218,85,'Istanbul SANDWICH BROT',1,9.90,'dining',NULL,NULL),
(219,85,'Berliner SANDWICH BROT',1,11.90,'dining',NULL,NULL),
(220,85,'Chicken Deluxe SANDWICH BROT',1,9.90,'dining',NULL,NULL);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(191) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_links`
--

DROP TABLE IF EXISTS `journal_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_links` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `link_type_id` int(10) unsigned NOT NULL,
  `source_id` int(10) unsigned NOT NULL,
  `destination_id` int(10) unsigned NOT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `journal_links_link_type_id_source_id_destination_id_unique` (`link_type_id`,`source_id`,`destination_id`),
  KEY `journal_links_source_id_foreign` (`source_id`),
  KEY `journal_links_destination_id_foreign` (`destination_id`),
  CONSTRAINT `journal_links_destination_id_foreign` FOREIGN KEY (`destination_id`) REFERENCES `transaction_journals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `journal_links_link_type_id_foreign` FOREIGN KEY (`link_type_id`) REFERENCES `link_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `journal_links_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `transaction_journals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_links`
--

LOCK TABLES `journal_links` WRITE;
/*!40000 ALTER TABLE `journal_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_meta`
--

DROP TABLE IF EXISTS `journal_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_meta` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `transaction_journal_id` int(10) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `data` text NOT NULL,
  `hash` varchar(64) NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `journal_meta_transaction_journal_id_index` (`transaction_journal_id`),
  KEY `journal_meta_data_index` (`data`(768)),
  KEY `journal_meta_name_index` (`name`),
  CONSTRAINT `journal_meta_transaction_journal_id_foreign` FOREIGN KEY (`transaction_journal_id`) REFERENCES `transaction_journals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_meta`
--

LOCK TABLES `journal_meta` WRITE;
/*!40000 ALTER TABLE `journal_meta` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal_meta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `link_types`
--

DROP TABLE IF EXISTS `link_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `link_types` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `outward` varchar(191) NOT NULL,
  `inward` varchar(191) NOT NULL,
  `editable` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `link_types_name_outward_inward_unique` (`name`,`outward`,`inward`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `link_types`
--

LOCK TABLES `link_types` WRITE;
/*!40000 ALTER TABLE `link_types` DISABLE KEYS */;
INSERT INTO `link_types` VALUES
(1,'2025-06-15 15:54:11','2025-06-15 15:54:11',NULL,'Related','relates to','relates to',0),
(2,'2025-06-15 15:54:11','2025-06-15 15:54:11',NULL,'Refund','(partially) refunds','is (partially) refunded by',0),
(3,'2025-06-15 15:54:11','2025-06-15 15:54:11',NULL,'Paid','(partially) pays for','is (partially) paid for by',0),
(4,'2025-06-15 15:54:12','2025-06-15 15:54:12',NULL,'Reimbursement','(partially) reimburses','is (partially) reimbursed by',0);
/*!40000 ALTER TABLE `link_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `locatable_id` int(10) unsigned NOT NULL,
  `locatable_type` varchar(255) NOT NULL,
  `latitude` decimal(12,8) DEFAULT NULL,
  `longitude` decimal(12,8) DEFAULT NULL,
  `zoom_level` smallint(5) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(191) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES
(1,'2016_06_16_000000_create_support_tables',1),
(2,'2016_06_16_000001_create_users_table',1),
(3,'2016_06_16_000002_create_main_tables',1),
(4,'2016_08_25_091522_changes_for_3101',1),
(5,'2016_09_12_121359_fix_nullables',1),
(6,'2016_10_09_150037_expand_transactions_table',1),
(7,'2016_10_22_075804_changes_for_v410',1),
(8,'2016_11_24_210552_changes_for_v420',1),
(9,'2016_12_22_150431_changes_for_v430',1),
(10,'2016_12_28_203205_changes_for_v431',1),
(11,'2017_04_13_163623_changes_for_v440',1),
(12,'2017_06_02_105232_changes_for_v450',1),
(13,'2017_08_20_062014_changes_for_v470',1),
(14,'2017_11_04_170844_changes_for_v470a',1),
(15,'2018_01_01_000001_create_oauth_auth_codes_table',1),
(16,'2018_01_01_000002_create_oauth_access_tokens_table',1),
(17,'2018_01_01_000003_create_oauth_refresh_tokens_table',1),
(18,'2018_01_01_000004_create_oauth_clients_table',1),
(19,'2018_01_01_000005_create_oauth_personal_access_clients_table',1),
(20,'2018_03_19_141348_changes_for_v472',1),
(21,'2018_04_07_210913_changes_for_v473',1),
(22,'2018_04_29_174524_changes_for_v474',1),
(23,'2018_06_08_200526_changes_for_v475',1),
(24,'2018_09_05_195147_changes_for_v477',1),
(25,'2018_11_06_172532_changes_for_v479',1),
(26,'2019_01_28_193833_changes_for_v4710',1),
(27,'2019_02_05_055516_changes_for_v4711',1),
(28,'2019_02_11_170529_changes_for_v4712',1),
(29,'2019_03_11_223700_fix_ldap_configuration',1),
(30,'2019_03_22_183214_changes_for_v480',1),
(31,'2019_11_30_000000_create_2fa_token_table',1),
(32,'2019_12_28_191351_make_locations_table',1),
(33,'2020_03_13_201950_changes_for_v520',1),
(34,'2020_06_07_063612_changes_for_v530',1),
(35,'2020_06_30_202620_changes_for_v530a',1),
(36,'2020_07_24_162820_changes_for_v540',1),
(37,'2020_11_12_070604_changes_for_v550',1),
(38,'2021_03_12_061213_changes_for_v550b2',1),
(39,'2021_05_09_064644_add_ldap_columns_to_users_table',1),
(40,'2021_05_13_053836_extend_currency_info',1),
(41,'2021_07_05_193044_drop_tele_table',1),
(42,'2021_08_28_073733_user_groups',1),
(43,'2021_12_27_000001_create_local_personal_access_tokens_table',1),
(44,'2022_08_21_104626_add_user_groups',1),
(45,'2022_09_18_123911_create_notifications_table',1),
(46,'2022_10_01_074908_invited_users',1),
(47,'2022_10_01_210238_audit_log_entries',1),
(48,'2023_08_11_192521_upgrade_og_table',1),
(49,'2023_10_21_113213_add_currency_pivot_tables',1),
(50,'2024_03_03_174645_add_indices',1),
(51,'2024_04_01_174351_expand_preferences_table',1),
(52,'2024_05_12_060551_create_account_balance_table',1),
(53,'2024_07_28_145631_add_running_balance',1),
(54,'2024_11_05_062108_add_date_tz_columns',1),
(55,'2024_11_30_075826_multi_piggy',1),
(56,'2024_12_19_061003_add_native_amount_column',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `noteable_id` int(10) unsigned NOT NULL,
  `noteable_type` varchar(191) NOT NULL,
  `title` varchar(191) DEFAULT NULL,
  `text` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `type` varchar(191) NOT NULL,
  `notifiable_type` varchar(191) NOT NULL,
  `notifiable_id` bigint(20) unsigned NOT NULL,
  `data` text NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oauth_access_tokens`
--

DROP TABLE IF EXISTS `oauth_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_access_tokens` (
  `id` varchar(100) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `client_id` int(11) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `scopes` text DEFAULT NULL,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_access_tokens_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oauth_access_tokens`
--

LOCK TABLES `oauth_access_tokens` WRITE;
/*!40000 ALTER TABLE `oauth_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oauth_auth_codes`
--

DROP TABLE IF EXISTS `oauth_auth_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_auth_codes` (
  `id` varchar(100) NOT NULL,
  `user_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `scopes` text DEFAULT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oauth_auth_codes`
--

LOCK TABLES `oauth_auth_codes` WRITE;
/*!40000 ALTER TABLE `oauth_auth_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_auth_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oauth_clients`
--

DROP TABLE IF EXISTS `oauth_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_clients` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `secret` varchar(100) DEFAULT NULL,
  `redirect` text NOT NULL,
  `personal_access_client` tinyint(1) NOT NULL,
  `password_client` tinyint(1) NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `provider` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_clients_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oauth_clients`
--

LOCK TABLES `oauth_clients` WRITE;
/*!40000 ALTER TABLE `oauth_clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oauth_personal_access_clients`
--

DROP TABLE IF EXISTS `oauth_personal_access_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_personal_access_clients` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_personal_access_clients_client_id_index` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oauth_personal_access_clients`
--

LOCK TABLES `oauth_personal_access_clients` WRITE;
/*!40000 ALTER TABLE `oauth_personal_access_clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_personal_access_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oauth_refresh_tokens`
--

DROP TABLE IF EXISTS `oauth_refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_refresh_tokens` (
  `id` varchar(100) NOT NULL,
  `access_token_id` varchar(100) NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_refresh_tokens_access_token_id_index` (`access_token_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oauth_refresh_tokens`
--

LOCK TABLES `oauth_refresh_tokens` WRITE;
/*!40000 ALTER TABLE `oauth_refresh_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `object_groupables`
--

DROP TABLE IF EXISTS `object_groupables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `object_groupables` (
  `object_group_id` int(11) NOT NULL,
  `object_groupable_id` int(10) unsigned NOT NULL,
  `object_groupable_type` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `object_groupables`
--

LOCK TABLES `object_groupables` WRITE;
/*!40000 ALTER TABLE `object_groupables` DISABLE KEYS */;
/*!40000 ALTER TABLE `object_groupables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `object_groups`
--

DROP TABLE IF EXISTS `object_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `object_groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `order` mediumint(8) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `object_groups_user_id_foreign` (`user_id`),
  KEY `object_groups_to_ugi` (`user_group_id`),
  CONSTRAINT `object_groups_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `object_groups_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `object_groups`
--

LOCK TABLES `object_groups` WRITE;
/*!40000 ALTER TABLE `object_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `object_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `email` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  KEY `password_resets_email_index` (`email`),
  KEY `password_resets_token_index` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission_role`
--

DROP TABLE IF EXISTS `permission_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_role` (
  `permission_id` int(10) unsigned NOT NULL,
  `role_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `permission_role_role_id_foreign` (`role_id`),
  CONSTRAINT `permission_role_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `permission_role_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_role`
--

LOCK TABLES `permission_role` WRITE;
/*!40000 ALTER TABLE `permission_role` DISABLE KEYS */;
/*!40000 ALTER TABLE `permission_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `display_name` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(191) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` varchar(191) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `piggy_bank_events`
--

DROP TABLE IF EXISTS `piggy_bank_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `piggy_bank_events` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `piggy_bank_id` int(10) unsigned NOT NULL,
  `transaction_journal_id` int(10) unsigned DEFAULT NULL,
  `date` date NOT NULL,
  `date_tz` varchar(50) DEFAULT NULL,
  `amount` decimal(32,12) NOT NULL,
  `native_amount` decimal(32,12) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `piggy_bank_events_piggy_bank_id_foreign` (`piggy_bank_id`),
  KEY `piggy_bank_events_transaction_journal_id_foreign` (`transaction_journal_id`),
  CONSTRAINT `piggy_bank_events_piggy_bank_id_foreign` FOREIGN KEY (`piggy_bank_id`) REFERENCES `piggy_banks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `piggy_bank_events_transaction_journal_id_foreign` FOREIGN KEY (`transaction_journal_id`) REFERENCES `transaction_journals` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `piggy_bank_events`
--

LOCK TABLES `piggy_bank_events` WRITE;
/*!40000 ALTER TABLE `piggy_bank_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `piggy_bank_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `piggy_bank_repetitions`
--

DROP TABLE IF EXISTS `piggy_bank_repetitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `piggy_bank_repetitions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `piggy_bank_id` int(10) unsigned NOT NULL,
  `start_date` date DEFAULT NULL,
  `start_date_tz` varchar(50) DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `target_date_tz` varchar(50) DEFAULT NULL,
  `current_amount` decimal(32,12) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `piggy_bank_repetitions_piggy_bank_id_foreign` (`piggy_bank_id`),
  CONSTRAINT `piggy_bank_repetitions_piggy_bank_id_foreign` FOREIGN KEY (`piggy_bank_id`) REFERENCES `piggy_banks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `piggy_bank_repetitions`
--

LOCK TABLES `piggy_bank_repetitions` WRITE;
/*!40000 ALTER TABLE `piggy_bank_repetitions` DISABLE KEYS */;
/*!40000 ALTER TABLE `piggy_bank_repetitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `piggy_banks`
--

DROP TABLE IF EXISTS `piggy_banks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `piggy_banks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `account_id` int(10) unsigned DEFAULT NULL,
  `transaction_currency_id` int(10) unsigned DEFAULT NULL,
  `name` varchar(1024) NOT NULL,
  `target_amount` decimal(32,12) NOT NULL,
  `start_date` date DEFAULT NULL,
  `start_date_tz` varchar(50) DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `target_date_tz` varchar(50) DEFAULT NULL,
  `order` int(10) unsigned NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 0,
  `encrypted` tinyint(1) NOT NULL DEFAULT 1,
  `native_target_amount` decimal(32,12) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `unique_currency` (`transaction_currency_id`),
  KEY `piggy_banks_account_id_foreign` (`account_id`),
  CONSTRAINT `piggy_banks_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `unique_currency` FOREIGN KEY (`transaction_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `piggy_banks`
--

LOCK TABLES `piggy_banks` WRITE;
/*!40000 ALTER TABLE `piggy_banks` DISABLE KEYS */;
/*!40000 ALTER TABLE `piggy_banks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preferences`
--

DROP TABLE IF EXISTS `preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `preferences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(1024) NOT NULL,
  `data` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `preferences_user_id_foreign` (`user_id`),
  KEY `preferences_to_ugi` (`user_group_id`),
  CONSTRAINT `preferences_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `preferences_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preferences`
--

LOCK TABLES `preferences` WRITE;
/*!40000 ALTER TABLE `preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurrences`
--

DROP TABLE IF EXISTS `recurrences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurrences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `transaction_type_id` int(10) unsigned NOT NULL,
  `title` varchar(1024) NOT NULL,
  `description` text NOT NULL,
  `first_date` date NOT NULL,
  `first_date_tz` varchar(50) DEFAULT NULL,
  `repeat_until` date DEFAULT NULL,
  `repeat_until_tz` varchar(50) DEFAULT NULL,
  `latest_date` date DEFAULT NULL,
  `latest_date_tz` varchar(50) DEFAULT NULL,
  `repetitions` smallint(5) unsigned NOT NULL,
  `apply_rules` tinyint(1) NOT NULL DEFAULT 1,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `recurrences_user_id_foreign` (`user_id`),
  KEY `recurrences_transaction_type_id_foreign` (`transaction_type_id`),
  KEY `recurrences_to_ugi` (`user_group_id`),
  CONSTRAINT `recurrences_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `recurrences_transaction_type_id_foreign` FOREIGN KEY (`transaction_type_id`) REFERENCES `transaction_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recurrences_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurrences`
--

LOCK TABLES `recurrences` WRITE;
/*!40000 ALTER TABLE `recurrences` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurrences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurrences_meta`
--

DROP TABLE IF EXISTS `recurrences_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurrences_meta` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `recurrence_id` int(10) unsigned NOT NULL,
  `name` varchar(50) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `recurrences_meta_recurrence_id_foreign` (`recurrence_id`),
  CONSTRAINT `recurrences_meta_recurrence_id_foreign` FOREIGN KEY (`recurrence_id`) REFERENCES `recurrences` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurrences_meta`
--

LOCK TABLES `recurrences_meta` WRITE;
/*!40000 ALTER TABLE `recurrences_meta` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurrences_meta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurrences_repetitions`
--

DROP TABLE IF EXISTS `recurrences_repetitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurrences_repetitions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `recurrence_id` int(10) unsigned NOT NULL,
  `repetition_type` varchar(50) NOT NULL,
  `repetition_moment` varchar(50) NOT NULL,
  `repetition_skip` smallint(5) unsigned NOT NULL,
  `weekend` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `recurrences_repetitions_recurrence_id_foreign` (`recurrence_id`),
  CONSTRAINT `recurrences_repetitions_recurrence_id_foreign` FOREIGN KEY (`recurrence_id`) REFERENCES `recurrences` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurrences_repetitions`
--

LOCK TABLES `recurrences_repetitions` WRITE;
/*!40000 ALTER TABLE `recurrences_repetitions` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurrences_repetitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurrences_transactions`
--

DROP TABLE IF EXISTS `recurrences_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurrences_transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `recurrence_id` int(10) unsigned NOT NULL,
  `transaction_currency_id` int(10) unsigned NOT NULL,
  `transaction_type_id` int(10) unsigned DEFAULT NULL,
  `foreign_currency_id` int(10) unsigned DEFAULT NULL,
  `source_id` int(10) unsigned NOT NULL,
  `destination_id` int(10) unsigned NOT NULL,
  `amount` decimal(32,12) NOT NULL,
  `foreign_amount` decimal(32,12) DEFAULT NULL,
  `description` varchar(1024) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `recurrences_transactions_recurrence_id_foreign` (`recurrence_id`),
  KEY `recurrences_transactions_transaction_currency_id_foreign` (`transaction_currency_id`),
  KEY `recurrences_transactions_foreign_currency_id_foreign` (`foreign_currency_id`),
  KEY `recurrences_transactions_source_id_foreign` (`source_id`),
  KEY `recurrences_transactions_destination_id_foreign` (`destination_id`),
  KEY `type_foreign` (`transaction_type_id`),
  CONSTRAINT `recurrences_transactions_destination_id_foreign` FOREIGN KEY (`destination_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recurrences_transactions_foreign_currency_id_foreign` FOREIGN KEY (`foreign_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `recurrences_transactions_recurrence_id_foreign` FOREIGN KEY (`recurrence_id`) REFERENCES `recurrences` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recurrences_transactions_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recurrences_transactions_transaction_currency_id_foreign` FOREIGN KEY (`transaction_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `type_foreign` FOREIGN KEY (`transaction_type_id`) REFERENCES `transaction_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurrences_transactions`
--

LOCK TABLES `recurrences_transactions` WRITE;
/*!40000 ALTER TABLE `recurrences_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurrences_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_user`
--

DROP TABLE IF EXISTS `role_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_user` (
  `user_id` int(10) unsigned NOT NULL,
  `role_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_user_role_id_foreign` (`role_id`),
  CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_user`
--

LOCK TABLES `role_user` WRITE;
/*!40000 ALTER TABLE `role_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `display_name` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES
(1,'2025-06-15 15:54:10','2025-06-15 15:54:10','owner','Site Owner','User runs this instance of FF3'),
(2,'2025-06-15 15:54:10','2025-06-15 15:54:10','demo','Demo User','User is a demo user');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rt_meta`
--

DROP TABLE IF EXISTS `rt_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rt_meta` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `rt_id` int(10) unsigned NOT NULL,
  `name` varchar(50) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `rt_meta_rt_id_foreign` (`rt_id`),
  CONSTRAINT `rt_meta_rt_id_foreign` FOREIGN KEY (`rt_id`) REFERENCES `recurrences_transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rt_meta`
--

LOCK TABLES `rt_meta` WRITE;
/*!40000 ALTER TABLE `rt_meta` DISABLE KEYS */;
/*!40000 ALTER TABLE `rt_meta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rule_actions`
--

DROP TABLE IF EXISTS `rule_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_actions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `rule_id` int(10) unsigned NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `action_value` varchar(255) NOT NULL,
  `order` int(10) unsigned NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `stop_processing` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `rule_actions_rule_id_foreign` (`rule_id`),
  CONSTRAINT `rule_actions_rule_id_foreign` FOREIGN KEY (`rule_id`) REFERENCES `rules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rule_actions`
--

LOCK TABLES `rule_actions` WRITE;
/*!40000 ALTER TABLE `rule_actions` DISABLE KEYS */;
/*!40000 ALTER TABLE `rule_actions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rule_groups`
--

DROP TABLE IF EXISTS `rule_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `order` int(10) unsigned NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `stop_processing` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `rule_groups_user_id_foreign` (`user_id`),
  KEY `rule_groups_to_ugi` (`user_group_id`),
  CONSTRAINT `rule_groups_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rule_groups_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rule_groups`
--

LOCK TABLES `rule_groups` WRITE;
/*!40000 ALTER TABLE `rule_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `rule_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rule_triggers`
--

DROP TABLE IF EXISTS `rule_triggers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_triggers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `rule_id` int(10) unsigned NOT NULL,
  `trigger_type` varchar(50) NOT NULL,
  `trigger_value` varchar(255) NOT NULL,
  `order` int(10) unsigned NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `stop_processing` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `rule_triggers_rule_id_foreign` (`rule_id`),
  CONSTRAINT `rule_triggers_rule_id_foreign` FOREIGN KEY (`rule_id`) REFERENCES `rules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rule_triggers`
--

LOCK TABLES `rule_triggers` WRITE;
/*!40000 ALTER TABLE `rule_triggers` DISABLE KEYS */;
/*!40000 ALTER TABLE `rule_triggers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rules`
--

DROP TABLE IF EXISTS `rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rules` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `rule_group_id` int(10) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `order` int(10) unsigned NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `stop_processing` tinyint(1) NOT NULL DEFAULT 0,
  `strict` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `rules_user_id_foreign` (`user_id`),
  KEY `rules_rule_group_id_foreign` (`rule_group_id`),
  KEY `rules_to_ugi` (`user_group_id`),
  CONSTRAINT `rules_rule_group_id_foreign` FOREIGN KEY (`rule_group_id`) REFERENCES `rule_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rules_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rules_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rules`
--

LOCK TABLES `rules` WRITE;
/*!40000 ALTER TABLE `rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(191) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` text NOT NULL,
  `last_activity` int(11) NOT NULL,
  UNIQUE KEY `sessions_id_unique` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tag_transaction_journal`
--

DROP TABLE IF EXISTS `tag_transaction_journal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tag_transaction_journal` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tag_id` int(10) unsigned NOT NULL,
  `transaction_journal_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tag_transaction_journal_tag_id_transaction_journal_id_unique` (`tag_id`,`transaction_journal_id`),
  KEY `tag_transaction_journal_transaction_journal_id_foreign` (`transaction_journal_id`),
  CONSTRAINT `tag_transaction_journal_tag_id_foreign` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tag_transaction_journal_transaction_journal_id_foreign` FOREIGN KEY (`transaction_journal_id`) REFERENCES `transaction_journals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tag_transaction_journal`
--

LOCK TABLES `tag_transaction_journal` WRITE;
/*!40000 ALTER TABLE `tag_transaction_journal` DISABLE KEYS */;
/*!40000 ALTER TABLE `tag_transaction_journal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `tag` varchar(1024) NOT NULL,
  `tagMode` varchar(1024) NOT NULL,
  `date` date DEFAULT NULL,
  `date_tz` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `latitude` decimal(12,8) DEFAULT NULL,
  `longitude` decimal(12,8) DEFAULT NULL,
  `zoomLevel` smallint(5) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tags_user_id_foreign` (`user_id`),
  KEY `tags_to_ugi` (`user_group_id`),
  CONSTRAINT `tags_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tags_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_currencies`
--

DROP TABLE IF EXISTS `transaction_currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_currencies` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  `code` varchar(51) NOT NULL,
  `name` varchar(255) NOT NULL,
  `symbol` varchar(51) NOT NULL,
  `decimal_places` smallint(5) unsigned NOT NULL DEFAULT 2,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_currencies_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_currencies`
--

LOCK TABLES `transaction_currencies` WRITE;
/*!40000 ALTER TABLE `transaction_currencies` DISABLE KEYS */;
INSERT INTO `transaction_currencies` VALUES
(1,'2025-06-15 15:53:57','2025-06-15 15:53:57',NULL,1,'EUR','Euro','€',2),
(2,'2025-06-15 15:53:57','2025-06-15 15:53:57',NULL,0,'HUF','Hungarian forint','Ft',2),
(3,'2025-06-15 15:53:58','2025-06-15 15:53:58',NULL,0,'GBP','British Pound','£',2),
(4,'2025-06-15 15:53:58','2025-06-15 15:53:58',NULL,0,'UAH','Ukrainian hryvnia','₴',2),
(5,'2025-06-15 15:53:58','2025-06-15 15:53:58',NULL,0,'PLN','Polish złoty','zł',2),
(6,'2025-06-15 15:53:59','2025-06-15 15:53:59',NULL,0,'TRY','Turkish lira','₺',2),
(7,'2025-06-15 15:53:59','2025-06-15 15:53:59',NULL,0,'DKK','Dansk krone','kr.',2),
(8,'2025-06-15 15:53:59','2025-06-15 15:53:59',NULL,0,'ISK','Íslensk króna','kr.',2),
(9,'2025-06-15 15:54:00','2025-06-15 15:54:00',NULL,0,'NOK','Norsk krone','kr.',2),
(10,'2025-06-15 15:54:00','2025-06-15 15:54:00',NULL,0,'SEK','Svensk krona','kr.',2),
(11,'2025-06-15 15:54:00','2025-06-15 15:54:00',NULL,0,'RON','Romanian leu','lei',2),
(12,'2025-06-15 15:54:01','2025-06-15 15:54:01',NULL,0,'USD','US Dollar','$',2),
(13,'2025-06-15 15:54:01','2025-06-15 15:54:01',NULL,0,'BRL','Brazilian real','R$',2),
(14,'2025-06-15 15:54:01','2025-06-15 15:54:01',NULL,0,'CAD','Canadian dollar','C$',2),
(15,'2025-06-15 15:54:02','2025-06-15 15:54:02',NULL,0,'MXN','Mexican peso','MX$',2),
(16,'2025-06-15 15:54:02','2025-06-15 15:54:02',NULL,0,'IDR','Indonesian rupiah','Rp',2),
(17,'2025-06-15 15:54:02','2025-06-15 15:54:02',NULL,0,'AUD','Australian dollar','A$',2),
(18,'2025-06-15 15:54:03','2025-06-15 15:54:03',NULL,0,'NZD','New Zealand dollar','NZ$',2),
(19,'2025-06-15 15:54:03','2025-06-15 15:54:03',NULL,0,'EGP','Egyptian pound','E£',2),
(20,'2025-06-15 15:54:03','2025-06-15 15:54:03',NULL,0,'MAD','Moroccan dirham','DH',2),
(21,'2025-06-15 15:54:04','2025-06-15 15:54:04',NULL,0,'ZAR','South African rand','R',2),
(22,'2025-06-15 15:54:04','2025-06-15 15:54:04',NULL,0,'JPY','Japanese yen','¥',0),
(23,'2025-06-15 15:54:04','2025-06-15 15:54:04',NULL,0,'CNY','Chinese yuan','¥',2),
(24,'2025-06-15 15:54:05','2025-06-15 15:54:05',NULL,0,'RUB','Russian ruble','₽',2),
(25,'2025-06-15 15:54:05','2025-06-15 15:54:05',NULL,0,'INR','Indian rupee','₹',2),
(26,'2025-06-15 15:54:05','2025-06-15 15:54:05',NULL,0,'ILS','Israeli new shekel','₪',2),
(27,'2025-06-15 15:54:06','2025-06-15 15:54:06',NULL,0,'CHF','Swiss franc','CHF',2),
(28,'2025-06-15 15:54:06','2025-06-15 15:54:06',NULL,0,'HRK','Croatian kuna','kn',2),
(29,'2025-06-15 15:54:06','2025-06-15 15:54:06',NULL,0,'HKD','Hong Kong dollar','HK$',2),
(30,'2025-06-15 15:54:07','2025-06-15 15:54:07',NULL,0,'CZK','Czech koruna','Kč',2);
/*!40000 ALTER TABLE `transaction_currencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_currency_user`
--

DROP TABLE IF EXISTS `transaction_currency_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_currency_user` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `transaction_currency_id` int(10) unsigned NOT NULL,
  `user_default` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_combo` (`user_id`,`transaction_currency_id`),
  KEY `transaction_currency_user_transaction_currency_id_foreign` (`transaction_currency_id`),
  CONSTRAINT `transaction_currency_user_transaction_currency_id_foreign` FOREIGN KEY (`transaction_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_currency_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_currency_user`
--

LOCK TABLES `transaction_currency_user` WRITE;
/*!40000 ALTER TABLE `transaction_currency_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `transaction_currency_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_currency_user_group`
--

DROP TABLE IF EXISTS `transaction_currency_user_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_currency_user_group` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `user_group_id` bigint(20) unsigned NOT NULL,
  `transaction_currency_id` int(10) unsigned NOT NULL,
  `group_default` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_combo_ug` (`user_group_id`,`transaction_currency_id`),
  KEY `transaction_currency_user_group_transaction_currency_id_foreign` (`transaction_currency_id`),
  CONSTRAINT `transaction_currency_user_group_transaction_currency_id_foreign` FOREIGN KEY (`transaction_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_currency_user_group_user_group_id_foreign` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_currency_user_group`
--

LOCK TABLES `transaction_currency_user_group` WRITE;
/*!40000 ALTER TABLE `transaction_currency_user_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `transaction_currency_user_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_groups`
--

DROP TABLE IF EXISTS `transaction_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transaction_groups_user_id_index` (`user_id`),
  KEY `transaction_groups_user_group_id_index` (`user_group_id`),
  CONSTRAINT `transaction_groups_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `transaction_groups_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_groups`
--

LOCK TABLES `transaction_groups` WRITE;
/*!40000 ALTER TABLE `transaction_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `transaction_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_journals`
--

DROP TABLE IF EXISTS `transaction_journals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_journals` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `transaction_type_id` int(10) unsigned NOT NULL,
  `transaction_group_id` int(10) unsigned DEFAULT NULL,
  `bill_id` int(10) unsigned DEFAULT NULL,
  `transaction_currency_id` int(10) unsigned DEFAULT NULL,
  `description` varchar(1024) NOT NULL,
  `date` datetime NOT NULL,
  `date_tz` varchar(50) DEFAULT NULL,
  `interest_date` date DEFAULT NULL,
  `book_date` date DEFAULT NULL,
  `process_date` date DEFAULT NULL,
  `order` int(10) unsigned NOT NULL DEFAULT 0,
  `tag_count` int(10) unsigned NOT NULL,
  `encrypted` tinyint(1) NOT NULL DEFAULT 1,
  `completed` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `transaction_journals_user_id_index` (`user_id`),
  KEY `transaction_journals_user_group_id_index` (`user_group_id`),
  KEY `transaction_journals_date_index` (`date`),
  KEY `transaction_journals_transaction_group_id_index` (`transaction_group_id`),
  KEY `transaction_journals_transaction_type_id_index` (`transaction_type_id`),
  KEY `transaction_journals_transaction_currency_id_index` (`transaction_currency_id`),
  KEY `transaction_journals_bill_id_index` (`bill_id`),
  CONSTRAINT `transaction_journals_bill_id_foreign` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transaction_journals_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `transaction_journals_transaction_currency_id_foreign` FOREIGN KEY (`transaction_currency_id`) REFERENCES `transaction_currencies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_journals_transaction_group_id_foreign` FOREIGN KEY (`transaction_group_id`) REFERENCES `transaction_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_journals_transaction_type_id_foreign` FOREIGN KEY (`transaction_type_id`) REFERENCES `transaction_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_journals_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_journals`
--

LOCK TABLES `transaction_journals` WRITE;
/*!40000 ALTER TABLE `transaction_journals` DISABLE KEYS */;
/*!40000 ALTER TABLE `transaction_journals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_types`
--

DROP TABLE IF EXISTS `transaction_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_types` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_types_type_unique` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_types`
--

LOCK TABLES `transaction_types` WRITE;
/*!40000 ALTER TABLE `transaction_types` DISABLE KEYS */;
INSERT INTO `transaction_types` VALUES
(1,'2025-06-15 15:54:08','2025-06-15 15:54:08',NULL,'Withdrawal'),
(2,'2025-06-15 15:54:08','2025-06-15 15:54:08',NULL,'Deposit'),
(3,'2025-06-15 15:54:08','2025-06-15 15:54:08',NULL,'Transfer'),
(4,'2025-06-15 15:54:09','2025-06-15 15:54:09',NULL,'Opening balance'),
(5,'2025-06-15 15:54:09','2025-06-15 15:54:09',NULL,'Reconciliation'),
(6,'2025-06-15 15:54:09','2025-06-15 15:54:09',NULL,'Invalid'),
(7,'2025-06-15 15:54:10','2025-06-15 15:54:10',NULL,'Liability credit');
/*!40000 ALTER TABLE `transaction_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `shop` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `time` time DEFAULT NULL,
  `total` decimal(12,2) DEFAULT NULL,
  `currency` enum('EUR','CHF','USD') NOT NULL DEFAULT 'CHF',
  `discount` decimal(12,2) DEFAULT NULL,
  `receipt_path` varchar(255) DEFAULT NULL,
  `account_id` int(10) unsigned DEFAULT NULL,
  `firefly_id` varchar(255) DEFAULT NULL,
  `identifier` smallint(5) unsigned NOT NULL DEFAULT 0,
  `native_amount` decimal(32,12) DEFAULT NULL,
  `native_foreign_amount` decimal(32,12) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `transaction_journal_id` int(10) unsigned DEFAULT NULL,
  `foreign_currency_id` int(10) unsigned DEFAULT NULL,
  `foreign_amount` decimal(32,12) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `transactions_account_id_index` (`account_id`),
  KEY `idx_transactions_journal_id` (`transaction_journal_id`),
  CONSTRAINT `fk_transactions_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES
(1,'Apple Premium Reseller ergo sum GmbH','2022-05-04','18:28:00',25.00,'EUR',NULL,'uploads/1747848426081-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(2,'Frau Shila Zeite (Zelti 5 GmbH)','2025-05-03',NULL,36.88,'EUR',5.00,'uploads/1747848720240-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(3,'Coop Pronto','2025-05-21','12:28:00',8.00,'CHF',NULL,'uploads/1747945053658-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(4,'Coop Pronto Shop','2025-05-21','12:28:00',8.00,'CHF',NULL,'uploads/1747945393555-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(5,'Coop Pronto Shop','2025-05-21','12:28:00',8.00,'CHF',NULL,'uploads/1747945507688-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(6,'Coop Pronto Shop','2025-05-21','12:28:00',8.00,'CHF',NULL,'uploads/1747945776212-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(7,'Primark','2023-09-25','13:10:55',22.00,'EUR',NULL,'uploads/1748018985638-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(8,'Galeria','2025-05-23','14:30:00',4.99,'EUR',NULL,'uploads/1748019729730-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(9,'Hugendubel','2025-05-23','14:20:03',14.49,'EUR',NULL,'uploads/1748019952348-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(10,'Woolworth','2023-10-15','09:15:00',8.50,'EUR',NULL,'uploads/1748020019585-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(11,'Snipes','2025-05-23','16:10:00',95.99,'EUR',0.00,'uploads/1748020073821-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(12,'Sneakers und Street Fashion','2025-05-23','16:19:55',80.83,'EUR',24.00,NULL,1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(13,'RESTAURANT HAVANA','2025-05-26','15:06:00',19.80,'EUR',NULL,'uploads/1748248400346-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(14,'Restaurant Havanda','2025-05-26','15:06:00',19.80,'EUR',NULL,'uploads/1748248648993-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(15,'Sapori d\'Italia (Zürich Hauptbahnhof)','2025-05-26','13:06:53',1.95,'CHF',NULL,'uploads/1748266190877-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(16,'DB Fernverkehr AG','2025-05-22',NULL,7.40,'EUR',NULL,'uploads/1748266259539-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(17,'DB Fernverkehr AG','2025-05-22',NULL,37.49,'EUR',NULL,'uploads/1748266337417-receipt.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(18,'Migros Bahnhof','2025-05-21',NULL,2.10,'CHF',NULL,NULL,1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(19,'Migros Basel Bahnhof','2025-05-21',NULL,5.05,'CHF',NULL,NULL,1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(20,'Migros Gourmessa Bahnhof','2025-05-21',NULL,7.90,'CHF',NULL,NULL,1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(21,'Jin’s Haus Frankfurt','2025-05-24',NULL,33.24,'CHF',NULL,NULL,1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(22,'Sapori d\'Italia Zürich Hauptbahnhof','2025-05-26','13:06:00',1.95,'CHF',NULL,'uploads/1748344252965-telegram-receipt-1748344252771.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(23,'Coop Pronto Shop','2025-05-28','16:06:52',10.75,'CHF',NULL,'uploads/1748483134171-telegram-receipt-1748483133943.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(24,'Coop Pronto Shop','2025-05-28','19:37:53',4.90,'CHF',NULL,'uploads/1748483219373-telegram-receipt-1748483219158.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(25,'Rent','2025-05-01',NULL,600.00,'CHF',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(26,'Coop Pronto Oerlikon','2025-05-28','23:00:00',1.20,'CHF',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(27,'Digitec Galaxus AG','2025-05-27',NULL,109.40,'CHF',NULL,'uploads/1748518563170-telegram-receipt-1748518562924.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(28,'Coop to go (Zürich Oerlikon Bhf)','2025-05-29','14:02:00',11.80,'CHF',NULL,'uploads/1748611495116-telegram-receipt-1748611494890.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(29,'migrolino Oberglatt','2025-05-30','14:16:06',1.90,'CHF',NULL,'uploads/1748611495013-telegram-receipt-1748611494786.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(30,'Coop Pronto Shop (Zürich Oerlikon)','2025-05-30','15:04:29',1.50,'CHF',NULL,'uploads/1748611874777-telegram-receipt-1748611874534.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(31,'Coop Pronto Shop Zürich Oerlikon','2025-05-30','15:16:02',2.10,'CHF',NULL,'uploads/1748611874769-telegram-receipt-1748611874512.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(32,'Coop Pronto Shop Zürich Oerlikon','2025-05-30','15:54:58',1.20,'CHF',NULL,'uploads/1748614453473-telegram-receipt-1748614453256.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(33,'Coop Pronto Shop','2025-05-30','17:13:30',3.45,'CHF',NULL,'uploads/1748629326423-telegram-receipt-1748629326178.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(34,'Coop Pronto Shop','2025-05-30','17:30:02',4.80,'CHF',NULL,'uploads/1748629326417-telegram-receipt-1748629326182.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(35,'Coop Pronto AG','2025-05-30',NULL,1.50,'CHF',NULL,'uploads/1748630103305-telegram-receipt-1748630103071.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(36,'Migrolino Oberglatt','2025-05-31','15:17:52',11.80,'CHF',NULL,'uploads/1748698447312-telegram-receipt-1748698447052.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(37,'Unknown (Haircut)','2025-05-31',NULL,30.00,'CHF',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(38,'SBB Contact Center Swiss Pass','2025-05-30',NULL,260.00,'CHF',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(39,'Krankenpflegeversicherung KVG','2025-05-30',NULL,133.95,'CHF',193.80,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(41,'Coop to go Zürich Oerlikon Bhf','2025-06-01','14:02:41',0.75,'CHF',NULL,'uploads/1748779758258-telegram-receipt-1748779757967.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(42,'Coop Pronto Shop','2025-06-01','17:10:47',1.50,'CHF',NULL,'uploads/1748791106578-telegram-receipt-1748791106370.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(43,'Coop Pronto Shop','2025-06-01','17:13:53',5.55,'CHF',NULL,'uploads/1748791106427-telegram-receipt-1748791106240.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(44,'Coop Pronto Shop','2025-06-02','14:47:32',3.15,'CHF',NULL,'uploads/1748868587118-telegram-receipt-1748868586885.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(45,'Coop Pronto Oerlikon','2025-06-01','18:00:00',3.20,'CHF',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(46,'Coop Pronto Shop','2025-06-02','15:13:38',9.90,'CHF',NULL,'uploads/1748870761468-telegram-receipt-1748870761301.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(47,'Coop Pronto Shop Höfliwiesenstrasse 369, 8050 Zürich Oerlikon','2025-06-02','18:50:49',13.25,'CHF',NULL,'uploads/1748884912022-telegram-receipt-1748884911801.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(48,'Coop Pronto Shop Zürich Oerlikon','2025-06-02','18:50:54',13.25,'CHF',NULL,'uploads/1748885530906-telegram-receipt-1748885530692.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(49,'Coop Pronto Shop','2025-06-02','18:50:54',13.25,'CHF',NULL,'uploads/1748887169149-telegram-receipt-1748887168957.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(50,'k kiosk Walche-21530','2025-06-03','12:42:16',9.90,'CHF',NULL,'uploads/1748956887793-telegram-receipt-1748956887583.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(51,'Migros Zürich HB','2025-06-03','12:45:00',9.40,'CHF',NULL,'uploads/1748956887973-telegram-receipt-1748956887726.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(52,'unknown (Frankfurt)','2025-06-03',NULL,3.00,'EUR',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(53,'THE ALLEY','2025-06-03','19:47:58',3.00,'EUR',3.00,'uploads/1748981855685-telegram-receipt-1748981855490.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(54,'ymart Fine Asian Goods','2025-06-03','19:04:00',14.34,'EUR',6.90,'uploads/1748981855596-telegram-receipt-1748981855397.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(55,'ALDI SÜD Frankfurt-Hausen','2025-06-04','14:12:00',16.50,'EUR',NULL,'uploads/1749040580954-telegram-receipt-1749040580755.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(56,'GoDaddy','2025-06-04',NULL,1.06,'CHF',NULL,'uploads/1749064899443-telegram-receipt-1749064899267.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(57,'REWE','2025-06-04','21:11:00',2.48,'EUR',NULL,'uploads/1749064909455-telegram-receipt-1749064909218.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(58,'DB Fernverkehr AG','2025-06-05',NULL,7.40,'EUR',NULL,'uploads/1749108814162-telegram-receipt-1749108813941.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(59,'REWE','2025-06-05','10:19:00',8.53,'EUR',NULL,'uploads/1749113233841-telegram-receipt-1749113233637.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(60,'DB Fernverkehr AG','2025-06-05',NULL,41.99,'EUR',NULL,'uploads/1749129088339-telegram-receipt-1749129088138.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(61,'ServiceStore DB','2025-06-05','15:50:00',7.75,'EUR',NULL,'uploads/1749132817633-telegram-receipt-1749132817409.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(62,'Coop Pronto Shop, Zürich Oerlikon','2025-06-06','12:01:56',2.10,'CHF',NULL,'uploads/1749204745328-telegram-image-1749204743495.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(63,'Coop Pronto Shop, Zürich Oerlikon','2025-06-06','12:11:07',1.50,'CHF',NULL,'uploads/1749213436591-telegram-image-1749213436360.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(64,'Coop Pronto Shop, Zürich Oerlikon','2025-06-06','14:21:27',1.00,'CHF',NULL,'uploads/1749213476077-telegram-image-1749213475884.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(66,'Anthropic, PBC','2025-06-05',NULL,5.01,'USD',NULL,'uploads/1749318842303-telegram-image-1749318842112.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(67,'Anthropic, PBC','2025-06-06',NULL,5.06,'USD',NULL,'uploads/1749318842247-telegram-image-1749318842008.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(68,'migrolino Oberglatt','2025-06-08','09:48:50',11.10,'CHF',NULL,'uploads/1749369071345-telegram-image-1749369071069.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(69,'Coop Pronto Shop','2025-06-08','13:14:17',3.60,'CHF',NULL,'uploads/1749390015114-telegram-image-1749390014889.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(70,'Coop Pronto Shop','2025-06-08','15:29:54',4.35,'CHF',NULL,'uploads/1749390015011-telegram-image-1749390014793.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(71,'Coop Pronto Shop','2025-06-09','15:00:18',5.25,'CHF',NULL,'uploads/1749474212287-telegram-image-1749474212035.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(72,'FlixTrain','2025-06-09','20:30:00',18.00,'CHF',NULL,'uploads/1749493874902-telegram-image-1749493874684.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(73,'Coop Pronto Shop','2025-06-10','17:20:57',7.25,'CHF',NULL,'uploads/1749606164438-telegram-image-1749606164230.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(74,'Coop Pronto Shop','2025-06-10','20:43:31',9.90,'CHF',NULL,'uploads/1749606183885-telegram-image-1749606183706.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(75,'Coop Pronto Shop','2025-06-10','23:12:53',1.20,'CHF',NULL,'uploads/1749606183900-telegram-image-1749606183711.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(76,'Coop Pronto Shop','2025-06-11','22:44:30',1.95,'CHF',NULL,'uploads/1749727180632-telegram-image-1749727180433.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(77,'Coop Pronto Shop','2025-06-11','22:12:05',2.10,'CHF',NULL,'uploads/1749727180578-telegram-image-1749727180379.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(78,'DB Fernverkehr AG','2025-06-12',NULL,33.00,'EUR',NULL,'uploads/1749727250837-telegram-image-1749727250650.jpg',1,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(79,'Migros Zürich Hauptbahnhof','2025-06-12','13:45:00',16.55,'CHF',NULL,'uploads/1749737919905-telegram-image-1749737919683.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(80,'Dasarang','2025-06-12','20:11:34',49.00,'EUR',NULL,'uploads/1749806230400-telegram-image-1749806230203.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(82,'ALDI SÜD','2025-06-13','19:08:00',34.78,'EUR',0.00,'uploads/1749906080567-telegram-image-1749906080332.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(84,'ALDI SÜD','2025-06-14','14:24:00',21.26,'EUR',NULL,'uploads/1749906296449-telegram-image-1749906296251.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40'),
(85,'RESTAURANT HAVANDA (Urbanaat Food GmbH)','2025-06-15','15:12:00',31.70,'EUR',NULL,'uploads/1750001522130-telegram-image-1750001522041.jpg',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-06-16 14:33:40','2025-06-16 14:33:40');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_groups`
--

DROP TABLE IF EXISTS `user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_groups` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_groups_title_unique` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_groups`
--

LOCK TABLES `user_groups` WRITE;
/*!40000 ALTER TABLE `user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_roles_title_unique` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES
(1,'2025-06-15 15:54:12','2025-06-15 15:54:12',NULL,'ro'),
(2,'2025-06-15 15:54:12','2025-06-15 15:54:12',NULL,'mng_trx'),
(3,'2025-06-15 15:54:13','2025-06-15 15:54:13',NULL,'mng_meta'),
(4,'2025-06-15 15:54:13','2025-06-15 15:54:13',NULL,'read_budgets'),
(5,'2025-06-15 15:54:13','2025-06-15 15:54:13',NULL,'read_piggies'),
(6,'2025-06-15 15:54:14','2025-06-15 15:54:14',NULL,'read_subscriptions'),
(7,'2025-06-15 15:54:14','2025-06-15 15:54:14',NULL,'read_rules'),
(8,'2025-06-15 15:54:14','2025-06-15 15:54:14',NULL,'read_recurring'),
(9,'2025-06-15 15:54:15','2025-06-15 15:54:15',NULL,'read_webhooks'),
(10,'2025-06-15 15:54:15','2025-06-15 15:54:15',NULL,'read_currencies'),
(11,'2025-06-15 15:54:15','2025-06-15 15:54:15',NULL,'mng_budgets'),
(12,'2025-06-15 15:54:16','2025-06-15 15:54:16',NULL,'mng_piggies'),
(13,'2025-06-15 15:54:16','2025-06-15 15:54:16',NULL,'mng_subscriptions'),
(14,'2025-06-15 15:54:16','2025-06-15 15:54:16',NULL,'mng_rules'),
(15,'2025-06-15 15:54:17','2025-06-15 15:54:17',NULL,'mng_recurring'),
(16,'2025-06-15 15:54:17','2025-06-15 15:54:17',NULL,'mng_webhooks'),
(17,'2025-06-15 15:54:17','2025-06-15 15:54:17',NULL,'mng_currencies'),
(18,'2025-06-15 15:54:18','2025-06-15 15:54:18',NULL,'view_reports'),
(19,'2025-06-15 15:54:18','2025-06-15 15:54:18',NULL,'view_memberships'),
(20,'2025-06-15 15:54:18','2025-06-15 15:54:18',NULL,'full'),
(21,'2025-06-15 15:54:19','2025-06-15 15:54:19',NULL,'owner');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `objectguid` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(60) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `reset` varchar(32) DEFAULT NULL,
  `blocked` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `blocked_code` varchar(25) DEFAULT NULL,
  `mfa_secret` varchar(50) DEFAULT NULL,
  `domain` varchar(191) DEFAULT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `type_user_group_id` (`user_group_id`),
  CONSTRAINT `type_user_group_id` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhook_attempts`
--

DROP TABLE IF EXISTS `webhook_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_attempts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `webhook_message_id` int(10) unsigned NOT NULL,
  `status_code` smallint(5) unsigned NOT NULL DEFAULT 0,
  `logs` longtext DEFAULT NULL,
  `response` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `webhook_attempts_webhook_message_id_foreign` (`webhook_message_id`),
  CONSTRAINT `webhook_attempts_webhook_message_id_foreign` FOREIGN KEY (`webhook_message_id`) REFERENCES `webhook_messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhook_attempts`
--

LOCK TABLES `webhook_attempts` WRITE;
/*!40000 ALTER TABLE `webhook_attempts` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhook_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhook_messages`
--

DROP TABLE IF EXISTS `webhook_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `sent` tinyint(1) NOT NULL DEFAULT 0,
  `errored` tinyint(1) NOT NULL DEFAULT 0,
  `webhook_id` int(10) unsigned NOT NULL,
  `uuid` varchar(64) NOT NULL,
  `message` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `webhook_messages_webhook_id_foreign` (`webhook_id`),
  CONSTRAINT `webhook_messages_webhook_id_foreign` FOREIGN KEY (`webhook_id`) REFERENCES `webhooks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhook_messages`
--

LOCK TABLES `webhook_messages` WRITE;
/*!40000 ALTER TABLE `webhook_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhook_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhooks`
--

DROP TABLE IF EXISTS `webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhooks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `user_group_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `secret` varchar(32) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `trigger` smallint(5) unsigned NOT NULL,
  `response` smallint(5) unsigned NOT NULL,
  `delivery` smallint(5) unsigned NOT NULL,
  `url` varchar(1024) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `webhooks_user_id_foreign` (`user_id`),
  KEY `webhooks_title_index` (`title`),
  KEY `webhooks_secret_index` (`secret`),
  KEY `webhooks_to_ugi` (`user_group_id`),
  CONSTRAINT `webhooks_to_ugi` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `webhooks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhooks`
--

LOCK TABLES `webhooks` WRITE;
/*!40000 ALTER TABLE `webhooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhooks` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-16 16:45:39
