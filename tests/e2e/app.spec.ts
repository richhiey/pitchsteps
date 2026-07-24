import { expect, test } from "@playwright/test";

test("renders setup screen without opening the microphone", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("pitchsteps", { exact: true })).toBeVisible();
  const warmupRegion = page.getByRole("region", { name: "Warm-up" });
  await expect(warmupRegion).toBeVisible();
  await expect(warmupRegion.getByRole("combobox")).toHaveValue("Major Scale");
  await expect(page.getByLabel("Starting note")).toHaveValue("60");
  await expect(page.getByLabel("Tempo")).toHaveValue("90");
  await expect(page.getByRole("combobox", { name: "Microphone", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Allow microphone" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Start" })).toBeDisabled();
  await expect(page.getByText("Audio stays on this device • © 2026 Richhiey Thomas", { exact: true })).toBeVisible();
});
