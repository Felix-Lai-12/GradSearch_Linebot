-- Migration 009: Merge User States & Quotas, and add Chat History

-- 1. Create user_chat_history table
CREATE TABLE IF NOT EXISTS user_chat_history (
    chat_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Expand user_states table
ALTER TABLE user_states
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS chat_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS chat_history_id UUID REFERENCES user_chat_history(chat_history_id) ON DELETE SET NULL;

-- 3. Migrate data from user_quotas to user_states (for users that already exist in user_states)
UPDATE user_states us
SET tier = uq.tier,
    chat_count = uq.chat_count,
    last_reset_date = uq.last_reset_date
FROM user_quotas uq
WHERE us.user_id = uq.user_id;

-- 4. Insert data from user_quotas to user_states (for users that don't exist in user_states)
INSERT INTO user_states (user_id, current_state, tier, chat_count, last_reset_date)
SELECT user_id, 'SEARCH', tier, chat_count, last_reset_date
FROM user_quotas
WHERE user_id NOT IN (SELECT user_id FROM user_states)
ON CONFLICT (user_id) DO NOTHING;
