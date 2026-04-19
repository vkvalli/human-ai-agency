CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    preferences JSONB DEFAULT '{}'::jsonb,
    context_type TEXT DEFAULT 'general',
    agency_goal INTEGER DEFAULT 70,
    breach_alert BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS plans (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    session_id UUID,
    task_title TEXT,
    intent_text TEXT,
    must_keep_points JSONB DEFAULT '[]'::jsonb,
    ai_help_scope JSONB DEFAULT '[]'::jsonb,
    human_owned_scope JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(plan_id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    task_type TEXT,
    deadline_active BOOLEAN DEFAULT false
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'plans_session_id_fkey'
    ) THEN
        ALTER TABLE plans
            ADD CONSTRAINT plans_session_id_fkey
            FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE SET NULL;
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS agency_scores (
    score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
    scored_at TIMESTAMPTZ DEFAULT now(),
    agency_score INTEGER,
    agency_band TEXT,
    reliance_risk FLOAT,
    decision_type TEXT,
    components JSONB DEFAULT '{}'::jsonb,
    drivers TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE TABLE IF NOT EXISTS drift_triggers (
    trigger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
    trigger_type TEXT,
    severity TEXT,
    message TEXT,
    cooldown_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_started_at
    ON sessions(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_scores_session_scored_at
    ON agency_scores(session_id, scored_at DESC);

CREATE INDEX IF NOT EXISTS idx_drift_triggers_lookup
    ON drift_triggers(user_id, session_id, trigger_type, cooldown_until DESC);
