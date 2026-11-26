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
        # Existing packages may still carry the rule that hid the case library.
        if module == 'song' and "${songBackend?'':B(`案例库" in text:
            text = replace(text, "async function startSongBackend(){\n ui.tab='mine';", "async function startSongBackend(){")
            text = replace(text, "${songBackend?'':B(`案例库", "${B(`案例库")
        if module == 'music' and "${musicBackend?'':B(`案例库" in text:
            text = replace(text, "async function startMusicBackend(){\n homeTab='mine';", "async function startMusicBackend(){")
            text = replace(text, "${musicBackend?'':B(`案例库", "${B(`案例库")
            text = replace(text, "(musicBackend?'':B('浏览案例库','home-tab','small','data-tab=\"library\"'))",
                           "B('浏览案例库','home-tab','small','data-tab=\"library\"')")
        return text
    if module == 'song':
        text = replace(text, "if(loaded.error)throw Error(loaded.error);\n  const next=await songBackend.load(items),write=M.saveLibrary(storage,KEY,next);", """const readOnly=window.WBWorkbenchApi.readOnly;
  if(loaded.error&&!readOnly)throw Error(loaded.error);
  const next=await songBackend.load(items);
  if(readOnly){items=next;render();return;}
  const write=M.saveLibrary(storage,KEY,next);""")
        text = replace(text, "}catch(e){storageError=e.message;}\n render();\n}", "}catch(e){storageError=e.message;if(window.WBWorkbenchApi.readOnly)items=[];}\n render();\n}")
        text = replace(text, 'function saveDraft(ready=false,goHome=false,automatic=false){', """function saveDraft(ready=false,goHome=false,automatic=false){
 if(songBackend&&window.WBWorkbenchApi.readOnly){if(!automatic)toast('当前连接只读后台，无法保存活动。');return false;}""")
        text = replace(text, "return !!songServices?.songAudioSource(id,mode)||(mode===", "return songBackend?!!songServices.songAudioSource(id,mode):(mode===")
        text = replace(text, "return M.melodies.filter(m=>!m.legacy&&", "return M.melodies.filter(m=>!m.legacy&&(!songBackend||songServices.songAudioSource(m.id,'vocal')||songServices.songAudioSource(m.id,'accompaniment'))&&")
    else:
        text = replace(text, 'if(libraryError)throw Error(libraryError);\n  const next=await musicBackend.load(works.items);', """const readOnly=window.WBWorkbenchApi.readOnly;
  if(libraryError&&!readOnly)throw Error(libraryError);
  const next=await musicBackend.load(works.items);""")
        text = replace(text, "  localStorage.setItem(WORKS,JSON.stringify(works));\n  await syncMusicBackend();", "  if(!readOnly){localStorage.setItem(WORKS,JSON.stringify(works));await syncMusicBackend();}")
        text = replace(text, "}catch(e){libraryError=e.message;}\n render();\n}", "}catch(e){libraryError=e.message;if(window.WBWorkbenchApi.readOnly)works=L.normalize({...works,items:[],lastId:null});}\n render();\n}")
        text = replace(text, ".concat(songChoices):songChoices", ":songChoices")
        text = replace(text, 'function save(next,completion=null,automatic=false){', """function save(next,completion=null,automatic=false){
  if(musicBackend&&window.WBWorkbenchApi.readOnly){if(!automatic)toast('当前连接只读后台，无法保存活动。');return false;}""")
    return marker + text


def database_cases(module, text):
    marker = '/* workbench-database-cases */'
    if marker in text:
        return text
    if module == 'song':
        text = replace(text, 'const pendingSongDraft=', """const caseLibrary=window.WBWorkbenchApi?.caseLibrary?.('song');
const caseEntries=()=>caseLibrary?.items??M.templates;
function caseDraft(id){
  if(caseLibrary)return caseLibrary.find(id)?.draft;
  return id==='feelings'?createWorkspaceDraft():M.createDraft({templateId:id});
}
const pendingSongDraft=""")
        text = replace(text, 'async function startSongBackend(){', 'async function startSongBackend(){\n await caseLibrary?.load();')
        text = replace(text, 'const list=cases?M.templates.map(t=>({d:t.id===\'feelings\'?createWorkspaceDraft():M.createDraft({templateId:t.id}),template:t.id}))',
                       'const list=cases?caseEntries().map(t=>({d:caseDraft(t.id),template:t.id}))')
        text = replace(text, " const cases=ui.tab==='cases';\n const list=", """ const cases=ui.tab==='cases';
 if(cases&&caseLibrary?.message)return `<p class="lh-empty" role="status">${E(caseLibrary.message)}</p>`;
 const list=""")
        text = replace(text, '案例库 <span>${M.templates.length}', '案例库 <span>${caseEntries().length}')
        text = replace(text, 'M.templates.map(t=>`<article class="template-option">', 'caseEntries().map(t=>`<article class="template-option">')
        text = replace(text, "openDraft(M.initializeActivityName(template==='feelings'?createWorkspaceDraft():M.createDraft({templateId:template})));",
                       """const source=caseDraft(template);if(!source)return;const copy=M.initializeActivityName(source);copy.id=M.uid('song');openDraft(copy);""")
        text = replace(text, """else if(a==='case-preview')startSession(b.dataset.template==='feelings'?createWorkspaceDraft():M.createDraft({templateId:b.dataset.template}),'case');""",
                       """else if(a==='case-preview'){const data=caseDraft(b.dataset.template);if(data)startSession(data,'case');}
else if(a==='publish-case'){if(await caseLibrary?.publish(b.dataset.id)){ui.tab='cases';ui.query='';ui.filter='all';render();toast('已发布到平台案例库。');}}""")
        text = replace(text, "+B('继续修改','open',d.lines.length?'secondary':'primary',attrs)+B('⋯','more',",
                       "+B('继续修改','open',d.lines.length?'secondary':'primary',attrs)+(d._publication&&caseLibrary?.canPublish?B('发布为案例','publish-case','secondary',attrs):'')+B('⋯','more',")
    else:
        text = replace(text, 'const musicLibrary=new Map();', """const musicLibrary=new Map();
const caseLibrary=window.WBWorkbenchApi?.caseLibrary?.('music');
const caseEntries=()=>caseLibrary?.items??L.presets;""")
        text = replace(text, 'async function startMusicBackend(){', 'async function startMusicBackend(){\n await caseLibrary?.load();')
        text = replace(text, 'function templateDraft(id){const p=L.presets.find',
                       'function templateDraft(id){if(caseLibrary)return caseLibrary.find(id)?.draft;const p=L.presets.find')
        text = replace(text, "const p=L.presets.find(x=>x.id===(source==='mine'?data.originId:id)),meta=L.metadata(data,M);",
                       "const p=source==='library'&&caseLibrary?caseLibrary.find(id)?.meta:L.presets.find(x=>x.id===(source==='mine'?data.originId:id)),meta=L.metadata(data,M);")
        text = replace(text, "goal:source==='library'?p.goal:", "goal:source==='library'?p?.goal:")
        text = replace(text, "targets:source==='library'?p.targets:", "targets:source==='library'?p?.targets:")
        text = replace(text, 'L.presets.map(p=>({data:templateDraft(p.id),id:p.id,source:', 'caseEntries().map(p=>({data:templateDraft(p.id),id:p.id,source:')
        text = replace(text, '案例库 <span>${L.presets.length}', '案例库 <span>${caseEntries().length}')
        text = replace(text, '${visible.map(e=>homeCard(e.data,e.source,e.id)).join(\'\')||',
                       '${homeTab===\'library\'&&caseLibrary?.message?`<p class="lh-empty" role="status">${E(caseLibrary.message)}</p>`:visible.map(e=>homeCard(e.data,e.source,e.id)).join(\'\')||')
        text = replace(text, "return ready&&!changed?teach+edit:edit+teach;",
                       "return (ready&&!changed?teach+edit:edit+teach)+(ready&&caseLibrary?.canPublish?B('发布为案例','publish-case','secondary'+size,attrs):'');")
        text = replace(text, "case 'entry-copy':", """case 'publish-case':void caseLibrary?.publish(el.dataset.entry).then(ok=>{
  if(ok){homeTab='library';query='';filter='all';homeFilters={age:'',level:''};render();toast('已发布到平台案例库。');}
}).catch(error=>toast(error.message));break;
case 'entry-copy':""")
    return marker + text


def case_presentation(module, text):
    marker = '/* workbench-case-presentation */'
    if marker in text:
        return text
    if module == 'song':
        grid, card, cover, body, actions = (
            'cards lh-grid', 'card lh-card', 'unified-card-cover lh-cover', 'card-body lh-card-body', 'actions lh-card-actions',
        )
        case = "cases"
        context, preview, copy = 'primary', 'case-preview', 'copy'
        copy_context = 'secondary'
    else:
        grid, card, cover, body, actions = (
            'home-cards lh-grid', 'home-card lh-card', 'home-cover-button lh-cover',
            'home-card-body lh-card-body', 'home-card-actions lh-card-actions',
        )
        case = "source==='library'"
        context, preview, copy = 'primary small', 'entry-preview', 'entry-copy'
        copy_context = 'small secondary'
    for original, shared in (
        (grid, "wb-case-grid"),
        (card, "wb-case-card"),
        (cover, "wb-case-cover"),
        (body, "wb-case-body"),
        ("lh-card-heading", "wb-case-title"),
        (actions, "wb-case-actions"),
    ):
        condition = "homeTab==='library'" if module == 'music' and original == grid else case
        text = replace(text, f'class="{original}"', f'class="{original}${{{condition}?\' {shared}\':\'\'}}"')
    text = replace(text,
                   f"B('预览案例','{preview}','{context}',attrs)+B('制作同款','{copy}','{copy_context}',attrs)",
                   f"""B('预览案例','{preview}','primary',attrs+' data-wb-button="primary"')+B('制作同款','{copy}','secondary',attrs+' data-wb-button="secondary"')""")
    for element in ('header', 'tabs', 'search'):
        text = replace(text, f'class="lh-{element}"', f'class="lh-{element} wb-library-{element}"')
    if module == 'music':
        text = replace(text,
                       "B('预览案例','entry-preview','primary',attrs)+B('制作同款','entry-copy','',attrs)",
                       """B('预览案例','entry-preview','primary',attrs+' data-wb-button="primary"')+B('制作同款','entry-copy','secondary',attrs+' data-wb-button="secondary"')""")
    return marker + text


def library_empty_controls(module, text):
    if 'data-wb-clear-search' in text:
        return text
    text = replace(text, '<p class="lh-empty" role="status">${E(caseLibrary.message)}</p>',
                   '<div class="wb-library-empty" role="status">${E(caseLibrary.message)}</div>')
    source = 'list' if module == 'song' else 'entries'
    reset = '''B('清除筛选','filter','secondary','data-filter="all"')''' if module == 'song' else "B('清除筛选','home-clear','secondary')"
    return replace(text, '''<p class="lh-empty" role="status">${filtered?'未找到匹配的活动。':cases?'暂无已发布的案例。':'暂无我制作的活动。'}</p>''',
                   '''<div class="wb-library-empty"><p role="status">${filtered&&SOURCE.length?'未找到匹配的活动。':cases?'暂无已发布的案例。':'暂无我制作的活动。'}</p>${filtered&&SOURCE.length?(query?'<button type="button" data-wb-button="secondary" data-wb-clear-search>清除搜索</button>':RESET):''}</div>'''.replace('SOURCE', source).replace('RESET', reset))


def library_controls(module, text):
    marker = '/* workbench-library-controls */'
    if marker in text:
        return library_empty_controls(module, text)
    text = replace(text, 'class="lh-library-head"', 'class="lh-library-head wb-library-tools"')
    text = replace(text, 'class="lh-tabs wb-library-tabs" role="group"', 'class="lh-tabs wb-library-tabs" role="tablist"')
    text = replace(text, '<span aria-hidden="true">⌕</span><input type="search"',
                   '${window.WBUI?.icon(\'search\')??\'\'}<input type="search"')
    if module == 'song':
        text = replace(text, "B('＋ 新建编唱活动','new','primary')", "B('新建活动','new','primary','data-icon=\"plus\"')")
        text = replace(text, 'aria-label="搜索编唱活动" placeholder="搜索活动、歌曲、主题或词汇"', 'aria-label="搜索活动" placeholder="搜索活动"')
        for tab in ('cases', 'mine'):
            text = replace(text, f'''data-tab="{tab}" aria-pressed="${{ui.tab==='{tab}'}}"''',
                           f'''data-tab="{tab}" role="tab" id="library-tab-{tab}" aria-controls="results" aria-selected="${{ui.tab==='{tab}'}}" tabindex="${{ui.tab==='{tab}'?0:-1}}"''')
        text = replace(text, '''<section id="results" aria-label="${ui.tab==='cases'?'案例活动':'我制作的活动'}">''',
                       '''<section id="results" role="tabpanel" aria-labelledby="library-tab-${ui.tab}">''')
        text = replace(text, "const visible=list.filter(({d})=>(!ui.query||", "const query=ui.query.trim().toLowerCase();\n const filtered=!!query||(!cases&&ui.filter!=='all');\n const visible=list.filter(({d})=>(!query||")
        text = replace(text, "d.melodyId)?.chineseTitle,...d.words.map(w=>w.text)].join(' ').toLowerCase().includes(ui.query.toLowerCase())",
                       "d.melodyId)?.chineseTitle,...M.languageGoals(d.settings),...d.words.map(w=>w.text)].join(' ').toLowerCase().includes(query)")
        text = replace(text, "B('继续修改','open',d.lines.length?'secondary':'primary',attrs)",
                       "B(window.WBWorkbenchApi?.readOnly?'查看备课':'继续备课','open',d.lines.length?'secondary':'primary',attrs)")
        text = replace(text, '''共 ${visible.length} 个${cases?'案例':'活动'}''', '''共 ${visible.length} 项''')
        text = replace(text, '''`<div class="empty lh-empty"><h2>${ui.query||ui.filter!=='all'?'没有找到相关活动':'从一首熟悉的旋律开始'}</h2><p>${ui.query||ui.filter!=='all'?'试试其他关键词或清除筛选。':'制作自己的填词模板，让每个班唱出不同的歌词。'}</p>${B(ui.query||ui.filter!=='all'?'清除筛选':'新建编唱活动',ui.query||ui.filter!=='all'?'clear-filter':'new','primary')}</div>`''',
                       '''`<p class="lh-empty" role="status">${filtered?'未找到匹配的活动。':cases?'暂无已发布的案例。':'暂无我制作的活动。'}</p>`''')
        text = replace(text, "else if(a==='clear-filter'){ui.query='';ui.filter='all';render();}\n", '')
    else:
        text = replace(text, "B('玩法说明','home-guide','quiet')}${B('＋ 新建音乐活动','new','primary')", "B('新建活动','new','primary','data-icon=\"plus\"')")
        text = replace(text, 'placeholder="搜索活动、歌曲或教学目标"', 'placeholder="搜索活动"')
        text = replace(text, '''<div class="lh-search wb-library-search">''', '''<label class="lh-search wb-library-search">''')
        text = replace(text, '''data-input="search" value="${E(query)}"></div></div>''', '''data-input="search" value="${E(query)}"></label></div>''')
        for tab in ('library', 'mine'):
            text = replace(text, f"""'data-tab="{tab}" aria-pressed="'+(homeTab==='{tab}')+'"'""",
                           f'''`data-tab="{tab}" role="tab" id="library-tab-{tab}" aria-controls="activity-library-results" aria-selected="${{homeTab==='{tab}'}}" tabindex="${{homeTab==='{tab}'?0:-1}}"`''')
        text = replace(text, "B('继续修改','entry-edit',(!ready||changed?'primary':'secondary')+size,attrs)",
                       "B(window.WBWorkbenchApi?.readOnly?'查看备课':'继续备课','entry-edit',(!ready||changed?'primary':'secondary')+size,attrs)")
        text = replace(text, '''function library(){
  const recent=L.recentDraft(works.items,M),recentMeta=recent?L.metadata(recent,M):null;
  const entries=''', '''function musicLibraryResults(){
  const entries=''')
        text = replace(text, "filtered=!!(query||filter", "filtered=!!(query.trim()||filter")
        text = replace(text, '''  return `<div class="music-home library-home">''', '''  const cases=homeTab==='library';
  if(cases&&caseLibrary?.message)return `<p class="lh-empty" role="status">${E(caseLibrary.message)}</p>`;
  const cards=visible.map(entry=>homeCard(entry.data,entry.source,entry.id)).join('');
  return `<div class="lh-results-head"><span role="status" aria-live="polite">共 ${visible.length} 项</span></div><div class="home-cards lh-grid${cases?' wb-case-grid':''}">${cards||`<p class="lh-empty" role="status">${filtered?'未找到匹配的活动。':cases?'暂无已发布的案例。':'暂无我制作的活动。'}</p>`}</div>`;
}
function library(){
  return `<div class="music-home library-home">''')
        text = replace(text, '''  ${homeTab==='mine'&&recent?`<section class="lh-resume" aria-label="继续备课"><div><span>继续上次备课</span><strong>${E(recentMeta.title)}</strong><small>${{song:'歌曲准备',type:'选择活动',edit:'活动编辑',preview:'核对授课版'}[L.resumeView(recent)]} · ${savedTime(recent.savedAt)}</small></div>${B('继续编辑 →','entry-edit','quiet',`data-entry="${E(recent.activityId)}" data-source="mine"`)}</section>`:''}
  <div class="home-results-head lh-results-head"><span aria-live="polite">${visible.length} 个活动</span></div>
  <div class="home-cards lh-grid${homeTab==='library'?' wb-case-grid':''}">${homeTab==='library'&&caseLibrary?.message?`<p class="lh-empty" role="status">${E(caseLibrary.message)}</p>`:visible.map(e=>homeCard(e.data,e.source,e.id)).join('')||`<section class="home-empty lh-empty"><span aria-hidden="true">♫</span><h2>${filtered?'没有找到匹配的活动':'还没有自己的音乐活动'}</h2><p>${filtered?'试试其他关键词，或清除筛选条件。':'可以从案例库制作同款，也可以从一首新歌开始。'}</p>${filtered?B('清除筛选','home-clear','small'):B('浏览案例库','home-tab','small','data-tab="library"')+B('新建音乐活动','new','small primary')}</section>`}</div>''',
                       '''  <section id="activity-library-results" role="tabpanel" aria-labelledby="library-tab-${homeTab}">${musicLibraryResults()}</section>''')
        text = replace(text, "case 'home-tab':homeTab=el.dataset.tab;homeStatus='all';query='';",
                       "case 'home-tab':homeTab=el.dataset.tab;homeStatus='all';")
        text = replace(text, "case 'home-clear':homeStatus='all';query='';", "case 'home-clear':homeStatus='all';")
        text = replace(text, "if(k==='search'){const at=el.selectionStart;query=el.value;render();const search=app.querySelector('[data-input=\"search\"]');search.focus();try{search.setSelectionRange(at,at);}catch{}}",
                       "if(k==='search'){query=el.value;const results=document.getElementById('activity-library-results');if(results)results.innerHTML=musicLibraryResults();return;}")
    return marker + library_empty_controls(module, text)


def music_library_guide(text):
    guide = '''${B('玩法说明','home-guide','quiet small','aria-haspopup="dialog"')}'''
    if guide in text:
        return text
    old_guide = "${B('玩法说明','home-guide','quiet small')}"
    if old_guide in text:
        text = replace(text, old_guide, '')
    return replace(text, '<div><h1>星光音乐棚</h1></div>',
                   '<div class="row"><h1>星光音乐棚</h1>' + guide + '</div>')


def compact_library_buttons(module, text):
    if 'data-wb-create' in text:
        return text
    text = replace(text, """B('新建活动','new','primary','data-icon="plus"')""",
                   """B('新建活动','new','primary','data-wb-create data-icon="plus"')""")
    options = ('data-filter="${id}"',) if module == 'song' else ('data-filter="${s.id}"', 'data-status="${status}"')
    for attribute in options:
        text = replace(text, attribute + ' aria-pressed=', 'data-wb-filter ' + attribute + ' aria-pressed=')
    if module == 'music':
        text = replace(text, """'home-filters','small flat')""",
                       """'home-filters','small','data-wb-button="secondary" data-wb-size="sm" aria-haspopup="dialog"')""")
    return text


def patch(module, document):
    marker = '/* workbench-song-music-backend */'
    if module == 'song':
        if marker not in document:
            document = script(document, 'song/model.js', lambda body: replace(body, "(image.kind === 'upload' &&", "(image.kind === 'remote' && !!window.WBSongMusicBackend?.resourceUrl(image.value)) ||\n       (image.kind === 'upload' &&"))
        return script(document, 'song/app.js', lambda body: compact_library_buttons(module, library_controls(module, case_presentation(module, database_cases(module, live_catalog(module, body if marker in body else marker + song(body)))))))
    if module == 'music':
        return script(document, 'app.js', lambda body: compact_library_buttons(module, music_library_guide(library_controls(module, case_presentation(module, database_cases(module, live_catalog(module, body if marker in body else marker + music(body))))))))
    raise ValueError(f"Unsupported song/music module: {module}")
