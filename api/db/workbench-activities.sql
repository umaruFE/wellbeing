CREATE TABLE IF NOT EXISTS workbench_activities (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_key TEXT NOT NULL,
  module_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  write_id UUID NOT NULL,
  snapshot JSONB NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  PRIMARY KEY (user_id, organization_key, module_id)
);

ALTER TABLE workbench_activities
  DROP CONSTRAINT IF EXISTS workbench_activities_module_id_check,
  ADD CONSTRAINT workbench_activities_module_id_check CHECK (module_id IN ('move-match', 'spin-speak', 'doodle'));
