/* Private per-preview snapshot. Games never write preparation state. */
var SS_ESCAPE = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
var SS_DATA=null;
try { const token=new URLSearchParams(location.search).get('session'); if(token)SS_DATA=JSON.parse(sessionStorage.getItem(('wellbeing-web-three-v1-'+window.WB_WEB_SCOPE+'-external-speak-'+"wellbeing-six-modules-v1-speak-session:")+token)); } catch(error){console.warn('游戏快照读取失败',error.message);}

if(new URLSearchParams(location.search).has('session')&&!SS_DATA){addEventListener('DOMContentLoaded',()=>{document.body.innerHTML='<main style="padding:50px;color:#233149;font:20px sans-serif"><h1>预览已过期</h1><p>请关闭此窗口，返回备课页重新打开预览或授课版。</p></main>';});}
