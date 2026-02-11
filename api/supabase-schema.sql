-- Supabase Database Schema for Wellbeing Platform
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  total_hours INTEGER DEFAULT 0,
  used_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- COURSES
-- =====================================================

-- Courses table
CREATE TABLE courses (
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
CREATE TABLE course_slides (
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
CREATE TABLE textbook_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grades
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Textbook units
CREATE TABLE textbook_units (
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
CREATE TABLE textbook_images (
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
CREATE TABLE ppt_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PPT images
CREATE TABLE ppt_images (
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
CREATE TABLE ip_characters (
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
CREATE TABLE voice_configs (
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

CREATE TABLE audit_logs (
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

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE textbook_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE textbook_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE textbook_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppt_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

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
-- SEED DATA
-- =====================================================

-- Insert default grades
INSERT INTO grades (name, display_order) VALUES
  ('一年级', 1),
  ('二年级', 2),
  ('三年级', 3),
  ('四年级', 4),
  ('五年级', 5),
  ('六年级', 6);

-- Insert default textbook types
INSERT INTO textbook_types (name, description) VALUES
  ('人教版', '人民教育出版社教材'),
  ('外研版', '外语教学与研究出版社教材'),
  ('北师大版', '北京师范大学出版社教材'),
  ('牛津版', '牛津大学出版社教材');

-- Insert default PPT categories
INSERT INTO ppt_categories (name, display_order) VALUES
  ('背景', 1),
  ('插画', 2),
  ('边框', 3),
  ('图标', 4);

-- Insert sample IP characters
INSERT INTO ip_characters (name, gender, style, description) VALUES
  ('小英老师', '女', '教师', '英语教师形象，友善亲切'),
  ('Tommy猫', '动物', '吉祥物', '蓝色卡通猫，活泼可爱'),
  ('Lily老师', '女', '教师', '年轻女教师，温柔专业'),
  ('Sam同学', '男', '学生', '三年级小学生，好奇好学'),
  ('Kitty兔', '动物', '吉祥物', '粉色小兔子，温馨治愈');

