import { expect, test } from "@playwright/test";

test("renders setup screen with disabled start gate", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("vocalwarmup", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Warm up your voice, one note at a time." })).toBeVisible();
  await expect(page.getByLabel("Starting note")).toHaveValue("60");
  await expect(page.getByLabel("Tempo")).toHaveValue("90");
  await expect(page.getByRole("combobox", { name: "Microphone", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Start warmup" })).toBeDisabled();
  await expect(page.getByText("Audio stays on this device")).toBeVisible();
});
