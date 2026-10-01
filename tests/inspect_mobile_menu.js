/**
 * Layout Verification of Open Mobile Menu
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

async function main() {
  const targets = await new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json/list', res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) return;

  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = {};

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks[msg.id]) {
      callbacks[msg.id](msg);
      delete callbacks[msg.id];
    }
  };

  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      callbacks[msgId] = resolve;
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await new Promise(resolve => ws.onopen = resolve);
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 1200));

  // Set mobile viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 412,
    height: 915,
    deviceScaleFactor: 1,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 400));

  // Click mobile toggle
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.mobile-nav-toggle').click()`
  });
  await new Promise(r => setTimeout(r, 400));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result?.data) {
    fs.writeFileSync(path.join(__dirname, 'mobile_menu_open.png'), Buffer.from(shot.result.data, 'base64'));
    console.log('Saved mobile_menu_open.png');
  }

  ws.close();
}

main().catch(console.error);
