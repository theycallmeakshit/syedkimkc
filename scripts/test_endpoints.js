const http = require('http');

const endpoints = [
  '/',
  '/privacy',
  '/terms',
  '/non-existent-page',
  '/icon.svg',
  '/favicon-32x32.png',
  '/apple-touch-icon.png'
];

async function check(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      resolve({ path, status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

(async () => {
  for (const ep of endpoints) {
    const res = await check(ep);
    console.log(`${res.path.padEnd(22)} -> Status: ${res.status} (${res.contentType || res.error})`);
  }
})();
