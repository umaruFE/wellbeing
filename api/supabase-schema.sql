-- Supabase Database Schema for Wellbeing Platform
-- Run this SQL in your Supabase SQL Editor
--
-- 注意：如果表已存在，请先删除：
-- DROP TABLE IF EXISTS audit_logs, voice_configs, ip_characters, ppt_images, ppt_categories,
--   textbook_images, textbook_units, grades, textbook_types, course_slides, courses,
--   users, organizations CASCADE;

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

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'creator',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '新用户'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'creator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Drop existing policies first (if any)
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Users can view their own courses" ON courses;
DROP POLICY IF EXISTS "Users can create courses" ON courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
DROP POLICY IF EXISTS "Users can manage voice configs" ON voice_configs;

-- Enable RLS on all tables
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS course_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS textbook_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS textbook_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS textbook_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ppt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ppt_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ip_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS voice_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for published courses
CREATE POLICY "Public courses are viewable by everyone"
  ON courses FOR SELECT
  USING (is_public = true);

-- Users can see their own courses
CREATE POLICY "Users can view their own courses"
  ON courses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create courses
CREATE POLICY "Users can create courses"
  ON courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own courses
CREATE POLICY "Users can update their own courses"
  ON courses FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can manage their own voice configs
CREATE POLICY "Users can manage voice configs"
  ON voice_configs FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA - 示例数据
-- =====================================================

-- Insert default grades (如果不存在)
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

-- Insert default textbook types (如果不存在)
INSERT INTO textbook_types (name, description)
SELECT '人教版', '人民教育出版社教材' WHERE NOT EXISTS (SELECT 1 FROM textbook_types WHERE name = '人教版');
INSERT INTO textbook_types (name, description)
SELECT '外研版', '外语教学与研究出版社教材' WHERE NOT EXISTS (SELECT 1 FROM textbook_types WHERE name = '外研版');
INSERT INTO textbook_types (name, description)
SELECT '北师大版', '北京师范大学出版社教材' WHERE NOT EXISTS (SELECT 1 FROM textbook_types WHERE name = '北师大版');
INSERT INTO textbook_types (name, description)
SELECT '牛津版', '牛津大学出版社教材' WHERE NOT EXISTS (SELECT 1 FROM textbook_types WHERE name = '牛津版');

-- Insert default PPT categories (如果不存在)
INSERT INTO ppt_categories (name, display_order)
SELECT '背景', 1 WHERE NOT EXISTS (SELECT 1 FROM ppt_categories WHERE name = '背景');
INSERT INTO ppt_categories (name, display_order)
SELECT '插画', 2 WHERE NOT EXISTS (SELECT 1 FROM ppt_categories WHERE name = '插画');
INSERT INTO ppt_categories (name, display_order)
SELECT '边框', 3 WHERE NOT EXISTS (SELECT 1 FROM ppt_categories WHERE name = '边框');
INSERT INTO ppt_categories (name, display_order)
SELECT '图标', 4 WHERE NOT EXISTS (SELECT 1 FROM ppt_categories WHERE name = '图标');

-- Insert sample IP characters (如果不存在)
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

-- =====================================================
-- DEBUG: 查询验证
-- =====================================================

SELECT 'Grades count: ' || COUNT(*)::text as grades_count FROM grades;
SELECT 'Textbook types count: ' || COUNT(*)::text as textbook_types_count FROM textbook_types;
SELECT 'PPT categories count: ' || COUNT(*)::text as ppt_categories_count FROM ppt_categories;
SELECT 'IP characters count: ' || COUNT(*)::text as ip_characters_count FROM ip_characters;
