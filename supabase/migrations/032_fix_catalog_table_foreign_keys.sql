-- Migration: 032_fix_catalog_table_foreign_keys.sql
-- Description: Fix missing foreign key constraints in catalog tables
-- PRD Reference: docs/PRD-Catalog-Module.md
-- Phase 1 Review Fix (US-P1F)

-- ============================================
-- FIX 1: Add FK on staff_service_assignments.staff_id
-- The staff_id column was missing a foreign key reference to the staff table
-- ============================================

ALTER TABLE staff_service_assignments
ADD CONSTRAINT staff_service_assignments_staff_id_fkey
FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;

-- Add index for the FK (improves JOIN performance)
CREATE INDEX IF NOT EXISTS idx_staff_service_assignments_staff_fk
ON staff_service_assignments(staff_id);

-- ============================================
-- FIX 2: Add ON DELETE CASCADE to service_categories.parent_category_id
-- The parent_category_id had a FK but was missing CASCADE behavior
-- This ensures child categories are deleted when parent is deleted
-- ============================================

-- First drop the existing constraint (if it exists)
ALTER TABLE service_categories
DROP CONSTRAINT IF EXISTS service_categories_parent_category_id_fkey;

-- Re-add with ON DELETE CASCADE
ALTER TABLE service_categories
ADD CONSTRAINT service_categories_parent_category_id_fkey
FOREIGN KEY (parent_category_id) REFERENCES service_categories(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT staff_service_assignments_staff_id_fkey ON staff_service_assignments
IS 'Foreign key to staff table with cascade delete - when staff member is deleted, their service assignments are also deleted.';

COMMENT ON CONSTRAINT service_categories_parent_category_id_fkey ON service_categories
IS 'Self-referential FK for category hierarchy with cascade delete - deleting a parent category also deletes all child categories.';
