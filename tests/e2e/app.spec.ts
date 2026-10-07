import { expect, test } from "@playwright/test";

test("renders setup screen while microphone permission is pending", async ({ page }) => {
  await page.addInitScript(() => {
    // Keep permission pending on every platform, including runners with no mic.
    navigator.mediaDevices.getUserMedia = () => new Promise<MediaStream>(() => undefined);
  });
  await page.goto("/");
  await expect(page.getByText("pitchsteps", { exact: true })).toBeVisible();
  const warmupRegion = page.getByRole("region", { name: "Warm-up" });
  await expect(warmupRegion).toBeVisible();
  await expect(warmupRegion.getByRole("combobox")).toHaveValue("Major Scale");
  await expect(page.getByLabel("Starting note")).toHaveValue("60");
  await expect(page.getByLabel("Tempo")).toHaveValue("90");
  await expect(page.getByRole("combobox", { name: "Microphone", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Start" })).toBeDisabled();
  await expect(page.getByText("Audio stays on this device • © 2026 Richhiey Thomas", { exact: true })).toBeVisible();
});
