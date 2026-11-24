(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.WBLanguageGoals=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const unique=values=>{
    const seen=new Set();
    return values.map(value=>String(value).trim().replace(/\s+/g,' ')).filter(value=>{
      const key=value.toLocaleLowerCase();if(!value||seen.has(key))return false;seen.add(key);return true;
    });
  };
  // A line is one goal; punctuation belongs to its sentence or grammar description.
  const parse=value=>{
    if(value!=null&&typeof value!=='string'&&!Array.isArray(value)||Array.isArray(value)&&value.some(item=>typeof item!=='string'))throw Error('语言目标请使用文字标签。');
    return unique(Array.isArray(value)?value:String(value||'').split(/[\r\n]+/));
  };
  function read(settings={}){
    if(Object.prototype.hasOwnProperty.call(settings,'languageGoals'))return parse(settings.languageGoals);
    const words=settings.vocabulary??settings.words??[];
    const patterns=settings.patterns??settings.sentences??settings.sentence??[];
    return unique([...(Array.isArray(words)?words:String(words).split(/[,，、;；\r\n]+/)),...parse(patterns)]);
  }
  function merge(items,value,index=null){
    const incoming=parse(value),editing=Number.isInteger(index)&&index>=0&&index<items.length;
    if(!incoming.length)return {items:[...items],duplicate:false,keptOriginal:editing};
    const base=items.filter((_,i)=>!editing||i!==index),seen=new Set(base.map(s=>s.toLocaleLowerCase())),added=[];
    let duplicate=false;
    for(const item of incoming){const key=item.toLocaleLowerCase();if(seen.has(key)){duplicate=true;continue;}seen.add(key);added.push(item);}
    if(editing&&!added.length)return {items:[...items],duplicate,keptOriginal:true};
    base.splice(editing?index:base.length,0,...added);
    return {items:base,duplicate,keptOriginal:false};
  }
  return Object.freeze({read,parse,merge});
});
