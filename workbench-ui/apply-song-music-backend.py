"""Apply the old platform services to the frozen song and music controllers."""

import re


def replace(text, old, new):
    if text.count(old) != 1:
        raise ValueError(f"Expected one song/music integration anchor: {old[:130]}")
    return text.replace(old, new, 1)


def script(text, source, update):
    pattern = rf'(<script\b[^>]*data-build-source="{re.escape(source)}"[^>]*>)(.*?)(</script>)'
    result, count = re.subn(pattern, lambda p: p[1] + update(p[2]) + p[3], text, flags=re.S)
    if count != 1:
        raise ValueError(f"Expected one embedded script for {source}")
    return result


def song(text):
    text = replace(text, 'let autoSaveTimer=null,saveChain=Promise.resolve();', '''let autoSaveTimer=null,saveChain=Promise.resolve(),songGeneration;
const songServices=window.WBSongMusicBackend;
const songBackend=songServices?.createCollection('song',KEY,(row,id)=>songServices.hydrateSong(M,row,id),()=>syncSaveState());
const pendingSongDraft=id=>M.loadLibrary(storage,KEY,{legacyKey:LEGACY_KEY}).items.find(item=>item.id===id);
function syncSongBackend(){return songBackend?.flush(pendingSongDraft)??Promise.resolve(true);}
async function startSongBackend(){
 try{
  await songServices.loadMelodies(M,A);
 }catch(e){toast('后台曲库加载失败：'+e.message);}
 try{
  if(loaded.error)throw Error(loaded.error);
  const next=await songBackend.load(items),write=M.saveLibrary(storage,KEY,next);
  if(!write.ok)throw Error(write.error);
  loaded=M.loadLibrary(storage,KEY,{legacyKey:LEGACY_KEY});items=loaded.items;
  await syncSongBackend();
 }catch(e){storageError=e.message;}
 render();
}''')
    text = replace(text, "dirty?'保存中…':'已保存';}", "dirty?'保存中…':songBackend?.error?'后台同步失败':songBackend?.pending?'正在同步后台…':songBackend?'已同步后台':'已保存';}")
    text = replace(text, "message.textContent=storageError||'';", "message.textContent=storageError||songBackend?.error||'';")
    text = replace(text, "retry.hidden=ui.saveState!=='error';", "retry.hidden=ui.saveState!=='error'&&!songBackend?.error;")
    text = replace(text, "function saveDraft(ready=false,goHome=false,automatic=false){", "async function saveDraft(ready=false,goHome=false,automatic=false){")
    text = replace(text, "ui.saveState='saved';ui.saveConflict=null;\n if(goHome)", '''ui.saveState='saved';ui.saveConflict=null;
 if(songBackend){
  try{songBackend.queue(draft);if(!await syncSongBackend())throw Error(songBackend.error);}
  catch(e){storageError=e.message;ui.saveState='error';syncSaveState();if(!automatic)toast(e.message);return false;}
 }
 if(goHome)''')
    text = replace(text, " if(ui.session){if(!persistClassroom())", " if(songGeneration)return false;\n if(ui.session){if(!persistClassroom())")
    text = replace(text, " return true;\n}\nasync function switchModule", " return syncSongBackend();\n}\nasync function switchModule")
    text = replace(text, "function close(){stopReviewMedia();ui.generation=null;", "function close(){songGeneration?.abort();songGeneration=null;stopReviewMedia();ui.generation=null;")
    text = replace(text, "function generate(){flushTags();ui.generation={draftId:draft.id,revision:draft.revision,settings:M.clone(draft.settings),melodyId:draft.melodyId,candidate:M.generateExample(draft)};const next=ui.generation.candidate;", '''async function generate(){
 flushTags();const owner=draft.id,revision=draft.revision;
 let next;
 if(songBackend){
  const controller=new AbortController();songGeneration?.abort();songGeneration=controller;
  dialog('正在生成歌曲','<p role="status">正在调用后台生成歌词与教案…</p>',B('取消生成','close'));
  try{next=await songServices.composeSong(M,draft,controller.signal);}
  catch(e){if(songGeneration===controller){close();toast(e.message);}return;}
  if(songGeneration!==controller||draft?.id!==owner||draft.revision!==revision)return;
  songGeneration=null;
 }else next=M.generateExample(draft);
 ui.generation={draftId:draft.id,revision:draft.revision,settings:M.clone(draft.settings),melodyId:draft.melodyId,candidate:next};''')
    text = replace(text, '<p class="hint">本地输入响应示例，尚未接入真实 AI；年龄、水平与所选旋律的适配仍需真实服务验证。</p>', '''<p class="hint">${songBackend?'请核对后台生成的歌词与所选旋律。':'本地输入响应示例，尚未接入真实 AI。'}</p>''')
    text = replace(text, "function propose(operation='optimize'){", "async function propose(operation='optimize'){")
    text = replace(text, "const c=ui.candidate;dialog(operation===", '''const original=ui.candidate;let c=original;
 if(songBackend){
  const controller=new AbortController();songGeneration?.abort();songGeneration=controller;
  dialog('正在调整歌词','<p role="status">正在调用后台生成调整候选…</p>',B('取消调整','close'));
  try{c=await songServices.rewriteSong(M,draft,original,controller.signal);}
  catch(e){if(songGeneration===controller){close();toast(e.message);}return;}
  if(songGeneration!==controller||draft?.id!==c.draftId||draft.revision!==c.baseRevision)return;
  songGeneration=null;ui.candidate=c;
 }
 dialog(operation===''')
    text = replace(text, "'<p class=\"hint\">本地示例 · 未接入真实 AI</p>'", "(songBackend?'<p class=\"hint\">后台生成候选，采用前可编辑。</p>':'<p class=\"hint\">本地示例 · 未接入真实 AI</p>')")
    text = replace(text, "if(hasPendingChanges()){e.preventDefault();", "if(hasPendingChanges()||songBackend?.pending){e.preventDefault();")
    text = replace(text, "else if(a==='delete-activity-confirm'){const result=", "else if(a==='delete-activity-confirm'){if(songBackend)await songBackend.remove(ui.deleteActivity);const result=")
    text = replace(text, "return word.image.kind==='upload'?", "return ['upload','remote'].includes(word.image.kind)?")
    text = replace(text, "function upload(file){if(!file)return;", "async function upload(file){if(!file)return;")
    text = replace(text, "&&wordBy(wordId,wordEditDraft());const reader=new FileReader();", '''&&wordBy(wordId,wordEditDraft());
 if(songBackend){
  try{
   const value=await window.WBWorkbenchApi.upload(file,'song-writing');
   if(!active())return;
   stageWord(M.upsertWord(wordEditDraft(),{...wordBy(wordId,wordEditDraft()),image:{kind:'remote',value}}));
   pictureDialog(wordId);toast('图片已上传，保存修改后生效');
  }catch(e){if(active())toast(e.message);}
  return;
 }
 const reader=new FileReader();''')
    text = replace(text, "const audio=A.createPlayer({", "const audio=(options=>songServices?.audioPlayer(A,options,()=>songPlaybackMode())??A.createPlayer(options))({")
    text = replace(text, "const libraryAudio=A.createPlayer({", "const libraryAudio=(options=>songServices?.audioPlayer(A,options,()=>ui.library?.mode||'accompaniment')??A.createPlayer(options))({")
    text = replace(text, "return mode==='accompaniment'&&['twinkle','row','mary','frere','london','macdonald'].includes(id);", "return !!songServices?.songAudioSource(id,mode)||(mode==='accompaniment'&&['twinkle','row','mary','frere','london','macdonald'].includes(id));")
    text = replace(text, "const playLabel=vocal?U('原曲示唱音频待接入'):available?", "const playLabel=vocal&&!available?U('原曲示唱音频待接入'):available?")
    text = replace(text, "${vocal?'原曲示唱 · 音频待接入':available?'伴奏模式 · 合成旋律参考':U('伴奏音频待接入')}", "${songServices?.songAudioSource(d.melodyId,songPlaybackMode())?(vocal?'原曲示唱':'伴奏'):vocal?'原曲示唱 · 音频待接入':available?'伴奏模式 · 合成旋律参考':U('伴奏音频待接入')}")
    text = replace(text, "</p>':vocal?'<p class=\"song-audio-notice\"", "</p>':vocal&&!available?'<p class=\"song-audio-notice\"")
    text = replace(text, "${vocal?'<p class=\"song-audio-notice\" role=\"status\">演唱模式", "${vocal&&!available?'<p class=\"song-audio-notice\" role=\"status\">演唱模式")
    text = replace(text, "render();\n// Explicit preview links", "if(songBackend)void startSongBackend();else render();\n// Explicit preview links")
    return text


def music(text):
    text = replace(text, "let navigationExpanded=false,hunterView='edit';", '''const musicServices=window.WBSongMusicBackend;
const musicBackend=musicServices?.createCollection('music',WORKS,(row,id)=>musicServices.hydrateMusic(M,row,id),()=>syncSaveState());
const musicLibrary=new Map();
const pendingMusicDraft=id=>L.load(localStorage,WORKS,KEY).items.find(item=>item.activityId===id);
function syncMusicBackend(){return musicBackend?.flush(pendingMusicDraft)??Promise.resolve(true);}
async function startMusicBackend(){
 try{
  if(libraryError)throw Error(libraryError);
  const next=await musicBackend.load(works.items);
  works=L.normalize({...works,items:next,lastId:next.some(item=>item.activityId===works.lastId)?works.lastId:next[0]?.activityId||null});
  localStorage.setItem(WORKS,JSON.stringify(works));
  await syncMusicBackend();
 }catch(e){libraryError=e.message;}
 render();
}
let remoteSongJob=null,remoteQuestionJob=null,backingPlayer=null,backingSource='',backingOwner=null;
function sourceForCurrentTrack(){return d.backendAudio&&d.media?.[track]?.src;}
function syncBackedPlayback(){
 const source=sourceForCurrentTrack();
 if(!source||!playing){backingPlayer?.pause();return;}
 if(!backingPlayer){
  backingPlayer=new Audio();
  backingPlayer.addEventListener('timeupdate',()=>{if(playing&&backingOwner===d){playSeconds=backingPlayer.currentTime;syncPlayback();}});
  backingPlayer.addEventListener('ended',()=>{if(backingOwner===d){playing=false;syncPlayback();}});
 }
 if(backingSource!==source||backingOwner!==d){
  backingOwner=d;backingSource=source;backingPlayer.src=source;
 }
 if(Math.abs(backingPlayer.currentTime-playSeconds)>.3)backingPlayer.currentTime=playSeconds;
 if(backingPlayer.paused)void backingPlayer.play().catch(e=>{
  if(e.name!=='AbortError'&&backingOwner===d&&playing){playing=false;syncPlayback();toast('歌曲音频无法播放，请重试。');}
 });
}
let navigationExpanded=false,hunterView='edit';''')
    text = replace(text, "B('生成歌曲（演示）','ai-generate','primary')", "B(musicBackend?'生成歌曲':'生成歌曲（演示）','ai-generate','primary')")
    text = replace(text, "candidate=M.createDraft('sunny'),coverage=", "candidate=d.generatedPreview.song||M.createDraft('sunny'),coverage=")
    text = replace(text, '<span class="badge">预设演示歌曲</span>', '''<span class="badge">${d.generatedPreview.song?'后台生成歌曲':'预设演示歌曲'}</span>''')
    text = replace(text, '    <div class="result-player"><div class="row between">${B(', '''    ${d.generatedPreview.song?`<div class="result-player"><label>原曲示唱 <audio controls preload="metadata" src="${E(candidate.media.vocal.src)}"></audio></label>${candidate.media.backing?`<label>伴奏 <audio controls preload="metadata" src="${E(candidate.media.backing.src)}"></audio></label>`:''}</div>`:`<div class="result-player"><div class="row between">${B(''')
    text = replace(text, '<small>模拟播放 · 暂无真实音频</small></div></div>\n', '<small>模拟播放 · 暂无真实音频</small></div></div>`}\n')
    text = replace(text, '<p class="notice">样例实际时长 00:48；本次目标 ${E(c.duration)}。当前用固定样例演示，重新生成仍返回该样例。</p>', '''<p class="notice">${d.generatedPreview.song?`整曲实际时长 ${time(M.songDuration(candidate))}；请听唱核对歌词与逐句时间。`:`样例实际时长 00:48；本次目标 ${E(c.duration)}。`}</p>''')
    text = replace(text, "dialog.dataset.creationPhase!=='result'||!dialog.open)return;", "dialog.dataset.creationPhase!=='result'||!dialog.open||d.generatedPreview?.song)return;")
    text = replace(text, "function generateSong(repeat=false) {", "async function generateSong(repeat=false) {")
    text = replace(text, '<p class="notice">生成过程演示 · 不调用真实服务</p>', '''<p class="notice" data-remote-song-status>${musicBackend?'正在调用后台歌曲生成服务…':'生成过程演示'}</p>''')
    text = replace(text, "  setTimeout(()=>{if(run!==creationRun||!dialog.open||dialog.dataset.creationPhase!=='generating')return;", '''  if(musicBackend){
    const controller=new AbortController();remoteSongJob?.abort();remoteSongJob=controller;
    try{
      const song=await musicServices.createMusicCandidate(M,d,conditions,{signal:controller.signal,onProgress:message=>{
        if(run===creationRun)dialog.querySelector('[data-remote-song-status]')?.replaceChildren(message);
      }});
      if(run!==creationRun||!dialog.open)return;
      d.generatedPreview={conditions:clone(conditions),song};mark();render();showCreationResult();
    }catch(e){if(run===creationRun&&dialog.open)modal('歌曲生成未完成',`<p role="alert">${E(e.message)}</p>`,B('返回创作条件','ai','primary'));}
    finally{if(remoteSongJob===controller)remoteSongJob=null;}
    return;
  }
  setTimeout(()=>{if(run!==creationRun||!dialog.open||dialog.dataset.creationPhase!=='generating')return;''')
    text = replace(text, "dirty?'保存中…':'已保存';}", "dirty?'保存中…':musicBackend?.error?'后台同步失败':musicBackend?.pending?'正在同步后台…':musicBackend?'已同步后台':'已保存';}")
    text = replace(text, "msg.textContent=libraryError;", "msg.textContent=libraryError||musicBackend?.error||'';")
    text = replace(text, "retry.hidden=saveState!=='error';", "retry.hidden=saveState!=='error'&&!musicBackend?.error;")
    text = replace(text, "    if(next==='new')startNew();", "    if(musicBackend){musicBackend.queue(saved);void syncMusicBackend();}\n    if(next==='new')startNew();")
    text = replace(text, "case 'retry-save':dialog.close();save(retrySaveNext,retrySaveStatus);break;", "case 'retry-save':dialog.close();if(musicBackend?.error&&!dirty)void syncMusicBackend();else save(retrySaveNext,retrySaveStatus);break;")
    text = replace(text, "window.WBPrepareModuleSwitch=()=>withWriteLock(()=>{if(openStarlightPreview.active)", "window.WBPrepareModuleSwitch=()=>withWriteLock(async()=>{if(remoteSongJob||remoteQuestionJob)return false;if(openStarlightPreview.active)")
    text = replace(text, "return !dirty||classroom||save(null,null,true);});", "return (!dirty||classroom||save(null,null,true))&&await syncMusicBackend();});")
    text = replace(text, "works=L.persist(localStorage,WORKS,KEY,saved,{expected:renameBaseline});if(d.activityId", "works=L.persist(localStorage,WORKS,KEY,saved,{expected:renameBaseline});if(musicBackend){musicBackend.queue(saved);void syncMusicBackend();}if(d.activityId")
    text = replace(text, "function openSongLibrary(){\n  modal('从曲库选择',`<div class=\"song-list\">${songChoices.map", '''async function openSongLibrary(){
  if(musicBackend){
    modal('从曲库选择','<p role="status">正在读取后台曲库…</p>',B('返回','close'));
    const request=Symbol();openSongLibrary.request=request;
    try{
      const entries=await musicServices.songLibrary();
      if(openSongLibrary.request!==request||!dialog.open)return;
      musicLibrary.clear();
      for(const entry of entries){if(/^[a-z0-9_-]+$/i.test(String(entry.id))&&entry.lyrics)musicLibrary.set(`library-${entry.id}`,entry);}
    }catch(e){if(!dialog.open||openSongLibrary.request!==request)return;modal('曲库暂不可用',`<p role="alert">${E(e.message)}</p>`,B('返回','close')+B('重试','song-library','primary'));return;}
  }
  const choices=musicBackend?[...musicLibrary].map(([id,entry])=>({id,title:entry.name,desc:entry.description||entry.melody_type||''})).concat(songChoices):songChoices;
  modal('从曲库选择',`<div class="song-list">${choices.map''')
    text = replace(text, "<strong>${s.title}</strong><p>${s.desc}</p>", "<strong>${E(s.title)}</strong><p>${E(s.desc)}</p>")
    text = replace(text, "aria-label=\"${current?'当前使用':'使用'} ${s.title}\"", "aria-label=\"${current?'当前使用':'使用'} ${E(s.title)}\"")
    text = replace(text, "曲库与 AI 创作均使用演示素材。</p>", "${musicBackend?'可从后台曲库选歌，也可按教学目标生成。':'曲库与 AI 创作均使用演示素材。'}</p>")
    text = replace(text, "const description=generated?`${d.lines.length} 行歌词 · 样例时长 48 秒`:", "const description=d.backendAudio?`${d.lines.length} 行歌词 · ${time(M.songDuration(d))}`:generated?`${d.lines.length} 行歌词 · 样例时长 48 秒`:")
    text = replace(text, "${generated?'AI 创作 · 演示':'曲库歌曲'}", "${generated?(d.backendAudio?'AI 创作':'AI 创作 · 演示'):'曲库歌曲'}")
    text = replace(text, "${E(songChoices.find(s=>s.id===el.dataset.song)?.title)}", "${E(musicLibrary.get(el.dataset.song)?.name||songChoices.find(s=>s.id===el.dataset.song)?.title)}")
    text = replace(text, "d=L.replaceSong(previous,M.createDraft(id));", "const entry=musicLibrary.get(id);let song;try{song=entry?musicServices.libraryMusic(M,previous,entry):M.createDraft(id);}catch(e){toast(e.message);return;}d=L.replaceSong(previous,song);")
    text = replace(text, "M.useGeneratedSong(d,pendingCreation));chosenSong", "(d.generatedPreview?.song||M.useGeneratedSong(d,pendingCreation)));chosenSong")
    text = replace(text, "toast(d._workspace?.songReplacementUndo?'已使用演示歌曲，可在歌曲准备中撤销替换':'已使用演示歌曲',true)", "toast(d._workspace?.songReplacementUndo?'已使用歌曲，可在歌曲准备中撤销替换':'已使用歌曲',true)")
    text = replace(text, "case 'result-line':resultPlayback.seconds=", "case 'result-line':if(d.generatedPreview?.song){const audio=dialog.querySelector('audio');audio.currentTime=d.generatedPreview.song.lines[Number(el.dataset.resultLine)].time;void audio.play().catch(e=>toast(e.message));break;}resultPlayback.seconds=")
    text = replace(text, "function generateCurrentQuestion(line){", "async function generateCurrentQuestion(line){")
    text = replace(text, "modal('正在生成调整候选 · 演示'", "modal(musicBackend?'正在生成调整候选':'正在生成调整候选 · 演示'")
    text = replace(text, "  setTimeout(()=>{\n    if(token!==questionRun", "  const complete=async()=>{\n    if(token!==questionRun")
    text = replace(text, "      const next=M.generateListeningQuestion(d,old,line);", '''      let next;
      if(musicBackend){
        const controller=new AbortController();remoteQuestionJob?.abort();remoteQuestionJob=controller;
        try{
          const id=await musicBackend.idForDraft(d);
          next=await musicServices.musicListeningQuestion(id,d,old,line,controller.signal);
        }finally{if(remoteQuestionJob===controller)remoteQuestionJob=null;}
      }else next=M.generateListeningQuestion(d,old,line);
      if(token!==questionRun||!dialog.open||d!==source||d.lines[line]?.text!==lyric)return;''')
    text = replace(text, '<p class="notice">本地规则演示</p>', '''<p class="notice">${musicBackend?'后台生成，请试听核对正确答案。':'本地规则演示'}</p>''')
    text = replace(text, "}catch(error){questionCandidate=null;modal('选项准备未完成'", "}catch(error){if(token!==questionRun||!dialog.open)return;questionCandidate=null;modal('选项准备未完成'")
    text = replace(text, "  },700);\n}\nfunction questionCandidateSummary", "  };\n  if(musicBackend)void complete();else setTimeout(complete,700);\n}\nfunction questionCandidateSummary")
    text = replace(text, "'title=\"本地规则演示，未连接 AI 服务\"'", "musicBackend?'title=\"调用后台生成听音题\"':'title=\"本地规则演示\"'")
    text = text.replace("if(dialog.dataset.creationPhase==='generating')creationRun++;", "if(dialog.dataset.creationPhase==='generating'){creationRun++;remoteSongJob?.abort();}remoteQuestionJob?.abort();")
    text = replace(text, "case 'close':{if(view==='preview'", "case 'close':{openSongLibrary.request=null;if(view==='preview'")
    text = replace(text, "function syncPlayback(){\n", "function syncPlayback(){\n  syncBackedPlayback();\n")
    text = replace(text, "if(classroom&&classReturn?.preview){openStarlightPreview(d);return;}", "if(classroom&&classReturn?.preview&&!musicBackend){openStarlightPreview(d);return;}")
    text = replace(text, "  if(!playing)return;playSeconds++;", "  if(!playing)return;if(sourceForCurrentTrack()){if(classroom)persistClassSession();return;}playSeconds++;")
    text = replace(text, "window.addEventListener('pagehide',()=>{persistClassSession();stopQuestionAudio();", "window.addEventListener('pagehide',()=>{backingPlayer?.pause();persistClassSession();stopQuestionAudio();")
    text = replace(text, "if(document.hidden)stopQuestionAudio();", "if(document.hidden){playing=false;backingPlayer?.pause();stopQuestionAudio();}")
    text = replace(text, "const data=canvas.toDataURL('image/webp',.82);M.setHint", '''const data=musicBackend?await window.WBWorkbenchApi.upload(file,'music-hints'):canvas.toDataURL('image/webp',.82);
if(hintPickerSession!==session||!dialog.open||d!==draft||!d.questions.includes(question))return;M.setHint''')
    text = replace(text, "if((dirty&&!classroom)||classReturn?.dirty||", "if(musicBackend?.pending||(dirty&&!classroom)||classReturn?.dirty||")
    text = replace(text, "render();\nif(directClassroom&&directClassData)", "if(musicBackend&&!directClassroom)void startMusicBackend();else render();\nif(directClassroom&&directClassData)")
    return text


def live_catalog(module, text):
    marker = '/* workbench-server-catalog */'
    if marker in text:
        return text
    if module == 'song':
        text = replace(text, 'async function startSongBackend(){', "async function startSongBackend(){\n ui.tab='mine';")
        text = replace(text, "if(loaded.error)throw Error(loaded.error);\n  const next=await songBackend.load(items),write=M.saveLibrary(storage,KEY,next);", """const readOnly=window.WBWorkbenchApi.readOnly;
  if(loaded.error&&!readOnly)throw Error(loaded.error);
  const next=await songBackend.load(items);
  if(readOnly){items=next;render();return;}
  const write=M.saveLibrary(storage,KEY,next);""")
        text = replace(text, "}catch(e){storageError=e.message;}\n render();\n}", "}catch(e){storageError=e.message;if(window.WBWorkbenchApi.readOnly)items=[];}\n render();\n}")
        text = replace(text, "${B(`案例库 <span>${M.templates.length}", "${songBackend?'':B(`案例库 <span>${M.templates.length}")
        text = replace(text, 'function saveDraft(ready=false,goHome=false,automatic=false){', """function saveDraft(ready=false,goHome=false,automatic=false){
 if(songBackend&&window.WBWorkbenchApi.readOnly){if(!automatic)toast('当前连接只读后台，无法保存活动。');return false;}""")
        text = replace(text, "return !!songServices?.songAudioSource(id,mode)||(mode===", "return songBackend?!!songServices.songAudioSource(id,mode):(mode===")
        text = replace(text, "return M.melodies.filter(m=>!m.legacy&&", "return M.melodies.filter(m=>!m.legacy&&(!songBackend||songServices.songAudioSource(m.id,'vocal')||songServices.songAudioSource(m.id,'accompaniment'))&&")
    else:
        text = replace(text, 'async function startMusicBackend(){', "async function startMusicBackend(){\n homeTab='mine';")
        text = replace(text, 'if(libraryError)throw Error(libraryError);\n  const next=await musicBackend.load(works.items);', """const readOnly=window.WBWorkbenchApi.readOnly;
  if(libraryError&&!readOnly)throw Error(libraryError);
  const next=await musicBackend.load(works.items);""")
        text = replace(text, "  localStorage.setItem(WORKS,JSON.stringify(works));\n  await syncMusicBackend();", "  if(!readOnly){localStorage.setItem(WORKS,JSON.stringify(works));await syncMusicBackend();}")
        text = replace(text, "}catch(e){libraryError=e.message;}\n render();\n}", "}catch(e){libraryError=e.message;if(window.WBWorkbenchApi.readOnly)works=L.normalize({...works,items:[],lastId:null});}\n render();\n}")
        text = replace(text, "${B(`案例库 <span>${L.presets.length}", "${musicBackend?'':B(`案例库 <span>${L.presets.length}")
        text = replace(text, "B('浏览案例库','home-tab','small','data-tab=\"library\"')+B('新建音乐活动'", "(musicBackend?'':B('浏览案例库','home-tab','small','data-tab=\"library\"'))+B('新建音乐活动'")
        text = replace(text, ".concat(songChoices):songChoices", ":songChoices")
        text = replace(text, 'function save(next,completion=null,automatic=false){', """function save(next,completion=null,automatic=false){
  if(musicBackend&&window.WBWorkbenchApi.readOnly){if(!automatic)toast('当前连接只读后台，无法保存活动。');return false;}""")
    return marker + text


def patch(module, document):
    marker = '/* workbench-song-music-backend */'
    if module == 'song':
        if marker not in document:
            document = script(document, 'song/model.js', lambda body: replace(body, "(image.kind === 'upload' &&", "(image.kind === 'remote' && !!window.WBSongMusicBackend?.resourceUrl(image.value)) ||\n       (image.kind === 'upload' &&"))
        return script(document, 'song/app.js', lambda body: live_catalog(module, body if marker in body else marker + song(body)))
    if module == 'music':
        return script(document, 'app.js', lambda body: live_catalog(module, body if marker in body else marker + music(body)))
    raise ValueError(f"Unsupported song/music module: {module}")
