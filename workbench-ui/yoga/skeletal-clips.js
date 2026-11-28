/* Animation authoring source: this rig is sampled by the backend asset baker. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./character-skins.js'));
  else root.YogaSkeletalClips = factory(root.YogaCharacterSkins);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (skins) {
  'use strict';

  const motions = [
    ['mountain','山式','Mountain Pose','Stand tall and bring your palms together.','Stand tall.','脚掌踩稳，双手在胸前合十。','站姿'],
    ['tree','树式','Tree Pose','Balance on one foot. Rest your other foot on your calf.','Grow like a tree.','重心移到支撑脚，另一只脚轻贴小腿内侧，膝盖向外，手臂慢慢打开。','平衡'],
    ['star','星星式','Star Pose','Stand wide and open your arms like a star.','Open your arms.','双脚分开，手臂向两侧伸开，指尖向远处延伸。','站姿'],
    ['butterfly','蝴蝶式','Butterfly Pose','Sit tall, touch the soles of your feet together and let your knees open.','Open your knees.','坐稳，双脚掌相对，膝盖向两侧自然打开，双手轻握脚踝。','坐姿'],
    ['garland','花环式','Garland Pose (Malasana)','Turn your toes out a little and slowly bend your knees.','Lower into a squat.','两脚稍宽，脚尖微向外，膝盖顺着脚尖方向缓缓弯曲，双手合十。','下蹲'],
    ['savasana','仰卧放松式','Savasana','Lie on your back and let your arms and legs rest.','Rest and breathe.','仰卧，手臂与身体留出空隙，双脚自然向外，轻轻呼吸。','仰卧'],
    ['chair','椅子式','Chair Pose','Bend your knees and send your hips back as if sitting on a chair.','Sit back.','从侧面示范屈髋屈膝，臀部向后，双脚踩稳，双臂斜向上。','下蹲'],
    ['warrior-ii','战士二式','Warrior II','Take a wide stance, bend your front knee and reach both arms out.','Reach both ways.','前脚朝侧面，前膝对齐脚踝，后腿伸展，双臂平展。','站姿'],
    ['upward-salute','向上致敬式','Upward Salute','Stand tall and lift both arms overhead.','Reach up.','双脚踩稳，双臂从身体两侧向上画弧，肩膀放松。','站姿'],
    ['side-bend','侧弯式','Side Bend','Reach one arm up and lean gently to the side.','Reach to the side.','两脚踩稳，一侧手臂上举，再随躯干轻柔侧弯。','站姿'],
    ['tree-toes','树式・脚尖点地',null,'Keep your toes on the floor and let your knee turn out.','Touch your toes down.','支撑脚踩稳，另一侧脚跟轻贴脚踝，脚尖留在地面。','平衡'],
    ['guide','招手引导',null,'Wave hello.','Hello!','站稳后抬起一只手，向孩子们招手。','引导']
  ].map(([id,name,pose,instruction,short,teacher,category])=>Object.freeze({id,name,pose,english:pose || (id==='guide'?'Wave':'Supported Tree'),instruction,short,teacher,category}));

  const RAD = Math.PI/180;
  const floorY = 201;
  const add = (a,b)=>[a[0]+b[0],a[1]+b[1]];
  const lerp = (a,b,t)=>a+(b-a)*t;
  const between = (a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];
  const clamp = x=>Math.max(0,Math.min(1,x));
  const smooth = x=>{ const t=clamp(x); return t*t*t*(t*(t*6-15)+10); };
  const rotate = ([x,y],angle)=>[Math.cos(angle*RAD)*x-Math.sin(angle*RAD)*y,Math.sin(angle*RAD)*x+Math.cos(angle*RAD)*y];
  const polar = (length,angle)=>[length*Math.sin(angle*RAD),length*Math.cos(angle*RAD)];
  const rounded = n=>+n.toFixed(2);
  const pair = point=>point.map(rounded).join(' ');
  const phase = (t,begin,end)=>smooth(Math.min(t/begin,(1-t)/(1-end)));
  const byId = new Map(motions.map(m=>[m.id,m]));

  // Analytic two-link IK. The bend sign is part of the rig, so the knee or
  // elbow cannot suddenly flip sides during interpolation near full extension.
  function bind(a,target,[upper,lower],bend) {
    const dx=target[0]-a[0],dy=target[1]-a[1];
    const requested=Math.hypot(dx,dy);
    const d=Math.min(upper+lower,Math.max(Math.abs(upper-lower)+0.00001,requested));
    const ux=requested?dx/requested:0, uy=requested?dy/requested:1;
    const along=(upper*upper-lower*lower+d*d)/(2*d);
    const normal=bend*Math.sqrt(Math.max(0,upper*upper-along*along));
    return {a,b:[a[0]+ux*along-uy*normal,a[1]+uy*along+ux*normal],c:[a[0]+d*ux,a[1]+d*uy]};
  }
  function fk(a,[upper,lower],u,l) {
    const b=add(a,polar(upper,u));
    return {a,b,c:add(b,polar(lower,l))};
  }
  // Toe contact travels along the rounded sole while the free heel lifts.
  function toeDrop(s,angle) {
    const sine=Math.sin(angle*RAD),cosine=Math.cos(angle*RAD);
    const toe=s.footToeX,depth=s.footDepth;
    if(s.id==='Ace') {
      const radiusX=.73*toe,radiusY=.56*depth;
      return (toe-radiusX)*sine+(depth-radiusY)*cosine+Math.hypot(radiusX*sine,radiusY*cosine);
    }
    const at=1.1*depth*cosine/(.82*toe*sine+1.1*depth*cosine);
    return toe*(1-.41*at*at)*sine+depth*(.45+1.1*at-.55*at*at)*cosine;
  }
  function standing(s,id,t) {
    const w=phase(t,.34,.76), tree=id==='tree'||id==='tree-toes';
    const L=s.legLengths[0]+s.legLengths[1],feet=s.hips.map(h=>[120+h[0],floorY-s.footDepth]);
    let x=120,angle=0,sink=0;
    const weights=[true,true];
    if(id==='star' || id==='garland') {
      const spread=L*(id==='star'?.50:.34);
      feet[0][0]-=spread; feet[1][0]+=spread;
      if(id==='garland') sink=w*.62*L;
    }
    if(id==='side-bend') angle=-18*phase(t,.43,.66);
    if(id==='chair') {
      x+=.36*L*w; angle=-18*w; sink=.31*L*w;
    }
    if(id==='warrior-ii') {
      // End position is built from a vertical front shin and a straight back
      // leg. The entry keeps both feet planted and shifts the pelvis sideways.
      const [thigh,shin]=s.legLengths;
      const backReach=Math.sqrt(L*L-shin*shin);
      const left=s.hips[0][0]-thigh,right=s.hips[1][0]+backReach;
      const center=(left+right)/2;
      feet[0][0]=120+left-center; feet[1][0]=120+right-center;
      x-=center*w;
    }
    if(tree) {
      const shift=phase(t,.25,.77);
      x-=s.hips[1][0]*.82*shift;
      weights[1]=false;
    }
    // A planted ankle must be reachable even after rotating / translating
    // the root. Pin both feet in world space and solve for pelvis height.
    const hipAngle=id==='side-bend'?0:angle;
    const localHips=s.hips.map(h=>rotate(h,hipAngle));
    const reachableY=feet.map((f,i)=>{
      const dx=f[0]-x-localHips[i][0];
      return f[1]-localHips[i][1]-Math.sqrt(Math.max(0,L*L-dx*dx));
    });
    let y=Math.max(...reachableY.filter((_,i)=>weights[i]))+sink;
    if(id==='warrior-ii') y+=.45*Math.sin(Math.PI*w);
    if(tree) {
      const lift=phase(t,.42,.70),support=feet[0];
      const full=id==='tree';
      if(full) {
        const ankle=[support[0]+s.legWidth*.95,support[1]-.44*L];
        feet[1]=between(feet[1],ankle,lift);
      } else {
        // Roll through the toe, keeping the toe contact on the floor as the
        // free heel rises. The supporting leg carries the weight throughout.
        const toe=[s.footToeX??s.legWidth*1.8,s.footDepth];
        const pivot=[feet[1][0]+toe[0],floorY];
        const rolled=rotate(toe,50*lift);
        feet[1]=[pivot[0]-rolled[0],floorY-toeDrop(s,50*lift)];
        const dx=feet[1][0]-x-localHips[1][0];
        const toeReach=feet[1][1]-localHips[1][1]-Math.sqrt(Math.max(0,L*L-dx*dx));
        y=Math.max(y,toeReach);
      }
    }
    if(id==='butterfly') {
      // Start seated with the knees bent, then draw the feet inward. The
      // thighs fan outward as the soles meet. The seat stays on the mat.
      const opening=phase(t,.40,.70);
      y=floorY-Math.max(7,s.footDepth*.67); x=120;
      for(let i=0;i<2;i++){
        const side=i===0?-1:1;
        const ankleX=lerp(Math.abs(s.hips[i][0])+.38*L,s.legWidth*.72,opening);
        feet[i]=[120+side*ankleX,floorY-s.footDepth];
      }
    }
    return {root:[x,y],angle,feet,tree,w};
  }

  function arms(s,id,t,body,legs) {
    const [upper,lower]=s.armLengths,L=upper+lower;
    const bodyPoint=local=>add(body.root,rotate(local,body.angle));
    const w=body.w,breath=(1-Math.cos(4*Math.PI*t))*.5;
    return s.shoulders.map((socket,i)=>{
      const side=i===0?-1:1;
      const a=bodyPoint(socket);
      const restAngles=[side*13-body.angle,side*9-body.angle];
      const angles=(u,l,k=w)=>fk(a,s.armLengths,lerp(restAngles[0],u,k),lerp(restAngles[1],l,k));
      const natural=fk(a,s.armLengths,...restAngles);
      let joint=natural,tip;
      if(id==='mountain'||id==='garland') {
        const contact=bodyPoint([side*(s.armWidth*.52),socket[1]+L*.18+breath*.6]);
        joint=bind(a,between(natural.c,contact,w),s.armLengths,-side);
        tip=side*lerp(12,179,w);
      } else if(id==='tree'||id==='tree-toes') {
        joint=angles(side*(120+2*breath),side*(145+2*breath),phase(t,.46,.66));
      } else if(id==='star'||id==='warrior-ii') {
        joint=angles(side*89,side*91);
      } else if(id==='upward-salute') {
        joint=angles(side*159,side*169);
      } else if(id==='side-bend') {
        joint=i===1?angles(-body.angle+166,-body.angle+190,phase(t,.30,.73)):angles(-12,5);
      } else if(id==='chair') {
        joint=angles(-103,-115);
      } else if(id==='butterfly') {
        joint=bind(a,between(natural.c,legs[i].c,.91),s.armLengths,-side);
      } else if(id==='guide' && i===1) {
        const wave=Math.sin(6*Math.PI*t)*9;
        joint=angles(58,158+wave);
      } else if(id==='savasana') {
        joint=fk(a,s.armLengths,side*(16+breath*1.3)-body.angle,side*(19+breath*1.7)-body.angle);
      }
      const forearm=-Math.atan2(joint.c[0]-joint.b[0],joint.c[1]-joint.b[1])/RAD;
      return {...joint,tip:tip ?? forearm,prayer:(id==='mountain'||id==='garland')?smooth((w-.40)/.39):0};
    });
  }
  function sample(characterId,id,progress) {
    if(!byId.has(id)) throw new RangeError('Unknown yoga motion: '+id);
    const view=id==='chair'?'side':'front';
    const s=skins.getSkin(characterId,view);
    const t=clamp(Number(progress)||0);
    const body=standing(s,id,t);
    const world=point=>add(body.root,rotate(point,body.angle));
    let legs;
    if(id==='savasana') {
      const L=s.legLengths[0]+s.legLengths[1];
      body.angle=-82;
      body.root=[120+.49*(s.bodyHeight-L),143+.45*(1-Math.cos(2*Math.PI*t))];
      legs=s.hips.map((h,i)=>fk(world(h),s.legLengths,(i===0?-10:10)-body.angle,(i===0?-13:13)-body.angle));
    } else {
      legs=body.feet.map((foot,i)=>{
        const bend=(id==='chair'||i===0)?1:-1;
        const a=id==='side-bend'?add(body.root,s.hips[i]):world(s.hips[i]);
        // The close-set hip sockets in a butterfly seat can be directly beside
        // the ankle. The lateral knees stay on either side of the body.
        return bind(a,foot,s.legLengths,bend);
      });
    }
    const poseArms=arms(s,id,t,body,legs);
    legs.forEach((leg,i)=>{
      leg.flip=id==='chair'?1:(i===0?1:-1);
      leg.angle=id==='savasana'?body.angle:0;
      if(i===1&&id==='tree') { leg.flip=1; leg.angle=-16*phase(t,.42,.70); }
      if(i===1&&id==='tree-toes') leg.angle=50*phase(t,.42,.70);
      if(id==='butterfly') { leg.flip=i===0?-1:1;leg.angle=(i===0?-64:64)*phase(t,.40,.70); }
    });
    return {skin:s,view,root:body.root,angle:body.angle,arms:poseArms,legs};
  }

  function limb(s,joint,i,isArm) {
    const {a,b,c}=joint, width=isArm?s.armWidth:s.legWidth;
    const outline=s.outline;
    const points=[a,between(a,b,.88),b,between(b,c,.12),c].map(pair);
    const path='M'+points[0]+' L'+points[1]+' Q'+points[2]+' '+points[3]+' L'+points[4];
    const brush=(ink,width)=>'<path d="'+path+'" fill="none" stroke="'+ink+'" stroke-width="'+rounded(width)+'"/>';
    const rotateTip=isArm?joint.tip:joint.angle,flip=isArm?(i===0?1:-1):joint.flip;
    let shape=isArm?s.hand:s.foot;
    if(isArm&&joint.prayer>0&&s.prayerHand) {
      shape=joint.prayer===1?s.prayerHand:
        '<g opacity="'+rounded(1-joint.prayer)+'">'+s.hand+'</g><g opacity="'+rounded(joint.prayer)+'">'+s.prayerHand+'</g>';
    }
    const tip='<g transform="translate('+pair(c)+') rotate('+rounded(rotateTip)+') scale('+flip+' 1)">'+shape+'</g>';
    // Open the proximal cap into the body skin so shoulder and hip joints
    // read as flexing limbs. The hand / shoe covers the distal seam.
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const dx=(b[0]-a[0])/length,dy=(b[1]-a[1])/length;
    const join='M'+pair([a[0]-dx*width*.59,a[1]-dy*width*.59])+' L'+pair([a[0]+dx*.35,a[1]+dy*.35]);
    const seam='<path d="'+join+'" fill="none" stroke="'+s.fill+'" stroke-width="'+rounded(width*.98)+'" stroke-linecap="butt"/>';
    return '<g stroke-linecap="round" stroke-linejoin="round">'+brush(s.ink,width)+tip+brush(s.fill,width-2*outline)+seam+'</g>';
  }
  function renderFrame(characterId,id,progress) {
    const {skin:s,view,root,angle,arms,legs}=sample(characterId,id,progress);
    const body='<g transform="translate('+pair(root)+') rotate('+rounded(angle)+')">'+(id==='savasana'&&s.restingBody?s.restingBody:s.body)+'</g>';
    const shadows=id==='savasana'?'<ellipse cx="120" cy="157" rx="85" ry="16" fill="#536754" opacity=".13"/>':'<ellipse cx="120" cy="202" rx="46" ry="3" fill="#536754" opacity=".13"/>';
    const armLayers=arms.map((j,i)=>limb(s,j,i,true));
    const legLayers=legs.map((j,i)=>limb(s,j,i,false));
    // Lifting a shin across a broad belly needs a foreground leg. Preserve
    // the far leg behind the body in profile and the relaxed standing poses.
    const frontLegs=legs.map((_,i)=>id==='butterfly'||id==='garland'||(i===1&&id.startsWith('tree'))||((id==='warrior-ii'||id==='chair')&&i===0));
    const rear=legLayers.filter((_,i)=>!frontLegs[i]).join(''),front=legLayers.filter((_,i)=>frontLegs[i]).join('');
    return '<g transform="translate(2.4 2.02) scale(.98)">'+shadows+rear+(view==='side'?armLayers[0]:'')+body+front+(view==='side'?armLayers[1]:armLayers.join(''))+'</g>';
  }

  return Object.freeze({motions:Object.freeze(motions),viewBox:'0 0 240 218',renderFrame,sample,toeDrop});
});
