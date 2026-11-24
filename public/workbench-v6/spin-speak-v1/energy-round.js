(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EnergyRound=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  return function createRound({random=Math.random,schedule=setTimeout,cancel=clearTimeout,reduceMotion=()=>false,onChange=()=>{}}={}){
    let phase='idle',last=-1,active=-1,pending=-1,timer=null;
    const snapshot=()=>({phase,last,active,level:active<0?0:active===5?0:6-active});
    const emit=()=>onChange(snapshot());
    function settle(){if(phase!=='drawing')return;cancel(timer);timer=null;last=active=pending;phase='selected';emit();}
    function draw(){
      if(phase==='drawing'||phase==='complete')return false;
      const pool=[0,1,2,3,4,5].filter(i=>i!==last);pending=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];phase='drawing';
      if(reduceMotion()){settle();return true;}
      const seq=[];let p=5,dir=-1;for(let k=0;k<15;k++){seq.push(p);if(p===0)dir=1;if(p===5)dir=-1;p+=dir;}seq.push(pending);
      let step=0;
      function tick(){active=seq[step];emit();step++;if(step<seq.length)timer=schedule(tick,step<11?72:105+(step-11)*25);else settle();}
      tick();return true;
    }
    function complete(){if(phase!=='selected')return false;phase='complete';emit();return true;}
    function reset(){cancel(timer);timer=null;phase='idle';last=active=pending=-1;emit();}
    return {draw,complete,reset,settle,snapshot};
  };
});
