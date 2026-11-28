CREATE TABLE IF NOT EXISTS yoga_motion_assets (
  character_id TEXT NOT NULL CHECK (character_id ~ '^[a-z][a-z0-9-]{0,63}$'),
  pose_id TEXT NOT NULL CHECK (pose_id ~ '^[a-z][a-z0-9-]{0,63}$'),
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  catalog_version INTEGER NOT NULL CHECK (catalog_version > 0),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  metadata JSONB NOT NULL CHECK (jsonb_typeof(metadata) = 'object'),
  svg_gzip BYTEA NOT NULL CHECK (octet_length(svg_gzip) > 0),
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (character_id, pose_id, sha256)
);
CREATE UNIQUE INDEX IF NOT EXISTS yoga_motion_assets_current
  ON yoga_motion_assets (character_id, pose_id) WHERE is_current;
