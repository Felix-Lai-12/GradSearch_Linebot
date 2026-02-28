-- Create user_states table to track if user is in AI chat mode
CREATE TABLE IF NOT EXISTS user_states (
    user_id TEXT PRIMARY KEY,
    current_state TEXT DEFAULT 'SEARCH',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
