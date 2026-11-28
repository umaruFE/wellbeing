// node api/db/import-yoga-motions.mjs <baked-directory>
// DB_* environment variables take precedence over api/.env.local and api/.env.
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import nextEnv from '@next/env';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import pg from 'pg';

const apiDir = dirname(dirname(fileURLToPath(import.meta.url)));
const characters = ['poppy', 'edi', 'rolly', 'milo', 'ace'];

async function readCatalog(directory) {
  const base = await realpath(directory);
  const { version, clips } = JSON.parse(await readFile(resolve(base, 'index.json'), 'utf8'));
  if (!Number.isInteger(version) || version < 1 || !Array.isArray(clips) || !clips.length) {
    throw new Error('动作目录为空或缺少版本');
  }
  const perCharacter = new Map(characters.map(key => [key, new Set()]));
  const result = [];
  for (const clip of clips) {
    const { characterId, poseId, filename, durationMs, frameCount } = clip;
    const poses = perCharacter.get(characterId);
    if (!poses || !/^[a-z][a-z0-9-]{0,63}$/.test(poseId) || poses.has(poseId) ||
        !Number.isInteger(durationMs) || durationMs <= 0 ||
        !Number.isInteger(frameCount) || frameCount < 2 || !clip.name?.trim()) {
      throw new Error(`动作条目无效或重复：${characterId}/${poseId}`);
    }
    poses.add(poseId);
    const path = await realpath(resolve(base, filename));
    if (!path.startsWith(base + sep) || !path.endsWith('.svg')) throw new Error('无效的动图文件路径');
    const svg = await readFile(path);
    const text = svg.toString('utf8');
    if (!/<svg\b/.test(text) || /<(?:script|foreignObject)\b|<!DOCTYPE|\son[a-z]+=|(?:href|src)\s*=\s*["'](?!#)/i.test(text)) {
      throw new Error(`动图必须是独立的无脚本 SVG：${filename}`);
    }
    const metadata = Object.fromEntries(['name', 'english', 'pose', 'instruction', 'short', 'teacher', 'category',
      'durationMs', 'frameCount'].filter(key => clip[key] !== undefined).map(key => [key, clip[key]]));
    result.push({
      characterId, poseId, version, metadata, sha256: createHash('sha256').update(svg).digest('hex'),
      gzip: gzipSync(svg, { level: 9 }),
    });
  }
  const signatures = Array.from(perCharacter.values(), poses => [...poses].sort().join('|'));
  if (new Set(signatures).size !== 1) throw new Error('每个角色都应具备整套同名动作');
  return result;
}

async function importCatalog(directory, checkOnly) {
  const assets = await readCatalog(directory);
  if (checkOnly) {
    console.log(`${assets.length} 个动作通过校验，共 ${assets.reduce((sum, asset) => sum + asset.gzip.length, 0)} 字节压缩数据。`);
    return;
  }
  const { combinedEnv: env } = nextEnv.loadEnvConfig(apiDir, process.env.NODE_ENV !== 'production');
  if (!env.DB_HOST || !env.DB_USER || !env.DB_NAME) throw new Error('数据库连接未配置');
  const db = new pg.Client({
    host: env.DB_HOST, port: Number(env.DB_PORT || '5432'), user: env.DB_USER,
    database: env.DB_NAME, password: env.DB_PASSWORD, connectionTimeoutMillis: 10000,
  });
  await db.connect();
  try {
    await db.query('BEGIN');
    await db.query("SELECT pg_advisory_xact_lock(hashtext('wellbeing.yoga_motion_assets'))");
    await db.query(await readFile(resolve(apiDir, 'db/yoga-motion-assets.sql'), 'utf8'));
    for (const [index, asset] of assets.entries()) {
      const { characterId, poseId, sha256, version, metadata, gzip } = asset;
      await db.query(`UPDATE yoga_motion_assets SET is_current = FALSE
        WHERE character_id = $1 AND pose_id = $2 AND sha256 <> $3 AND is_current`,
        [characterId, poseId, sha256]);
      await db.query(`INSERT INTO yoga_motion_assets
        (character_id, pose_id, sha256, catalog_version, sort_order, metadata, svg_gzip)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (character_id, pose_id, sha256) DO UPDATE SET
          catalog_version = EXCLUDED.catalog_version, sort_order = EXCLUDED.sort_order,
          metadata = EXCLUDED.metadata, is_current = TRUE`,
        [characterId, poseId, sha256, version, index, metadata, gzip]);
    }
    await db.query('COMMIT');
    console.log(`${assets.length} 个动作已完整入库，覆盖 ${characters.length} 个角色。`);
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    await db.end();
  }
}

if (!process.argv[2]) {
  console.error('请提供包含 index.json 和 SVG 的动作目录。');
  process.exitCode = 1;
} else {
  try { await importCatalog(process.argv[2], process.argv[3] === '--check'); }
  catch (error) { console.error('动作入库失败：', error.message); process.exitCode = 1; }
}
