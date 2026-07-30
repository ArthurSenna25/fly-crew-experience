import { chromium } from 'playwright';

// Create a tracing script that reproduces the WebKit memory growth issue
(async () => {
  // Launch WebKit browser with iPhone 14/15 user agent and viewport
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14/15 Safari
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Capture all console logs and page errors
  page.on('console', (msg) => console.log(`[console.${msg.type()}]`, msg.text()));
  page.on('pageerror', (err) => console.log('[pageerror]', err.message));

  // Start tracing with screenshots and snapshots
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

  const start = Date.now();

  // Navigate to the production URL
  await page.goto('https://fly-crew-site.vercel.app/', {
    waitUntil: 'load',
    timeout: 60000
  });
  console.log(`[timing] load event: ${Date.now() - start}ms`);

  // Simulate the reported pattern: scroll repeatedly
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(500);
  }

  await page.waitForTimeout(3000);

  // Stop tracing and save the trace
  await context.tracing.stop({ path: 'webkit-trace.zip' });
  await browser.close();
  console.log('Trace saved as webkit-trace.zip');
})();