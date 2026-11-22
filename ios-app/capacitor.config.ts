import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "vn.sensegroup.dalatevent",
  appName: "DalatEvent",
  webDir: "dist",
  ios: {
    contentInset: "never",
    backgroundColor: "#FFF8EF",
  },
  plugins: {
    LocalNotifications: {
      iconColor: "#E0218A",
    },
  },
};

export default config;
