(function () {
  'use strict';

  const api=window.WBWorkbenchApi, M=window.YogaModel, L=window.YogaLibrary;
  if(!api||api.offline)return;

  const moduleId='interactive-yoga', collection='/api/creative-works';
  const rowsUrl=`${collection}?moduleId=${moduleId}`;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const clean=value=>String(value??'').replace(/</g,'＜');
  const speechVoices={gentle:'en-US-JennyNeural',bright:'en-US-AriaNeural',calm:'en-US-GuyNeural'};

  function workParams(record) {
    const settings=record.state.draft?.settings||record.workspace.form||record.state.settings;
    return {
      theme:settings.theme||'',age:settings.age||'',duration:`${parseFloat(settings.duration)||8}分钟`,
      goals:[settings.goal,...M.languageGoals(settings)].filter(Boolean).join('\n'),
      requirements:[settings.context,settings.sentence,`编排时使用 ${settings.characterId||'Poppy'} 作为引导角色。`].filter(Boolean).join('\n'),
      workbenchYoga:record,
    };
  }
  function oldPage(page,index) {
    const pose=M.ACTIONS.find(action=>action.id===page.actionId)?.english||page.backendPose||null;
    const type={cover:'scene',ending:'ending',intro:'transition',action:'action'}[page.kind];
    const image=M.safeMediaUrl(page.backgroundUrl);
    return {id:page.id,page:index+1,type,pose,subtitle:clean(page.english),teacherLang:clean(page.teacher),
      expression:clean(page.story),action:clean(page.story),imagePrompt:clean(page.scene),node:page.kind==='action'?'🌿':'✦',...(image&&page.assets.background==='ready'?{img:clean(image)}:{})};
  }
  function initialSettings(row) {
    const p=row.parameters||{}, base=M.createState().settings;
    return {...base,title:String(row.title||base.title),theme:String(p.theme||base.theme),age:String(p.age||base.age),
      duration:Math.min(60,Math.max(1,parseFloat(p.duration)||base.duration)),goal:String(p.goals||base.goal).split('\n')[0],context:String(p.requirements||base.context)};
  }
  function recordFor(row) {
    if(!Number.isSafeInteger(Number(row?.id))||Number(row.id)<=0)throw Error('后台课程编号无效。');
    const saved=row.parameters?.workbenchYoga;
    if(saved)return L.validate({schema:1,activeId:saved.id,items:[saved]}).items[0];
    const id=`creative-yoga-${row.id}`, result=row.result||{}, settings=initialSettings(row);
    let state=M.createState();
    if(Array.isArray(result.pages)&&result.pages.length>=6)state=M.useBackendCourse(state,settings,{title:result.title||row.title,pages:result.pages});
    const workspace=state.draft?{step:2}:{form:{...settings,title:String(settings.title).slice(0,70),theme:String(settings.theme).slice(0,100),age:String(settings.age).slice(0,40),goal:String(settings.goal).slice(0,220),context:String(settings.context).slice(0,500)}};
    const record=L.createRecord(state,{id,now:row.created_at,workspace});
    return L.validate({schema:1,activeId:id,items:[{...record,updatedAt:row.updated_at||record.updatedAt,...(result.plan?{backendPlan:result.plan}:{})}]}).items[0];
  }
  function createStore(onChange) {
    const token=localStorage.getItem('token');
    const tabKey='wellbeing-workbench-tab', tab=sessionStorage.getItem(tabKey)||crypto.randomUUID();
    sessionStorage.setItem(tabKey,tab);
    const key=`${L.KEY}:creative-sync:${tab}`;
    const pending=new Map(api.readOnly?[]:JSON.parse(localStorage.getItem(key)||'[]').map(entry=>[entry.record.id,entry]));
    const known=new Map(), baseline=new Map();
    let value=null, job=null, timer, lastError=null, status='loading', unavailable=0;

    async function request(path,options={}) {
      if(!token||token!==localStorage.getItem('token'))throw Error('登录已变化，请重新打开课程。');
      return api.request(path,{...options,token});
    }
    function savePending(){if(pending.size)localStorage.setItem(key,JSON.stringify([...pending.values()]));else localStorage.removeItem(key);}
    function change(next,message=null){status=next;lastError=message;onChange?.();}
    function remember(row){const record=recordFor(row);known.set(record.id,{id:row.id,updatedAt:row.updated_at});return record;}
    async function findRow(id) {
      const {data}=await request(rowsUrl,{timeout:20000});
      const row=data.find(row=>row.parameters?.workbenchYoga?.id===id||`creative-yoga-${row.id}`===id);
      if(row)remember(row);
      return row;
    }
    function defer(){clearTimeout(timer);timer=setTimeout(()=>void flush(),550);}

    function set(raw){
      if(api.readOnly)throw Error('当前连接只读后台，无法保存课程。');
      const next=L.validate(raw);
      const previous=new Map(pending);
      try{
        for(const record of next.items)if(baseline.get(record.id)!==record.saveToken){
          const previous=pending.get(record.id);
          pending.set(record.id,{record,expected:previous?previous.expected:known.get(record.id)?.updatedAt||null});
        }
        savePending();
      }catch(error){pending.clear();for(const entry of previous)pending.set(...entry);throw error;}
      value=JSON.stringify(next);
      if(pending.size&&status!=='conflict'){change('pending');defer();}
    }
    async function load(){
      const {data}=await request(rowsUrl,{timeout:20000});
      if(!Array.isArray(data))throw Error('后台返回的课程列表格式有误。');
      const records=new Map();
      unavailable=0;
      for(const row of data){
        try{
          const record=recordFor(row);
          if(records.has(record.id)){unavailable++;continue;}
          known.set(record.id,{id:row.id,updatedAt:row.updated_at});
          baseline.set(record.id,record.saveToken);records.set(record.id,record);
        }catch(_){unavailable++;}
      }
      let legacy=null;
      if(!api.readOnly)try{legacy=L.load(localStorage);}catch(_) { /* Preserve unreadable local files for offline recovery. */ }
      for(const record of legacy?.items||[])if(!records.has(record.id)&&!pending.has(record.id))pending.set(record.id,{record,expected:null});
      for(const [id,entry] of pending){if(records.get(id)?.saveToken===entry.record.saveToken)pending.delete(id);else records.set(id,entry.record);}
      if(!api.readOnly)savePending();
      const items=[...records.values()];
      value=JSON.stringify(L.validate({schema:1,activeId:items.some(r=>r.id===legacy?.activeId)?legacy.activeId:null,items}));
      if(pending.size){change('pending');defer();}else change('synced');
    }
    async function syncRecord({record,expected}) {
      let binding=known.get(record.id), snap=record.state.draft, parameters=workParams(record);
      const title=clean(record.displayTitle||snap?.title||record.workspace.form?.title||'未命名情境瑜伽');
      if(!binding){
        const {data}=await request(collection,{method:'POST',body:{moduleId,moduleName:'情境瑜伽',title,parameters}}).catch(async error=>{
          const row=await findRow(record.id);
          if(!row)throw error;
          return {data:row};
        });
        remember(data);binding=known.get(record.id);
        if(!snap&&!record.backendPlan)return;
      }
      const pages=snap?.pages.map(oldPage);
      const payload={title, parameters, expectedUpdatedAt:expected||binding.updatedAt, ...(pages?{pages}:{}), ...(record.backendPlan?{plan:record.backendPlan}:{})};
      try{
        const {data}=await request(`${collection}/${binding.id}`,{method:'PUT',body:payload,timeout:20000});
        if(!data)throw Error('后台没有确认保存。');
        remember(data);
      }catch(error){
        if(error.status!==409)throw error;
        const {data}=await request(`${collection}/${binding.id}`,{timeout:20000});
        // A lost save response can be acknowledged by its persisted local token.
        if(data?.parameters?.workbenchYoga?.saveToken!==record.saveToken)throw error;
        remember(data);
      }
    }
    function flush(){
      if(job)return job;
      if(!pending.size)return Promise.resolve(true);
      if(status==='conflict')return Promise.resolve(false);
      clearTimeout(timer);change('pending');
      job=(async()=>{
        while(pending.size){
          const entry=pending.values().next().value,{record}=entry;
          await syncRecord(entry);
          baseline.set(record.id,record.saveToken);
          const latest=pending.get(record.id);
          if(latest?.record.saveToken===record.saveToken)pending.delete(record.id);
          else if(latest)latest.expected=known.get(record.id).updatedAt;
          savePending();
        }
        change('synced');return true;
      })().catch(error=>{change(error.status===409?'conflict':'unsynced',error);return false;}).finally(()=>{job=null;});
      return job;
    }
    async function generate(id,requirements,signal){
      if(!await flush())throw lastError||Error('请先完成草稿同步。');
      const workId=known.get(id)?.id;if(!workId)throw Error('未找到后台课程。');
      const saved=JSON.parse(value).items.find(record=>record.id===id);
      const plan=requirements?saved?.backendPlan:((await request(`${collection}/${workId}/plan`,{method:'POST',body:{preview:true},signal,timeout:180000})).data?.plan);
      const {data}=await request(`${collection}/${workId}/design`,{method:'POST',body:{preview:true,plan,requirements},signal,timeout:180000});
      if(!Array.isArray(data?.pages))throw Error('后台返回的课程设计缺少页面。');
      return {...data,plan};
    }
    function background(course,page,overrides,signal){
      const pose=M.ACTIONS.find(action=>action.id===page.actionId)?.english||page.backendPose;
      const instruction=[`Guided yoga adventure illustration, ${course.title}.`,page.scene,overrides,
        pose?`Clearly demonstrate this pose with child-appropriate instruction: ${pose}.`:'Show the story atmosphere.',
        'Watercolor picture book illustration, completely text-free. No captions or watermarks.'].filter(Boolean).join(' ');
      const index=course.pages.findIndex(p=>p.id===page.id)+1;
      return request('/api/ai/generate-ppt-asset',{method:'POST',signal,body:{assetType:'image',assetCode:'B9',assetName:'情境瑜伽插图',prompt:instruction,
        options:{imageRatio:'16:9',imageStyle:'Watercolor Picture Book',negativePrompt:'letters, text, captions, watermark',referenceNotes:instruction,
          batchItems:[{page:index,pageType:oldPage(page,index-1).type,title:page.title,imagePrompt:page.scene,visibleEnglishText:'',prompt:instruction}],
          rawValues:{storybookTitle:course.title,storybookContent:page.english,storybookStyle:'Watercolor Picture Book',storybookGrade:course.settings.age}}}})
        .then(result=>resolveAsset(result.asset||result.assets?.[0]||result,signal));
    }
    async function resolveAsset(asset,signal){
      const pick=value=>M.safeMediaUrl(value?.url||value?.assetUrl||value?.imageUrl||value?.data?.url||value?.asset?.url);
      const direct=pick(asset);if(direct)return direct;
      const statusUrl=asset?.statusUrl||asset?.asset?.statusUrl;
      if(typeof statusUrl!=='string'||!statusUrl.startsWith('/api/'))throw Error('后台未返回图片任务。');
      return poll(statusUrl,pick,signal);
    }
    async function poll(path,pick,signal){
      for(let attempt=0;attempt<100;attempt++){
        signal?.throwIfAborted();
        await new Promise(resolve=>setTimeout(resolve,attempt<2?1200:3000));
        const result=await request(path,{signal,timeout:30000});
        if(['error','failed'].includes(result.status))throw Error(result.error||'素材生成失败，请重试。');
        const url=pick(result);if(url)return url;
      }
      throw Error('素材生成超时，请重试。');
    }
    async function voice(page,voiceOptions,signal){
      const body={text:page.english,voice_id:speechVoices[voiceOptions.id]||speechVoices.gentle,speed:voiceOptions.rate||.85,pitch:voiceOptions.pitch||1};
      const result=await request('/api/ai/generate-voice',{method:'POST',body,signal});
      const pick=value=>M.safeMediaUrl(value?.url||value?.audioUrl||value?.data?.url);
      const direct=pick(result);if(direct)return direct;
      if(!result.executionId)throw Error('后台未返回配音任务。');
      return poll('/api/ai/generate-voice?executionId='+encodeURIComponent(result.executionId),pick,signal);
    }
    async function reloadLatest(id){
      await findRow(id);
      const backup=localStorage.getItem(key);if(backup)localStorage.setItem(`${key}:backup`,backup);
      pending.delete(id);savePending();await load();
      return L.load(storage);
    }
    const storage={getItem:key=>key===L.KEY?value:null,setItem:(key,raw)=>{if(key!==L.KEY)throw Error('后台课程存储键无效。');set(raw);}};
    window.addEventListener('online',flush);
    return {storage,load,flush,generate,background,voice,reloadLatest,
      get dirty(){return pending.size>0;},get status(){return status;},get error(){return lastError;},get unavailable(){return unavailable;}};
  }

  function createPlayer(options={}) {
    const browser=window.YogaPlayback.createPlayer(options);
    let audio=null, state='idle', message='', progress=0;
    function status(next,detail=''){state=next;message=detail;options.onStatus?.({state,message,progress});}
    function stop(){
      if(!audio){browser.stop();return;}
      const previous=audio;audio=null;previous.pause();previous.removeAttribute('src');previous.load();progress=0;
      options.onProgress?.(0);status('idle');
    }
    async function play(text,voiceOptions={}){
      stop();
      const src=M.safeMediaUrl(voiceOptions.source||options.getSource?.());
      if(!src)return browser.play(text,voiceOptions);
      const player=new Audio(src);audio=player;status('starting');
      player.onplaying=()=>{if(audio===player)status('playing');};
      player.onpause=()=>{if(audio===player&&!player.ended)status('paused','已暂停');};
      player.ontimeupdate=()=>{if(audio===player&&player.duration>0){progress=player.currentTime/player.duration;options.onProgress?.(progress);}};
      player.onended=()=>{if(audio===player){progress=1;options.onProgress?.(1);status('ended','本页配音已结束。');options.onEnd?.();}};
      player.onerror=()=>{if(audio===player)status('error','后台配音无法播放，请重新生成或重试。');};
      try{await player.play();return audio===player;}catch(_){if(audio===player)status('error','后台配音无法播放，请重试。');return false;}
    }
    return {play,replay:play,stop,pause(){if(audio)audio.pause();else browser.pause();},
      async resume(){if(!audio)return browser.resume();try{await audio.play();return true;}catch(_){status('error','配音无法继续播放。');return false;}},
      destroy(){stop();browser.destroy();},getState(){return audio?{state,message,progress}:browser.getState();}};
  }

  window.YogaExistingBackend={createStore,createPlayer};
})();
