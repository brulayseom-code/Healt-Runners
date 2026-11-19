import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';
import { crc32 } from 'node:zlib';

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

function pngAtLimit(image) {
  // Insert a valid ancillary PNG chunk before IEND to test the exact byte limit.
  const size = MAX_PHOTO_BYTES - image.length - 12;
  assert.ok(size > 0);
  const chunk = Buffer.alloc(size + 12);
  chunk.writeUInt32BE(size, 0);
  chunk.write('npAd', 4, 'ascii');
  chunk.writeUInt32BE(crc32(chunk.subarray(4, -4)), chunk.length - 4);
  return Buffer.concat([image.subarray(0, -12), chunk, image.subarray(-12)]);
}

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
let initial;
let peer;
let anonymous;

async function dashboard(client = context.request) {
  const response = await client.get(`${base}/api/dashboard`);
  assert.equal(response.status(), 200);
  return response.json();
}
async function action(body, client = context.request) {
  const response = await client.post(`${base}/api/actions`, { data: { ...body, date: initial.day.date } });
  const result = await response.json();
  assert.equal(response.status(), 200, result.error);
  return result;
}
async function reload() {
  const loaded = page.waitForResponse(r => r.url().includes('/api/dashboard'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal((await loaded).status(), 200);
  await page.locator('.loading-indicator').waitFor({ state: 'hidden' });
}
async function openEditor() {
  await page.getByRole('main').getByRole('button', { name: 'Alterar foto', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function chooseImage(buffer, name = 'minha-foto.png', mimeType = 'image/png') {
  await page.locator('#profile-photo-file').setInputFiles({ name, mimeType, buffer });
}
async function saveImage() {
  const uploaded = page.waitForResponse(r => r.url().includes('/api/profile/photo?') && r.request().method() === 'POST');
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar foto', exact: true }).click();
  const response = await uploaded;
  const result = await response.json();
  assert.equal(response.status(), 200, result.error);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  return result;
}
async function expectPersonalAvatars(source) {
  for (const selector of ['.profile-photo-trigger', '.sidebar-profile', '.top-profile-trigger']) {
    await expect(page.locator(`${selector} img`)).toHaveAttribute('src', source);
    await expect.poll(() => page.locator(`${selector} img`).evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  }
}

try {
  const png = await sharp({ create: { width: 760, height: 980, channels: 3, background: '#74945b' } }).png().toBuffer();
  const jpeg = await sharp({ create: { width: 1100, height: 720, channels: 3, background: '#719fbb' } }).jpeg().toBuffer();
  const largePng = await sharp({ create: { width: 2048, height: 2048, channels: 3, background: '#74945b' } }).png({ compressionLevel: 0 }).toBuffer();
  assert.ok(largePng.length > 5 * 1024 * 1024 && largePng.length < MAX_PHOTO_BYTES);
  const limitPng = pngAtLimit(largePng);
  assert.equal(limitPng.length, MAX_PHOTO_BYTES);
  assert.equal((await sharp(limitPng, { failOn: 'warning' }).metadata()).format, 'png');
  const loaded = page.waitForResponse(r => r.url().includes('/api/dashboard'));
  await page.goto(`${base}/?view=settings`, { waitUntil: 'networkidle' });
  initial = await (await loaded).json();
  await page.locator('.loading-indicator').waitFor({ state: 'hidden' });
  const isolated = await action({ action: 'create-group', name: `Fotos QA ${Date.now()}`, category: 'friends' });
  await reload();

  await page.locator('#profile-name').fill('Nome ainda não salvo');
  await openEditor();
  await expect(page.getByRole('button', { name: 'Salvar foto', exact: true })).toBeDisabled();
  await chooseImage(png);
  await expect(page.locator('.photo-preview-area')).toContainText('Prévia da sua nova foto');
  const beforeSaving = await dashboard();
  assert.equal(beforeSaving.profile.avatar, initial.profile.avatar, 'Preview must not save automatically');
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/profile-photo-editor-desktop.png', fullPage: false });
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  assert.equal((await dashboard()).profile.avatar, initial.profile.avatar);
  console.log('✓ Selecting and cancelling a photo only changes the preview.');

  await openEditor();
  await chooseImage(Buffer.from('hello'), 'arquivo.txt', 'text/plain');
  await expect(page.locator('.photo-error')).toContainText('formato');
  await expect(page.getByRole('button', { name: 'Salvar foto', exact: true })).toBeDisabled();
  await chooseImage(Buffer.alloc(MAX_PHOTO_BYTES + 1), 'grande.png');
  await expect(page.locator('.photo-error')).toContainText('15 MB');
  await chooseImage(Buffer.from('not a picture'), 'invalida.png');
  await expect(page.locator('.photo-error')).toContainText('Não foi possível abrir');
  console.log('✓ Unsupported, oversized and corrupted files are rejected in the interface.');

  await expect(page.locator('.photo-dropzone')).toContainText('Até 15 MB');
  await chooseImage(largePng, 'foto-maior-que-5mb.png');
  await expect(page.getByRole('button', { name: 'Salvar foto', exact: true })).toBeEnabled();
  await chooseImage(limitPng, 'foto-exatamente-15mb.png');
  await expect(page.getByRole('button', { name: 'Salvar foto', exact: true })).toBeEnabled();
  const saved = await saveImage();
  console.log('✓ A valid photo of exactly 15 MB uploads successfully; larger files are rejected.');
  assert.ok(saved.profile.avatar.startsWith(`/api/profile/photo/${initial.profile.id}?v=`));
  assert.equal(saved.totalXp, initial.totalXp);
  assert.equal(saved.day.waterMl, initial.day.waterMl);
  assert.deepEqual(saved.meals, initial.meals);
  assert.equal(saved.profile.name, initial.profile.name);
  await expect(page.locator('#profile-name')).toHaveValue('Nome ainda não salvo');
  await expectPersonalAvatars(saved.profile.avatar);
  await reload();
  await expectPersonalAvatars(saved.profile.avatar);
  const imageResponse = await context.request.get(`${base}${saved.profile.avatar}`);
  assert.equal(imageResponse.status(), 200);
  assert.equal(imageResponse.headers()['content-type'], 'image/webp');
  const metadata = await sharp(await imageResponse.body()).metadata();
  assert.equal(metadata.width, 512);
  assert.equal(metadata.height, 512);
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.xmp, undefined);
  console.log('✓ Upload persists across reloads; avatars update everywhere; habits and unsaved form edits are preserved.');
  console.log('✓ Saved photos are 512×512 WebP without original EXIF metadata.');

  await page.locator('.sidebar .nav-item').filter({ hasText: /^Ranking$/ }).click();
  await expect(page.locator('.ranking-row.is-you img')).toHaveAttribute('src', saved.profile.avatar);
  peer = await browser.newContext();
  await dashboard(peer.request);
  await action({ action: 'join-group', code: isolated.group.code }, peer.request);
  const peerData = await dashboard(peer.request);
  assert.equal(peerData.leaderboard.find(person => person.id === initial.profile.id).avatar, saved.profile.avatar);
  assert.equal((await peer.request.get(`${base}${saved.profile.avatar}`)).status(), 200);
  console.log('✓ Ranking shows the saved image and group members can load it.');

  // Avatars load from their versioned, unguessable URL even without cookies (iframe-safe).
  anonymous = await browser.newContext();
  assert.equal((await anonymous.request.get(`${base}${saved.profile.avatar}`)).status(), 200);
  assert.equal((await anonymous.request.get(`${base}/api/profile/photo/00000000-0000-4000-8000-000000000000`)).status(), 404);
  console.log('✓ Avatar images load from their URL even when the browser blocks cookies.');

  // Simulate an embedded iframe where cookies are blocked: the session is carried only by the stored header.
  const framed = await browser.newContext();
  const framedBootstrap = await (await framed.request.get(`${base}/api/dashboard`)).json();
  const framedId = framedBootstrap.profile.id;
  await framed.clearCookies();
  const framedHeaders = { 'x-session-id': framedId };
  const framedUpload = await framed.request.post(`${base}/api/profile/photo?date=${framedBootstrap.day.date}`, { headers: framedHeaders, multipart: { photo: { name: 'perfil.png', mimeType: 'image/png', buffer: png } } });
  assert.equal(framedUpload.status(), 200, JSON.stringify(await framedUpload.json()));
  const framedData = await framedUpload.json();
  assert.ok(framedData.profile.avatar.startsWith(`/api/profile/photo/${framedId}?v=`));
  await framed.clearCookies();
  const framedCheck = await (await framed.request.get(`${base}/api/dashboard`, { headers: framedHeaders })).json();
  assert.equal(framedCheck.profile.id, framedId);
  assert.equal(framedCheck.profile.avatar, framedData.profile.avatar);
  assert.equal((await framed.request.get(`${base}${framedData.profile.avatar}`)).status(), 200);
  await framed.request.delete(`${base}/api/profile/photo`, { headers: framedHeaders });
  await framed.close();
  console.log('✓ With cookies blocked, the header-based session keeps the profile and photo working (iframe-safe).');

  for (const [name, mimeType, buffer, expected] of [
    ['fake.png', 'image/png', Buffer.from('invalid image'), 400],
    ['fake.svg', 'image/svg+xml', Buffer.from('<svg/>'), 415],
    ['large.png', 'image/png', Buffer.alloc(MAX_PHOTO_BYTES + 1), 413],
  ]) {
    const rejected = await context.request.post(`${base}/api/profile/photo`, { multipart: { photo: { name, mimeType, buffer } } });
    assert.equal(rejected.status(), expected);
    if (expected === 413) assert.match((await rejected.json()).error, /15 MB/);
    assert.equal((await dashboard()).profile.avatar, saved.profile.avatar);
  }
  assert.equal((await context.request.post(`${base}/api/profile/photo`, { headers: { 'Origin': 'https://outro-site.example', 'Sec-Fetch-Site': 'cross-site' }, multipart: { photo: { name: 'photo.png', mimeType: 'image/png', buffer: png } } })).status(), 403);
  console.log('✓ Server still validates file contents, size and request origin.');

  await page.locator('.sidebar .nav-item').filter({ hasText: /^Configurações$/ }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await openEditor();
  await chooseImage(jpeg, 'nova-foto.jpg', 'image/jpeg');
  await expect(page.getByRole('button', { name: 'Salvar foto', exact: true })).toBeEnabled();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: 'artifacts/profile-photo-editor-mobile.png', fullPage: false });
  const changed = await saveImage();
  assert.notEqual(changed.profile.avatar, saved.profile.avatar, 'A new version must bypass the old image cache');
  await expectPersonalAvatars(changed.profile.avatar);
  await reload();
  await expectPersonalAvatars(changed.profile.avatar);
  console.log('✓ Changing a saved photo works on mobile without stale images.');

  await openEditor();
  await page.getByRole('button', { name: 'Remover foto atual', exact: true }).click();
  await expect(page.locator('.photo-remove-confirm')).toBeVisible();
  await page.getByRole('button', { name: 'Manter foto', exact: true }).click();
  assert.equal((await dashboard()).profile.avatar, changed.profile.avatar);
  await page.getByRole('button', { name: 'Remover foto atual', exact: true }).click();
  const deleting = page.waitForResponse(r => r.url().includes('/api/profile/photo?') && r.request().method() === 'DELETE');
  await page.getByRole('button', { name: 'Sim, remover', exact: true }).click();
  const removed = await (await deleting).json();
  assert.equal(removed.profile.avatar, 'initials');
  assert.equal(removed.totalXp, initial.totalXp);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  for (const selector of ['.profile-photo-trigger', '.sidebar-profile', '.top-profile-trigger']) await expect(page.locator(`${selector} img`)).toHaveCount(0);
  await reload();
  assert.equal((await dashboard()).profile.avatar, 'initials');
  assert.equal((await context.request.get(`${base}${changed.profile.avatar}`)).status(), 404);
  await page.getByRole('button', { name: 'Abrir menu do perfil', exact: true }).click();
  await page.locator('.profile-dropdown').getByRole('button', { name: 'Alterar foto', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remover foto atual', exact: true })).toHaveCount(0);
  await chooseImage(png);
  await expect(page.getByRole('button', { name: 'Salvar foto', exact: true })).toBeEnabled();
  const restored = await saveImage();
  await expectPersonalAvatars(restored.profile.avatar);
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('✓ Removal requires confirmation, restores initials and deletes the stored image; a new upload still works.');
  console.log('\nAll profile photo checks passed.');
} catch (error) {
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/profile-photo-test-error.png', fullPage: true }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  if (initial) await context.request.delete(`${base}/api/profile/photo`).catch(() => {});
  await peer?.close();
  await anonymous?.close();
  await browser.close();
}
