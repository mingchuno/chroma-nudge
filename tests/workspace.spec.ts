import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, type Page, test } from '@playwright/test';

const standalone = pathToFileURL(resolve('dist/chroma-nudge.html')).href;

async function exportJson(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export full study as JSON' }).click();
  const download = await pending;
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Download stream is missing');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString());
}

test('opens directly from disk and samples a local PNG without network requests', async ({
  page,
  baseURL,
}) => {
  const network: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && request.resourceType() !== 'document') network.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(baseURL ?? standalone);
  await expect(page.getByRole('heading', { name: 'Start with a photograph.' })).toBeVisible();
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 50;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No canvas');
    context.fillStyle = '#FF0000';
    context.fillRect(0, 0, 50, 50);
    context.fillStyle = '#0000FF';
    context.fillRect(50, 0, 50, 50);
    return canvas.toDataURL('image/png').split(',')[1] ?? '';
  });
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'local-study.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.getByRole('group', { name: /^Photo sampler/ }).click({ position: { x: 30, y: 30 } });
  await expect(page.getByRole('button', { name: 'Copy original #FF0000' })).toBeVisible();
  const image = await page.getByRole('img', { name: 'local-study.png' }).boundingBox();
  if (!image) throw new Error('Photo bounds are missing');
  const dot = page.locator('[data-sample-id]');
  const bounds = await dot.boundingBox();
  if (!bounds) throw new Error('Sample bounds are missing');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(image.x + image.width * 0.75, image.y + image.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Copy original #0000FF' })).toBeVisible();
  await dot.focus();
  await page.keyboard.press('ArrowRight');
  const reference = await exportJson(page);
  expect(reference.samples[0].position.x).toBeGreaterThan(0.75);
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.getByRole('alert')).toContainText('could not read');
  await expect(page.getByRole('img', { name: 'local-study.png' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear samples', exact: true }).click();
  for (let index = 0; index < 16; index++)
    await page.getByRole('button', { name: 'Add center sample' }).click();
  await expect(page.getByRole('button', { name: 'Add center sample' })).toBeDisabled();
  await expect(page.locator('ol > li')).toHaveCount(16);
  await page.getByRole('button', { name: 'Remove sample 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add center sample' })).toBeEnabled();
  expect(network).toEqual([]);
  expect(errors).toEqual([]);
});

test('honors anchor, strength and custom drag and exports a safe reference sheet', async ({
  page,
  baseURL,
}) => {
  await page.goto(baseURL ?? standalone);
  await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
  await page.getByRole('combobox', { name: 'Harmony', exact: true }).selectOption('complementary');
  await page.getByRole('button', { name: 'Anchor sample 1', exact: true }).click();
  await expect(page.locator('ol > li').first()).toContainText('Anchor · keep');
  await page.getByRole('slider', { name: 'Nudge strength', exact: true }).focus();
  await page.keyboard.press('Home');
  let reference = await exportJson(page);
  expect(
    reference.samples.every(
      (sample: { original: string; suggested: string }) => sample.original === sample.suggested,
    ),
  ).toBe(true);
  await page.getByRole('slider', { name: 'Nudge strength', exact: true }).focus();
  await page.keyboard.press('End');
  await page.getByRole('slider', { name: 'Maximum move', exact: true }).focus();
  await page.keyboard.press('End');
  await page.getByRole('combobox', { name: 'Harmony', exact: true }).selectOption('custom');
  await page.getByRole('button', { name: 'Select sample 3', exact: true }).click();
  await page.getByRole('spinbutton').fill('145');
  reference = await exportJson(page);
  expect(reference.samples[2].suggestedHsl.h).toBeCloseTo(145);
  expect(reference.samples[0].original).toBe(reference.samples[0].suggested);
  const target = page.locator('circle[stroke-dasharray="2 2"]').nth(2);
  await page.locator('svg[viewBox="0 0 400 400"]').scrollIntoViewIfNeeded();
  const bounds = await target.boundingBox();
  const wheel = await page.locator('svg[viewBox="0 0 400 400"]').boundingBox();
  if (!bounds || !wheel) throw new Error('Wheel target bounds are missing');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(wheel.x + wheel.width * 0.275, wheel.y + wheel.height * 0.8897, { steps: 8 });
  await page.mouse.up();
  reference = await exportJson(page);
  expect(reference.samples[2].targetHue).toBeCloseTo(240, 0);
  await page.getByRole('textbox', { name: 'Name sample 1', exact: true }).fill('<script>alert(1)</script>');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reference sheet' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('chroma-nudge-reference.svg');
  const stream = await download.createReadStream();
  if (!stream) throw new Error('No SVG stream');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const svg = Buffer.concat(chunks).toString();
  expect(svg).toContain('&lt;script&gt;');
  expect(svg).not.toContain('<script>');
});

test('keeps desktop and mobile layouts within the viewport', async ({ page, baseURL }) => {
  await page.goto(baseURL ?? standalone);
  await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Export reference sheet' })).toBeVisible();
  }
});

test('rejects unsupported files and keeps the workspace usable', async ({ page, baseURL }) => {
  await page.goto(baseURL ?? standalone);
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'image.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByRole('alert')).toContainText('Choose a JPEG');
  await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
  await expect(page.locator('ol > li')).toHaveCount(6);
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Start with a photograph.' })).toBeVisible();
});
