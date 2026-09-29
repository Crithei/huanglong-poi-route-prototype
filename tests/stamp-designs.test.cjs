const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

function load() {
  const context = vm.createContext({ window: {}, console });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'stamps.js'), 'utf8'), context);
  return context.window.HUANGLONG_STAMPS;
}

test('key Huanglong POIs have distinct collectible stamp art direction', () => {
  const stamps = load();
  const ids = ['welcome-pond', 'flying-waterfall', 'jinsha-pudi', 'zhengyan-chi', 'five-color-pond', 'huanglong-ancient-temple'];
  ids.forEach((id) => {
    const stamp = stamps[id];
    assert.ok(stamp, `${id} should have a dedicated stamp`);
    assert.ok(stamp.title.length >= 2);
    assert.ok(stamp.motto.length >= 4);
    assert.match(stamp.color, /^#[0-9a-f]{6}$/i);
    assert.match(stamp.accent, /^#[0-9a-f]{6}$/i);
    assert.ok(['pond', 'waterfall', 'landform', 'culture'].includes(stamp.motif));
  });
  assert.equal(new Set(ids.map((id) => stamps[id].color)).size, ids.length, 'key stamps should not collapse into one palette');
});

test('stamp catalogue provides a graceful generic design for the remaining scenic POIs', () => {
  const stamps = load();
  assert.ok(stamps.default);
  assert.equal(stamps.default.motif, 'default');
  assert.ok(stamps.default.motto.length >= 4);
});
