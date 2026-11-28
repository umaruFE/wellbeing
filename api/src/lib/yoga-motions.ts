import { db } from '@/lib/db';

export interface YogaMotionRef {
  characterId: string;
  poseId: string;
  url: string;
  frameCount: number;
  durationMs: number;
  name: string;
}

interface YogaMotion extends YogaMotionRef {
  pose: string | null;
  teacher: string;
  sha256: string;
  version: number;
}

export async function readYogaMotions(characterId?: string): Promise<YogaMotion[]> {
  const { rows } = await db.query(`
    SELECT character_id, pose_id, sha256, catalog_version, metadata
    FROM yoga_motion_assets WHERE is_current ${characterId ? 'AND character_id = $1' : ''}
    ORDER BY sort_order, character_id, pose_id
  `, characterId ? [characterId] : []);
  return rows.map(row => ({
    ...row.metadata,
    characterId: row.character_id,
    poseId: row.pose_id,
    version: row.catalog_version,
    sha256: row.sha256,
    url: `/api/yoga-motions/${row.character_id}/${row.pose_id}?v=${row.sha256}`,
  }));
}

// Preserve the independent art/animations on an imported template throughout regeneration.
export function generationParams(parameters: Record<string, any>): Record<string, string> {
  const scalar = Object.fromEntries(Object.entries(parameters)
    .filter(([key, value]) => key !== 'workbenchYoga' && key !== 'useTemplateMotion' && value != null)
    .map(([key, value]) => [key, String(value)]));
  const record = parameters.workbenchYoga;
  const draft = record?.state?.draft;
  if (draft?.templateId) scalar.useTemplateMotion = 'true';
  else scalar.motionCharacterId ||= draft?.settings?.characterId || record?.workspace?.form?.characterId || record?.state?.settings?.characterId || 'poppy';
  return scalar;
}

export async function availableYogaMotions(params: Record<string, string>) {
  if (params.useTemplateMotion === 'true') return [];
  const assets = await readYogaMotions((params.motionCharacterId || 'poppy').trim().toLowerCase());
  if (!assets.some(clip => clip.pose) || !assets.some(clip => clip.poseId === 'guide')) {
    throw new Error('当前角色的动作库暂未就绪，请重新选择角色或稍后重试。');
  }
  return assets;
}

export function pageYogaMotion(
  page: { pose: string | null; subtitle: string; teacherLang: string; action?: string },
  clips: YogaMotion[],
): YogaMotionRef {
  let clip = page.pose ? clips.find(item => item.pose === page.pose) : clips.find(item => item.poseId === 'guide');
  if (clip?.poseId === 'tree' && /脚尖点地|脚趾点地|toe[s]? (?:on|touch)/i.test([page.subtitle, page.teacherLang, page.action].join(' '))) {
    clip = clips.find(item => item.poseId === 'tree-toes') || clip;
  }
  if (!clip) throw new Error('当前角色缺少所选动作，请重新选择体式。');
  const { characterId, poseId, url, name, durationMs, frameCount } = clip;
  return { characterId, poseId, url, name, durationMs, frameCount };
}
