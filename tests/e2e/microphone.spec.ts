import { expect, test } from "@playwright/test";

// Exercise the real AudioWorklet and pitch worker without microphone hardware.
test.use({ launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] } });

test("microphone input reaches the live pitch graph after Start and restart", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      oscillator.frequency.value = 440;
      gain.gain.value = 0;
      document.addEventListener("click", (event) => {
        if ((event.target as Element).closest("button")?.textContent?.trim() === "Start") {
          gain.gain.setValueAtTime(0.15, context.currentTime + 0.3);
        }
      });
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      await context.resume();
      return destination.stream;
    };
    navigator.mediaDevices.enumerateDevices = async () => [{
      deviceId: "synthetic-microphone", groupId: "test", kind: "audioinput", label: "Test tone", toJSON() { return {}; }
    }];
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByLabel("Live pitch feedback")).toBeVisible({ timeout: 10000 });
  await expect(page.getByLabel("Live pitch feedback")).toContainText("Hearing", { timeout: 10000 });
  await expect(page.getByTestId("pitch-timeline")).not.toHaveAttribute("aria-label", /Smoothed pitch listening/);
  await expect(page.getByLabel(/Microphone level:/)).toContainText("In the zone");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByLabel("Live pitch feedback")).toContainText("Hearing", { timeout: 10000 });
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  expect(errors).toEqual([]);
});
