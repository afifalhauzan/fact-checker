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
  await page.goto("/login", { waitUntil: "networkidle" });
  const registerLink = page.getByRole("link", { name: "Daftar" });
  await expect(registerLink).toHaveAttribute("href", "/register");
  await Promise.all([page.waitForURL(/\/register$/), registerLink.click()]);
  await expect(page.getByRole("heading", { name: /Daftar/i })).toBeVisible();
});

test("login password visibility can be toggled", async ({ page }) => {
  await page.goto("/login");
  const password = page.getByPlaceholder("Password");

  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Tampilkan password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sembunyikan password" }).click();
  await expect(password).toHaveAttribute("type", "password");
});

test("registration form reports mismatched passwords", async ({ page }) => {
  await page.goto("/register");
  await page.getByPlaceholder("Nama lengkap").fill("Siti Rahmawati");
  await page.getByPlaceholder("Email").fill("siti@example.com");
  await page.getByPlaceholder("Password", { exact: true }).fill("secret123");
  await page.getByPlaceholder("Ulangi password").fill("different123");
  await page.getByRole("button", { name: "Daftar" }).click();

  await expect(page.getByText("Password tidak sama")).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("chat composer keeps send disabled until there is input", async ({ page }) => {
  await page.goto("/chat");
  await expect(page).toHaveURL(/\/chat\?conversation_id=/);

  const send = page.getByRole("button", { name: "Kirim" });
  const composer = page.getByRole("textbox", { name: "Pesan" });
  await expect(send).toBeDisabled();
  await composer.fill("Cek lowongan ini");
  await expect(send).toBeEnabled();
  await composer.fill("   ");
  await expect(send).toBeDisabled();
});

test("chat analysis returns a risk assessment from the real provider API", async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto("/chat");
  await expect(page).toHaveURL(/\/chat\?conversation_id=/);

  const posting =
    "PT Contoh membuka lowongan Admin Jakarta. Pelamar diminta transfer biaya administrasi Rp250.000 ke rekening BCA 0123456789 sebelum wawancara.";
  const analysisResponse = page.waitForResponse(
    (response) => response.url().includes("/api/chat") && response.request().method() === "POST",
    { timeout: 150_000 }
  );

  await page.getByRole("textbox", { name: "Pesan" }).fill(posting);
  await page.getByRole("button", { name: "Kirim" }).click();

  const response = await analysisResponse;
  expect(response.ok(), `Chat API returned HTTP ${response.status()}`).toBe(true);
  await expect(page.getByText("Tingkat risiko awal", { exact: true })).toBeVisible({ timeout: 150_000 });
  await expect(page.getByText("Risiko Tinggi", { exact: true })).toBeVisible();
  await expect(page.getByText(/Analisis AI sedang tidak dapat dijalankan/)).toHaveCount(0);
});
