/* Selected activities are the only source of order and completion in the preview. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.StarlightJourney=api;
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const catalog=Object.freeze([
    {id:'lyrics',name:'歌词猎人',en:'LYRIC HUNTER',task:'找回歌曲中的词句',icon:'mic',guide:'完成选词、组句和听音挑战，找回歌曲中的词句。'},
    {id:'composer',name:'旋律舞者',en:'MELODY MOVER',task:'编排动作与乐器',icon:'drum',guide:'选择动作与乐器，编排歌词，再一起完成全曲表演。'},
    {id:'echo',name:'魔法跟唱',en:'ECHO MASTER',task:'藏起单词，一起唱',icon:'wand',guide:'用魔法笔遮住单词，逐句领唱、回忆和表达。'},
    {id:'star',name:'舞台之星',en:'STAGE STAR',task:'分配角色，一起合唱',icon:'star',guide:'为歌词分配演唱角色，再一起完成合唱演出。'}
  ].map(Object.freeze));
  function create(selection){
    const requested=Array.isArray(selection)?selection:[];
    const stages=Object.freeze(catalog.filter(stage=>requested.includes(stage.id)));
    const ids=Object.freeze(stages.map(stage=>stage.id));
    const has=id=>ids.includes(id);
    const completed=status=>ids.filter(id=>status?.[id]===true).length;
    return Object.freeze({
      stages,ids,count:ids.length,has,
      ordinal:id=>ids.indexOf(id)+1,
      number:id=>String(ids.indexOf(id)+1).padStart(2,'0'),
      next:id=>has(id)?ids[ids.indexOf(id)+1]||null:null,
      completed,
      isComplete:status=>ids.length>0&&completed(status)===ids.length,
      firstPending:status=>ids.find(id=>status?.[id]!==true)||null,
      start:()=>ids.length===1?ids[0]:'map',
      resolve:route=>ids.length===0?'empty':route==='award'?'award':route==='map'?(ids.length===1?ids[0]:'map'):has(route)?route:(ids.length===1?ids[0]:'map')
    });
  }
  function fromSearch(search){
    const params=new URLSearchParams(search);
    return create(params.has('stages')?params.get('stages').split(','):catalog.map(stage=>stage.id));
  }
  return Object.freeze({catalog,create,fromSearch});
});
