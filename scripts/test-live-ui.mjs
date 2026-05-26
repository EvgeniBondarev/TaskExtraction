/**
 * Проверка всплывашек и бейджей (нужна активная сессия в браузере).
 * Запуск: npx playwright install chromium && node scripts/test-live-ui.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.TE_URL || "http://localhost:5173";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

  await page.goto(`${BASE}/tasks`, { waitUntil: "networkidle", timeout: 30000 });

  const title = await page.title();
  const hasNav = await page.locator('button:has-text("Задачи")').count();
  const isSetup = await page.locator("text=Telegram").count();

  console.log("URL:", page.url());
  console.log("Title:", title);
  console.log("Nav buttons:", hasNav);
  console.log("Looks like setup/auth:", isSetup > 0);

  if (hasNav === 0) {
    console.log("\n⚠️  Нет панели навигации — войдите в панель вручную и сохраните storage state, либо откройте /tasks после авторизации.");
    await browser.close();
    process.exit(1);
  }

  // Ждём bootstrap live-poll (до 8 с)
  await page.waitForTimeout(8000);

  const feedBadge = await page.locator('button:has-text("Лента") .nav-badge').textContent().catch(() => null);
  const tasksBadge = await page.locator('button:has-text("Задачи") .nav-badge').textContent().catch(() => null);
  const toasts = await page.locator(".toast-stack .toast-card").count();

  console.log("Feed badge:", feedBadge ?? "—");
  console.log("Tasks badge:", tasksBadge ?? "—");
  console.log("Toasts visible:", toasts);

  if (logs.length) {
    console.log("\nConsole (last 8):");
    logs.slice(-8).forEach((l) => console.log(l));
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
