/**
 * Layout Verification & Screenshot Capture via Chrome DevTools Protocol (CDP)
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
  if (!pageTarget) {
    console.error('No page target found');
    return;
  }

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
  
  // Wait 1.5s for page to render
  await new Promise(r => setTimeout(r, 1500));

  // Set window size to 1366x800
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Evaluate element rects
  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const brand = document.querySelector('.brand-link').getBoundingClientRect();
        const logo = document.querySelector('.brand-logo-img').getBoundingClientRect();
        const homeLink = document.querySelector('.nav-item a').getBoundingClientRect();
        const navLinks = document.querySelector('.nav-links').getBoundingClientRect();
        const navActions = document.querySelector('.nav-actions').getBoundingClientRect();
        return {
          brandWidth: brand.width,
          logoWidth: logo.width,
          brandRight: brand.right,
          homeLeft: homeLink.left,
          gapBetweenLogoAndHome: homeLink.left - brand.right,
          isOverlapping: brand.right > homeLink.left,
          navLinksWidth: navLinks.width,
          navActionsLeft: navActions.left
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Layout Metrics at 1366px Viewport:\n', JSON.stringify(evalRes.result?.value, null, 2));

  // Capture screenshot
  const shotRes = await send('Page.captureScreenshot', { format: 'png' });
  if (shotRes.result?.data) {
    const buf = Buffer.from(shotRes.result.data, 'base64');
    const outPath = path.join(__dirname, 'layout_verified.png');
    fs.writeFileSync(outPath, buf);
    console.log('Saved screenshot to:', outPath);
  }

  ws.close();
}

main().catch(console.error);
