-- Email Agent - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY DEFAULT 'anonymous',
  user_name TEXT DEFAULT 'User',
  backend_url TEXT DEFAULT 'http://localhost:8000',
  font_size TEXT DEFAULT 'medium',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for anonymous access
-- Note: For production, replace with proper authentication policies

-- Conversations policies
CREATE POLICY IF NOT EXISTS "Allow anonymous access to conversations"
  ON conversations FOR ALL
  USING (user_id = 'anonymous');

-- Messages policies  
CREATE POLICY IF NOT EXISTS "Allow anonymous access to messages"
  ON messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = 'anonymous'
    )
  );

-- User settings policies
CREATE POLICY IF NOT EXISTS "Allow anonymous access to settings"
  ON user_settings FOR ALL
  USING (user_id = 'anonymous');

-- 7. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for auto-updating timestamps
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Setup complete!
-- You can now use the Email Agent with Supabase storage.
