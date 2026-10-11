import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, type Page, test } from '@playwright/test';

const standalone = pathToFileURL(resolve('dist/chroma-nudge.html')).href;

test('auto samples only on request, preserves manual edits, skips duplicates and undoes its batch', async ({
  page,
  baseURL,
}) => {
  await page.goto(baseURL ?? standalone);
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No canvas');
    ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'].forEach((color, index) => {
      context.fillStyle = color;
      context.fillRect(index * 100, 0, 100, 200);
    });
    return canvas.toDataURL().split(',')[1] ?? '';
  });
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'six-colors.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByRole('img', { name: 'six-colors.png' })).toBeVisible();
  await expect(page.locator('[data-sample-id]')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Colors', exact: true })).toHaveValue('5');
  for (const count of ['4', '5', '6']) {
    await page.getByRole('combobox', { name: 'Colors', exact: true }).selectOption(count);
    await page.getByRole('button', { name: 'Auto sample', exact: true }).click();
    await expect(page.locator('[data-sample-id]')).toHaveCount(Number(count));
    await page.getByRole('button', { name: 'Clear samples', exact: true }).click();
  }
  const image = await page.getByRole('img', { name: 'six-colors.png' }).boundingBox();
  if (!image) throw new Error('No photo');
  await page
    .getByRole('group', { name: /^Photo sampler/ })
    .click({ position: { x: image.width / 12, y: image.height / 2 } });
  await page.getByRole('textbox', { name: 'Name sample 1', exact: true }).fill('Keep this red');
  await page.getByRole('button', { name: 'Anchor sample 1', exact: true }).click();
  const before = await exportJson(page);
  await page.getByRole('button', { name: 'Auto sample', exact: true }).click();
  await expect(page.locator('[data-sample-id]')).toHaveCount(6);
  const added = await exportJson(page);
  expect(added.samples[0]).toEqual(before.samples[0]);
  expect(added.samples.map((sample: { original: string }) => sample.original).sort()).toEqual([
    '#0000FF',
    '#00FF00',
    '#00FFFF',
    '#FF0000',
    '#FF00FF',
    '#FFFF00',
  ]);
  await page.getByRole('button', { name: 'Auto sample', exact: true }).click();
  await expect(page.locator('[data-sample-id]')).toHaveCount(6);
  await expect(page.getByRole('status', { name: '', exact: true })).toContainText('already sampled');
  await page.getByRole('textbox', { name: 'Name sample 2', exact: true }).fill('Editable auto sample');
  await page.locator('[data-sample-id]').nth(1).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Undo auto sample', exact: true }).click();
  expect((await exportJson(page)).samples).toEqual(before.samples);
  await page.getByRole('button', { name: 'Clear samples', exact: true }).click();
  for (let index = 0; index < 15; index++)
    await page.getByRole('button', { name: 'Add center sample' }).click();
  await page.getByRole('button', { name: 'Auto sample', exact: true }).click();
  await expect(page.locator('[data-sample-id]')).toHaveCount(16);
  await expect(page.getByRole('button', { name: 'Auto sample', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Undo auto sample', exact: true }).click();
  await expect(page.locator('[data-sample-id]')).toHaveCount(15);
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
  await expect(page.getByRole('button', { name: 'Undo auto sample', exact: true })).toHaveCount(0);
});

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
  await page.getByText('Fine-tune the nudge', { exact: true }).click();
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
  expect(download.suggestedFilename()).toBe('chroma-nudge-reference.png');
  const pngStream = await download.createReadStream();
  if (!pngStream) throw new Error('No PNG stream');
  const pngChunks: Buffer[] = [];
  for await (const chunk of pngStream) pngChunks.push(Buffer.from(chunk));
  const png = Buffer.concat(pngChunks);
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(png.readUInt32BE(16)).toBe(1600);
  expect(png.readUInt32BE(20)).toBe(2 * (230 + reference.samples.length * 90));
  const pendingSvg = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export as SVG', exact: true }).click();
  const svgDownload = await pendingSvg;
  expect(svgDownload.suggestedFilename()).toBe('chroma-nudge-reference.svg');
  const stream = await svgDownload.createReadStream();
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

test('keeps action feedback visible while scrolling and exposes technical help', async ({
  page,
  baseURL,
}) => {
  await page.goto(baseURL ?? standalone);
  await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(page.getByRole('status', { name: '', exact: true })).toBeEmpty();
  await page.getByText('Fine-tune the nudge', { exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Maximum move', exact: true })).toBeVisible();
  await page.getByText('Reading & using this reference', { exact: true }).click();
  await expect(page.getByText('Original colors are on the left;', { exact: false })).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 800 });
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export reference sheet' }).click();
    await pending;
    await expect(page.getByRole('status', { name: '', exact: true })).toContainText(
      'Reference sheet exported.',
    );
    await expect(page.getByRole('button', { name: 'Dismiss notification' })).toBeInViewport();
    await page.getByRole('button', { name: 'Dismiss notification' }).click();
    await expect(page.getByRole('status', { name: '', exact: true })).toBeEmpty();
  }
  await page.getByRole('link', { name: 'How it works' }).click();
  await expect(page.getByRole('heading', { name: 'A direction, not a prescription.' })).toBeInViewport();
});

test('dismisses a notification with one click throughout its close target', async ({ page, baseURL }) => {
  await page.goto(baseURL ?? standalone);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const fraction of [0.1, 0.5, 0.9]) {
      await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
      const close = page.getByRole('button', { name: 'Dismiss notification' });
      const bounds = await close.boundingBox();
      if (!bounds) throw new Error('Notification close target is missing');
      await page.mouse.click(bounds.x + bounds.width * fraction, bounds.y + bounds.height / 2);
      await expect(close).toHaveCount(0);
      await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
      await page.getByRole('button', { name: 'Dismiss notification' }).click();
    }
  }
});

test('clear preserves nudge settings while demo resets selection and samples', async ({ page, baseURL }) => {
  await page.goto(baseURL ?? standalone);
  await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
  await page.getByRole('combobox', { name: 'Harmony', exact: true }).selectOption('custom');
  await page.getByRole('slider', { name: 'Nudge strength' }).fill('25');
  await page.getByRole('button', { name: 'Anchor sample 1', exact: true }).click();
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Explore a six-color demo' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
  const reference = await exportJson(page);
  expect(reference.settings.strength).toBe(0.25);
  expect(reference.samples).toHaveLength(6);
  expect(reference.samples.every((sample: { locked: boolean }) => !sample.locked)).toBe(true);
  await expect(page.getByRole('combobox', { name: 'Harmony', exact: true })).toHaveValue('auto');
});

for (const replacement of ['clear', 'demo', 'newer import'] as const) {
  test(`pending import cannot replace ${replacement}`, async ({ page, baseURL }) => {
    await page.goto(baseURL ?? standalone);
    await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
    const png = await page.evaluate(() => {
      const state = window as unknown as { releaseImports: (() => void)[] };
      state.releaseImports = [];
      const decode = window.createImageBitmap.bind(window);
      window.createImageBitmap = async (source: ImageBitmapSource) => {
        const bitmap = await decode(source);
        await new Promise<void>((resolve) => state.releaseImports.push(resolve));
        return bitmap;
      };
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      return canvas.toDataURL().split(',')[1] ?? '';
    });
    const input = page.locator('input[type=file]');
    await input.setInputFiles({
      name: 'older.png',
      mimeType: 'image/png',
      buffer: Buffer.from(png, 'base64'),
    });
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { releaseImports: (() => void)[] }).releaseImports.length),
      )
      .toBe(1);
    if (replacement === 'clear') {
      await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
    } else if (replacement === 'demo') {
      await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
      await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
    } else {
      await input.setInputFiles({
        name: 'newer.png',
        mimeType: 'image/png',
        buffer: Buffer.from(png, 'base64'),
      });
      await expect
        .poll(() =>
          page.evaluate(
            () => (window as unknown as { releaseImports: (() => void)[] }).releaseImports.length,
          ),
        )
        .toBe(2);
      await page.evaluate(() =>
        (window as unknown as { releaseImports: (() => void)[] }).releaseImports[1]?.(),
      );
      await expect(page.getByRole('img', { name: 'newer.png', exact: true })).toBeVisible();
    }
    await page.evaluate(async () => {
      (window as unknown as { releaseImports: (() => void)[] }).releaseImports[0]?.();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    await expect(page.getByRole('img', { name: 'older.png', exact: true })).toHaveCount(0);
    if (replacement === 'clear') {
      await expect(page.getByRole('heading', { name: 'Start with a photograph.' })).toBeVisible();
    } else {
      await expect(
        page.getByRole('img', {
          name: replacement === 'demo' ? 'Six-color study (demo)' : 'newer.png',
          exact: true,
        }),
      ).toBeVisible();
    }
  });
}

test('magnifies the active sample during dragging and dismisses on release or cancellation', async ({
  page,
  baseURL,
}) => {
  await page.goto(baseURL ?? standalone);
  await page.getByRole('button', { name: 'Explore a six-color demo' }).click();
  const surface = page.getByRole('group', { name: /^Photo sampler/ });
  const loupe = page.getByTestId('sample-loupe');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await surface.scrollIntoViewIfNeeded();
    const bounds = await surface.boundingBox();
    if (!bounds) throw new Error('Photo bounds missing');
    await page.mouse.move(bounds.x + bounds.width / 6, bounds.y + bounds.height / 4);
    await page.mouse.down();
    await expect(loupe).toBeVisible();
    await expect(loupe).toContainText('#D3A878');
    await page.mouse.move(bounds.x + bounds.width - 1, bounds.y + 1);
    await expect(loupe).toContainText('#3F4E36');
    const preview = await loupe.boundingBox();
    if (!preview) throw new Error('Loupe bounds missing');
    expect(preview.x).toBeGreaterThanOrEqual(0);
    expect(preview.x + preview.width).toBeLessThanOrEqual(width);
    expect(preview.y).toBeGreaterThanOrEqual(0);
    expect(preview.y + preview.height).toBeLessThanOrEqual(1000);
    await page.mouse.up();
    await expect(loupe).toHaveCount(0);
  }
  const bounds = await surface.boundingBox();
  if (!bounds) throw new Error('Photo bounds missing');
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
  });
  await expect(loupe).toBeVisible();
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: bounds.x + bounds.width / 4, y: bounds.y + bounds.height / 3 }],
  });
  await expect(loupe).toContainText('#D3A878');
  await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(loupe).toHaveCount(0);
});
