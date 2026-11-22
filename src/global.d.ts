declare module "*.png" {
  const content: string;
  export default content;
}
declare module "*.jpg" {
  const content: string;
  export default content;
}
declare module "*.svg" {
  const content: string;
  export default content;
}
declare interface Window {
  APP_CONFIG?: unknown;
  ZaloJavaScriptInterface?: {
    getStatusBarHeight: () => number;
  };
}
