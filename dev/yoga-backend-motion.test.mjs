import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({ URL });
for (const filename of ['../public/workbench-v6/prep-workbench-six-modules-v1/language-goals.js', '../workbench-ui/yoga/model.js']) {
  vm.runInContext(readFileSync(new URL(filename, import.meta.url), 'utf8'), context);
}
const model = context.YogaModel;

function makeCourse() {
  const pages = [
    ['scene', null], ['transition', null], ['action', 'Tree Pose'],
    ['action', 'Garland Pose (Malasana)'], ['return', 'Savasana'], ['ending', null],
  ].map(([type, pose], i) => ({ type, pose, subtitle: 'Follow the light.', img: '/uploads/yoga/' + i + '.png' }));
  const state = model.createState();
  return model.useBackendCourse(state, state.settings, { title:'Night Walk', pages });
}

test('new workbench courses bind the selected character to each supported pose, including a resting return', () => {
  let state = makeCourse();
  assert.deepEqual(Array.from(state.draft.pages, page => page.assets.motion), ['na','na','ready','ready','ready','na']);
  assert.equal(state.draft.pages[4].backendType,'return');
  assert.equal(state.draft.pages[4].actionId,'savasana');
  assert.equal(model.actionForPose('Malasana').id,'garland');
  assert.equal(model.actionForPose('Seated Mountain Pose'),undefined);
  state = model.editContent(state,{target:'settings',values:{characterId:'milo'}});
  assert.equal(JSON.parse(state.draft.pages[2].assetSources.motion)[1],'milo');
  assert.equal(model.readiness(state).stale.some(entry=>entry.kind==='motion'),false);
  assert.doesNotThrow(()=>model.validateState(state));
});

test('published snapshots without motion stay readable and acquire matching rigs when copied', () => {
  let state=model.confirmContent(makeCourse());
  state=model.startAssets(state,{kinds:['voice']});
  state=model.finishAssets(state,state.job.id);
  const page=state.draft.pages[3];
  page.actionId=null;page.assets.motion='na';page.assetSources.motion=null;
  const published=model.publish(state);
  const saved=JSON.stringify(published.published);
  assert.doesNotThrow(()=>model.validateState(published));
  assert.equal(model.pageAction(published.published.course.pages[3]).id,'garland');
  const copy=model.forkDraft(published);
  assert.equal(copy.draft.pages[3].actionId,'garland');
  assert.equal(copy.draft.pages[3].assets.motion,'ready');
  assert.equal(JSON.stringify(copy.published),saved);
});
