/**
 * Bản thay thế zmp-sdk cho app iOS: cùng tên hàm, nhưng gọi tính năng của máy qua Capacitor.
 */
import { AppLauncher } from "@capacitor/app-launcher";
import { Browser } from "@capacitor/browser";
import { Share } from "@capacitor/share";

export async function openWebview(opts: { url: string; config?: unknown }) {
  await Browser.open({ url: opts.url, presentationStyle: "popover" });
}

export async function openOutApp(opts: { url: string }) {
  await AppLauncher.openUrl({ url: opts.url });
}

export async function openPhone(opts: { phoneNumber: string }) {
  await AppLauncher.openUrl({ url: "tel:" + opts.phoneNumber });
}

export async function openShareSheet(opts: {
  type: string;
  data: { text: string; description?: string; autoParseLink?: boolean };
}) {
  await Share.share({ text: opts.data.text, title: opts.data.description });
}

export async function favoriteApp(): Promise<void> {
  throw new Error("Chỉ có trong Zalo");
}

export function getSystemInfo() {
  return { platform: "ios" };
}

export const nativeStorage = {
  getItem(key: string): string | null {
    return window.localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    window.localStorage.setItem(key, value);
  },
};
