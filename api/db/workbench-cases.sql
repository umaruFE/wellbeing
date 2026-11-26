CREATE TABLE IF NOT EXISTS workbench_cases (
  module_id TEXT NOT NULL CHECK (module_id IN ('song', 'music', 'yoga', 'spin-speak', 'doodle', 'move-match')),
  case_id TEXT NOT NULL CHECK (case_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  payload JSONB NOT NULL CHECK (
    jsonb_typeof(payload) = 'object' AND payload ? 'id' AND payload->>'id' = case_id
  ),
  published BOOLEAN NOT NULL DEFAULT TRUE,
  source_user_id UUID,
  source_work_id TEXT,
  CHECK ((source_user_id IS NULL) = (source_work_id IS NULL)),
  PRIMARY KEY (module_id, case_id)
);
