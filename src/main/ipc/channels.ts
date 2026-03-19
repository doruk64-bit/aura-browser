/**
 * IPC Kanal Tanımları — Tip-güvenli kanal isimleri
 * Tüm main ↔ renderer iletişimi bu kanallar üzerinden yapılır.
 */

export const IPC_CHANNELS = {
  // ─── Sekme Yönetimi ───
  TAB_CREATE: 'tab:create',
  TAB_CLOSE: 'tab:close',
  TAB_SWITCH: 'tab:switch',
  TAB_LIST: 'tab:list',
  TAB_UPDATE: 'tab:update',           // main → renderer bildirim
  TAB_REORDER: 'tab:reorder',

  // ─── Navigasyon ───
  NAV_GO: 'nav:go',
  NAV_BACK: 'nav:back',
  NAV_FORWARD: 'nav:forward',
  NAV_RELOAD: 'nav:reload',
  NAV_STOP: 'nav:stop',
  NAV_URL_UPDATED: 'nav:url-updated', // main → renderer bildirim
  NAV_LOADING: 'nav:loading',         // main → renderer bildirim
  NAV_TITLE_UPDATED: 'nav:title-updated',

  // ─── Pencere Kontrolleri ───
  WIN_MINIMIZE: 'win:minimize',
  WIN_MAXIMIZE: 'win:maximize',
  WIN_CLOSE: 'win:close',
  WIN_IS_MAXIMIZED: 'win:is-maximized',
  WIN_STATE_CHANGED: 'win:state-changed',

  // ─── Geçmiş & Yer İmleri ───
  HISTORY_GET: 'history:get',
  HISTORY_CLEAR: 'history:clear',
  BOOKMARKS_GET: 'bookmarks:get',
  BOOKMARKS_ADD: 'bookmarks:add',
  BOOKMARKS_REMOVE: 'bookmarks:remove',

  // ─── İndirme ───
  DOWNLOAD_START: 'download:start',
  DOWNLOAD_PROGRESS: 'download:progress',
  DOWNLOAD_COMPLETE: 'download:complete',

  // ─── Sayfa İçi Arama ───
  FIND_IN_PAGE: 'find:in-page',
  FIND_STOP: 'find:stop',

  // ─── Çalışma Alanları ───
  WORKSPACE_LIST: 'workspace:list',
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_SWITCH: 'workspace:switch',

  // ─── Genel ───
  APP_INFO: 'app:info',
} as const;

/** Tüm kanal isimlerinin tipi */
export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
