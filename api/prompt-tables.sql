-- Add tables for prompt history and optimization

-- Prompt history table
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  prompt_type VARCHAR(50) NOT NULL, -- course, activity, script, etc.
  original_prompt TEXT NOT NULL,
  generated_result JSONB,
  model_name VARCHAR(100) DEFAULT 'qwen-plus',
  execution_time INTEGER, -- in milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt optimization table
CREATE TABLE IF NOT EXISTS prompt_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  element_type VARCHAR(50) NOT NULL, -- image, script, activity, etc.
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  improvement_score INTEGER DEFAULT 0, -- 1-10
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_prompt_type ON prompt_history(prompt_type);
CREATE INDEX IF NOT EXISTS idx_prompt_optimizations_element_type ON prompt_optimizations(element_type);
CREATE INDEX IF NOT EXISTS idx_prompt_optimizations_user_id ON prompt_optimizations(user_id);

-- Enable RLS for both tables
ALTER TABLE IF EXISTS prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prompt_optimizations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own prompt history" ON prompt_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create prompt history" ON prompt_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own prompt optimizations" ON prompt_optimizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create prompt optimizations" ON prompt_optimizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prompt optimizations" ON prompt_optimizations FOR UPDATE USING (auth.uid() = user_id);

-- Function to update last_used_at and usage_count
CREATE OR REPLACE FUNCTION public.update_prompt_usage(p_optimization_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE prompt_optimizations
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = p_optimization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
