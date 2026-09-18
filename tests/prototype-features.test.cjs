const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadPrototypeApi() {
  const appPath = path.join(__dirname, "..", "app.js");
  let source = fs.readFileSync(appPath, "utf8");
  source = source.replace(/bindEvents\(\);\s*renderAll\(\);\s*$/, "");
  source += "\nglobalThis.__prototypeTestApi = { POIS, buildPlan };";

  const context = { console };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.__prototypeTestApi;
}

test("curated POI catalogue covers scenic highlights and mapped services", () => {
  const { POIS } = loadPrototypeApi();
  const ids = new Set(POIS.map((poi) => poi.id));
  const requiredIds = [
    "visitor-center",
    "welcome-pond",
    "liantai-fall",
    "jinsha-pudi",
    "zhengyan-chi",
    "five-color-pond",
    "huanglong-ancient-temple",
    "medical-point",
  ];

  assert.ok(POIS.length >= 12, "the prototype should include at least 12 POIs");
  requiredIds.forEach((id) => assert.ok(ids.has(id), `missing ${id}`));
  POIS.forEach((poi) => {
    assert.equal(Array.isArray(poi.location), true, `${poi.id} must have a JSAPI location array`);
    assert.equal(poi.location.length, 2, `${poi.id} must have longitude and latitude`);
    poi.location.forEach((coordinate) => assert.equal(Number.isFinite(coordinate), true, `${poi.id} coordinate must be numeric`));
  });
});

test("planner keeps selected POIs in the scenic route order", () => {
  const { POIS, buildPlan } = loadPrototypeApi();
  const ids = new Set(POIS.map((poi) => poi.id));
  const plan = buildPlan(ids, { hours: 8, pace: "深度", cableCar: false, shortageMinutes: 0 }, new Set());
  const routeOrders = Array.from(plan.included, (poi) => poi.routeOrder);

  assert.deepEqual(routeOrders, [...routeOrders].sort((left, right) => left - right));
});
