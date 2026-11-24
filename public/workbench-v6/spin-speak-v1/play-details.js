/* Presentation feedback for the existing games; never writes game or lesson data. */
(()=>{
 'use strict';
 const stage=document.getElementById('stage'),game=document.body.dataset.game;
 if(!stage)return;
 const $=s=>stage.querySelector(s),all=s=>[...stage.querySelectorAll(s)];
 const make=(cls,html)=>{const el=document.createElement('div');el.className=cls;el.innerHTML=html;return el;};
 const wave='<svg viewBox="0 0 48 28" aria-hidden="true"><path d="M5 11v6m7-12v18m8-20v22m8-17v12m8-16v20m7-13v6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
 const bolt='<svg viewBox="0 0 28 32" aria-hidden="true"><path d="M16 2 4 18h9l-2 12 13-18h-9z" fill="currentColor"/></svg>';
 const star='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="currentColor"/></svg>';
 const labels=game==='words'?['选动作','连起来说','完成']:game==='flip'?['听问题','翻牌回答','完成']:['抽取','开口说','完成'];
 const progress=make('play-progress',labels.map((s,i)=>'<span data-phase="'+i+'"><i>'+String(i+1)+'</i>'+s+'</span>').join(''));
 progress.setAttribute('aria-label','本轮进度');stage.append(progress);
 const celebration=make('round-celebration','<div class="celebration-stars">'+star+star+star+'</div><b>ROUND COMPLETE!</b><span>这一轮，完成！</span>');celebration.setAttribute('aria-hidden','true');stage.append(celebration);
 const bits=make('celebration-bits',Array.from({length:12},(_,i)=>'<i style="--i:'+i+';--burst-y:'+(125-i%3*95)+'px"></i>').join(''));bits.setAttribute('aria-hidden','true');stage.append(bits);
 let lastPhase='',lastChoice='',raf=0,trailTimer;
 function attr(el,key,value){if(el&&el.getAttribute(key)!==value)el.setAttribute(key,value);}
 function toggle(el,name,on){if(el&&el.classList.contains(name)!==on)el.classList.toggle(name,on);}
 function content(el,text){if(el&&el.textContent!==text)el.textContent=text;}
 function addDetails(){
  if(game==='tempo'&&!$('.rhythm-lights')){
   const lights=make('rhythm-lights','<span>'+wave+'</span><div>'+Array.from({length:12},(_,i)=>'<i style="--bar:'+i+';--level:'+(20+(i*17)%43)+'px"></i>').join('')+'</div>');lights.setAttribute('aria-hidden','true');$('.wside').prepend(lights);
   const rail=make('tempo-switches','<i></i><i></i><i></i><span>●</span>');rail.setAttribute('aria-hidden','true');$('.wheelpanel').append(rail);
  }
  if(game==='volume')all('.pick').forEach((el,i)=>{if(el.querySelector('.channel-hardware'))return;const detail=make('channel-hardware','<span class="channel-lamps">'+Array.from({length:5},(_,j)=>'<i class="'+(j<=i*2?'lit':'')+'"></i>').join('')+'</span><span class="mini-dial" style="--dial:'+(-45+i*45)+'deg"></span>');detail.setAttribute('aria-hidden','true');el.append(detail);});
  if(game==='energy'&&!$('.energy-readout')){const readout=make('energy-readout',bolt+'<span>抽取你的情绪电量</span>');readout.setAttribute('aria-live','polite');$('.bub.a').append(readout);$('.talk').append(make('energy-connector','<i></i><i></i><i></i>'));}
  if(game==='words')all('.sent .col').forEach((el,i)=>{attr(el,'data-order',String(i+1));el.style.setProperty('--step',i);});
  if(game==='role')all('.flip').forEach((el,i)=>{const back=el.querySelector('.card-back');if(back&&!back.querySelector('.voice-pattern')){const motif=make('voice-pattern',wave);motif.setAttribute('aria-hidden','true');back.append(motif);attr(back,'data-card',String(i+1).padStart(2,'0'));}});
  if(game==='silly'&&!$('.mix-action')){
   const wrap=make('mix-action','<span class="mix-join" aria-hidden="true">+</span><button class="mix-button" type="button">一起抽取<small>SPIN BOTH</small></button>');$('.mstage').append(wrap);
   wrap.querySelector('button').addEventListener('click',()=>{if(wrap.querySelector('button').disabled)return;$('#m_a').click();$('#m_b').click();});
  }
  if(game==='flip'){
   if(!$('.answer-collection')){const tray=make('answer-collection',Array.from({length:3},(_,i)=>'<span data-piece="'+i+'">'+(i+1)+'</span>').join(''));tray.setAttribute('aria-label','已收集答案 0 / 3');$('.qbar').insertBefore(tray,$('.qt'));}
   all('.mpcard').forEach((el,i)=>{attr(el.querySelector('.mpb'),'data-card',String.fromCharCode(65+i));});
  }
 }
 function update(){
  raf=0;addDetails();
  const doneButton=$('#doneBtn,#okBtn'),done=!!$('.rv.on')||!!doneButton?.textContent.includes('PLAY AGAIN');
  let busy=false,ready=!!doneButton&&!doneButton.disabled;
  if(game==='tempo')busy=!!$('#spinBtn')?.disabled&&!done;
  if(game==='volume')busy=!!$('.pick.roll');
  if(game==='energy')busy=!!$('.cell.flash');
  if(game==='silly')busy=!!$('.machine.spin');
  const phase=done?'complete':busy?'drawing':ready?'speaking':'ready';
  attr(stage,'data-play-phase',phase);
  const step=done?2:ready&&!busy?1:0;
  progress.querySelectorAll('[data-phase]').forEach((el,i)=>{attr(el,'data-state',i<step?'done':i===step?'current':'next');attr(el,'aria-current',i===step?'step':'false');});
  if(phase!==lastPhase){lastPhase=phase;toggle(stage,'round-complete',done);}
  if(game==='tempo'){attr(stage,'data-audio',!done&&!$('#beatBtn').disabled&&$('#beatBtn').textContent.includes('STOP')?'playing':'stopped');}
  if(game==='energy'){content($('.energy-readout span'),$('.cell.active .st')?.textContent|| (busy?'正在抽取…':'抽取你的情绪电量'));toggle($('.energy-readout'),'chosen',!!$('.cell.active'));}
  if(game==='words'){
   const choice=$('.opt.sel')?.getAttribute('data-sp')||'';
   if(choice&&choice!==lastChoice){toggle(stage,'word-trail',false);requestAnimationFrame(()=>toggle(stage,'word-trail',true));clearTimeout(trailTimer);trailTimer=setTimeout(()=>toggle(stage,'word-trail',false),all('.sent .col').length*90+900);}
   lastChoice=choice;
  }
  if(game==='silly'){const btn=$('.mix-button');if(btn.disabled!==!!(busy||done))btn.disabled=!!(busy||done);toggle($('.ans'),'sentence-ready',ready&&!busy&&!done);}
  if(game==='flip'){const count=done?3:all('.mpcard.lock').length;attr($('.answer-collection'),'aria-label','已收集答案 '+count+' / 3');all('[data-piece]').forEach((el,i)=>{attr(el,'data-collected',i<count?'true':'false');content(el,i<count?'✓':String(i+1));});}
 }
 const observer=new MutationObserver(()=>{if(!raf)raf=requestAnimationFrame(update);});
 update();observer.observe(stage,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','disabled']});
 addEventListener('pagehide',()=>{observer.disconnect();cancelAnimationFrame(raf);clearTimeout(trailTimer);});
})();
