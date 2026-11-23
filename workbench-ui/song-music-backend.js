(function (root) {
  'use strict';

  const musicModule = 'music-star-quest';
  const clone = value => JSON.parse(JSON.stringify(value));
  const list = value => Array.isArray(value) ? value : [];
  const clean = value => typeof value === 'string' ? value.trim() : '';
  const plainLines = values => list(values).map(line => clean(line?.text ?? line)).filter(Boolean);
  function resourceUrl(value) {
    if (typeof value !== 'string' || !/^(https?:\/\/|\/(?!\/))[^\s<>"']+$/i.test(value)) return '';
    if (!value.startsWith('/')) {
      const url = new URL(value);
      if (url.pathname === '/api/media/music') return url.pathname + url.search;
    }
    return value;
  }
  const validRemoteId = value => /^\d+$/.test(String(value)) ? String(value) : '';

  function createCollection(kind, key, convert, onStatus) {
    const api = root.WBWorkbenchApi;
    if (!api || api.offline) return null;
    const song = kind === 'song';
    const base = song ? '/api/song-writing-works' : '/api/creative-works';
    const listUrl = song ? base : `${base}?moduleId=${musicModule}`;
    const marker = `${key}:pending-server`;
    const idFor = draft => song ? draft.id : draft.activityId;
    const rows = new Map();
    const known = new Set();
    let ids = new Map();
    let pending = new Set();
    let sync;
    let failure = '';
    try {
      const saved = JSON.parse(localStorage.getItem(marker) || '{}');
      ids = new Map(list(saved.ids));
      pending = new Set(list(saved.pending));
    } catch { /* the stored activity itself remains readable */ }

    function remember() {
      localStorage.setItem(marker, JSON.stringify({ ids: [...ids], pending: [...pending] }));
    }

    function rowId(row) {
      if (!validRemoteId(row.id)) return '';
      return song ? row.work_data?.workbench?.id || `server-song-${row.id}`
        : row.parameters?.workbench?.activityId || `server-music-${row.id}`;
    }

    async function getRows() {
      const result = await api.request(listUrl, { timeout: 20000 });
      if (!Array.isArray(result.data)) throw Error('后台返回的活动列表无效。');
      return result.data.filter(row => !row.parameters?.workbenchMusicCandidate);
    }

    async function load(local) {
      const server = await getRows();
      const active = new Set();
      const localById = new Map(local.map(item => [idFor(item), item]));
      const remote = [];
      for (const row of server) {
        const id = rowId(row);
        if (!id) continue;
        active.add(id);
        known.add(id);
        rows.set(id, row);
        ids.set(id, String(row.id));
        if (pending.has(id) && localById.has(id)) remote.push(localById.get(id));
        else {
          // Older music works only include summary fields in the list.
          const detail = !song && !row.parameters?.workbench && row.lyric_count
            ? (await api.request(`${base}/${row.id}`, { timeout: 45000 })).data : row;
          const value = convert(detail, id);
          if (value) remote.push(value);
        }
      }
      const merged = remote.concat(local.filter(item => !active.has(idFor(item)) && (!ids.has(idFor(item)) || pending.has(idFor(item)))));
      remember();
      return merged;
    }

    async function save(draft) {
      const id = idFor(draft);
      let remoteId = ids.get(id);
      let row = rows.get(id);
      if (!remoteId) {
        // A lost POST response can be recovered by its stable workbench ID.
        row = (await getRows()).find(candidate => rowId(candidate) === id);
        if (row) remoteId = String(row.id);
      }
      if (remoteId && !row) {
        row = (await getRows()).find(candidate => String(candidate.id) === remoteId);
        if (!row && known.has(id)) throw Error('后台活动已被删除。请保留当前内容并另存。');
      }
      const body = song ? songWork(draft, row?.work_data, row?.cover_url) : musicWork(draft);
      if (song) {
        row = (await api.request(remoteId ? `${base}/${remoteId}` : base, {
          method: remoteId ? 'PUT' : 'POST', body, timeout: 30000,
        })).data;
      } else {
        if (!remoteId) {
          row = (await api.request(base, { method: 'POST', body: {
            moduleId: musicModule, moduleName: '星光录音棚', title: body.title, parameters: body.parameters,
          }, timeout: 30000 })).data;
          remoteId = validRemoteId(row?.id);
          if (!remoteId) throw Error('后台未返回已创建的活动编号。');
          rows.set(id, row);
          ids.set(id, remoteId);
          remember();
        }
        if (body.song || row?.title !== body.title || row?.parameters?.workbench !== body.parameters.workbench) {
          row = (await api.request(`${base}/${remoteId}`, { method: 'PUT', body, timeout: 30000 })).data;
        }
      }
      const updatedId = validRemoteId(row?.id);
      if (!updatedId) throw Error('后台未确认活动已保存。');
      rows.set(id, row);
      ids.set(id, updatedId);
      known.add(id);
      remember();
      return updatedId;
    }

    function queue(draft) {
      pending.add(idFor(draft));
      remember();
      failure = '';
      onStatus();
    }

    function flush(readDraft) {
      if (sync) return sync;
      sync = Promise.resolve().then(async () => {
        while (pending.size) {
          const id = pending.values().next().value;
          const draft = readDraft(id);
          if (!draft) { pending.delete(id); remember(); continue; }
          const signature = JSON.stringify(draft);
          await save(draft);
          if (signature === JSON.stringify(readDraft(id))) pending.delete(id);
          remember();
        }
        failure = '';
        return true;
      }).catch(error => {
        failure = error.message || '活动未同步后台，请重试。';
        return false;
      }).finally(() => { sync = null; onStatus(); });
      return sync;
    }

    async function remove(draft) {
      const id = idFor(draft);
      const remoteId = ids.get(id);
      if (remoteId) await api.request(`${base}/${remoteId}`, { method: 'DELETE', timeout: 20000 });
      pending.delete(id);
      known.delete(id);
      rows.delete(id);
      ids.delete(id);
      remember();
    }

    async function idForDraft(draft) {
      await sync;
      if (ids.has(idFor(draft))) return ids.get(idFor(draft));
      return save(draft);
    }

    return { load, queue, flush, remove, idForDraft, get pending() { return pending.size > 0; }, get error() { return failure; } };
  }

  function songInput(draft, model) {
    const settings = draft.settings || {};
    const melody = model.melodies.find(m => m.id === draft.melodyId);
    return {
      age: settings.age, level: settings.level, participants: settings.participants,
      themes: settings.theme ? [settings.theme] : [], vocabulary: list(settings.vocabulary).join('，'),
      grammar: model.languageGoals(settings).join('；'), melody: melody?.melodyType || melody?.title || '',
    };
  }

  function songWork(draft, existing = {}, cover) {
    const model = root.SongModel;
    const data = songInput(draft, model);
    const words = draft.words.map(item => item.text);
    return {
      title: model.songTitle(draft), coverUrl: cover || existing.coverUrl || '',
      workData: {
        ...existing, title: model.songTitle(draft), workbench: clone(draft),
        form: { ...existing.form, ...data, melody: draft.melodyId },
        draft: { ...existing.draft, title: model.songTitle(draft), melody: draft.melodyId, words,
          lines: draft.lines.map(item => item.text.replace(/____/g, '______')),
          ...(draft.teachingPlan ? { activityPlan: draft.teachingPlan } : {}) },
        arrangement: Object.fromEntries(draft.lines.map((line, index) => [index, line.instruments])),
      },
    };
  }

  function applySongResult(model, draft, value) {
    const title = clean(value?.title);
    const lines = plainLines(value?.lines);
    if (!title || !lines.length) throw Error('后台未返回歌曲名称和歌词。');
    const next = model.setSongLines({ ...model.clone(draft), words: [] }, lines.map(text => ({ text })));
    next.songTitle = title.slice(0, 80);
    for (const text of [...new Set(list(value.words).map(word => clean(word?.text ?? word)).filter(Boolean))]) {
      const emoji = clean(value.wordEmojis?.[text]);
      next.words.push({ id: model.uid('word'), text, image: emoji && emoji.length <= 30 ? { kind: 'emoji', value: emoji } : null });
    }
    for (const line of next.lines) for (const blank of line.blanks) blank.wordIds = next.words.map(word => word.id);
    if (value.activityPlan) next.teachingPlan = value.activityPlan;
    return next;
  }

  function hydrateSong(model, row, id) {
    const work = row.work_data || {};
    if (work.workbench?.id === id) return work.workbench;
    const value = work.draft || {};
    const form = work.form || {};
    const split = input => Array.isArray(input) ? input : clean(input).split(/[、，,；;\n]+/).map(clean).filter(Boolean);
    let draft = model.emptyDraft();
    draft.id = id;
    draft.title = clean(row.title) || draft.title;
    draft.savedAt = row.updated_at;
    draft.createdAt = row.created_at;
    draft = model.updateSettings(draft, {
      age: form.age || draft.settings.age, level: form.level || draft.settings.level,
      participants: form.participants || draft.settings.participants, theme: form.themes?.[0] || form.themeOther || '',
      vocabulary: split(form.vocabulary), patterns: split(form.grammar),
    });
    if (model.melodies.some(melody => melody.id === form.melody)) draft.melodyId = form.melody;
    if (plainLines(value.lines).length) draft = applySongResult(model, draft, { ...value, title: value.title || draft.title });
    for (const [index, line] of draft.lines.entries()) {
      line.instruments = list(work.arrangement?.[index]).map(item => item.id || item)
        .filter(item => model.instruments.some(instrument => instrument.id === item));
    }
    return draft;
  }

  async function composeSong(model, draft, signal) {
    const result = await root.WBWorkbenchApi.request('/api/ai/generate-song-writing', {
      method: 'POST', body: songInput(draft, model), signal,
    });
    return applySongResult(model, draft, result.data);
  }

  async function rewriteSong(model, draft, candidate, signal) {
    const body = { ...songInput(draft, model), adjustmentRequest: candidate.prompt || '重新生成歌词',
      currentLines: draft.lines.map(line => line.text.replace(/____/g, '______')),
      currentWords: draft.words.map(word => word.text),
    };
    const single = candidate.scope === 'line';
    const index = draft.lines.findIndex(line => line.id === candidate.lines[0]?.lineId);
    const result = await root.WBWorkbenchApi.request(`/api/ai/generate-song-writing${single ? '-line' : ''}`, {
      method: 'POST', signal,
      body: single ? { ...body, lines: body.currentLines, regenerateIndex: index } : body,
    });
    const after = single ? [clean(result.data?.line)] : plainLines(result.data?.lines);
    if (after.length !== candidate.lines.length || after.some(line => !line)) throw Error('后台返回的歌词行数不一致，请重试。');
    return { ...candidate, demo: false, manual: false, partial: false,
      lines: candidate.lines.map((line, i) => ({ ...line, after: after[i].replace(/_{5,}/g, '____') })) };
  }

  function musicParameters(draft, conditions = draft.creationConditions || draft.creationDraft || {}) {
    const goals = list(conditions.languageGoals).map(goal => goal?.value || goal?.text || goal).join('；');
    return { title: draft.activityName || draft.title || '未命名活动', theme: conditions.theme || '', age: conditions.age || '',
      level: conditions.level || '', goals, duration: conditions.duration || '', style: conditions.style || '',
      scene: conditions.scene || '', language: conditions.language || 'en' };
  }

  function musicWork(draft) {
    return {
      title: draft.activityName || draft.title || '未命名活动',
      parameters: { ...musicParameters(draft), workbench: clone(draft) },
      ...(draft.song ? { song: { songMeta: { ...musicParameters(draft), title: draft.title },
        lyrics: draft.lines.map((row, index) => ({ text: row.text, time: String(row.time), start: row.time,
          end: row.end || draft.lines[index + 1]?.time || draft.media?.duration, url: row.audio?.src })),
        targetPatterns: list(draft.creationConditions?.languageGoals).map(goal => goal?.value || goal?.text || goal) },
        ...(draft.backendAudio ? { audio: draft.backendAudio } : {}),
      } : {}),
    };
  }

  function musicDraft(model, old, id, title, lyrics, audio = {}) {
    function timestamp(value) {
      if (value === undefined || value === null || value === '') return null;
      const match = /^(\d{1,2}):(\d{2})(\.\d+)?$/.exec(String(value));
      if (match) return Number(match[1]) * 60 + Number(match[2] + (match[3] || ''));
      return Number.isFinite(Number(value)) ? Number(value) : null;
    }
    const clipLines = list(lyrics).map((line, index) => {
      const [start, stop] = String(line?.time ?? '').split(/\s*[–—-]\s*/);
      const end = timestamp(line?.end ?? stop);
      return { text: clean(line?.text), time: timestamp(line?.start ?? start) ?? index * 6,
        ...(end !== null ? { end } : {}),
        ...(resourceUrl(line?.url) ? { audio: { kind: 'song-vocal', src: resourceUrl(line.url) } } : {}) };
    }).filter(line => line.text);
    if (!clipLines.length) return null;
    const base = model.createDraft('sunny');
    const duration = Math.max(Number(audio.actualDuration) || 0, clipLines.at(-1).end || 0, clipLines.at(-1).time + 0.1);
    const vocal = resourceUrl(audio.url || audio.vocal);
    const backing = resourceUrl(audio.backingUrl || audio.backing);
    const media = { duration, ...(vocal ? { vocal: { src: vocal, kind: 'song-vocal' } } : {}),
      ...(backing ? { backing: { src: backing, kind: 'song-backing' } } : {}) };
    const next = { ...base, activityId: id, song: `backend-${id}`, title: clean(title) || 'New Song', lines: clipLines,
      media, masks: [], placements: clipLines.map(() => ({ actions: [], instruments: [] })),
      groups: clipLines.map(() => ['all']), questions: [{ id: 'order-1', type: 'order', line: 0 }],
      ...(old ? { stage: old.stage, mode: old.mode, selectedStages: old.selectedStages } : {}) };
    return model.upgradeDraft(next);
  }

  function hydrateMusic(model, row, id) {
    if (row.parameters?.workbench?.activityId === id) return row.parameters.workbench;
    const result = row.result || {};
    const data = { ...model.createDraft(), activityId: id, song: null, lines: [], questions: [], masks: [], placements: [], groups: [] };
    const next = musicDraft(model, null, id, result.title || row.title, result.lyrics, result.audio) || data;
    if (next.song) {
      const comparable = text => clean(text).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '');
      const locate = value => value ? next.lines.findIndex(line => comparable(line.text) === comparable(value)) : -1;
      const questions = [];
      for (const [index, item] of list(result.ex1FillData).entries()) {
        const answer = clean(item.blanks?.[0]);
        const line = locate(list(item.sentence).map(part => part || answer).join(' ').replace(/\s+([.,!?])/g, '$1'));
        if (line < 0 || !answer || !list(item.options).includes(answer)) continue;
        const word = next.lines[line].text.split(/\s+/).findIndex(text => comparable(text) === comparable(answer));
        if (word < 0) continue;
        const options = item.options.map((text, at) => ({ id: `choice-${at}`, text }));
        const src = resourceUrl(item.imageUrl);
        questions.push({ id: `fill-${index}`, type: 'blank', line, word, options,
          correct: options.find(choice => choice.text === answer).id,
          ...(src ? { hint: { kind: 'image', src, name: answer } } : item.emoji ? { hint: { kind: 'emoji', value: item.emoji, name: answer } } : {}) });
      }
      for (const [index, item] of list(result.ex2Items).entries()) {
        const line = locate(item.answer);
        if (line >= 0) questions.push({ id: `order-${index}`, type: 'order', line });
      }
      for (const [index, item] of list(result.ex3Data).entries()) {
        const answer = item.options?.[item.correct];
        const line = locate(answer);
        if (line >= 0) questions.push({ id: `listen-${index}`, type: 'listen', line,
          lyricSource: next.lines[line].text, audio: { kind: 'song-vocal', line },
          options: item.options.map((text, at) => ({ id: `choice-${at}`, text })), correct: `choice-${item.correct}` });
      }
      if (questions.length) next.questions = questions;
      if (result.audio) next.backendAudio = result.audio;
    }
    return { ...next, activityName: row.title, savedAt: row.updated_at, savedView: next.song ? 'edit' : 'song' };
  }

  async function songLibrary() {
    const response = await root.WBWorkbenchApi.request('/api/song-library', { timeout: 20000 });
    if (!Array.isArray(response.data)) throw Error('后台曲库数据无效。');
    return response.data;
  }

  const sourceTracks = new Map();
  const songAudioSource = (id, mode) => sourceTracks.get(id)?.[mode];
  async function loadMelodies(model, audio) {
    const entries = await songLibrary();
    for (const item of entries) {
      const melody = model.melodies.find(entry => entry.title === item.melody_type);
      if (!melody || sourceTracks.has(melody.id)) continue;
      const vocal = resourceUrl(item.vocal_url), accompaniment = resourceUrl(item.instrumental_url);
      if (!vocal && !accompaniment) continue;
      sourceTracks.set(melody.id, { vocal, accompaniment, duration: melody.duration });
    }
    const duration = audio.duration;
    const lineRange = audio.lineRange;
    audio.duration = id => sourceTracks.get(id)?.duration || duration(id);
    audio.lineRange = (id, index, count) => {
      if (!sourceTracks.has(id)) return lineRange(id, index, count);
      const total = audio.duration(id);
      return total && count > 0 && index >= 0 && index < count ? { start: total * index / count, end: total * (index + 1) / count } : null;
    };
  }

  function audioPlayer(base, options, mode) {
    const fallback = base.createPlayer(options);
    let element, currentId = 'twinkle', activeSource = '', status = 'idle', range, seekTo = 0, rate = 1, volume = .35;
    const state = () => activeSource ? { state: status, id: currentId, position: element.currentTime,
      duration: Number.isFinite(element.duration) ? element.duration : base.duration(currentId), rate, volume, range } : fallback.getState();
    const notify = () => options.onTime?.(state().position, state().duration);
    const setStatus = value => { status = value; options.onStatus?.(value); };

    function player() {
      if (element) return element;
      element = new Audio();
      element.preload = 'metadata';
      element.addEventListener('loadedmetadata', () => {
        if (!activeSource) return;
        if (Number.isFinite(element.duration) && sourceTracks.has(currentId)) sourceTracks.get(currentId).duration = element.duration;
        element.currentTime = Math.min(seekTo, element.duration || seekTo);
        notify();
      });
      element.addEventListener('timeupdate', () => {
        if (!activeSource) return;
        if (range && element.currentTime >= range.end) { element.pause(); setStatus('ended'); }
        notify();
      });
      element.addEventListener('ended', () => setStatus('ended'));
      return element;
    }

    function stop() {
      if (!activeSource) { fallback.stop(); return; }
      element.pause();
      if (element.readyState) element.currentTime = 0;
      seekTo = 0;
      range = null;
      setStatus('idle');
      notify();
    }

    async function play(id = currentId, segment) {
      const source = songAudioSource(id, mode());
      if (!source) {
        if (activeSource) { element.pause(); activeSource = ''; }
        currentId = id;
        return fallback.play(id, segment);
      }
      const native = player();
      if (!activeSource) fallback.pause();
      if (source !== activeSource) {
        activeSource = source;
        currentId = id;
        range = null;
        seekTo = 0;
        native.src = source;
      }
      if (segment) { range = { ...segment }; seekTo = segment.start; }
      else if (status === 'ended') seekTo = range?.start || 0;
      if (native.readyState && (segment || status === 'ended')) native.currentTime = seekTo;
      native.volume = volume;
      native.playbackRate = rate;
      try { await native.play(); setStatus('playing'); }
      catch { status = 'error'; options.onStatus?.('error', '后台曲库音频暂时无法播放。'); }
      notify();
    }

    return {
      play, getState: state, stop, playRange: (id, start, end) => play(id, { start, end }),
      select(id) { if (id !== currentId) { stop(); activeSource = ''; currentId = id; fallback.select(id); } },
      pause() { if (activeSource) { element.pause(); setStatus('paused'); notify(); } else fallback.pause(); },
      seek(position) { if (activeSource) { seekTo = position; if (element.readyState) element.currentTime = position; notify(); } else fallback.seek(position); },
      setRate(value) { rate = value; if (activeSource) element.playbackRate = value; else fallback.setRate(value); },
      setVolume(value) { volume = value; if (activeSource) element.volume = value; else fallback.setVolume(value); },
    };
  }

  function libraryMusic(model, draft, entry) {
    const raw = entry.lyrics;
    const time = text => { const match = /^([0-9]{1,2}):([0-9]{2})(?:[.:]([0-9]{1,3}))?$/.exec(text); return match ? 60 * Number(match[1]) + Number(match[2]) + Number('0.' + (match[3] || '0')) : null; };
    const lines = (Array.isArray(raw) ? raw : String(raw || '').split(/\r?\n/)).flatMap((value, index) => {
      const text = clean(value?.text || value);
      const mark = /^(?:\[([\d:.]+)\]|(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})\s+)(.*)$/.exec(text);
      return mark ? [{ text: mark[4].trim(), start: time(mark[1] || mark[2]) ?? index * 3, end: time(mark[3]) ?? undefined }]
        : text ? [{ text, start: Number.isFinite(value?.start) ? value.start : index * 3, end: value?.end }] : [];
    });
    const song = musicDraft(model, draft, draft.activityId, entry.name, lines, {
      vocal: entry.vocal_url, backing: entry.instrumental_url, actualDuration: Number(entry.duration) || (lines.at(-1)?.start || 0) + 3,
    });
    if (!song) throw Error('曲库中这首歌没有可用歌词，请选择其他歌曲。');
    song.song = `library-${entry.id}`;
    song.backendAudio = { vocal: song.media.vocal?.src || '', backing: song.media.backing?.src || '', actualDuration: song.media.duration };
    return song;
  }

  async function createMusicCandidate(model, draft, conditions, { signal, onProgress } = {}) {
    const api = root.WBWorkbenchApi;
    const { data: work } = await api.request('/api/creative-works', {
      method: 'POST', timeout: 30000, body: { moduleId: musicModule, moduleName: '星光录音棚',
        title: '歌曲生成候选', parameters: { ...musicParameters(draft, conditions), workbenchMusicCandidate: true } },
    });
    const id = validRemoteId(work?.id);
    if (!id) throw Error('后台未返回歌曲生成编号。');
    const path = `/api/creative-works/${id}`;
    try {
      signal?.throwIfAborted();
      const { data } = await api.request(`${path}/song`, { method: 'POST', body: {}, signal, timeout: 240000 });
      if (!data?.song?.lyrics?.length) throw Error('后台未返回歌曲歌词。');
      onProgress?.('歌词已生成，正在准备原唱、伴奏和逐句时间…');
      const task = await api.request(`${path}/music`, { method: 'POST', signal, timeout: 55000 });
      if (!task.data?.executionId) throw Error('后台没有接受整曲任务。');
      const deadline = Date.now() + 480000;
      while (Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        signal?.throwIfAborted();
        const { data: audio } = await api.request(`${path}/music`, { signal, timeout: 30000 });
        if (audio?.status === 'error') throw Error(audio.error || '歌曲音频生成失败。');
        if (audio?.status !== 'completed') continue;
        const candidate = musicDraft(model, draft, draft.activityId || id, data.title, audio.lyrics, audio);
        if (!candidate?.media?.vocal) throw Error('后台未返回可播放的歌曲音频。');
        candidate.creationConditions = clone(conditions);
        candidate.creationDraft = clone(conditions);
        candidate.backendAudio = { vocal: candidate.media.vocal.src, backing: candidate.media.backing?.src || '',
          segments: candidate.lines.map(line => line.audio?.src).filter(Boolean), transcription: audio,
          actualDuration: candidate.media.duration, alignmentStatus: 'needs_review' };
        return candidate;
      }
      throw Error('歌曲音频仍在生成，等待时间已超过 8 分钟。');
    } finally {
      await api.request(path, { method: 'DELETE', timeout: 12000 }).catch(() => {});
    }
  }

  async function musicListeningQuestion(id, draft, previous, line, signal) {
    const lyric = clean(draft.lines[line]?.text);
    if (!lyric) throw Error('请先填写这句歌词。');
    const { data } = await root.WBWorkbenchApi.request(`/api/creative-works/${id}/exercises`, {
      method: 'POST', signal, timeout: 230000, body: { section: 'ex3Data', previewOnly: true,
        lyrics: draft.lines.map(row => ({ text: row.text, time: String(row.time) })),
        adjustment: `请为选定的歌词行生成一道听音选词题，正确选项必须原样来自第 ${line + 1} 行：${lyric}` },
    });
    const comparable = value => clean(value).replace(/[^\p{L}\p{N} ]/gu, '').toLowerCase();
    const choices = list(data?.ex3Data).find(question => {
      const answer = comparable(question?.options?.[question.correct]);
      return answer && comparable(lyric).includes(answer) && new Set(question.options.map(comparable)).size === question.options.length;
    });
    if (!choices || choices.options.length < 2) throw Error('后台未返回与本句原唱匹配的题目，请重试。');
    const next = { ...previous, line, lyricSource: lyric, audio: { kind: 'song-vocal', line, text: lyric },
      generation: { kind: 'backend', revision: (previous.generation?.revision || 0) + 1, source: lyric },
      options: choices.options.map((text, index) => ({ id: `choice-${index}`, text: clean(text) })),
      correct: 'choice-' + choices.correct };
    delete next.lyricReview;
    return next;
  }

  root.WBSongMusicBackend = { createCollection, hydrateSong, hydrateMusic, composeSong, rewriteSong, songLibrary, loadMelodies,
    songAudioSource, audioPlayer, libraryMusic,
    musicParameters, musicDraft, createMusicCandidate, musicListeningQuestion, resourceUrl };
})(window);
