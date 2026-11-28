CREATE TABLE IF NOT EXISTS lesson_step_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  course_ref TEXT NOT NULL,
  phase_key TEXT NOT NULL CHECK (phase_key IN ('eng', 'emp', 'exc', 'elv')),
  step JSONB NOT NULL CHECK (jsonb_typeof(step) = 'object'),
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
