import http from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes,timingSafeEqual} from 'node:crypto';
const base=(process.env.COMFYUI_URL||'http://117.50.214.226:8188').replace(/\/$/,'');
const token=process.env.COMFYUI_TOKEN;
const template=JSON.parse(await readFile(new URL('./graph.json',import.meta.url),'utf8'));
const html=await readFile(new URL('./index.html',import.meta.url));
const password=process.env.PAGE_PASSWORD;
const taskFile=process.env.TASK_FILE||'/var/lib/h3-video/tasks.json';
let saved=[];try{saved=JSON.parse(await readFile(taskFile,'utf8'));}catch{}
const tasks=new Map(saved);
async function comfy(path,options={}) {
 if(!token) throw Error('生成服务尚未配置认证，请联系管理员');
 const r=await fetch(base+path,{...options,headers:{Authorization:'Bearer '+token,...options.headers},signal:AbortSignal.timeout(60000)});
 if(!r.ok) throw Error('生成服务请求失败（'+r.status+'）');
 return r;
}
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req){const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>29*1024*1024)throw Error('图片不能超过20MB');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString());}
function authorized(req){if(!password)return true;const expected=Buffer.from('Basic '+Buffer.from('video:'+password).toString('base64'));const actual=Buffer.from(req.headers.authorization||'');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
http.createServer(async(req,res)=>{
 try{
  if(!authorized(req)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Video"'});res.end('Authentication required');return;}
  const u=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(html);return;}
  if(req.method==='POST'&&u.pathname==='/api/generate'){
   const x=await body(req);if(!['i2v','t2v'].includes(x.mode))throw Error('请选择生成方式');
   if(typeof x.prompt!=='string'||!x.prompt.trim()||x.prompt.length>6000)throw Error('请输入6000字以内的提示词');
   const duration=Number(x.duration);if(!Number.isFinite(duration)||duration<4||duration>15)throw Error('时长必须在4到15秒之间');
   const sizes={'16:9':[864,480],'9:16':[480,864],'1:1':[480,480]};if(!sizes[x.ratio])throw Error('无效画幅');
   const graph=structuredClone(template);const inputs=graph['105:104'].inputs;
   inputs.prompt=x.mode==='i2v'?'Preserve the supplied first-frame subject, background, colors and visual style. '+x.prompt.trim():x.prompt.trim();
   [inputs.width,inputs.height]=sizes[x.ratio];const frames=Math.round(duration*24);inputs.length=frames+((5-frames%17)+17)%17;
   graph['h3:trim'].inputs.length=frames;graph['105:15'].inputs.noise_seed=randomBytes(6).readUIntBE(0,6);
   graph['h3:lora']={class_type:'LoraLoaderModelOnly',inputs:{model:['105:6',0],lora_name:'minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors',strength_model:1}};
   graph['h3:shift']={class_type:'MiniMaxH3SigmaShift',inputs:{model:['h3:lora',0],shift_video:6,shift_audio:3}};
   graph['105:9'].inputs.model=['h3:shift',0];graph['105:16'].inputs.model=['h3:shift',0];graph['105:9'].inputs.steps=8;graph['105:17'].inputs.sampler_name='euler';
   if(x.mode==='i2v'){
    const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(x.image||'');if(!match)throw Error('请上传PNG、JPEG或WebP图片');
    const bytes=Buffer.from(match[2],'base64');if(bytes.length>20*1024*1024||!bytes.length)throw Error('图片不能超过20MB');
    const ext=match[1].split('/')[1];const form=new FormData();form.append('image',new Blob([bytes],{type:match[1]}),'h3-'+randomBytes(12).toString('hex')+'.'+ext);form.append('type','input');
    const upload=await(await comfy('/upload/image',{method:'POST',body:form})).json();if(!upload.name)throw Error('图片上传失败');graph['114'].inputs.image=upload.subfolder?upload.subfolder+'/'+upload.name:upload.name;
   }else{delete inputs.first_frame;delete graph['114'];}
   const result=await(await comfy('/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:graph})})).json();
   if(!result.prompt_id||Object.keys(result.node_errors||{}).length)throw Error('生成流程校验失败：'+JSON.stringify(result.node_errors||result.error||{}));
   tasks.set(result.prompt_id,Date.now());await writeFile(taskFile,JSON.stringify([...tasks]));send(res,200,{id:result.prompt_id,status:'pending'});return;
  }
  const m=/^\/api\/tasks\/([\w-]+)$/.exec(u.pathname);
  if(req.method==='GET'&&m){
   const id=m[1];if(!tasks.has(id)){send(res,404,{error:'任务不存在或服务已重启'});return;}
   const data=await(await comfy('/history/'+encodeURIComponent(id))).json();const task=data[id];
   if(task?.status?.status_str==='error'){send(res,200,{status:'failed',error:'生成失败，请查看服务器日志'});return;}
   const elapsed=Math.round((Date.now()-tasks.get(id))/1000);
   if(task?.status?.completed||task?.status?.status_str==='success'){
    const file=Object.values(task.outputs?.['92']||{}).flat().find(f=>/\.(mp4|webm|mov)$/i.test(f?.filename||''));if(!file)throw Error('生成完成但未找到视频');
    send(res,200,{status:'completed',elapsed,url:'api/video/'+id});
   }else send(res,200,{status:'pending',elapsed});return;
  }
  const vm=/^\/api\/video\/([\w-]+)$/.exec(u.pathname);
  if(req.method==='GET'&&vm){
   const id=vm[1];if(!tasks.has(id)){send(res,404,{error:'任务不存在'});return;}
   const history=await(await comfy('/history/'+id)).json();const file=Object.values(history[id]?.outputs?.['92']||{}).flat().find(f=>/\.(mp4|webm|mov)$/i.test(f?.filename||''));if(!file)throw Error('视频尚未生成');
   const upstream=await comfy('/view?'+new URLSearchParams({filename:file.filename,subfolder:file.subfolder||'',type:file.type||'output'}),{headers:req.headers.range?{Range:req.headers.range}:{}});
   const headers={'Content-Type':upstream.headers.get('content-type')||'video/mp4','Cache-Control':'private, max-age=3600'};
   for(const key of ['content-length','content-range','accept-ranges']){const value=upstream.headers.get(key);if(value)headers[key]=value;}
   res.writeHead(upstream.status,headers);
   for await(const chunk of upstream.body){if(!res.write(chunk))await new Promise(resolve=>res.once('drain',resolve));}res.end();return;
  }
  send(res,404,{error:'页面不存在'});
 }catch(e){if(!res.headersSent)send(res,400,{error:e.message});else res.destroy();}
}).listen(Number(process.env.PORT||8090),process.env.HOST||'127.0.0.1',()=>console.log('H3 video service ready'));
