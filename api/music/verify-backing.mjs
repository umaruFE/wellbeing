// Verify actual separation + FTP + owner API + seek + courseware. Removes its test work.
import fs from 'node:fs';
import crypto from 'node:crypto';
import pg from 'pg';
const env=fs.readFileSync(new URL('../.env',import.meta.url),'utf8');
const get=k=>env.match(new RegExp('^'+k+'=(.*)$','m'))?.[1]?.trim().replace(/^"|"$/g,'');
const fixture=JSON.parse(fs.readFileSync(process.argv[2]||'/tmp/wellbeing-music-ftp-test-result.json','utf8'));
const pool=new pg.Pool({host:get('DB_HOST')||'localhost',port:Number(get('DB_PORT')||5432),database:get('DB_NAME'),user:get('DB_USER'),password:get('DB_PASSWORD'),connectionTimeoutMillis:8000,statement_timeout:10000});
let id, temporaryFlow;
const n8nBase=get('N8N_API_BASE_URL')||'http://117.50.218.161:5678';
const n8n=async(path,options={})=>{const r=await fetch(n8nBase+path,{headers:{'Content-Type':'application/json','X-N8N-API-KEY':get('N8N_API_KEY')},...options});const j=await r.json();if(!r.ok)throw Error('n8n '+r.status);return j;};
try {
 const userId=(await pool.query('SELECT id::text FROM users LIMIT 1')).rows[0]?.id;if(!userId)throw Error('No test owner');
 const timestamp=Date.now(),role='user',secret=get('JWT_SECRET')||'wellbeing-secret-key-2024';
 const token='pg_token_'+Buffer.from(JSON.stringify({id:userId,role,timestamp,signature:crypto.createHmac('sha256',secret).update(`${userId}:${role}:${timestamp}`).digest('hex').substring(0,32)})).toString('base64');
 const headers={'Content-Type':'application/json',Authorization:'Bearer '+token,Referer:'http://localhost:5174/'};
 const api=async(suffix,options={})=>{const r=await fetch('http://localhost:5174/api/creative-works'+suffix,{headers,...options,signal:AbortSignal.timeout(30000)});const j=await r.json();if(!r.ok)throw Error(JSON.stringify(j));return j.data;};
 id=(await api('',{method:'POST',body:JSON.stringify({moduleId:'music-star-quest',moduleName:'星光录音棚',title:'临时同曲伴奏验证',parameters:{}})})).id;
 await api('/'+id,{method:'PUT',body:JSON.stringify({song:{lyrics:fixture.lyrics},audio:{vocal:fixture.url,segments:fixture.lyrics.map(l=>l.url),actualDuration:fixture.actualDuration,transcription:fixture,alignmentStatus:'needs_review',generationTask:{executionId:fixture.executionId,status:'completed'}}})});
 let result;
 for(let i=0;i<180;i++) {
  result=await api('/'+id+'/music');
  if(result.status==='error')throw Error(result.error);
  if(result.status==='completed')break;
  if(result.phase!=='backing')throw Error('Expected backing stage');
  if(i%12===0)console.log('Waiting for same-song instrumental');
  await new Promise(r=>setTimeout(r,5000));
 }
 if(result?.status!=='completed'||!result.backingUrl?.includes('/api/media/music?'))throw Error('Missing instrumental URL');
 if(result.backing.sourceFilename!==fixture.filename||Math.abs(result.backing.actualDuration-fixture.actualDuration)>0.01)throw Error('Instrumental is not from this master');
 const media=await fetch(result.backingUrl,{headers:{Range:'bytes=0-41'}});const bytes=Buffer.from(await media.arrayBuffer());
 if(media.status!==206||bytes.length!==42||bytes.subarray(0,4).toString()!=='fLaC')throw Error('Instrumental not playable');
 const packed=bytes.subarray(18,26).reduce((v,b)=>(v<<8n)|BigInt(b),0n);const rate=Number(packed>>44n),count=Number(packed&((1n<<36n)-1n));
 if(rate!==result.backing.sampleRate||count!==result.backing.sampleCount)throw Error('Saved audio timeline changed');
 const seek=await fetch(result.backingUrl,{headers:{Range:'bytes=4096-8191'}});if(seek.status!==206||(await seek.arrayBuffer()).byteLength!==4096)throw Error('Instrumental seek failed');
 const detail=await api('/'+id);if(detail.result.audio.backing!==result.backingUrl||detail.result.audio.backingStatus!=='completed')throw Error('Backing not persisted');
 const rendered=await api('/'+id+'/render',{method:'POST',body:'{}'});
 if(!rendered.html.includes(`id="audioAccomp" src="${result.backingUrl.replaceAll('&','&amp;')}"`))throw Error('HTML missing matching backing');
 const saved=(await pool.query('SELECT pg_column_size(result) AS bytes FROM creative_works WHERE id=$1',[id])).rows[0].bytes;
 // Exercise the new-task path against a temporary n8n execution returning the actual audio fixture.
 const production=await n8n('/api/v1/workflows/dSzHC0vfUXO3GgTo');
 const webhook=structuredClone(production.nodes.find(n=>n.type==='n8n-nodes-base.webhook'));
 webhook.id=crypto.randomUUID();webhook.webhookId=crypto.randomUUID();webhook.name='入口';webhook.parameters.path='verify-backing-'+crypto.randomUUID();webhook.parameters.responseMode='lastNode';
 const done={id:crypto.randomUUID(),name:'执行结束返回字段',type:'n8n-nodes-base.code',typeVersion:2,position:[400,200],parameters:{jsCode:'return [{json:'+JSON.stringify(fixture)+'}];'}};
 temporaryFlow=await n8n('/api/v1/workflows',{method:'POST',body:JSON.stringify({name:'临时同曲伴奏完成链路验证',nodes:[webhook,done],connections:{入口:{main:[[{node:done.name,type:'main',index:0}]]}},settings:{executionOrder:'v1'}})});
 await n8n('/api/v1/workflows/'+temporaryFlow.id+'/activate',{method:'POST',body:JSON.stringify({versionId:temporaryFlow.versionId})});
 const run=await fetch(n8nBase+'/webhook/'+webhook.parameters.path,{method:'POST',headers:{'Content-Type':'application/json','X-N8N-API-KEY':get('N8N_API_KEY')},body:'{}'});if(!run.ok)throw Error('Fixture n8n execution failed');await run.arrayBuffer();
 const execution=(await n8n('/api/v1/executions?workflowId='+temporaryFlow.id+'&limit=1')).data[0];
 const hash=crypto.createHash('sha256').update(JSON.stringify(fixture.lyrics.map(l=>l.text))).digest('hex');
 await api('/'+id,{method:'PUT',body:JSON.stringify({song:{lyrics:fixture.lyrics},audio:{vocal:'',backing:'',transcription:null,generationTask:{executionId:execution.id,status:'submitted',lyricsHash:hash}}})});
 const fresh=await api('/'+id+'/music');
 if(fresh.status!=='completed'||fresh.backingUrl!==result.backingUrl||(await api('/'+id)).result.audio.generationTask.status!=='completed')throw Error('New generation did not complete with its backing');
 console.log(JSON.stringify({verified:true,matchingMaster:result.backing.sourceFilename,duration:result.backing.actualDuration,backingStoredOnFtp:result.backing.cdnUrl,backingPlayable:true,newTaskCompletion:true,rangeSeek:true,htmlHasBacking:true,storedResultBytes:saved}));
}finally{if(temporaryFlow){await n8n('/api/v1/workflows/'+temporaryFlow.id+'/deactivate',{method:'POST'});await n8n('/api/v1/workflows/'+temporaryFlow.id,{method:'DELETE'});}if(id)await pool.query("DELETE FROM creative_works WHERE id=$1 AND module_id='music-star-quest'",[id]);await pool.end();console.log('Temporary backing work removed');}
