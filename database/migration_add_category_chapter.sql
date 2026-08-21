-- ============================================================
-- WolloShare Migration: Add category & chapter to resources
-- Category: course_material | assignment | past_exam
-- Chapter: student-entered text field (e.g., "Chapter 5", "Unit 3")
-- ============================================================

USE wolloshare;

ALTER TABLE resources
  ADD COLUMN category ENUM('course_material', 'assignment', 'past_exam') NOT NULL DEFAULT 'course_material' AFTER resource_type_id,
  ADD COLUMN chapter VARCHAR(100) NULL AFTER category,
  ADD INDEX idx_resources_category (category),
  ADD INDEX idx_resources_chapter (chapter);
