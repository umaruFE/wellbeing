(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SpeakModel=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const clone=v=>JSON.parse(JSON.stringify(v));
const acts=['cook','watch films','play chess','go hiking','have a picnic','read books'];
const gerunds={'cook':'cooking','watch films':'watching films','play chess':'playing chess','go hiking':'going hiking','have a picnic':'having a picnic','read books':'reading books','play football':'playing football','ride a bike':'riding a bike','draw pictures':'drawing pictures','swim':'swimming'};
const emoji={'cook':'🍳','watch films':'🍿','play chess':'♟️','go hiking':'🥾','have a picnic':'🧺','read books':'📚','play football':'⚽','ride a bike':'🚲','draw pictures':'🎨','swim':'🏊'};
const silly=[['a dragon','🐉'],['a pirate','🏴‍☠️'],['a robot','🤖'],['a penguin','🐧'],['a dinosaur','🦖'],['an alien','👽']].map(([text,em])=>({text,em}));
const games=[
 {id:'tempo',name:'节奏挑战',en:'Tempo Challenge',verb:'跟着节拍说',need:'1 句',description:'转动速度盘，跟着快慢节奏读出目标语言。',color:'#e7eddf'},
 {id:'volume',name:'音量挑战',en:'Volume Challenge',verb:'换个音量说',need:'1 句',description:'抽一个音量档，轻声、正常或响亮地说。',color:'#e3eef2'},
 {id:'energy',name:'情绪应答',en:'Energy Response',verb:'带着情绪答',need:'1 组问答',description:'抽取情绪电量，用对应的语气回应问题。',color:'#e0ece5'},
 {id:'words',name:'动作挑战',en:'Words in Motion',verb:'边说边做',need:'含可替换词的句子',description:'选词填空，为每个词配上一个动作。',color:'#f4ead8'},
 {id:'role',name:'角色扮演',en:'Role Play',verb:'变个角色说',need:'1 句',description:'翻开一张角色卡，模仿它的声音读句子。',color:'#e8e4f1'},
 {id:'silly',name:'离谱问答机',en:'Silly Machine',verb:'抽个组合说',need:'活动类问答',description:'分别抽取动作和角色，读出意想不到的组合。',color:'#f5e8cf'},
 {id:'flip',name:'翻牌问答',en:'Flip & Answer',verb:'听问题，翻答案',need:'3 组问答 + 介绍句',description:'听问题、找答案，完成三题揭晓完整介绍。',color:'#e1eceb'}
];
const samples={family:{title:'My Family',input:'There are four people in my family: my dad, my mum, my sister and me. My father is strict, but he is also very funny. We cook together every weekend.',main:'There are [four] people in my family.',full:'There are four people in my family: my dad, my mum, my sister and me. We [cook] together every weekend.',dialog:[{q:'How many people are there in your family?',a:'There are four people in my family.'},{q:'What is your father like?',a:'My father is strict, but he is also very funny.'},{q:'What do you like doing together?',a:'We cook together every weekend.'}],acts},weekend:{title:'My Weekend',input:'We play football together every weekend. I like reading books with my friends. Would you like to join us?',main:'We [play football] together every weekend.',full:'I like reading books with my friends.',dialog:[{q:'What do you do at the weekend?',a:'We play football together every weekend.'},{q:'What do you like doing?',a:'I like reading books.'},{q:'Would you like to join us?',a:"Yes! I'd love to!"}],acts:['play football','ride a bike','draw pictures','swim','read books','cook']},weather:{title:'The Weather',input:"It is sunny today. I like sunny days. What is the weather like today?",main:'It is sunny today.',full:'I like sunny days. We can go outside and play.',dialog:[{q:'What is the weather like today?',a:'It is sunny today.'},{q:'Do you like sunny days?',a:'Yes, I like sunny days.'},{q:'What can we do today?',a:'We can go outside and play.'}],acts:[]}};
function makePack(s){return {unit:s.title,sentences:{main:s.main,full:s.full},dialog:clone(s.dialog),pools:{acts:[...s.acts]},sel:{main:true,full:true,d:[true,true,true]}};}
function buildLanguage(input){
 const text=input.trim();if(!text)throw Error('先输入本课要练的目标语言。');
 for(const s of Object.values(samples))if(text===s.input)return makePack(s);
 // Local prototype adapter: preserve arbitrary input, never substitute an unrelated theme.
 if(!/[a-z]{2}/i.test(text))throw Error('这个原型暂不能从中文主题起草英文。可选择一份案例体验，或直接输入英文句子 / 问答。');
 const lines=text.split(/\n+/).map(s=>s.replace(/^(Q|A|问|答)\s*[:：]\s*/i,'').trim()).filter(Boolean);
 let dialog=[];for(let i=0;i<lines.length-1;i++)if(/\?$/.test(lines[i])&&!/\?$/.test(lines[i+1]))dialog.push({q:lines[i],a:lines[++i]});
 const sentences=text.split(/(?<=[.!])\s+/).filter(s=>!s.includes('?'));
 const main=dialog[0]?.a||sentences[0]||text;const full=dialog.map(d=>d.a).join(' ')||text;
 const qs=['What can you tell us?','Can you say more about it?','What would you like to share?'];
 while(dialog.length<3)dialog.push({q:qs[dialog.length],a:sentences[dialog.length]||main});
 return {unit:'口语练习',sentences:{main,full},dialog:dialog.slice(0,3),pools:{acts:Object.keys(gerunds).filter(a=>text.toLowerCase().includes(a))},sel:{main:true,full:true,d:[true,true,true]}};
}
const plain=s=>String(s||'').replace(/[\[\]]/g,'').trim();
function activePack(p){return {unit:p.unit,lines:[p.sel.main?p.sentences.main:'',p.sel.full?p.sentences.full:''].filter(Boolean).filter((s,i,a)=>a.indexOf(s)===i),dialog:p.dialog.filter((d,i)=>p.sel.d[i]),pools:clone(p.pools)};}
function wordFrame(p){
 for(const value of p.lines){for(const line of value.split(/(?<=[.!?])\s+/)){
 const matches=[...line.matchAll(/\[([^\]]+)\]/g)];let phrase=matches.length===1?matches[0][1]:null;
 if(!phrase)phrase=p.pools.acts.find(a=>line.toLowerCase().includes(a.toLowerCase()));
 if(!phrase||(!p.pools.acts.includes(phrase)))continue;
 const clean=plain(line);if(clean.split(phrase).length!==2)continue;
 const words=clean.replace(phrase,'___').replace(/[.!?]$/,'').split(/\s+/);if(words.length>14)continue;
 const blankIndex=words.indexOf('___');
 const moveCycle=['squat','sidebend','balance','armsup'];
 let moveIndex=0;
 const moves=words.map((_,i)=>i===blankIndex?null:moveCycle[moveIndex++%moveCycle.length]);
 return {words,blankIndex,moves};
 }}return null;
}
function need(id,p){
 const sentence=p.lines.some(s=>plain(s));const qa=p.dialog.filter(d=>d.q.trim()&&d.a.trim());
 if(['tempo','volume','role'].includes(id))return sentence;
 if(id==='energy')return qa.length>=1;
 if(id==='words')return !!wordFrame(p)&&p.pools.acts.length>0;
 if(id==='silly')return qa.some(d=>/like doing|like to do/i.test(d.q))&&p.pools.acts.filter(a=>gerunds[a]).length>=4;
 return qa.length>=3&&sentence;
}
function generate(id,p){
 if(!need(id,p))throw Error('这个活动用到的内容还不够：多勾选几条操练语言，或换个活动试试。');
 const line=plain(p.lines[0]);
 if(id==='tempo')return {lines:p.lines.map(s=>String(s).trim()).slice(0,3)};
 if(id==='volume'||id==='role')return {line};
 if(id==='energy'){
 const pair=p.dialog.find(d=>/^(do you|would you|can you)/i.test(d.q))||p.dialog[0];
 const yesno=/^(do you|would you|can you)/i.test(pair.q);
 // All six generated lines are explicitly reviewed in preview before publication.
 let answers=yesno?["Yes! I'd love to!","Yes! That sounds fun!","Sure, why not?","Maybe next time.","Not today. I'm tired.","No, thank you."]:Array(6).fill(plain(pair.a));
 if(/^do you like/i.test(pair.q))answers=[plain(pair.a),plain(pair.a),'Yes, I do.','Sometimes.','Not really.',"No, I don't."];
 if(/^can you/i.test(pair.q))answers=['Yes, I can!','Of course I can!','I can try.','Maybe.','Not right now.',"Sorry, I can't."];
 return {question:pair.q,answers:answers.map((text,i)=>({text,label:['SUPER!','HAPPY','READY','SO-SO','TIRED','EMPTY'][i],em:['🤩','😄','🙂','😐','😴','🪫'][i]}))};
 }
 if(id==='words')return {...wordFrame(p),acts:p.pools.acts.slice(0,5).map(text=>({text,em:emoji[text]||'💬'})).concat({text:'say your own',own:true})};
 if(id==='silly')return {question:p.dialog.find(d=>/like doing|like to do/i.test(d.q)).q,answerTpl:'We like {A} with {B}.',poolA:p.pools.acts.filter(a=>gerunds[a]).slice(0,6).map(a=>({text:gerunds[a],em:emoji[a]||'💬'})),poolB:clone(silly)};
 return {qa:p.dialog.slice(0,3).map(d=>({q:d.q,a:plain(d.a),em:/family|people/i.test(d.q)?'👨‍👩‍👧':/father/i.test(d.q)?'👨':'💬',hint:plain(d.a).replace(/^(There are|My father is|We|I|It is|Yes,?)\s+/i,'').split(' ').slice(0,3).join(' ')})),decoy:{em:'🐕',hint:'a dog'},reveal:plain(p.lines[p.lines.length-1])};
}
function count(p){return Number(p.sel.main)+Number(p.sel.full)+p.sel.d.filter(Boolean).length;}
function invalidate(d){d.finalized=false;d.previewEdits={};d.previewDirty=false;d.confirmed=false;d.preview=null;d.reviewed=false;d.step=Math.min(d.step,2);return d;}
function initial(){return {id:'draft-'+Date.now(),title:'未命名口语活动',input:'',pack:null,game:'tempo',confirmed:false,preview:null,reviewed:false,step:1,published:null,history:[],finalized:false};}
function snapshot(d){if(!d.confirmed||!d.preview||!d.reviewed||d.previewDirty)throw Error('先试玩并确认内容。');return {id:'v-'+Date.now(),title:d.title,game:d.game,input:d.input,pack:clone(d.pack),content:clone(d.preview),createdAt:new Date().toISOString()};}
return {games,samples,clone,buildLanguage,activePack,wordFrame,need,generate,count,invalidate,initial,snapshot,plain};
});
