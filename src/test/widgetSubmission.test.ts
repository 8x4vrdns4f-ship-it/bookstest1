import { afterEach, expect, it, vi } from "vitest";
import { buildWidgetScript, WIDGET_MARKUP } from "@/lib/widgetTemplate";

afterEach(() => { document.body.innerHTML = ""; vi.unstubAllGlobals(); });

it("keeps submit locked through input changes and a second click", async () => {
  document.body.innerHTML = WIDGET_MARKUP;
  let finish: ((value: unknown) => void) | undefined;
  const submit = vi.fn(() => new Promise(resolve => { finish = resolve; }));
  const payment = { mount: vi.fn(), clear: vi.fn(), on: (event: string, cb: () => void) => { if (event === "ready") cb(); } };
  const stripe = { elements: () => ({ create: () => payment, submit }), confirmSetup: vi.fn() };
  vi.stubGlobal("Stripe", () => stripe);
  const fetchMock = vi.fn(async (url: string) => ({ json: async () => url.includes("get_widget_settings") ? [{ allow_same_day: false, payments_enabled: true }] : [] }));
  vi.stubGlobal("fetch", fetchMock);
  window.eval(buildWidgetScript({ supabaseUrl: "https://example.invalid", supabaseKey: "public", userId: "test", stripePublishableKey: "public" }));
  await vi.waitFor(() => expect(document.querySelectorAll("#bw-slots .slot").length).toBeGreaterThan(0));
  const slot = document.querySelector<HTMLElement>("#bw-slots .slot");
  slot?.click();
  document.querySelector<HTMLButtonElement>("#bw-durs button:not(:disabled)")?.click();
  const name = document.querySelector<HTMLInputElement>("#bw-name");
  const email = document.querySelector<HTMLInputElement>("#bw-email");
  const button = document.querySelector<HTMLButtonElement>("#bw-submit");
  if (!name || !email || !button) throw new Error("Missing widget controls");
  name.value = "Test Client"; email.value = "client@example.com";
  name.dispatchEvent(new Event("input"));
  expect(button.disabled).toBe(false);
  button.click();
  name.value = "Updated Client";
  name.dispatchEvent(new Event("input"));
  expect(button.disabled).toBe(true);
  button.dispatchEvent(new Event("click"));
  expect(submit).toHaveBeenCalledTimes(1);
  finish?.({ error: { message: "Test failure" } });
  await vi.waitFor(() => expect(button.disabled).toBe(false));
  expect(fetchMock).toHaveBeenCalledTimes(5);
});