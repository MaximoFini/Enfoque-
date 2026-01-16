-- Enfoque App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Users can view system categories" ON public.categories
  FOR SELECT USING (is_system = TRUE);

CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  due_date DATE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TIME_BLOCKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.time_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  date DATE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

-- Policies for time_blocks
CREATE POLICY "Users can view own time blocks" ON public.time_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time blocks" ON public.time_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time blocks" ON public.time_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time blocks" ON public.time_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TIME_LOGS TABLE (Timer & Manual Logging)
-- ============================================
CREATE TYPE work_type AS ENUM ('deep', 'shallow');

CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  work_type work_type NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Policies for time_logs
CREATE POLICY "Users can view own time logs" ON public.time_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time logs" ON public.time_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time logs" ON public.time_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time logs" ON public.time_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- WEEKLY_GOALS TABLE (Metas semanales por categoría)
-- ============================================
CREATE TABLE IF NOT EXISTS public.weekly_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  target_hours NUMERIC(5,2) NOT NULL CHECK (target_hours > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Enable RLS
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

-- Policies for weekly_goals
CREATE POLICY "Users can view own weekly goals" ON public.weekly_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly goals" ON public.weekly_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly goals" ON public.weekly_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly goals" ON public.weekly_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for weekly_goals updated_at
CREATE TRIGGER update_weekly_goals_updated_at
  BEFORE UPDATE ON public.weekly_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SEED SYSTEM CATEGORIES
-- ============================================

-- Main categories
INSERT INTO public.categories (name, emoji, color, is_system) VALUES
  ('Facultad', '🎓', '#3b82f6', TRUE),
  ('KEI', '🚀', '#8b5cf6', TRUE),
  ('Gym', '💪', '#22c55e', TRUE),
  ('Social', '🤝', '#eab308', TRUE),
  ('Scroll', '📱', '#ef4444', TRUE),
  ('Sueño', '💤', '#6366f1', TRUE),
  ('Proyectos Varios', '🎯', '#f97316', TRUE)
ON CONFLICT DO NOTHING;

-- Facultad subcategories
INSERT INTO public.categories (name, emoji, parent_id, is_system)
SELECT sub.name, '📚', c.id, TRUE
FROM (VALUES 
  ('DSI'), ('BD'), ('COM'), ('AN'), 
  ('Inglés 2'), ('AM1'), ('ECO'), ('DSW')
) AS sub(name)
CROSS JOIN public.categories c
WHERE c.name = 'Facultad' AND c.is_system = TRUE
ON CONFLICT DO NOTHING;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tasks updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
