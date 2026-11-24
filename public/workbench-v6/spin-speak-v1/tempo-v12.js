/* Isolated V12 presentation: original random result, audio and session logic are unchanged. */
(()=>{
  // Match the supplied illustration's aspect ratio without stretching its circles.
  const sceneHeight=1280*906/1736;
  const fitReferenceScene=()=>{
    document.getElementById('stage').style.transform='scale('+Math.min(innerWidth/1280,innerHeight/sceneHeight)+')';
  };
  addEventListener('resize',fitReferenceScene);fitReferenceScene();
  const controlBase=document.createElement('div');
  controlBase.className='tempo-control-base';controlBase.setAttribute('aria-hidden','true');
  document.getElementById('stage').append(controlBase);
  // Two opposing marquee trails follow the existing bulbs; skip pointer and stars.
  const rimLights=document.createElement('div');
  rimLights.className='tempo-rim-lights';rimLights.setAttribute('aria-hidden','true');
  for(let i=0;i<24;i++){
    if(i===0||i===6||i===18)continue;
    const angle=(i*15-90)*Math.PI/180;
    const lamp=document.createElement('i');lamp.className='tempo-rim-lamp';
    lamp.style.left=(1001.29+154.5*Math.cos(angle))+'px';
    lamp.style.top=(300.83+154.5*Math.sin(angle))+'px';
    lamp.style.setProperty('--lamp-offset',String((i%12)/12-1));
    rimLights.append(lamp);
  }
  document.getElementById('stage').append(rimLights);
  SS_LIFECYCLE.subscribe(({paused})=>{rimLights.dataset.paused=String(paused);});
  const title=document.querySelector('.title h1');
  document.querySelector('#helpBtn').textContent='?';
  title.innerHTML='<svg class="title-curve" viewBox="0 0 405 84" aria-hidden="true" focusable="false"><defs><path id="tempo-title-arc" d="M10 65 Q202.5 24 395 65"/></defs><text xml:space="preserve"><textPath href="#tempo-title-arc" startOffset="50%" text-anchor="middle"><tspan>Tempo </tspan><tspan class="challenge">Challenge</tspan></textPath></text></svg>';
  title.setAttribute('aria-label','Tempo Challenge · 节奏唱片铺');
  // Concrete speed cues, with one rounded outline and a shared cream / purple palette.
  const tempoIcons={
    slow:`<svg class="tempo-speed-icon" data-icon="snail" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <g stroke="#68416f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m33 22-3-9m7 9 4-10" fill="none"/>
        <path d="M5 35c9-1 17 2 23-3l1-8c0-5 3-7 6-6 4 1 4 5 4 9l-1 6c2 1 4 2 6 5 1 2-1 3-4 3H11c-4 0-7-2-8-4-1-1 0-2 2-2Z" fill="#fff1c8"/>
        <circle cx="18" cy="25" r="13" fill="#ffbd6d"/>
        <path d="M13 33c7 3 15-2 13-9-1-5-7-7-11-4-4 3-3 8 1 9 3 1 5-2 3-4" fill="none" stroke="#b87355" stroke-width="2.3"/>
      </g>
      <circle cx="30" cy="12" r="2" fill="#68416f"/><circle cx="41" cy="11" r="2" fill="#68416f"/>
    </svg>`,
    medium:`<svg class="tempo-speed-icon" data-icon="bicycle" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <g stroke="#68416f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="32" r="9" fill="#fff5d9"/><circle cx="37" cy="32" r="9" fill="#fff5d9"/>
        <path d="M11 26v12m-6-6h12m20-6v12m-6-6h12" stroke="#dfc5bb" stroke-width="1.2"/>
        <path d="m11 32 8-14 7 14H11m8-14h13l-6 14m11 0-7-21" fill="none" stroke-width="4.6"/>
        <path d="m11 32 8-14 7 14H11m8-14h13l-6 14m11 0-7-21" fill="none" stroke="#73cce0" stroke-width="2.5"/>
        <path d="M29 11h7q3 0 3 3" fill="none"/>
        <path d="M15 15h8" stroke-width="4.4"/>
        <circle cx="26" cy="32" r="2.5" fill="#ffca67" stroke-width="1.8"/>
        <path d="m26 32 3 4h3" fill="none" stroke-width="1.6"/>
      </g>
    </svg>`,
    fast:`<svg class="tempo-speed-icon" data-icon="rocket" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <g transform="rotate(35 24 24)" stroke="#68416f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 32c-2 5 0 10 5 14 5-4 7-9 5-14" fill="#ffce55" stroke="#bc754e"/>
        <path d="M22 33c-1 4 0 6 2 9 2-3 3-5 2-9" fill="#fff4bd" stroke="none"/>
        <path d="M17 22c-6 2-8 7-7 13l9-4m12-9c6 2 8 7 7 13l-9-4" fill="#f68e9e"/>
        <path d="M17 32C13 19 17 9 24 3c7 6 11 16 7 29Z" fill="#fff5df"/>
        <path d="M17 14c1-5 4-8 7-11 3 3 6 6 7 11Z" fill="#f68e9e"/>
        <circle cx="24" cy="22" r="5.2" fill="#7ad0e6" stroke-width="2"/>
        <path d="M18 32h12l-2 3h-8Z" fill="#b08be0" stroke-width="1.8"/>
      </g>
    </svg>`
  };
  const labels=[...document.querySelectorAll('.wseg')];
  labels.forEach((item,i)=>{
    const name=item.textContent,key=name.toLowerCase();item.dataset.speed=key;
    item.innerHTML='<span>'+name+'</span>'+tempoIcons[key];
    const angle=(i*120-30)*Math.PI/180;
    item.style.left=(120+Math.cos(angle)*80)+'px';
    item.style.top=(120+Math.sin(angle)*80)+'px';
  });
  const originalSetTip=setTip;
  setTip=html=>{
    const speed=html.match(/<b>(SLOW|MEDIUM|FAST)<\/b>/)?.[1];
    if(speed&&html.includes('student reads'))originalSetTip('<b>'+speed+' · Keep<br>the same speed.</b><small>Read clearly, then tap COMPLETE.</small>');
    else if(speed&&html.includes('PLAY AGAIN'))originalSetTip('<b>Round complete · '+speed+'</b><small>Play again for another beat.</small>');
    else originalSetTip(html);
  };
  originalSetTip('<b>Spin the wheel<br>to pick your beat.</b><small>R = SPIN　·　SPACE = COMPLETE</small>');
})();
