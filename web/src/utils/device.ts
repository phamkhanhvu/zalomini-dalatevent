import { AppLauncher } from "@capacitor/app-launcher";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

/**
 * Các thao tác phụ thuộc thiết bị. Trên trình duyệt dùng tính năng web;
 * trong app iOS (Capacitor) dùng tính năng của máy.
 */
export const IS_NATIVE = Capacitor.isNativePlatform();
export const IS_IOS = Capacitor.getPlatform() === "ios";
export const IS_ANDROID = Capacitor.getPlatform() === "android";

export async function openUrl(url: string) {
  if (IS_NATIVE) {
    try {
      await Browser.open({ url, presentationStyle: "popover" });
      return;
    } catch (e) {
      /* rơi xuống cách mở thường */
    }
  }
  window.open(url, "_blank", "noopener");
}

export function mapsUrl(query: string) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
}

/** Mở bản đồ để chỉ đường (app bản đồ trên máy nếu có) */
export async function openDirections(query: string) {
  const url = mapsUrl(query);
  if (IS_NATIVE) {
    try {
      await AppLauncher.openUrl({ url });
      return;
    } catch (e) {
      /* rơi xuống cách mở thường */
    }
  }
  window.open(url, "_blank", "noopener");
}

export async function callPhone(phoneNumber: string) {
  window.location.href = "tel:" + phoneNumber;
}

/** Trả về true nếu đã chia sẻ hoặc đã chép vào bộ nhớ tạm */
export async function shareText(text: string, description?: string) {
  try {
    if (IS_NATIVE || typeof navigator.share === "function") {
      await Share.share({ text, title: description });
      return true;
    }
  } catch (e) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* bỏ qua: không lưu được thì chỉ mất danh sách đã lưu */
    }
  },
};
