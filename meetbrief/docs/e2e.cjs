const { chromium } = require('playwright');
// Usage: start emulators, server (.env.emulators) and web (--mode emulators), then
//   SP=/path/to/output-dir node docs/e2e.cjs   (needs review.mp4 in SP: any short video with audio)
const SP = process.env.SP;
const BASE = 'http://localhost:5173';
const log = (...a) => console.log(new Date().toISOString().slice(11,19), ...a);

(async () => {
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['microphone'], acceptDownloads: true });
  let page = await ctx.newPage();
  const errors = []; global.__errors = errors;
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  // Sign up
  await page.goto(BASE);
  await page.screenshot({ path: `${SP}/01-login.png` });
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.getByLabel('Email').fill(`tester${Date.now()}@example.com`);
  await page.getByLabel('Password').fill('correct-horse-9');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByRole('heading', { name: 'Ready for your next meeting?' }).waitFor();
  log('signed in');

  if (process.env.ONLY_CRASH) { await page.goto(`${BASE}/settings`); await page.getByLabel('Local save interval (seconds)').fill('2'); await page.getByRole('button', { name: 'Save settings' }).click(); await page.getByText('Saved', { exact: true }).waitFor(); }
  if (!process.env.ONLY_CRASH) {
  // Settings: 1-minute segments, 2-second chunks
  await page.goto(`${BASE}/settings`);
  await page.getByLabel('Segment length (minutes)').fill('1');
  await page.getByLabel('Local save interval (seconds)').fill('2');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await page.getByText('Saved', { exact: true }).waitFor();
  log('settings saved');

  // New meeting
  await page.goto(`${BASE}/meetings/new`);
  await page.getByText('District health programme review').click();
  await page.getByLabel('Meeting title').fill('District Health Society monthly review');
  await page.getByLabel('Chairperson').fill('District Collector');
  await page.getByRole('button', { name: 'Add participant' }).click();
  await page.getByLabel('Participant 1 name').fill('Dr. K. Lakshmi');
  await page.getByLabel('Participant 1 designation').fill('DMHO');
  await page.getByLabel('Report language').selectOption('bilingual');
  await page.screenshot({ path: `${SP}/02-new-meeting.png`, fullPage: true });
  await page.getByRole('button', { name: 'Continue to recording' }).click();
  await page.waitForURL(/\/record$/);
  log('on record page');
  const startBtn = page.getByRole('button', { name: 'Start recording' });
  if (!(await startBtn.isDisabled())) throw new Error('start should be disabled before consent');
  await page.getByText('I have informed everyone present').click();
  await page.screenshot({ path: `${SP}/03-consent.png`, fullPage: true });
  await startBtn.click();
  await page.getByText('Recording', { exact: true }).first().waitFor();
  log('recording');
  await page.waitForTimeout(8000);
  // Simulate a network outage mid-recording
  await ctx.setOffline(true);
  log('offline');
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${SP}/04-recording-offline.png`, fullPage: true });
  await ctx.setOffline(false);
  log('online');
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Resume' }).click();
  // cross the 1-minute segment boundary
  await page.waitForTimeout(52000);
  await page.screenshot({ path: `${SP}/05-recording-seg2.png`, fullPage: true });
  const segText = await page.locator('dt:has-text("Segment") + dd').first().textContent();
  const chunks = await page.locator('dt:has-text("Saved chunks") + dd').first().textContent();
  log('saved chunks', chunks);
  log('segment shown:', segText);
  await page.getByRole('button', { name: 'Stop' }).click();
  await page.getByRole('button', { name: 'Stop and process' }).click();
  await page.waitForURL(/\/meetings\/[^/]+$/, { timeout: 120000 });
  const meetingUrl = page.url();
  log('workspace', meetingUrl);
  await page.getByText('Ready', { exact: true }).waitFor({ timeout: 180000 });
  log('ready');
  await page.screenshot({ path: `${SP}/06-overview.png`, fullPage: true });
  await page.getByRole('tab', { name: 'Transcript' }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SP}/07-transcript.png`, fullPage: true });
  const lines = await page.locator('ol li').count();
  log('transcript lines', lines);
  await page.getByRole('tab', { name: 'Minutes' }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SP}/08-minutes.png`, fullPage: true });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Word (.docx)' }).click()]);
  await dl.saveAs(`${SP}/minutes.docx`);
  log('docx', dl.suggestedFilename());
  await page.getByRole('tab', { name: 'Action Items' }).click();
  await page.waitForTimeout(800);
  const tasks = await page.locator('input[type=checkbox][aria-label^="Mark"]').count();
  log('tasks', tasks);
  const firstBox = page.locator('input[type=checkbox][aria-label^="Mark"]').first();
  await firstBox.click();
  await page.locator('p.line-through').first().waitFor({ timeout: 10000 });
  log('task marked done');
  await page.screenshot({ path: `${SP}/09-actions.png`, fullPage: true });
  await page.getByRole('tab', { name: 'Ask AI' }).click();
  await page.getByLabel('Ask a question about this meeting').fill('What about immunisation?');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await page.getByText('(Demo answer)').waitFor({ timeout: 20000 });
  await page.screenshot({ path: `${SP}/10-ask.png`, fullPage: true });
  await page.getByRole('tab', { name: 'Files' }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SP}/11-files.png`, fullPage: true });
  log('files tab ok');

  // Upload flow with a video file
  await page.goto(`${BASE}/meetings/new?mode=upload`);
  await page.getByLabel('Meeting title').fill('Project sync (uploaded video)');
  await page.getByText('Project meeting').click();
  await page.getByRole('button', { name: 'Upload a file instead' }).click();
  await page.waitForURL(/\/upload$/);
  await page.setInputFiles('#file-input', `${SP}/review.mp4`);
  await page.getByText('video (audio will be extracted)').waitFor();
  await page.getByText('Participants knew this meeting').click();
  await page.screenshot({ path: `${SP}/12-upload.png`, fullPage: true });
  await page.getByRole('button', { name: /Upload and process/ }).click();
  await page.waitForURL(/\/meetings\/[^/]+$/, { timeout: 60000 });
  await page.getByText('Ready', { exact: true }).waitFor({ timeout: 120000 });
  log('upload processed');

  // Dashboard, search, tasks
  await page.goto(BASE);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SP}/13-dashboard.png`, fullPage: true });
  await page.goto(`${BASE}/search`);
  await page.getByLabel('Search meetings and transcripts').fill('immunisation');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForTimeout(1500);
  log('search results', await page.locator('main li').count());
  await page.screenshot({ path: `${SP}/14-search.png`, fullPage: true });
  await page.goto(`${BASE}/tasks`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SP}/15-tasks.png`, fullPage: true });

  }
  const crashTest = true;
  // Crash recovery: record, then kill the tab without a clean stop.
  await page.goto(`${BASE}/meetings/new`);
  await page.getByLabel('Meeting title').fill('Crash recovery test');
  await page.getByRole('button', { name: 'Continue to recording' }).click();
  await page.waitForURL(/\/record$/);
  const crashUrl = page.url().replace(/\/record$/, '');
  await page.getByText('I have informed everyone present').click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.waitForTimeout(9000);
  await ctx.setOffline(true); // the last chunks never reach the server
  await page.waitForTimeout(5000);
  await page.close({ runBeforeUnload: false });
  await ctx.setOffline(false);
  const page2 = await ctx.newPage();
  page2.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push('P2 ' + m.text()); if (m.text().includes('meetbrief')) console.log('P2', m.text()); });
  await page2.goto(BASE);
  await page2.getByRole('button', { name: 'Recover and upload' }).click();
  await page2.getByText('A recording was interrupted').waitFor({ state: 'detached', timeout: 90000 });
  log('recovered');
  await page2.goto(crashUrl);
  await page2.waitForTimeout(3000); await page2.screenshot({ path: SP + '/crash-ws.png', fullPage: true });
  await page2.getByRole('button', { name: /Process recording/ }).click();
  await page2.getByText('Ready', { exact: true }).waitFor({ timeout: 120000 });
  log('recovered meeting processed');

  // Mobile
  const mobile = await browser.newContext({ ...require('playwright').devices['Pixel 7'], permissions: ['microphone'], storageState: await ctx.storageState({ indexedDB: true }) });
  const mp = await mobile.newPage();
  await mp.goto(BASE);
  await mp.waitForTimeout(2500);
  await mp.screenshot({ path: `${SP}/16-mobile-dashboard.png` });
  await mp.goto(crashUrl + '?tab=minutes');
  await mp.waitForTimeout(2500);
  await mp.screenshot({ path: `${SP}/17-mobile-minutes.png` });
  log('console errors:', errors.filter(e => !e.includes('net::ERR_INTERNET_DISCONNECTED')).slice(0, 10));
  await browser.close();
})().catch(e => { console.error('E2E FAILED', String(e).slice(0,300)); console.error((global.__errors||[]).filter(x=>!x.includes('DISCONNECTED')).join('\n').slice(0,4000)); process.exit(1); });
