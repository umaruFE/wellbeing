export const INTEGRATED_MODULES = Object.freeze({
  song: { entry: 'song.html', title: '歌曲编唱屋', path: '/song-writing', roles: ['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator'] },
  music: { entry: 'music.html', title: '星光音乐棚', path: '/workshop/music-star-quest', roles: ['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator', 'viewer'] },
  yoga: { entry: 'yoga.html', title: '情境瑜伽', path: '/workshop/interactive-yoga', roles: ['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator', 'viewer'] },
  speak: { entry: 'spin-speak-v1/index.html', title: '口语翻翻乐', path: '/workshop/spin-speak', roles: ['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator', 'viewer'] },
  doodle: { entry: 'doodle-guess-v1/index.html', title: '涂鸦游戏', path: '/workshop/doodle', roles: ['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator', 'viewer'] },
  'move-match': { entry: 'move-match-v1/index.html', title: '分类游戏', path: '/workshop/move-match', roles: ['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator', 'viewer'] },
});

export function moduleAtPath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return Object.keys(INTEGRATED_MODULES).find(id => INTEGRATED_MODULES[id].path === path) || null;
}

export function mayOpenModule(id, role) {
  return Object.hasOwn(INTEGRATED_MODULES, id) && INTEGRATED_MODULES[id].roles.includes(role);
}

export function userStorageIdentity(user) {
  return JSON.stringify([String(user?.organizationId ?? user?.organization_id ?? ''), String(user?.id ?? '')]);
}

export async function storageScope(identity) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function setModuleVisible(frame, visible, origin) {
  try {
    const target = frame?.contentWindow;
    if (!target) return;
    target.WBWebModule?.setVisible(visible);
    // The existing song/yoga listeners intentionally only trust their real parent.
    target.postMessage({ type: 'wellbeing:visibility', visible }, origin);
  } catch { /* A failed or navigated frame must not crash its parent page. */ }
}

export async function prepareModuleLeave(frame, timeoutMs = 10000) {
  let timer;
  try {
    const api = frame?.contentWindow?.WBWebModule;
    // An uninitialized or failed page has no editable content to lose.
    if (!api || !api.ready()) return true;
    return await Promise.race([
      Promise.resolve().then(() => api.prepareLeave()).then(result => result === true),
      new Promise(resolve => { timer = setTimeout(() => resolve(false), timeoutMs); }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function moduleFromMessage(event, frames, origin, activeModule, role, returnModule = 'music') {
  if (event.origin !== origin || !activeModule || event.source !== frames[activeModule]?.contentWindow) return null;
  const data = event.data;
  if (!data || Array.isArray(data)) return null;
  const target = data.type === 'wellbeing:return' ? returnModule
    : data.type === 'wellbeing:module' ? (data.module === 'classification' ? 'move-match' : data.module) : null;
  return mayOpenModule(target, role) ? target : null;
}

// Only the active speaking activity can request a manual resume after host pause.
export function isModuleResumeMessage(event, frames, origin, activeModule) {
  return activeModule === 'speak' && event.origin === origin
    && !!frames.speak?.contentWindow && event.source === frames.speak.contentWindow
    && event.data?.type === 'wellbeing:resume' && event.data.module === 'speak';
}
