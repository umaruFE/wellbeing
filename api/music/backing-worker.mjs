// A durable local job: survives Next development reloads. No audio is stored in the DB.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const apiRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [source, filename]=process.argv.slice(2);
if(!/^full_song_\d+_\d+\.flac$/.test(source||'')||!/^backing_[a-f0-9]{32}\.flac$/.test(filename||''))throw Error('Invalid backing job');
const root=process.env.MUSIC_RUNTIME_DIR||path.join(apiRoot,'.music-runtime');
const output=path.join(root,'audio',filename), state=path.join(root,'jobs',filename+'.json');
const write=async value=>{const tmp=state+'.'+process.pid+'.tmp';await fs.writeFile(tmp,JSON.stringify({...value,sourceFilename:source,updatedAt:Date.now()}));await fs.rename(tmp,state);};
try{
 await fs.mkdir(path.dirname(output),{recursive:true});
 const url=new URL('/webhook/files',process.env.N8N_API_BASE_URL||'http://117.50.218.161:5678');url.searchParams.set('file',source);
 await write({status:'processing',pid:process.pid,phase:'downloading'});
 const response=await fetch(url,{signal:AbortSignal.timeout(60000),redirect:'error'});
 if(!response.ok||!response.body)throw Error('整曲备用文件下载失败');
 const chunks=[];let size=0;const reader=response.body.getReader();
 while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>40*1024*1024){await reader.cancel();throw Error('整曲超过40MB');}chunks.push(r.value);}
 const bytes=Buffer.concat(chunks);if(bytes.subarray(0,4).toString()!=='fLaC')throw Error('整曲不是FLAC');
 const input=path.join(root,'audio',filename+'.source.flac');await fs.writeFile(input,bytes);
 await write({status:'processing',pid:process.pid,phase:'separating'});
 const python=process.env.MUSIC_SEPARATION_PYTHON||path.join(apiRoot,'.venv-music','bin','python');
 const temporary=output+'.tmp.flac';
 const info=await new Promise((resolve,reject)=>{
  const child=spawn(python,[path.join(apiRoot,'music','separate_backing.py'),input,temporary],{env:{...process.env,TORCH_HOME:path.join(root,'models')},stdio:['ignore','pipe','inherit']});
  let stdout='';child.stdout.on('data',c=>{stdout+=c;if(stdout.length>65536)stdout=stdout.slice(-65536);});
  const timeout=setTimeout(()=>{child.kill('SIGKILL');reject(Error('伴奏分离超过15分钟'));},15*60*1000);
  child.on('error',e=>{clearTimeout(timeout);reject(e.code==='ENOENT' ? Error('服务器未安装伴奏Python运行环境，请先运行 bash music/install-runtime.sh，安装后再重试伴奏') : e);});child.on('exit',code=>{clearTimeout(timeout);if(code!==0)return reject(Error('同曲伴奏分离失败，请查看本地 .music-runtime 日志'));try{resolve(JSON.parse(stdout.trim().split('\n').at(-1)));}catch{reject(Error('伴奏结果缺少音频信息'));}});
 });
 await fs.rename(temporary,output);await fs.rm(input,{force:true});
 await write({status:'processing',pid:process.pid,phase:'uploading'});
 const audio=await fs.readFile(output);if(audio.subarray(0,4).toString()!=='fLaC')throw Error('伴奏不是有效FLAC');
 const form=new FormData();form.append('file',new Blob([audio],{type:'audio/flac'}),filename);form.append('folder','music-star-quest/audio');
 const upload=await fetch('https://wellbeing.newstaredu.cn/api/upload',{method:'POST',body:form,signal:AbortSignal.timeout(120000)});
 const result=await upload.json();const cdn=new URL(result.url);
 if(!upload.ok||!result.success||cdn.protocol!=='https:'||cdn.hostname!=='z.wellbeing.newstaredu.cn')throw Error('伴奏FTP上传失败');
 await write({status:'ready',backing:{cdnUrl:cdn.toString(),fallbackFilename:filename,sourceFilename:source,...info,storage:'ftp',format:'flac'}});
}catch(error){console.error(error);await write({status:'error',error:error.message||'伴奏生成失败'});process.exitCode=1;}
finally{await fs.rm(state+'.lock',{force:true});}
