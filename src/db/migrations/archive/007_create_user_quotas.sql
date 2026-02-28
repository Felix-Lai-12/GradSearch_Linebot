-- Create user_quotas table to track AI chat usage
CREATE TABLE IF NOT EXISTS user_quotas (
    user_id TEXT PRIMARY KEY,
    tier TEXT DEFAULT 'free',
    chat_count INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);
