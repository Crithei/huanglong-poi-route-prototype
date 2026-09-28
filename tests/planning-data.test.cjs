const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

function load() {
  const context = vm.createContext({ window: {}, console });
  for (const file of ['data/planning.js', 'data/scenic.js', 'map.js', 'app.js']) {
    let source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    if (file === 'app.js') source = source.replace(/bindEvents\(\);\s*renderAll\(\);\s*$/, '');
    vm.runInContext(source, context);
  }
  vm.runInContext('globalThis.api={planning:window.HUANGLONG_PLANNING,buildPlan,appState}', context);
  return context.api;
}

test('planning reference data carries source status, areas, capacity and map layers', () => {
  const { planning } = load();
  assert.equal(planning.summary.scenicResourceCount, 103);
  assert.equal(planning.areas.length, 7);
  assert.equal(planning.facilities.length >= 6, true);
  assert.equal(planning.routes.length >= 3, true);
  assert.equal(planning.source.status.includes('规划资料'), true);
  for (const area of planning.areas) {
    assert.ok(Number.isFinite(area.capacity));
    assert.ok(Number.isFinite(area.limit));
    assert.equal(area.center.length, 2);
  }
  for (const route of planning.routes) assert.ok(route.points.length > 1);
  for (const resource of planning.resources) assert.equal(resource.location.length, 2);
});

test('planner exposes planning context and keeps legacy preference calls valid', () => {
  const { buildPlan, appState } = load();
  const plan = buildPlan(new Set(['welcome-pond', 'five-color-pond']), { hours: 6, pace: '平衡', cableCar: false, shortageMinutes: 0 }, new Set());
  assert.equal(plan.planning.routeMode, '观光核心');
  assert.equal(plan.planning.capacity.name, '黄龙沟');
  const photoPlan = buildPlan(new Set(['welcome-pond', 'five-color-pond']), { hours: 6, pace: '平衡', mode: '摄影', cableCar: false, shortageMinutes: 0 }, new Set());
  assert.equal(photoPlan.planning.routeMode, '摄影');
  assert.equal(appState.preferences.mode, '观光核心');
});
