/* Articulated foreground for authored courses. The classroom clock drives the same rig as the teacher reference. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.YogaScene = factory(root.YogaScene, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (original, environment = globalThis) {
  // Body contours and faces follow the five platform IP portraits. Each has its own shoulder sockets.
  // Coordinates are relative to the pelvis. The feet and hands are articulated separately.
  const characters = {
    poppy: {
      name:'Poppy', fill:'#faaab0', ink:'#975d69', shoulder:[34,-30], faceY:-48,
      shape:'M -43,-11 C -57,-13 -62,-28 -54,-40 Q -54,-51 -43,-58 Q -42,-70 -28,-72 Q -17,-88 -3,-84 Q 13,-93 24,-75 Q 42,-76 46,-60 Q 57,-57 55,-44 Q 68,-31 56,-18 Q 51,-10 42,-12 Q 32,-1 18,-5 Q 9,6 -2,1 Q -15,3 -23,-6 Q -38,-2 -43,-11 Z',
      detail:'<path d="M -5,-9 Q 0,-1 7,-5" fill="none"/>'
    },
    edi: {
      name:'Edi', fill:'#69c9e1', ink:'#477587', shoulder:[26,-39], faceY:-76, glasses:true,
      shape:'M -36,-91 Q -36,-102 -23,-103 Q 0,-105 27,-102 Q 39,-101 39,-89 Q 40,-66 18,-53 Q 10,-48 16,-42 Q 34,-31 39,-12 Q 42,1 32,2 L -32,2 Q -43,1 -39,-12 Q -32,-32 -15,-42 Q -9,-48 -17,-53 Q -39,-65 -36,-91 Z'
    },
    rolly: {
      name:'Rolly', fill:'#f3592c', ink:'#a54c36', shoulder:[30,-34], faceY:-59,
      shape:'M -33,-9 L -33,-47 Q -34,-71 -14,-78 L -19,-90 L 9,-84 Q 31,-84 35,-70 Q 40,-62 39,-45 L 38,-10 Q 28,4 6,7 Q -16,7 -33,-9 Z'
    },
    milo: {
      name:'Milo', fill:'#efa54f', ink:'#9b713d', shoulder:[33,-38], faceY:-87, glasses:true,
      shape:'M -45,-25 Q -46,-43 -30,-64 Q -22,-77 -22,-90 Q -21,-113 0,-115 Q 22,-115 24,-94 Q 24,-78 34,-61 Q 50,-38 45,-20 Q 42,-1 23,5 Q 1,14 -21,6 Q -42,0 -45,-25 Z',
      detail:'<path d="M -33,-20 Q -29,-10 -23,-7" fill="none"/>'
    },
    ace: {
      name:'Ace', fill:'#ae95d9', ink:'#78638f', shoulder:[35,-39], faceY:-55,
      shape:'M -44,-52 L -51,-63 Q -54,-68 -48,-70 L -36,-75 L -37,-88 Q -38,-94 -32,-93 L -16,-89 L -6,-104 Q -2,-110 2,-104 L 14,-89 L 29,-93 Q 35,-95 35,-87 L 36,-75 L 49,-70 Q 55,-68 51,-62 L 45,-52 L 54,-41 Q 58,-36 52,-34 L 40,-28 L 41,-13 Q 43,-7 36,-7 L 22,-7 L 13,6 Q 9,11 5,6 L -5,-1 L -18,7 Q -22,9 -24,4 L -30,-6 L -43,-6 Q -48,-6 -47,-12 L -45,-26 L -55,-34 Q -60,-38 -55,-42 Z'
    }
  };
  const poses = {mountain:'山式',tree:'树式',star:'星星式',butterfly:'蝴蝶式',garland:'花环式',savasana:'仰卧放松'};
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const selected = settings => own(characters, settings?.characterId) ? settings.characterId : 'poppy';
  const round = n => Math.round(n * 100) / 100;
  const pair = point => point.map(round).join(' ');
  const mix = (a,b,t) => a+(b-a)*t;
  const clamp = t => Math.max(0,Math.min(1,Number(t)||0));
  function entry(t) {
    const x=clamp(Math.min(t/.30,(1-t)/.20)); return x*x*(3-2*x);
  }
  function actionFor(page) {
    if(page?.actionId==='savasana') return 'savasana';
    return page?.kind==='action' && own(poses,page.actionId) ? page.actionId : 'guide';
  }
  function variation(page, action) {
    const text=[page?.english,page?.scene,page?.teacher].filter(Boolean).join(' ');
    if(action==='mountain' && /胸前|合十|holding the letter|hands (?:at|to) (?:your|my|the) chest/i.test(text)) return 'palms';
    if(action==='tree' && /脚尖点地|脚趾点地|toe[s]? (?:on|touch)/i.test(text)) return 'toes';
    return '';
  }

  // Coordinates are in a 240 x 218 stage. Foot positions are defined in stage space
  // so the support foot stays planted during entry, the hold and return.
  function frame(character, pose, variant, progress) {
    const t=clamp(progress), w=entry(t), breath=(1-Math.cos(t*4*Math.PI))*.5;
    let hip=133;
    if(pose==='butterfly') hip=184;
    if(pose==='garland') hip+=42*w;
    const torsoY=hip-(pose==='savasana'?2:1.5)*breath;
    const arms=[],legs=[];
    const sx=character.shoulder[0], sy=torsoY+character.shoulder[1];
    for(const side of [-1,1]) {
      let elbow=[120+side*(sx+5),sy+24], hand=[120+side*(sx+9),sy+48];
      let knee=[120+side*12,mix(hip,197,.52)], foot=[120+side*12,197], footAngle=0;
      if(pose==='mountain' && variant==='palms' || pose==='garland') {
        elbow=[120+side*mix(sx+5,sx+1,w),sy+mix(24,20,w)];
        hand=[120+side*mix(sx+9,4,w),sy+mix(48,1,w)];
      } else if(pose==='mountain') {
        elbow=[120+side*mix(sx+5,sx+15,w),sy+mix(24,-26,w)];
        hand=[120+side*mix(sx+9,sx+5,w),sy+mix(48,-56,w)];
      } else if(pose==='tree' || pose==='star') {
        elbow=[120+side*mix(sx+5,sx+24,w),sy+mix(24,pose==='tree'?-11:0,w)];
        hand=[120+side*mix(sx+9,sx+48,w),sy+mix(48,pose==='tree'?-30:-3,w)];
      } else if(pose==='butterfly') {
        elbow=[120+side*(sx+5),sy+15]; hand=[120+side*6,195];
      } else if(pose==='guide' && side===1) {
        elbow=[120+sx+6,sy+19]; hand=[120+sx+24,sy-1-breath*3];
      } else if(pose==='savasana') {
        elbow=[120+side*(sx+4),sy+18]; hand=[120+side*(sx+8),sy+36];
      }
      if(pose==='tree' && side===1) {
        knee=[120+mix(12,39,w),mix(167,158,w)];
        foot=[120+mix(12,variant==='toes'?-2:-4,w),mix(197,variant==='toes'?193:170,w)];
        footAngle=mix(0,variant==='toes'?42:65,w);
      } else if(pose==='star') {
        knee=[120+side*mix(12,25,w),165];foot=[120+side*mix(12,41,w),197];
      } else if(pose==='butterfly') {
        knee=[120+side*(48+13*w),hip+mix(-13,3,w)-3*breath];foot=[120+side*4,196];footAngle=side===1?96:-96;
      } else if(pose==='garland') {
        knee=[120+side*mix(28,48,w),mix(162,161,w)]; foot=[120+side*32,197];
      } else if(pose==='savasana') {
        knee=[120+side*15,166];foot=[120+side*23,197];
      }
      arms.push({a:[120+side*sx,sy],b:elbow,c:hand,side});
      legs.push({a:[120+side*11,hip-4],b:knee,c:foot,side,angle:footAngle});
    }
    return {torsoY,arms,legs,orientation:pose==='savasana'?'translate(0 21) rotate(-85 120 124)':''};
  }

  function jointPath({a,b,c}) {
    const before=[mix(a[0],b[0],.84),mix(a[1],b[1],.84)];
    const after=[mix(b[0],c[0],.16),mix(b[1],c[1],.16)];
    return 'M '+pair(a)+' L '+pair(before)+' Q '+pair(b)+' '+pair(after)+' L '+pair(c);
  }
  function handTransform({b,c}) {
    const angle=Math.atan2(c[1]-b[1],c[0]-b[0])*180/Math.PI-90;
    return 'translate('+pair(c)+') rotate('+round(angle)+')';
  }
  function footTransform({c,side,angle}) {
    return 'translate('+pair(c)+') rotate('+round(angle)+') scale('+side+' 1)';
  }
  function limb(joint,kind,index) {
    const arm=kind==='arm',d=jointPath(joint),name=kind+index;
    const end=arm?handTransform(joint):footTransform(joint);
    const shape=arm?'M -3,-3 Q -6,-1 -5,2 L -4,5 Q -3,8 -1,7 Q 1,9 3,7 Q 6,7 5,4 L 5,1 Q 8,4 8,1 Q 7,-2 4,-4 Z':'M -3,-3 Q 1,-5 4,-2 L 6,0 Q 10,-1 12,2 Q 14,5 10,6 L -3,6 Q -6,6 -5,2 Z';
    return '<g stroke-linecap="round" stroke-linejoin="round"><path data-yc-path="'+name+'" d="'+d+'" fill="none" stroke="var(--yc-ink)" stroke-width="'+(arm?6.7:7.8)+'"/><path data-yc-path="'+name+'" d="'+d+'" fill="none" stroke="var(--yc-fill)" stroke-width="'+(arm?4.6:5.6)+'"/><path data-yc-tip="'+name+'" d="'+shape+'" transform="'+end+'" fill="var(--yc-fill)" stroke="var(--yc-ink)" stroke-width="1.1"/></g>';
  }
  function face(character,sleeping) {
    const y=character.faceY;
    const eyes=sleeping?'<path d="M -16,0 Q -12,4 -8,0 M 8,0 Q 12,4 16,0" fill="none" stroke="#493e41" stroke-width="1.6"/>':'<g fill="#413a3c"><ellipse cx="-11" cy="0" rx="2" ry="2.4"/><ellipse cx="11" cy="0" rx="2" ry="2.4"/></g>';
    const glasses=character.glasses?'<g stroke="#51494b" stroke-width="1.4" fill="#e9f6f2"><circle cx="-11" cy="0" r="8.8"/><circle cx="11" cy="0" r="8.8"/><path d="M -2,0 Q 0,-2 2,0" fill="none"/></g>':'';
    return '<g transform="translate(0 '+y+')">'+glasses+eyes+'<path d="M -7,9 Q 0,14 8,8" fill="none" stroke="#664b4a" stroke-width="1.5" stroke-linecap="round"/></g>';
  }
  function rig(page,settings) {
    const id=selected(settings),character=characters[id],pose=actionFor(page),variant=variation(page,pose);
    const f=frame(character,pose,variant,.55);
    const label=character.name+(poses[pose]?' · '+poses[pose]:'');
    const scope='data-yc-rig="'+id+'" data-yc-action="'+pose+'" data-yc-variation="'+variant+'"';
    return '<svg class="yc-actor" '+scope+' viewBox="0 0 240 218" role="img" aria-label="'+escape(label)+'" style="--yc-fill:'+character.fill+';--yc-ink:'+character.ink+'">'+
      (pose==='savasana' ? '<path d="M 12,116 Q 11,111 18,111 L 195,105 Q 200,105 202,110 L 232,193 Q 234,198 228,198 L 38,207 Q 33,207 32,202 Z" fill="#dae4c6" stroke="#aab59a" stroke-width="1.3"/>' : '<ellipse cx="120" cy="204" rx="48" ry="3.3" fill="#536744" opacity=".16"/>')+
      '<g transform="'+f.orientation+'">'+f.legs.map((j,i)=>limb(j,'leg',i)).join('')+
      '<g data-yc-torso="" transform="translate(120 '+round(f.torsoY)+')" stroke-linejoin="round" stroke="var(--yc-ink)" stroke-width="1.5"><path d="'+character.shape+'" fill="var(--yc-fill)"/>'+(character.detail||'')+face(character,pose==='savasana')+'</g>'+
      f.arms.map((j,i)=>limb(j,'arm',i)).join('')+'</g></svg>';
  }
  function renderCourseScene(page,settings,options={}) {
    const title=options.showLabel!==false && page.kind==='cover'?'<h2 class="yc-title">'+escape(page.title)+'</h2>':'';
    return '<section class="yoga-scene yc-scene'+(options.compact?' yc-compact':'')+'" data-yoga-scene aria-label="'+escape(page.title)+'"><div class="yc-stage">'+(options.backgroundMarkup||original.renderBackground(page,settings))+title+rig(page,settings)+'</div>'+ (page.english?'<p class="yc-caption" lang="en">'+escape(page.english)+'</p>':'')+'</section>';
  }
  function renderReference(page,settings) {
    if(page?.wonder || page?.backendPose===undefined && !page?.backgroundUrl) return original.renderReference(page,settings);
    const pose=actionFor(page), character=characters[selected(settings)];
    return '<section class="yoga-reference yc-reference" data-yoga-reference aria-label="'+escape(character.name+' · '+(poses[pose]||'带领角色'))+'">'+rig(page,settings)+'</section>';
  }
  const reduced=environment.matchMedia?.('(prefers-reduced-motion: reduce)');
  function setProgress(container,progress) {
    original.setProgress(container,progress);
    if(!container?.querySelectorAll) return;
    for(const svg of container.querySelectorAll('[data-yc-rig]')) {
      const character=characters[svg.getAttribute('data-yc-rig')];
      if(!character) continue;
      const f=frame(character,svg.getAttribute('data-yc-action'),svg.getAttribute('data-yc-variation'),reduced?.matches ? .55 : progress);
      svg.querySelector('[data-yc-torso]').setAttribute('transform','translate(120 '+round(f.torsoY)+')');
      function update(joint,kind,index) {
        const key=kind+index,d=jointPath(joint);
        for(const node of svg.querySelectorAll('[data-yc-path="'+key+'"]'))node.setAttribute('d',d);
        svg.querySelector('[data-yc-tip="'+key+'"]').setAttribute('transform',kind==='arm'?handTransform(joint):footTransform(joint));
      }
      f.arms.forEach((j,i)=>update(j,'arm',i)); f.legs.forEach((j,i)=>update(j,'leg',i));
    }
  }
  return {...original,renderCourseScene,renderReference,setProgress};
});
