import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMusicTime, parseMusicRange, applyActualLrc } from './musicTiming.js';

test('milliseconds and rounding across minute boundary', () => {
  assert.equal(formatMusicTime(59.9996), '01:00.000');
  assert.deepEqual(parseMusicRange('00:08.125–00:12.750'), { start: 8.125, end: 12.75 });
  assert.equal(parseMusicRange('00:60–01:02'), null);
  assert.equal(parseMusicRange('00:10–00:08'), null);
});
test('actual LRC keeps every repeated line and uses measured duration', () => {
  const lyrics = [{ text: 'Clap again!' }, { text: 'Clap again!' }, { text: 'Happy team!' }];
  const result = applyActualLrc('[00:08.125]Clap again!\n[00:12.500]Clap again!\n[00:16.750]Happy team!', lyrics, 23.625);
  assert.equal(result[0].time, '00:08.125–00:12.500');
  assert.equal(result[2].time, '00:16.750–00:23.625');
  assert.equal(result[2].text, lyrics[2].text);
});
test('reject missing lines, wrong lyrics, duplicate starts and out-of-range timing', () => {
  const lyrics = [{ text: 'Hello' }, { text: 'Goodbye' }];
  for (const lrc of ['[00:08]Hello', '[00:08]Wrong\n[00:10]Goodbye', '[00:08]Hello\n[00:08]Goodbye', '[00:08]Hello\n[00:30]Goodbye']) {
    assert.throws(() => applyActualLrc(lrc, lyrics, 20));
  }
});
