-- Local PostgreSQL Database Schema for Wellbeing Platform
-- Run this SQL in your local PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  total_hours INTEGER DEFAULT 0,
  used_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (simplified for local PostgreSQL)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'creator',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COURSES
-- =====================================================

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  age_group VARCHAR(50),
  unit VARCHAR(255),
  duration VARCHAR(50),
  theme VARCHAR(255),
  keywords TEXT[],
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course slides table
CREATE TABLE IF NOT EXISTS course_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  title VARCHAR(255),
  content JSONB,
  slide_type VARCHAR(50) DEFAULT 'content',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- KNOWLEDGE BASE - TEXTBOOKS
-- =====================================================

-- Textbook types (人教版, 外研版, etc.)
CREATE TABLE IF NOT EXISTS textbook_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grades
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Textbook units
CREATE TABLE IF NOT EXISTS textbook_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  textbook_type_id UUID REFERENCES textbook_types(id) ON DELETE CASCADE,
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  unit_code VARCHAR(100),
  keywords TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Textbook images (uploaded scanned pages)
CREATE TABLE IF NOT EXISTS textbook_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES textbook_units(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  page_number INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- KNOWLEDGE BASE - PPT IMAGES
-- =====================================================

-- PPT image categories
CREATE TABLE IF NOT EXISTS ppt_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PPT images
CREATE TABLE IF NOT EXISTS ppt_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES ppt_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- KNOWLEDGE BASE - IP CHARACTERS
-- =====================================================

-- IP characters
CREATE TABLE IF NOT EXISTS ip_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(20),
  style VARCHAR(100),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- KNOWLEDGE BASE - VIDEOS
-- =====================================================

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration VARCHAR(50),
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VOICE CONFIGURATIONS
-- =====================================================

-- Voice configurations
CREATE TABLE IF NOT EXISTS voice_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  voice_type VARCHAR(100),
  speed FLOAT DEFAULT 1.0,
  pitch FLOAT DEFAULT 1.0,
  volume FLOAT DEFAULT 1.0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOG
-- =====================================================

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROMPT HISTORY & OPTIMIZATION
-- =====================================================

-- Prompt history table
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  prompt_type VARCHAR(50) NOT NULL,
  original_prompt TEXT NOT NULL,
  generated_result JSONB,
  model_name VARCHAR(100) DEFAULT 'qwen-plus',
  execution_time INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  prompt_id TEXT, -- AI API 返回的任务ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt optimization table
CREATE TABLE IF NOT EXISTS prompt_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  element_type VARCHAR(50) NOT NULL,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  improvement_score INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_course_slides_course_id ON course_slides(course_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_prompt_type ON prompt_history(prompt_type);
CREATE INDEX IF NOT EXISTS idx_prompt_optimizations_element_type ON prompt_optimizations(element_type);
CREATE INDEX IF NOT EXISTS idx_prompt_optimizations_user_id ON prompt_optimizations(user_id);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default grades
INSERT INTO grades (name, display_order)
SELECT '一年级', 1 WHERE NOT EXISTS (SELECT 1 FROM grades WHERE name = '一年级');
INSERT INTO grades (name, display_order)
SELECT '二年级', 2 WHERE NOT EXISTS (SELECT 1 FROM grades WHERE name = '二年级');
INSERT INTO grades (name, display_order)
SELECT '三年级', 3 WHERE NOT EXISTS (SELECT 1 FROM grades WHERE name = '三年级');
INSERT INTO grades (name, display_order)
SELECT '四年级', 4 WHERE NOT EXISTS (SELECT 1 FROM grades WHERE name = '四年级');
INSERT INTO grades (name, display_order)
SELECT '五年级', 5 WHERE NOT EXISTS (SELECT 1 FROM grades WHERE name = '五年级');
INSERT INTO grades (name, display_order)
SELECT '六年级', 6 WHERE NOT EXISTS (SELECT 1 FROM grades WHERE name = '六年级');

-- Insert default textbook types
INSERT INTO textbook_types (name, description)
SELECT '人教版', '人民教育出版社教材' WHERE NOT EXISTS (SELECT 1 FROM textbook_types WHERE name = '人教版');
INSERT INTO textbook_types (name, description)
SELECT '外研版', '外语教学与研究出版社教材' WHERE NOT EXISTS (SELECT 1 FROM textbook_types WHERE name = '外研版');
INSERT INTO textbook_types (name, description)
SELECT '北师大版', '北京师范大学出版社教材' WHERE NOT EXISTS (SELECT 1 FROM textbook_types WHERE name = '北师大版');
INSERT INTO textbook_types (name, description)
SELECT '牛津版', '牛津大学出版社教材' WHERE NOT EXISTS (SELECT 1 FROM textbook_types WHERE name = '牛津版');

-- Insert default PPT categories
INSERT INTO ppt_categories (name, display_order)
SELECT '背景', 1 WHERE NOT EXISTS (SELECT 1 FROM ppt_categories WHERE name = '背景');
INSERT INTO ppt_categories (name, display_order)
SELECT '插画', 2 WHERE NOT EXISTS (SELECT 1 FROM ppt_categories WHERE name = '插画');
INSERT INTO ppt_categories (name, display_order)
SELECT '边框', 3 WHERE NOT EXISTS (SELECT 1 FROM ppt_categories WHERE name = '边框');
INSERT INTO ppt_categories (name, display_order)
SELECT '图标', 4 WHERE NOT EXISTS (SELECT 1 FROM ppt_categories WHERE name = '图标');

-- Insert sample IP characters
INSERT INTO ip_characters (name, gender, style, description)
SELECT '小英老师', '女', '教师', '英语教师形象，友善亲切' WHERE NOT EXISTS (SELECT 1 FROM ip_characters WHERE name = '小英老师');
INSERT INTO ip_characters (name, gender, style, description)
SELECT 'Tommy猫', '动物', '吉祥物', '蓝色卡通猫，活泼可爱' WHERE NOT EXISTS (SELECT 1 FROM ip_characters WHERE name = 'Tommy猫');
INSERT INTO ip_characters (name, gender, style, description)
SELECT 'Lily老师', '女', '教师', '年轻女教师，温柔专业' WHERE NOT EXISTS (SELECT 1 FROM ip_characters WHERE name = 'Lily老师');
INSERT INTO ip_characters (name, gender, style, description)
SELECT 'Sam同学', '男', '学生', '三年级小学生，好奇好学' WHERE NOT EXISTS (SELECT 1 FROM ip_characters WHERE name = 'Sam同学');
INSERT INTO ip_characters (name, gender, style, description)
SELECT 'Kitty兔', '动物', '吉祥物', '粉色小兔子，温馨治愈' WHERE NOT EXISTS (SELECT 1 FROM ip_characters WHERE name = 'Kitty兔');
