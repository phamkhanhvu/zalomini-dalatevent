import {
  nativeStorage,
  openOutApp,
  openPhone,
  openShareSheet,
  openWebview,
  favoriteApp,
} from "zmp-sdk";

/**
 * Các hàm gọi tính năng của Zalo. Khi chạy thử trên trình duyệt (ngoài Zalo),
 * các API này không có nên mỗi hàm đều có phương án dự phòng.
 */

export async function openUrl(url: string) {
  try {
    await openWebview({ url, config: { style: "normal" } });
  } catch (e) {
    window.open(url, "_blank");
  }
}

export function mapsUrl(query: string) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query)
  );
}

/** Mở Google Maps bằng ứng dụng bản đồ trên máy (ngoài Zalo) để chỉ đường */
export async function openDirections(query: string) {
  const url = mapsUrl(query);
  try {
    await openOutApp({ url });
  } catch (e) {
    window.open(url, "_blank");
  }
}

export async function callPhone(phoneNumber: string) {
  try {
    await openPhone({ phoneNumber });
  } catch (e) {
    window.location.href = "tel:" + phoneNumber;
  }
}

export async function shareText(text: string, description?: string) {
  try {
    await openShareSheet({
      type: "text",
      data: { text, description, autoParseLink: true },
    });
    return true;
  } catch (e) {
    const nav = navigator as Navigator & {
      share?: (d: { text: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ text });
        return true;
      } catch (err) {
        return false;
      }
    }
    return false;
  }
}

export async function addFavorite() {
  try {
    await favoriteApp();
    return true;
  } catch (e) {
    return false;
  }
}

export const storage = {
  get(key: string): string | null {
    try {
      return nativeStorage.getItem(key);
    } catch (e) {
      try {
        return window.localStorage.getItem(key);
      } catch (err) {
        return null;
      }
    }
  },
  set(key: string, value: string) {
    try {
      nativeStorage.setItem(key, value);
    } catch (e) {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        /* bỏ qua: không lưu được thì chỉ mất danh sách đã lưu */
      }
    }
  },
};
