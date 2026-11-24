import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = { module: { exports: {} } };
vm.runInNewContext(readFileSync(new URL('../workbench-ui/move-match-v1/model.js', import.meta.url), 'utf8'), context);
const { reorderItems } = context.module.exports;
const ids = items => items.map(item => item.id);
const deck = (...names) => Object.freeze(names.map(id => Object.freeze({ id, word: id })));

test('a question can move to either end of the lesson', () => {
  const items = deck('a', 'b', 'c', 'd');
  assert.deepEqual(ids(reorderItems(items, 'a', 'd', true)), ['b', 'c', 'd', 'a']);
  assert.deepEqual(ids(reorderItems(items, 'd', 'a')), ['d', 'a', 'b', 'c']);
});

test('before and after destinations retain their meaning in both directions', () => {
  const items = deck('a', 'b', 'c', 'd', 'e');
  assert.deepEqual(ids(reorderItems(items, 'a', 'd')), ['b', 'c', 'a', 'd', 'e']);
  assert.deepEqual(ids(reorderItems(items, 'a', 'd', true)), ['b', 'c', 'd', 'a', 'e']);
  assert.deepEqual(ids(reorderItems(items, 'e', 'b')), ['a', 'e', 'b', 'c', 'd']);
  assert.deepEqual(ids(reorderItems(items, 'e', 'b', true)), ['a', 'b', 'e', 'c', 'd']);
});

test('moving across visual rows changes only the sequential lesson order', () => {
  const items = deck('q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9');
  const moved = reorderItems(items, 'q2', 'q8', true);
  assert.deepEqual(ids(moved), ['q1', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q2', 'q9']);
  assert.deepEqual(ids(reorderItems(moved, 'q2', 'q3')), ids(items));
});

test('dragging filtered questions preserves all hidden questions and their order', () => {
  const items = Object.freeze([
    { id:'a1', categoryId:'a' }, { id:'b1', categoryId:'b' },
    { id:'a2', categoryId:'a' }, { id:'c1', categoryId:'c' },
    { id:'b2', categoryId:'b' }, { id:'a3', categoryId:'a' },
  ].map(Object.freeze));
  const moved = reorderItems(items, 'a3', 'a1');
  assert.deepEqual(ids(moved), ['a3', 'a1', 'b1', 'a2', 'c1', 'b2']);
  assert.deepEqual(ids(moved.filter(item => item.categoryId !== 'a')), ['b1', 'c1', 'b2']);
  assert.equal(moved.length, items.length);
  assert.equal(new Set(ids(moved)).size, items.length);
});

test('invalid and unchanged destinations preserve the original array identity', () => {
  const items = deck('a', 'b', 'c');
  for (const [source, target, after] of [
    ['missing', 'a', false], ['a', 'missing', true], ['missing', 'missing', false],
    ['a', 'a', false], ['b', 'b', true], ['a', 'b', false], ['b', 'a', true],
  ]) assert.equal(reorderItems(items, source, target, after), items);
  const empty = Object.freeze([]);
  assert.equal(reorderItems(empty, 'a', 'b'), empty);
});

test('reordering never mutates the input or clones question content', () => {
  const items = deck('a', 'b', 'c', 'd');
  const moved = reorderItems(items, 'b', 'd', true);
  assert.notEqual(moved, items);
  assert.deepEqual(ids(items), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids(moved), ['a', 'c', 'd', 'b']);
  for (const item of moved) assert.equal(item, items.find(original => original.id === item.id));
});
