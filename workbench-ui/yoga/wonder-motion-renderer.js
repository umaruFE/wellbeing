/* Progress-driven textured character mesh. No independent animation clock. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.YogaWonderMotionRenderer = factory(root.YogaWonderMotion, root.YogaWonderCase, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (motion, W, environment) {
  'use strict';
  const env = environment || globalThis;
  const instances = new WeakMap(), live = new Set();
  const reduced = env.matchMedia?.('(prefers-reduced-motion: reduce)');
  let observer = null, reportedFailure = false;
  const vertexShader = `attribute vec2 a_position;attribute vec2 a_uv;uniform vec4 u_crop;varying vec2 v_uv;
    void main(){gl_Position=vec4((a_position.x+0.25)/1.5*2.0-1.0,1.0-(a_position.y+0.25)/1.5*2.0,0.0,1.0);v_uv=u_crop.xy+a_uv*u_crop.zw;}`;
  const fragmentShader = 'precision mediump float;uniform sampler2D u_image;varying vec2 v_uv;void main(){gl_FragColor=texture2D(u_image,v_uv);}';

  function sourceCrop(character) {
    const [width, height] = character.dimensions_px;
    if (character.original_display_crop) {
      const [left, right] = character.original_display_crop.source_visible_x_range_px;
      const [top, bottom] = character.original_display_crop.source_visible_y_range_px;
      return [left / width, top / height, (right - left) / width, (bottom - top) / height];
    }
    const [left, top, right, bottom] = character.visible_alpha_bbox_px;
    return [left / width, top / height, (right - left) / width, (bottom - top) / height];
  }

  function releaseGraphics(item) {
    const gl = item.gl; item.gl = null;
    if (!gl) return;
    for (const shader of item.shaders || []) gl.deleteShader(shader);
    for (const buffer of item.buffers || []) gl.deleteBuffer(buffer);
    if (item.texture) gl.deleteTexture(item.texture);
    if (item.program) gl.deleteProgram(item.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    item.shaders = []; item.buffers = []; item.texture = null; item.program = null;
  }

  function dispose(item) {
    if (item.disposed) return;
    item.disposed = true;
    item.image.removeEventListener?.('load', item.onLoad);
    item.image.removeEventListener?.('error', item.onError);
    item.resizeObserver?.disconnect();
    item.canvas?.remove();
    item.actor.classList.remove('yw-motion-ready');
    releaseGraphics(item);
    live.delete(item); instances.delete(item.actor);
  }

  function prune() {
    for (const item of live) if (item.actor.isConnected === false) dispose(item);
  }

  function fail(item, error) {
    if (item.disposed || item.failed) return;
    item.failed = true;
    item.actor.classList.remove('yw-motion-ready');
    item.actor.dataset.motionState = 'unavailable';
    item.canvas?.remove();
    item.image.removeEventListener?.('load', item.onLoad);
    item.image.removeEventListener?.('error', item.onError);
    item.resizeObserver?.disconnect();
    releaseGraphics(item); live.delete(item);
    if (!reportedFailure) {
      reportedFailure = true;
      env.console?.warn?.('Yoga character animation is unavailable; preserving the original image.', error);
      if (typeof env.CustomEvent === 'function') item.actor.dispatchEvent(new env.CustomEvent('yoga:motion-error', { bubbles: true }));
    }
  }

  function compile(gl, type, code) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(message || 'Character shader compilation failed.');
    }
    return shader;
  }

  function initialize(item, sample) {
    const { actor, image } = item, doc = actor.ownerDocument;
    const canvas = doc.createElement('canvas'); item.canvas = canvas;
    canvas.className = 'yw-motion-canvas'; canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true, preserveDrawingBuffer: false });
    if (!gl) throw new Error('WebGL is unavailable.');
    item.gl = gl;
    canvas.addEventListener('webglcontextlost', () => fail(item, new Error('Character graphics context was lost.')));
    item.shaders = [compile(gl, gl.VERTEX_SHADER, vertexShader)];
    item.shaders.push(compile(gl, gl.FRAGMENT_SHADER, fragmentShader));
    const [vertex, fragment] = item.shaders;
    const program = gl.createProgram(); item.program = program;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment); item.shaders = [];
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Character program link failed.');
    gl.useProgram(program);
    item.buffers = [];
    function attribute(name, data, usage) {
      const buffer = gl.createBuffer(); item.buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      const location = gl.getAttribLocation(program, name); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
      return buffer;
    }
    item.positions = attribute('a_position', sample.positions, gl.DYNAMIC_DRAW);
    attribute('a_uv', sample.uvs, gl.STATIC_DRAW);
    item.indices = gl.createBuffer(); item.buffers.push(item.indices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, item.indices); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sample.indices, gl.STATIC_DRAW);
    item.texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, item.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
    gl.uniform4fv(gl.getUniformLocation(program, 'u_crop'), sourceCrop(item.spec.character));
    gl.clearColor(0, 0, 0, 0);
    actor.appendChild(canvas);
  }

  function draw(item) {
    if (item.failed || item.disposed || item.actor.isConnected === false || item.actor.ownerDocument.hidden) return;
    if (!item.image.complete || !item.image.naturalWidth) return;
    const rect = item.actor.getBoundingClientRect(); if (!(rect.width > 0 && rect.height > 0)) return;
    const progress = reduced?.matches ? .55 : item.progress;
    const ratio = Math.min(Number(env.devicePixelRatio) || 1, 2);
    const scale = Math.min(ratio * 1.5, 1024 / Math.max(rect.width, rect.height));
    const width = Math.max(1, Math.round(rect.width * scale)), height = Math.max(1, Math.round(rect.height * scale));
    if (item.lastProgress === progress && item.canvas?.width === width && item.canvas?.height === height) return;
    try {
      const sample = motion.sample(item.spec.kind, progress, { reducedMotion: !!reduced?.matches });
      if (!item.gl) initialize(item, sample);
      const { gl, canvas } = item;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      gl.viewport(0, 0, width, height); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(item.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, item.positions); gl.bufferSubData(gl.ARRAY_BUFFER, 0, sample.positions);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, item.indices); gl.drawElements(gl.TRIANGLES, sample.indices.length, gl.UNSIGNED_SHORT, 0);
      item.actor.classList.add('yw-motion-ready'); item.actor.dataset.motionState = reduced?.matches ? 'reduced' : sample.phase;
      item.lastProgress = progress;
    } catch (error) { fail(item, error); }
  }

  function track(actor) {
    const spec = W.pages.find(page => page.actionId && page.kind === actor.dataset.ywMotion);
    const image = actor.querySelector('.yw-sprite img'); if (!spec || !image) return null;
    const item = { actor, image, spec, progress: .55, disposed: false, failed: false };
    item.onLoad = () => draw(item); item.onError = () => fail(item, new Error('Character image failed to load.'));
    image.addEventListener('load', item.onLoad); image.addEventListener('error', item.onError);
    instances.set(actor, item); live.add(item);
    if (env.ResizeObserver) {
      item.resizeObserver = new env.ResizeObserver(() => draw(item)); item.resizeObserver.observe(actor);
    }
    if (!observer && env.MutationObserver && actor.ownerDocument.body) {
      observer = new env.MutationObserver(prune); observer.observe(actor.ownerDocument.body, { childList: true, subtree: true });
    }
    return item;
  }

  function setProgress(container, progress) {
    prune(); if (!container || !motion) return;
    const value = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : .55;
    for (const actor of container.querySelectorAll('[data-yw-motion]')) {
      const item = instances.get(actor) || track(actor); if (!item) continue;
      item.progress = value; draw(item);
    }
  }

  reduced?.addEventListener?.('change', () => { for (const item of live) { item.lastProgress = null; draw(item); } });
  env.addEventListener?.('pagehide', () => { for (const item of [...live]) dispose(item); });
  return { setProgress, sourceCrop };
});
