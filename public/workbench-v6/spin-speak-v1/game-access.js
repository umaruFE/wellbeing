/* Shared classroom affordances; business state belongs to each original game. */
(()=>{
 const names={tempo:'节奏挑战',volume:'音量挑战',energy:'情绪应答',words:'动作挑战',role:'角色扮演',silly:'离谱问答机',flip:'翻牌问答'};
 const game=document.body.dataset.game;
 const scenes={tempo:'节奏唱片铺',volume:'声音广播站',energy:'情绪充电花园',words:'动作冒险营地',role:'声音小剧场',silly:'奇妙组合游乐铺',flip:'答案发现博物馆'};
 if(game==='tempo'){document.getElementById('spres').textContent='';document.getElementById('tip').textContent='R = SPIN　·　SPACE = COMPLETE';}
 if(game==='silly')document.getElementById('ftip').textContent='R = RE-SPIN　·　SPACE = COMPLETE';
 function fitStage(){const stage=document.getElementById('stage');if(stage)stage.style.transform='scale('+Math.min(innerWidth/1280,innerHeight/720)+')';}
 addEventListener('resize',fitStage);fitStage();
 const title=document.querySelector('.badge,.mv-title,.title h1');
 if(title){const en={tempo:'Tempo Challenge',volume:'Volume Challenge',energy:'Energy Response',words:'Words in Motion',role:'Role Play',silly:'Silly Machine',flip:'Flip & Answer'};title.dataset.number=String(Object.keys(names).indexOf(game)+1).padStart(2,'0');title.textContent=en[game];const sub=document.createElement('span');sub.className='game-cn';sub.textContent=scenes[game];title.append(sub);}
 const help=document.querySelector('#helpBtn');if(help){help.textContent='玩法';help.setAttribute('aria-label','查看玩法');}
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[role="button"]')){e.preventDefault();e.target.click();}if(e.key==='Escape')document.querySelector('.notes')?.classList.remove('on');});
 const notes=document.querySelector('.notes'); if(notes){notes.setAttribute('role','dialog');notes.setAttribute('aria-label','玩法说明');}
 if(game==='role'){
  const guide=document.querySelector('.guide');if(guide){guide.childNodes.forEach(n=>{if(n.nodeType===3)n.remove();});const instruction=document.createElement('span');instruction.className='voice-instruction';instruction.textContent='Pick a role and say in its voice:';guide.prepend(instruction);}
 }
 if(game==='flip'){document.querySelectorAll('.mdec').forEach(el=>el.remove());document.querySelector('.rv-sub').textContent='Three answers collected — now read the whole introduction.';document.querySelector('.rv-badge').textContent='ALL ANSWERS FOUND · 3/3';}
 if(game==='volume'){
  setMode('teacher');
  document.querySelector('button[data-mode="teacher"]').textContent='教师判断';document.querySelector('button[data-mode="mic"]').textContent='麦克风辅助';
  const prior=setMode;setMode=function(m){suspendRecording();rec=null;recordingPaused=false;prior(m);};
 }
 function stopAudio(){
  if(typeof beatAudio!=='undefined'&&beatAudio){beatAudio.pause();if(game==='tempo'&&!finished)el.beat.textContent='▶ PLAY THE BEAT';}
  if('speechSynthesis' in window)speechSynthesis.cancel();
  if(typeof suspendRecording==='function')suspendRecording();
  else if(typeof ac!=='undefined'&&ac){try{ac.close()?.catch(()=>{});}catch{}ac=null;}
 }
 SS_LIFECYCLE.subscribe(({paused})=>{if(paused)stopAudio();});
 if(SS_DATA){
   const generic={tempo:'转动速度盘，跟着节奏读完整句。老师听读词和节拍，完成后点击 COMPLETE。',volume:'抽取一个音量档，用这个音量读完整句。默认由老师判断；麦克风辅助显示相对输入强度，不代表标准分贝或口语评分。',energy:'抽取一个情绪，用对应语气回答左边的问题。老师判断语气和读词，完成后点击 COMPLETE。',words:'选择一个词组填空，为它编一个动作，再逐词边读边做动作。say your own 表示口头说出自己的词组。',role:'翻开一张角色卡，看画像、听角色的出场声。点卡面上的「重听」可以再听一次。模仿它的声音读目标句，老师确认后点 COMPLETE。',silly:'分别抽取动作和角色，读出组合后的完整答句。两个滚轮都停下后，老师可点击 COMPLETE。',flip:'先听问题，翻开匹配的答案卡并说出答案。翻错会自动盖回，翻对后由老师点击 CORRECT，完成三题再读完整介绍。'};
   const panel=notes?.querySelector('.cardn,.card'); if(panel){panel.innerHTML='<h3>'+names[game]+' · 怎么玩</h3><p>'+generic[game]+'</p><p style="margin-top:16px">R：重新抽取 / 洗牌　空格：完成当前任务</p><button class="close" id="closeNotes">知道了</button>';panel.querySelector('button').onclick=()=>notes.classList.remove('on');}
 }
})();
