import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 1, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));
let date;
const log = message => console.log(`✓ ${message}`);
async function snapshot(client = context.request) { const response = await client.get(`${base}/api/dashboard`); assert.equal(response.status(), 200); return response.json(); }
async function action(body, client = context.request) { const response = await client.post(`${base}/api/actions`, { data: { ...body, date } }); const result = await response.json(); assert.equal(response.status(), 200, result.error); return result; }
async function reload() { const loaded = page.waitForResponse(r => r.url().includes('/api/dashboard') && r.status() === 200); await page.reload({ waitUntil: 'domcontentloaded' }); await loaded; await page.locator('.loading-indicator').waitFor({ state: 'hidden' }); }
async function nav(label) { const button = page.locator('.sidebar .nav-item').filter({ hasText: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).first(); if (await page.locator('.mobile-menu').isVisible()) { if (!(await page.locator('.sidebar').getAttribute('class')).includes('open')) await page.getByRole('button', { name: 'Abrir menu de navegação' }).click(); } await button.click(); }
async function submit(label) { const response = page.waitForResponse(r => r.url().endsWith('/api/actions') && r.request().method() === 'POST'); await page.getByRole('dialog').getByRole('button', { name: label, exact: true }).click(); const result = await (await response).json(); assert.equal(result.error, undefined, result.error); await expect(page.getByRole('dialog')).toHaveCount(0); return result; }
try {
  const loaded = page.waitForResponse(r => r.url().includes('/api/dashboard') && r.status() === 200);
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  const initial = await (await loaded).json(); date = initial.day.date;
  await page.locator('.loading-indicator').waitFor({ state: 'hidden' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('h1')).toContainText('Isabella');
  assert.equal(initial.day.waterMl, 1500);
  assert.equal(initial.activities[0].duration, 45);
  await page.waitForTimeout(900);
  assert.equal(await page.locator('.hero-image').evaluate(img => img.naturalWidth > 0), true);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/health-runners-desktop.png', fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/health-runners-mobile.png', fullPage: false });
  for (const label of ['Nutrição', 'Hidratação', 'Atividade física', 'Sono & bem-estar', 'Desafios', 'Ranking', 'Conquistas', 'Meu progresso', 'Configurações', 'Meu dia']) {
    await nav(label);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Horizontal overflow: ${label}`);
  }
  log('Desktop, mobile, images and all ten navigation destinations');
  await page.setViewportSize({ width: 1440, height: 1080 });
  const isolated = await action({ action: 'create-group', name: 'QA Health Runners ' + Date.now(), category: 'friends' });
  const groupCode = isolated.group.code;
  await reload();

  const waterResponse = page.waitForResponse(r => r.url().endsWith('/api/actions'));
  await page.locator('.water-actions > button').first().click();
  await waterResponse;
  await expect(page.locator('.water-number')).toContainText('1.750');
  await reload();
  await expect(page.locator('.water-number')).toContainText('1.750');
  log('Quick water registration persists after reload');

  await page.locator('.hero-button').click();
  await page.locator('.mood-options > button').first().click();
  await page.locator('#energy').fill('80');
  await page.locator('#checkin-note').fill('Um teste de cuidado e constância.');
  const checked = await submit('Concluir meu check-in');
  assert.equal(checked.day.checkIn, true); assert.equal(checked.day.mood, 'Muito bem'); assert.equal(checked.day.energy, 80);
  log('Mood, energy, stress and daily check-in');

  await nav('Nutrição');
  await page.getByRole('button', { name: 'Registrar refeição', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar minha refeição' }).click();
  await expect(page.locator('.form-error')).toBeVisible();
  await page.locator('.meal-type-options > button').nth(1).click();
  await page.locator('.components-options > label').filter({ hasText: 'Fonte de proteína' }).click();
  await page.locator('.components-options > label').filter({ hasText: 'Verdura ou legume' }).click();
  await page.locator('.color-options > button').filter({ hasText: /^Verde$/ }).click();
  await page.locator('.color-options > button').filter({ hasText: /^Roxo$/ }).click();
  await page.locator('#meal-note').fill('Almoço de teste: proteína, folhas e repolho roxo.');
  const meal = await submit('Salvar minha refeição');
  assert.equal(meal.meals.length, initial.meals.length + 1);
  assert.ok(meal.profile.completedChallenges.includes('colorful-plate'));
  await expect(page.locator('.meal-note').filter({ hasText: 'Almoço de teste' })).toBeVisible();
  log('Meal validation, food components, colors and challenge reward');

  const reached = await action({ action: 'water', amount: 250 });
  assert.equal(reached.day.waterMl, 2000);
  assert.ok(reached.profile.completedChallenges.includes('water-week'));
  const awardCount = reached.profile.completedChallenges.length;
  const undone = await action({ action: 'water', amount: -250 });
  const reachedAgain = await action({ action: 'water', amount: 250 });
  assert.equal(reachedAgain.profile.completedChallenges.length, awardCount);
  assert.equal(reachedAgain.totalXp - undone.totalXp, 60);
  assert.equal(reachedAgain.totalXp, reached.totalXp);
  log('Daily mission points and challenge rewards cannot be duplicated');

  const invalidWater = await context.request.post(`${base}/api/actions`, { data: { action: 'water', amount: 9000, date } });
  assert.equal(invalidWater.status(), 400);
  assert.equal((await snapshot()).day.waterMl, 2000);
  const off = await action({ action: 'habit', habit: 'fruit', checked: false });
  assert.ok(!off.history.find(d => d.date === date).completed.includes('fruit'));
  const on = await action({ action: 'habit', habit: 'fruit', checked: true });
  assert.ok(on.history.find(d => d.date === date).completed.includes('fruit'));
  log('Input validation and reversible habit overrides');

  await nav('Atividade física');
  await page.getByRole('button', { name: 'Registrar atividade', exact: true }).first().click();
  await page.locator('.activity-options > button').filter({ hasText: /^Caminhada$/ }).click();
  await page.locator('#activity-duration').fill('30');
  const moved = await submit('Registrar meu movimento');
  assert.equal(moved.activities.length, 2);
  await page.getByRole('button', { name: 'Excluir Caminhada', exact: true }).click();
  const removed = await submit('Sim, excluir');
  assert.equal(removed.activities.length, 1);
  const noWorkout = await action({ action: 'delete-activity', id: removed.activities[0].id });
  assert.equal(noWorkout.activities.length, 0);
  assert.ok(!noWorkout.history.find(d => d.date === date).completed.includes('workout'));
  await action({ action: 'activity', type: 'Musculação', duration: 45, note: '' });
  log('Activity duration, deletion confirmation and automatic points update');

  await nav('Sono & bem-estar');
  await page.getByRole('button', { name: 'Atualizar meu sono', exact: true }).click();
  await page.locator('#sleep-hours').fill('7.75');
  await page.getByRole('button', { name: '5 estrelas', exact: true }).click();
  const sleep = await submit('Salvar meu sono');
  assert.equal(sleep.day.sleepHours, 7.75); assert.equal(sleep.day.sleepQuality, 5);
  log('Sleep duration and quality');

  await nav('Ranking');
  await page.getByRole('button', { name: 'Gerenciar grupo', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar com código', exact: true }).click();
  await page.locator('#group-code').fill('NOT-A-REAL-GROUP');
  await page.getByRole('button', { name: 'Entrar no grupo', exact: true }).click();
  await expect(page.locator('.toast.error')).toBeVisible();
  assert.equal(await page.locator('.toast').evaluate(el => el.matches(':popover-open')), true);
  await page.getByRole('button', { name: 'Fechar janela', exact: true }).click();
  await page.locator('.sidebar-invite > button').click();
  const invite = await page.locator('.invite-link input').inputValue();
  assert.ok(invite.includes(groupCode));
  await page.getByRole('button', { name: 'Copiar link do convite', exact: true }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), invite);
  await page.getByRole('button', { name: 'Fechar janela', exact: true }).click();
  log('Group validation, top-layer error feedback and real clipboard invite');

  const peer = await browser.newContext();
  const peerInitial = await snapshot(peer.request);
  await action({ action: 'join-group', code: groupCode }, peer.request);
  await action({ action: 'profile', name: 'Amiga de teste', email: '', waterGoal: 2000, reminders: true }, peer.request);
  const shared = await snapshot();
  assert.equal(shared.leaderboard.length, 2);
  assert.ok(shared.leaderboard.some(p => p.name === 'Amiga de teste' && p.id === peerInitial.profile.id));
  await reload();
  await expect(page.locator('.rank-name').filter({ hasText: 'Amiga de teste' })).toBeVisible();
  await peer.close();
  log('A second independent browser joins the group and appears in ranking');

  await nav('Configurações');
  await page.locator('#profile-name').fill('Isabella QA');
  await page.locator('#profile-email').fill('isabella@example.com');
  await page.locator('#water-goal').fill('2250');
  const saved = page.waitForResponse(r => r.url().endsWith('/api/actions'));
  await page.getByRole('button', { name: 'Salvar meu perfil', exact: true }).click();
  await saved; await reload();
  await expect(page.locator('#profile-name')).toHaveValue('Isabella QA');
  await expect(page.locator('#water-goal')).toHaveValue('2250');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar meus registros', exact: true }).click();
  assert.ok((await download).suggestedFilename().startsWith('health-runners-meus-registros-'));
  log('Editable profile, hydration goals and data export');

  const reset = await action({ action: 'reset-data' });
  assert.equal(reset.meals.length, 0); assert.equal(reset.activities.length, 0); assert.equal(reset.totalXp, 0); assert.equal(reset.day.waterMl, 0); assert.equal(reset.profile.name, 'Isabella QA');
  await reload(); await nav('Meu dia');
  await expect(page.locator('.water-number')).toContainText('0');
  assert.equal(pageErrors.length, 0, pageErrors.join('\n'));
  log('Clean start preserves profile and removes records, points and awards');
  console.log('\nAll Health Runners browser and persistence checks passed.');
} catch (error) {
  await page.screenshot({ path: 'artifacts/health-runners-test-error.png', fullPage: true }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally { await browser.close(); }
