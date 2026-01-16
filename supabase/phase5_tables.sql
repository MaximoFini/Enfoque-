-- Phase 5 Tables for Enfoque App

-- Daily Logs (for 22:00 popup)
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
    what_worked TEXT,
    what_to_improve TEXT,
    social_media_minutes INTEGER DEFAULT 0,
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, log_date)
);

-- Weekly Retrospectives (for Sunday 17:00 popup)
CREATE TABLE IF NOT EXISTS weekly_retrospectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL, -- Monday of the week
    -- Auto-filled fields (calculated from data)
    total_hours DECIMAL(6,2),
    deep_hours DECIMAL(6,2),
    shallow_hours DECIMAL(6,2),
    tasks_completed INTEGER,
    most_productive_day TEXT,
    top_category TEXT,
    -- Manual fields
    wins TEXT, -- What went well
    challenges TEXT, -- What was challenging
    learnings TEXT, -- Key learnings
    next_week_focus TEXT, -- Focus for next week
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, week_start)
);

-- User XP and Levels
CREATE TABLE IF NOT EXISTS user_xp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    category VARCHAR(50) -- streaks, productivity, social, etc.
);

-- User Achievements (unlocked)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- Interruptions Tracker
CREATE TABLE IF NOT EXISTS interruptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_at TIMESTAMPTZ DEFAULT now(),
    session_id UUID, -- optional link to time_log
    estimated_lost_minutes INTEGER DEFAULT 5
);

-- Context Switches Tracker
CREATE TABLE IF NOT EXISTS context_switches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    switched_at TIMESTAMPTZ DEFAULT now(),
    from_category_id UUID REFERENCES categories(id),
    to_category_id UUID REFERENCES categories(id),
    note TEXT
);

-- Row Level Security
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_retrospectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE interruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_switches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- RLS Policies
DROP POLICY IF EXISTS "Users can CRUD their own daily logs" ON daily_logs;
CREATE POLICY "Users can CRUD their own daily logs" ON daily_logs
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD their own weekly retrospectives" ON weekly_retrospectives;
CREATE POLICY "Users can CRUD their own weekly retrospectives" ON weekly_retrospectives
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD their own XP" ON user_xp;
CREATE POLICY "Users can CRUD their own XP" ON user_xp
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all achievements" ON achievements;
CREATE POLICY "Users can view all achievements" ON achievements
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can CRUD their own unlocked achievements" ON user_achievements;
CREATE POLICY "Users can CRUD their own unlocked achievements" ON user_achievements
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD their own interruptions" ON interruptions;
CREATE POLICY "Users can CRUD their own interruptions" ON interruptions
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD their own context switches" ON context_switches;
CREATE POLICY "Users can CRUD their own context switches" ON context_switches
    FOR ALL USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO achievements (code, name, description, emoji, xp_reward, category) VALUES
('first_hour', 'Primera Hora', 'Completa tu primera hora de trabajo enfocado', '🎯', 50, 'milestones'),
('first_task', 'Primera Tarea', 'Completa tu primera tarea', '✅', 25, 'milestones'),
('streak_3', 'En Racha', 'Mantén una racha de 3 días consecutivos', '🔥', 100, 'streaks'),
('streak_7', 'Semana Perfecta', 'Mantén una racha de 7 días consecutivos', '⭐', 250, 'streaks'),
('streak_30', 'Mes Imparable', 'Mantén una racha de 30 días consecutivos', '🏆', 1000, 'streaks'),
('deep_work_10', 'Deep Worker', 'Acumula 10 horas de Deep Work', '🧠', 200, 'productivity'),
('deep_work_50', 'Maestro del Enfoque', 'Acumula 50 horas de Deep Work', '💎', 500, 'productivity'),
('deep_work_100', 'Leyenda del Deep Work', 'Acumula 100 horas de Deep Work', '👑', 1000, 'productivity'),
('early_bird', 'Madrugador', 'Completa una sesión antes de las 7am', '🌅', 75, 'habits'),
('night_owl', 'Búho Nocturno', 'Completa una sesión después de las 22:00', '🦉', 75, 'habits'),
('pomodoro_master', 'Maestro Pomodoro', 'Completa 100 pomodoros', '🍅', 300, 'productivity'),
('perfect_day', 'Día Perfecto', 'Cumple todas tus metas diarias', '💯', 150, 'productivity'),
('weekly_retro', 'Reflexivo', 'Completa tu primera retrospectiva semanal', '📝', 100, 'habits'),
('level_10', 'Nivel 10', 'Alcanza el nivel 10', '🔟', 500, 'milestones'),
('level_25', 'Nivel 25', 'Alcanza el nivel 25', '🥈', 1000, 'milestones'),
('level_50', 'Nivel 50', 'Alcanza el nivel 50 - Máximo nivel', '🥇', 2500, 'milestones')
ON CONFLICT (code) DO NOTHING;
