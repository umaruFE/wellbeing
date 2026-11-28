// Run with node bake-motions.cjs <output directory>, then import index.json on the backend.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadRig() {
  const context = vm.createContext({});
  for (const file of ['character-skins.js', 'skeletal-clips.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context, {filename:file});
  }
  return context.YogaSkeletalClips;
}

function bakeSvg(rig, characterId, motion, durationMs, count) {
  const paths = new Map();
  const frames = [];
  const playback = [];
  for (let frame = 0; frame < count; frame++) {
    const drawing = rig.renderFrame(characterId, motion.id, frame / count);
    // Identical artwork (including each face and silhouette) is referenced across frames.
    const markup = drawing.replace(/<(path|ellipse|circle)\b[^<>]{95,}?\/>/g, tag => {
      if (!paths.has(tag)) paths.set(tag, 'p' + paths.size);
      return '<use href="#' + paths.get(tag) + '"/>';
    });
    frames.push('<g id="f' + frame + '">' + markup + '</g>');
    const start = (frame / count).toFixed(7), end = ((frame + 1) / count).toFixed(7);
    const keys = frame === 0 ? '0;' + end + ';1' : frame === count - 1 ? '0;' + start + ';1' : '0;' + start + ';' + end + ';1';
    const values = frame === 0 ? 'visible;hidden;hidden' : frame === count - 1 ? 'hidden;visible;hidden' : 'hidden;visible;hidden;hidden';
    playback.push('<use href="#f' + frame + '" visibility="' + (frame ? 'hidden' : 'visible') + '"><animate attributeName="visibility" calcMode="discrete" dur="' + durationMs + 'ms" repeatCount="indefinite" keyTimes="' + keys + '" values="' + values + '"/></use>');
  }
  const shapes = [...paths].map(([tag,id]) => tag.replace(' ', ' id="' + id + '" '));
  const title = characterId[0].toUpperCase() + characterId.slice(1) + ' · ' + motion.name;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + rig.viewBox + '" role="img"><title>' + title + '</title><defs>' + shapes.join('') + frames.join('') + '</defs>' + playback.join('') + '</svg>';
}

if (require.main === module) {
  const output = process.argv[2];
  if (!output) throw Error('Please supply an output directory.');
  const rig = loadRig(), clips = [];
  fs.mkdirSync(output, {recursive:true});
  for (const characterId of ['poppy','edi','rolly','milo','ace']) {
    for (const motion of rig.motions) {
      const durationMs = motion.durationMs || 4800;
      const frameCount = Math.round(durationMs * 25 / 1000);
      const filename = characterId + '-' + motion.id + '.svg';
      fs.writeFileSync(path.join(output, filename), bakeSvg(rig, characterId, motion, durationMs, frameCount));
      const {id:poseId, ...fields} = motion;
      clips.push({characterId, poseId, ...fields, durationMs, frameCount, filename});
    }
  }
  fs.writeFileSync(path.join(output, 'index.json'), JSON.stringify({version:1, clips}, null, 2));
  console.log('Baked ' + clips.length + ' clips.');
}
module.exports = {bakeSvg, loadRig};
