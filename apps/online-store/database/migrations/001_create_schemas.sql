-- /database/migrations/001_create_schemas.sql
-- Store-specific database schema (SQL Server 2019+)
-- Note: Business data (services, products, staff) comes from Mango Biz
-- This database only stores store-specific configuration

USE MangoStore;
GO

-- Create schemas for different data types
CREATE SCHEMA store_config;
GO

CREATE SCHEMA store_cache;
GO

CREATE SCHEMA store_analytics;
GO

-- Store configuration (template, theme, etc.)
CREATE TABLE store_config.store_settings (
  tenant_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
  template_id NVARCHAR(64) NOT NULL,
  theme_config NVARCHAR(MAX), -- JSON
  custom_domain NVARCHAR(256),
  is_published BIT DEFAULT 0,
  created_at DATETIME2(3) DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2(3)
);
GO

-- Cache tables for Mango Biz data (for performance)
CREATE TABLE store_cache.services (
  id INT IDENTITY(1,1) PRIMARY KEY,
  tenant_id UNIQUEIDENTIFIER NOT NULL,
  service_public_id UNIQUEIDENTIFIER NOT NULL,
  data NVARCHAR(MAX), -- JSON
  cached_at DATETIME2(3) DEFAULT SYSUTCDATETIME(),
  expires_at DATETIME2(3),
  
  CONSTRAINT UQ_CacheServices_TenantId_ServicePublicId UNIQUE (tenant_id, service_public_id)
);
GO

CREATE TABLE store_cache.products (
  id INT IDENTITY(1,1) PRIMARY KEY,
  tenant_id UNIQUEIDENTIFIER NOT NULL,
  product_public_id UNIQUEIDENTIFIER NOT NULL,
  data NVARCHAR(MAX), -- JSON
  cached_at DATETIME2(3) DEFAULT SYSUTCDATETIME(),
  expires_at DATETIME2(3),
  
  CONSTRAINT UQ_CacheProducts_TenantId_ProductPublicId UNIQUE (tenant_id, product_public_id)
);
GO

CREATE TABLE store_cache.staff (
  id INT IDENTITY(1,1) PRIMARY KEY,
  tenant_id UNIQUEIDENTIFIER NOT NULL,
  staff_public_id UNIQUEIDENTIFIER NOT NULL,
  data NVARCHAR(MAX), -- JSON
  cached_at DATETIME2(3) DEFAULT SYSUTCDATETIME(),
  expires_at DATETIME2(3),
  
  CONSTRAINT UQ_CacheStaff_TenantId_StaffPublicId UNIQUE (tenant_id, staff_public_id)
);
GO

-- Analytics events
CREATE TABLE store_analytics.events (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tenant_id UNIQUEIDENTIFIER NOT NULL,
  session_id NVARCHAR(128) NOT NULL,
  event_type NVARCHAR(64) NOT NULL,
  event_data NVARCHAR(MAX), -- JSON
  user_agent NVARCHAR(512),
  ip_address NVARCHAR(45),
  created_at DATETIME2(3) DEFAULT SYSUTCDATETIME()
);
GO

-- Page views
CREATE TABLE store_analytics.page_views (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tenant_id UNIQUEIDENTIFIER NOT NULL,
  session_id NVARCHAR(128) NOT NULL,
  page_path NVARCHAR(512) NOT NULL,
  page_title NVARCHAR(256),
  referrer NVARCHAR(512),
  user_agent NVARCHAR(512),
  ip_address NVARCHAR(45),
  created_at DATETIME2(3) DEFAULT SYSUTCDATETIME()
);
GO

-- User sessions
CREATE TABLE store_analytics.sessions (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tenant_id UNIQUEIDENTIFIER NOT NULL,
  session_id NVARCHAR(128) NOT NULL,
  user_id UNIQUEIDENTIFIER NULL,
  started_at DATETIME2(3) DEFAULT SYSUTCDATETIME(),
  ended_at DATETIME2(3) NULL,
  duration_seconds INT NULL,
  page_views INT DEFAULT 0,
  events_count INT DEFAULT 0,
  
  CONSTRAINT UQ_Sessions_TenantId_SessionId UNIQUE (tenant_id, session_id)
);
GO

-- Create indexes for performance
CREATE NONCLUSTERED INDEX IX_CacheServices_TenantId_ExpiresAt
ON store_cache.services (tenant_id, expires_at)
WHERE expires_at > SYSUTCDATETIME();
GO

CREATE NONCLUSTERED INDEX IX_CacheProducts_TenantId_ExpiresAt
ON store_cache.products (tenant_id, expires_at)
WHERE expires_at > SYSUTCDATETIME();
GO

CREATE NONCLUSTERED INDEX IX_CacheStaff_TenantId_ExpiresAt
ON store_cache.staff (tenant_id, expires_at)
WHERE expires_at > SYSUTCDATETIME();
GO

CREATE NONCLUSTERED INDEX IX_Events_TenantId_CreatedAt
ON store_analytics.events (tenant_id, created_at);
GO

CREATE NONCLUSTERED INDEX IX_Events_SessionId_CreatedAt
ON store_analytics.events (session_id, created_at);
GO

CREATE NONCLUSTERED INDEX IX_PageViews_TenantId_CreatedAt
ON store_analytics.page_views (tenant_id, created_at);
GO

CREATE NONCLUSTERED INDEX IX_PageViews_SessionId_CreatedAt
ON store_analytics.page_views (session_id, created_at);
GO

CREATE NONCLUSTERED INDEX IX_Sessions_TenantId_StartedAt
ON store_analytics.sessions (tenant_id, started_at);
GO

CREATE NONCLUSTERED INDEX IX_Sessions_UserId_StartedAt
ON store_analytics.sessions (user_id, started_at)
WHERE user_id IS NOT NULL;
GO




