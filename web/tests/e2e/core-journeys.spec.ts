import { expect, test } from "playwright/test";

test("landing page presents the main service and chat composer", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Cek Risiko Lowongan Kerja/i })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Pesan" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Buka Telaah" })).toBeVisible();
});

test("TelaahBareng navigation opens the public community page", async ({ page }) => {
  await page.goto("/chat");
  // Chat assigns a URL to the new session after hydration; let that replace settle before navigating away.
  await expect(page).toHaveURL(/\/chat\?conversation_id=/);
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "TelaahBareng" }).click();

  await expect(page).toHaveURL(/\/telaah-bersama$/);
  await expect(page.getByRole("heading", { name: /TelaahBareng/i }).first()).toBeVisible();
});

test("login form reports a password that is too short", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Masuk ke TelaahKarier" })).toBeVisible();

  await page.getByPlaceholder("Email").fill("demo@example.com");
  await page.getByPlaceholder("Password").fill("123");
  await page.getByRole("button", { name: "Masuk ke Chat" }).click();

  await expect(page.getByText("Password minimal 6 karakter")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("login page links to registration", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Daftar" }).click();

  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: /Daftar/i })).toBeVisible();
});
