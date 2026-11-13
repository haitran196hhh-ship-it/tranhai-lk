
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const runtime = require('../akirrai_cms_stage6_runtime.js');
const root = path.resolve(__dirname, '..');

const catalog = JSON.parse(
  fs.readFileSync(
    path.join(root, 'data', 'cms_catalog.json'), 'utf8'
  )
);

const active = catalog.items.filter(x => x.enabled !== false);

function mount() {
  const routes = new Map();
  const cms = runtime.install({
    get: (url, fn) => routes.set(url, fn)
  }, root);
  return { routes, cms };
}

test('CMS catalog', () => {
  assert.equal(catalog.schemaVersion, 1);
  assert.ok(active.length > 0);
  assert.equal(mount().cms.count, active.length);
});

test('CMS assets and layouts', () => {
  const { cms } = mount();

  for (const item of active) {
    assert.equal(cms.has(item.id, item.type), true);

    if (['frame', 'ptb', 'sticker'].includes(item.type)) {
      const asset = cms.asset(item.id);
      assert.ok(asset && fs.statSync(asset).size > 0);
    }

    if (item.type === 'ptb') {
      assert.equal(
        cms.layout(item.id).slots.length,
        item.layout.slots.length
      );
    }

    if (item.type === 'ai') {
      assert.equal(cms.prompt(item.id), item.prompt);
    }
  }
});

test('CMS API does not publish AI prompts', () => {
  const { routes } = mount();
  let body;

  routes.get('/api/akirrai/catalog')({}, {
    setHeader: () => {},
    json: value => { body = value; }
  });

  assert.equal(body.count, active.length);
  assert.equal(
    body.items.some(x => Object.hasOwn(x, 'prompt')),
    false
  );
});
