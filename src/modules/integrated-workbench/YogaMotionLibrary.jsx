import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Pause, Play, RotateCcw } from 'lucide-react';
import { ContentTabs, ContentTabPanel } from '../../components/LibraryControls';
import { PageLoading } from '../../components/PageLoading';
import './YogaMotionLibrary.css';

const characterName = id => id.slice(0,1).toUpperCase() + id.slice(1);
const initialPose = 'tree';

function Frame({ clip, frame, label }) {
  return (
    <svg viewBox="0 0 240 218" aria-label={label} role={label ? 'img' : undefined} aria-hidden={!label}>
      <use href={clip.url + '#f' + frame} />
    </svg>
  );
}

function MotionPlayer({ clip }) {
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [position, setPosition] = useState(() => playing ? 0 : Math.round(clip.frameCount * .52));
  const progress = useRef(position);
  const [speed, setSpeed] = useState(1);
  const fps = clip.frameCount * 1000 / clip.durationMs;
  useEffect(() => {
    if (!playing) return;
    const started = performance.now(), from = progress.current;
    let raf;
    function tick(now) {
      progress.current = (from + (now - started) * fps * speed / 1000) % clip.frameCount;
      setPosition(Math.floor(progress.current));
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, clip, speed, fps]);
  function seek(frame) {
    setPlaying(false);
    progress.current = frame;
    setPosition(frame);
  }
  return (
    <article className="ym-player">
      <div className="ym-pose-heading">
        <div><h2>{clip.name}</h2><span lang="en">{clip.english}</span></div>
        <a data-wb-button="quiet" data-wb-size="sm" href={clip.url} download={clip.characterId + '-' + clip.poseId + '.svg'}><Download size={15} />下载动图</a>
      </div>
      <div className="ym-stage">
        <Frame clip={clip} frame={position} label={characterName(clip.characterId) + ' · ' + clip.name} />
      </div>
      <div className="ym-playback">
        <button type="button" data-wb-button="primary" onClick={() => setPlaying(!playing)} aria-label={playing ? '暂停动作' : '播放动作'}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? '暂停' : '播放'}</button>
        <button type="button" data-wb-button="quiet" aria-label="回到第一帧" title="回到第一帧" onClick={() => seek(0)}><RotateCcw size={16} /></button>
        <input type="range" aria-label="动作进度" min="0" max={clip.frameCount - 1} value={position} onInput={e => seek(e.currentTarget.valueAsNumber)} />
        <span className="ym-time">{(position / fps).toFixed(1)} / {(clip.durationMs / 1000).toFixed(1)} s</span>
        <select aria-label="播放速度" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={.5}>0.5×</option><option value={1}>1×</option></select>
      </div>
      <div className="ym-notes"><strong>动作要点</strong><p>{clip.teacher}</p><div lang="en">{clip.instruction}</div></div>
    </article>
  );
}

export function YogaMotionLibrary() {
  const [clips, setClips] = useState(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const [character, setCharacter] = useState('poppy'), [pose, setPose] = useState(initialPose);
  useEffect(() => {
    const abort = new AbortController();
    setError('');
    fetch('/api/yoga-motions', {signal:abort.signal}).then(async response => {
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.data) || !body.data.length) throw Error(body.error || '暂时没有可查看的动作。');
      setClips(body.data);
    }).catch(e => { if (!abort.signal.aborted) setError(e.message || '动作库读取失败。'); });
    return () => abort.abort();
  }, [attempt]);
  const roles = [...new Set((clips || []).map(c => c.characterId))];
  const currentRole = roles.includes(character) ? character : roles[0];
  const choices = (clips || []).filter(c => c.characterId === currentRole);
  const selected = choices.find(c => c.poseId === pose) || choices[0];

  return (
    <main className="ym-library">
      <Link to="/workshop/interactive-yoga" className="ym-back"><ArrowLeft size={15} />情境瑜伽</Link>
      <header className="ym-heading"><h1>角色动作库</h1>{clips && <span>{roles.length} 个角色 · {clips.length} 段动图</span>}</header>
      {error ? <div className="ym-error" role="alert">{error}<button data-wb-button="secondary" onClick={() => setAttempt(attempt + 1)}>重新加载</button></div> : !clips ? <PageLoading label="正在读取角色动作" /> : <>
        <ContentTabs group="yoga-role" label="选择角色" items={roles.map(value => ({value, label:characterName(value)}))} value={currentRole} onChange={setCharacter} />
        <ContentTabPanel className="ym-workspace" group="yoga-role" value={currentRole}>
          <section className="ym-choices" aria-label="选择动作"><div className="ym-list-heading"><h2>动作列表</h2><span>{choices.length}</span></div>
            <div className="ym-pose-choices">{choices.map(c => <button type="button" key={c.poseId} aria-pressed={c.poseId === selected.poseId} onClick={() => setPose(c.poseId)}>
              <span className="ym-thumb"><Frame clip={c} frame={Math.round(c.frameCount * .52)} /></span>
              <span><strong>{c.name}</strong><small lang="en">{c.english}</small></span>
            </button>)}</div>
          </section>
          <MotionPlayer clip={selected} key={selected.url} />
        </ContentTabPanel>
      </>}
    </main>
  );
}
