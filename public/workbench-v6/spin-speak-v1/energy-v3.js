(() => {
  'use strict';
  const $=s=>document.querySelector(s),stage=$('#stage');
  if(new URLSearchParams(location.search).has('session')&&!SS_DATA)return;
  const defaults={question:'Do you want to join our family dinner?',answers:[
    {label:'SUPER!',text:"Yes! I'd love to!"},{label:'HAPPY',text:'Yes! That sounds so fun!'},
    {label:'READY',text:"OK! I can't wait!"},{label:'SO-SO',text:'Maybe next time.'},
    {label:'TIRED',text:"No, thanks. I'm tired."},{label:'EMPTY',text:"Sorry, I can't come today."}
  ]};
  const content=SS_DATA||defaults;
  if(typeof content.question!=='string'||!Array.isArray(content.answers)||content.answers.length!==6){
    stage.innerHTML='<div class="content-error"><h1>预览内容不完整</h1><p>需要一个问句和六档答句，请返回备课页检查后重新预览。</p></div>';return;
  }
  const icon=(body,view='0 0 32 32')=>'<svg viewBox="'+view+'" aria-hidden="true">'+body+'</svg>';
  const dice=icon('<rect x="5" y="5" width="22" height="22" rx="5" fill="#fff8e8" stroke="currentColor" stroke-width="2" transform="rotate(-9 16 16)"/><g fill="currentColor"><circle cx="11" cy="11" r="1.8"/><circle cx="21" cy="11" r="1.8"/><circle cx="16" cy="16" r="1.8"/><circle cx="11" cy="21" r="1.8"/><circle cx="21" cy="21" r="1.8"/></g>');
  const check=icon('<path d="m6 16 7 7L27 8" fill="none" stroke="currentColor" stroke-width="4"/>');
  const replay=icon('<path d="M7 12a10 10 0 1 1-1 9M6 4v9h9" fill="none" stroke="currentColor" stroke-width="2.5"/>');
  function moodIcon(i){
    if(i===5)return icon('<rect x="3" y="8" width="24" height="16" rx="4" fill="#fff6cf" stroke="#825b8c" stroke-width="1.8"/><path d="M28 13h2v6h-2" fill="#ab8ac7" stroke="#825b8c" stroke-width="1.8"/><rect x="6" y="11" width="4" height="10" rx="1.5" fill="#ef9b83"/><path d="m18 10-4 6h4l-2 6" fill="none" stroke="#ad8cae" stroke-width="1.5"/>');
    const faces=[
      '<path d="m10 7 1.2 2.4 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4Zm12 0 1.2 2.4 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4Z" fill="#8b5bab" stroke-width=".7"/><path d="M9 18q7 12 14 0Z" fill="#89507b"/><path d="M12 20h8" stroke="#fff9e9" stroke-width="2"/>',
      '<path d="M8 12q3-5 6 0m4 0q3-5 6 0" fill="none"/><path d="M10 19q6 8 12 0Z" fill="#9c5d77"/>',
      '<path d="M10 11v3m12-3v3M10 20q6 5 12 0" fill="none"/>',
      '<path d="M10 11v3m12-3v3M11 21h10" fill="none"/>',
      '<path d="M8 13q3 3 6 0m4 0q3 3 6 0" fill="none"/><ellipse cx="16" cy="22" rx="2.6" ry="3.6" fill="#9c7ba6"/>'
    ];
    return icon('<circle cx="16" cy="16" r="14" fill="'+(i===4?'#e7d5fc':'#ffdf74')+'" stroke="#95678e" stroke-width="1.6"/><path d="M4 20a13 13 0 0 0 24 0" fill="none" stroke="'+(i===4?'#c6abe2':'#efb957')+'" stroke-width="2.6"/><g stroke="#7e5489" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+faces[i]+'</g>');
  }
  $('#question').textContent=content.question;
  const hues=['#77ce9a','#86d39b','#a3d67b','#c3dc70','#f1d56e','#eeae87'];
  // One curved cavity owns the perspective; six energy bands share its clip.
  const bezelContour='M12 .8Q81 12.8 150 .8Q160-1 160 11V351Q160 358 150 361Q81 375 12 361Q2 358 2 351V11Q2-1 12 .8Z';
  const wellContour='M19 13Q81 25 143 13Q151 12 151 20V343Q151 350 143 352Q81 364 19 352Q11 350 11 343V20Q11 12 19 13Z';
  const bands=hues.map((_,i)=>{
    const y=3.5+i*58;
    return '<g class="battery-segment" data-index="'+i+'">'+
      '<path class="segment-fold" d="M12 '+y+'L25 '+(y+2)+'V'+(y+46)+'L12 '+(y+57)+'ZM137 '+(y+2)+'L150 '+y+'V'+(y+57)+'L137 '+(y+46)+'Z"/>'+
      '<path class="segment-return" d="M12 '+y+'Q81 '+(y+12)+' 150 '+y+'L137 '+(y+2)+'Q81 '+(y+14)+' 25 '+(y+2)+'Z"/>'+
      '<path class="segment-fill" d="M25 '+(y+2)+'Q81 '+(y+14)+' 137 '+(y+2)+'V'+(y+46)+'Q81 '+(y+58)+' 25 '+(y+46)+'Z"/>'+
      '<path class="segment-depth" d="M25 '+(y+46)+'Q81 '+(y+58)+' 137 '+(y+46)+'L150 '+(y+57)+'Q81 '+(y+69)+' 12 '+(y+57)+'Z"/>'+
      '<path class="segment-seam" d="M25 '+(y+3)+'V'+(y+46)+'Q81 '+(y+58)+' 137 '+(y+46)+'V'+(y+3)+'M25 '+(y+46)+'l-13 11M137 '+(y+46)+'l13 11"/>'+
      '</g>';
  }).join('');
  const markers=hues.map((_,i)=>'<path class="cell-marker" data-index="'+i+'" d="M153 '+(32.5+i*58)+'l5 4-5 4Z"/>').join('');
  const separators=Array.from({length:5},(_,i)=>{
    const y=57.5+i*58;
    return '<g class="cell-divider"><path class="divider-tab" d="M11 '+(y-1.5)+'l10 1.7v5.2l-10-1.7ZM151 '+(y-1.5)+'l-10 1.7v5.2l10-1.7Z"/></g>';
  }).join('');
  const fasteners=[[6.5,15],[155.5,15],[6.5,346],[155.5,346]].map(([x,y])=>'<g class="rim-fastener"><circle cx="'+x+'" cy="'+y+'" r="2.1"/><path d="M'+(x-1)+' '+y+'h2"/></g>').join('');
  const railDetails='<path class="cell-side-left" d="M17 13L23 14V355L17 354Z"/><path class="cell-side-right" d="M139 14L145 13V354L139 355Z"/><path class="meter-rail" d="M11 12H17V362H11ZM145 12H151V362H145Z"/><path class="rail-edge" d="M17 19V351M145 19V351"/>';
  $('#battery').innerHTML='<svg class="battery-meter" viewBox="0 0 162 370" aria-hidden="true" focusable="false"><defs><path id="energy-bezel" d="'+bezelContour+'"/><path id="energy-well" d="'+wellContour+'"/><clipPath id="energy-well-clip"><use href="#energy-well"/></clipPath><clipPath id="energy-bezel-clip"><use href="#energy-bezel"/></clipPath></defs><use class="meter-bezel" href="#energy-bezel"/><g clip-path="url(#energy-bezel-clip)"><path class="rim-face" d="M12 .8Q81 12.8 150 .8L150 4Q81 16 12 4Z"/><path class="rim-side" d="M153 8H160V351L153 357Z"/><path class="meter-base" d="M2 344Q2 352 12 355Q81 369 150 355Q160 352 160 344V374H2Z"/></g><use class="meter-lip" href="#energy-well"/><use class="meter-well" href="#energy-well"/><g clip-path="url(#energy-well-clip)">'+bands+separators+railDetails+'<path class="meter-inset" d="M18 13Q81 25 143 13L151 18Q81 30 11 18Z"/></g><use class="meter-inner-edge" href="#energy-well"/>'+fasteners+'<g class="cell-markers">'+markers+'</g></svg>';
  $('#answer-rows').innerHTML=content.answers.map((a,i)=>'<div class="answer-row" tabindex="0" data-index="'+i+'" aria-label="'+SS_ESCAPE(a.label+': '+a.text)+'"><div class="answer-card"><span class="mood-icon" aria-hidden="true">'+moodIcon(i)+'</span><span class="answer-copy"><span class="mood-name">'+SS_ESCAPE(a.label)+'</span><span class="answer-text">'+SS_ESCAPE(a.text)+'</span></span></div></div>').join('');
  const rows=[...document.querySelectorAll('.answer-row')],bars=[...document.querySelectorAll('.battery-segment')];
  const draw=$('#drawBtn'),done=$('#doneBtn'),pointer=$('#arrowBtn'),help=$('#helpDialog'),answers=$('#answer-rows');
  draw.querySelector('.button-icon').innerHTML=dice;done.querySelector('.button-icon').innerHTML=check;
  let active=-1;
  function positionPointer(){
    const row=rows[Math.max(active,0)],y=row.offsetTop-answers.scrollTop+row.offsetHeight/2-14;
    const visible=y>=-8&&y<=answers.clientHeight-20;
    pointer.style.top=y+'px';pointer.style.visibility=visible?'visible':'hidden';
    const link=$('#selected-link'),show=active>=0&&stage.dataset.phase!=='idle'&&visible;
    link.toggleAttribute('hidden',!show);link.style.visibility=show?'visible':'hidden';
    if(show){const startY=258.5+active*58,endY=parseFloat(getComputedStyle($('.mood-machine')).top)+y+14;link.setAttribute('d','M807 '+startY+' C815 '+startY+' 815 '+endY+' 824 '+endY);}
  }
  const round=EnergyRound({schedule:SS_LIFECYCLE.setTimeout,cancel:SS_LIFECYCLE.clearTimeout,reduceMotion:()=>matchMedia('(prefers-reduced-motion: reduce)').matches,onChange:s=>{
    stage.dataset.phase=s.phase;active=s.active;
    rows.forEach((row,i)=>{row.classList.toggle('active',(s.phase==='selected'||s.phase==='complete')&&i===s.active);row.classList.toggle('scan',s.phase==='drawing'&&i===s.active);row.setAttribute('aria-current',i===s.active?'true':'false');});
    $('#battery').style.setProperty('--charge',hues[Math.max(s.active,0)]);
    bars.forEach((bar,i)=>{bar.classList.toggle('lit',s.active>=0&&i>=s.active);bar.classList.toggle('current',s.active===i&&s.phase!=='idle');});
    document.querySelectorAll('.cell-marker').forEach((marker,i)=>marker.classList.toggle('current',s.active===i&&s.phase!=='idle'));
    $('.hero-battery').setAttribute('aria-label',s.active===5?'EMPTY mood; bottom segment highlighted':'Energy level: '+(s.active<0?'not drawn':s.level+' of 6'));
    draw.disabled=pointer.disabled=s.phase==='drawing'||s.phase==='complete';done.disabled=s.phase==='idle'||s.phase==='drawing';
    draw.querySelector('.button-text').textContent=s.phase==='drawing'?'WAIT':s.phase==='complete'?'DONE':s.phase==='idle'?'DRAW':'AGAIN';
    draw.setAttribute('aria-label',s.phase==='drawing'?'Drawing a mood':s.phase==='complete'?'Round complete':s.phase==='idle'?'Draw a mood':'Draw another mood');
    draw.setAttribute('aria-busy',String(s.phase==='drawing'));
    done.querySelector('.button-text').textContent=s.phase==='complete'?'PLAY AGAIN':'COMPLETE';done.querySelector('.button-icon').innerHTML=s.phase==='complete'?replay:check;
    if(s.phase==='idle'){$('#mood-status').textContent='What will your mood be?';$('#tip').textContent='Draw a mood, then say your answer.';answers.scrollTop=0;}
    if(s.phase==='drawing'){$('#mood-status').textContent='Finding your mood…';$('#tip').textContent='Watch the energy move!';}
    if(s.phase==='selected'){$('#mood-status').textContent=content.answers[s.active].label+' · Your turn to answer';$('#tip').textContent='Read the highlighted answer with this feeling.';}
    if(s.phase==='complete'){$('#mood-status').textContent='Nicely expressed!';$('#tip').textContent='Round complete. Ready for another feeling?';}
    if(s.active>=0){const row=rows[s.active];if(row.offsetTop<answers.scrollTop)answers.scrollTop=row.offsetTop;else if(row.offsetTop+row.offsetHeight>answers.scrollTop+answers.clientHeight)answers.scrollTop=row.offsetTop+row.offsetHeight-answers.clientHeight;}
    positionPointer();$('#answers-cue').hidden=answers.scrollHeight<=answers.clientHeight+3;
  }});
  draw.onclick=pointer.onclick=()=>round.draw();done.onclick=()=>round.snapshot().phase==='complete'?round.reset():round.complete();
  $('#helpBtn').onclick=()=>help.showModal();$('#closeHelp').onclick=()=>help.close();
  help.addEventListener('close',()=>$('#helpBtn').focus());
  document.addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey||e.repeat||help.open)return;if(e.key.toLowerCase()==='r'){e.preventDefault();round.draw();}if(e.code==='Space'){e.preventDefault();round.snapshot().phase==='complete'?round.reset():round.complete();}});
  SS_LIFECYCLE.subscribe(({paused})=>{stage.dataset.hidden=String(paused);});
  answers.addEventListener('scroll',positionPointer);
  function fit(){stage.style.transform='scale('+Math.min(innerWidth/1280,innerHeight/720)+')';}
  function fitQuestion(){const q=$('#question');q.style.fontSize='31px';for(let n=31;n>25&&q.scrollHeight>q.clientHeight+1;n--)q.style.fontSize=(n-1)+'px';$('.question-panel').dataset.overflow=String(q.scrollHeight>q.clientHeight+1);}
  const qScroll=$('#question');qScroll.addEventListener('scroll',()=>$('.question-cue').style.visibility=qScroll.scrollTop+qScroll.clientHeight>=qScroll.scrollHeight-2?'hidden':'visible');
  addEventListener('resize',fit);fit();round.reset();document.fonts.ready.then(()=>{fitQuestion();positionPointer();$('#answers-cue').hidden=answers.scrollHeight<=answers.clientHeight+3;});
})();
