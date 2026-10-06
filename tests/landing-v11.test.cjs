const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const context = { window: {} };
vm.runInNewContext(script.split('var state=')[0] + '})();', context);
const model = context.window.SIGSLandingModel;
const config = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/plans-v11.json')));
for (const p of model.plans) {
  const saved = config.plans.find(x => x.code === p.code);
  assert.equal(p.price, saved.monthly_price_eur);
  assert.equal(p.projects, saved.max_projects);
  assert.equal(p.items, saved.max_items_per_project);
}
for (const [projects, items, expected] of [
  [1, 15, 'FREE'], [1, 16, 'EXPRESS'], [2, 15, 'EXPRESS'],
  [10, 50, 'EXPRESS'], [11, 50, 'PRO'], [10, 51, 'PRO'],
  [50, 100, 'PRO'], [51, 100, 'SUPREME'], [50, 101, 'SUPREME'], [100000, 200, 'SUPREME'], [1, 201, null]
]) assert.equal(model.recommend(projects, items)?.code ?? null, expected);
for (const [module, unit, fixed] of [['cctv',120,280],['alarm',65,220],['fire',85,450]]) {
  for (const count of [1,4,8]) {
    const q = model.demoQuote(module, count);
    assert.equal(q.subtotal, count * unit + fixed);
    assert.equal(q.total, Math.round(q.subtotal * 1.23 * 100) / 100);
    assert.equal(q.tax, Math.round(q.subtotal * .23 * 100) / 100);
  }
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'IDs must be unique');
for (const match of html.split('<script>')[0].matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const target = match[1];
  if (target.startsWith('#')) assert.ok(ids.includes(target.slice(1)), target);
  else if (!/^(?:data:|https?:|mailto:)/.test(target)) assert.ok(fs.existsSync(path.join(root, target.split('?')[0])), target);
}
for (const match of script.matchAll(/el\('([^']+)'\)/g)) assert.ok(ids.includes(match[1]), match[1]);
assert.ok(html.includes('prefers-reduced-motion'));
assert.ok(html.includes('lang="pt-PT"'));
console.log('PASS: exact plans, recommendations at boundaries, demo totals, syntax and local links.');

assert.equal(config.vat_included,false);assert(html.includes('IVA não incluído'));assert(html.includes('19,99 €'));
