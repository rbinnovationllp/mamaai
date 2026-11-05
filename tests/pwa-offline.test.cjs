const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('offline missing assets fail instead of returning the home page as script content', async () => {
  const handlers = {};
  const cachedShell = new Response('<html>public</html>');
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'), {
    URL, Response,
    self: { location: { origin: 'https://fictional.example' }, addEventListener: (name, handler) => { handlers[name] = handler; } },
    fetch: async () => { throw new Error('offline'); },
    caches: { match: async request => request === '/' ? cachedShell : undefined },
  });
  let response;
  handlers.fetch({
    request: { method: 'GET', mode: 'cors', url: 'https://fictional.example/_next/static/missing.js' },
    respondWith: promise => { response = promise; },
  });
  assert.equal((await response).type, 'error');
});

test('service worker installs from the active root layout', () => {
  const layout = fs.readFileSync(path.join(__dirname, '../app/layout.tsx'), 'utf8');
  const registration = fs.readFileSync(path.join(__dirname, '../components/RegisterServiceWorker.tsx'), 'utf8');
  assert.match(layout, /<RegisterServiceWorker\s*\/>/);
  assert.match(registration, /register\("\/sw\.js"\)/);
});
