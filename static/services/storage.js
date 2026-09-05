// ストレージキー定数
export const DRAFT_KEY = 'summarizer_draft';
export const HISTORY_KEY = 'summarizer_history';
export const STYLE_KEY = 'summarizer_style';

// 有効期限および件数上限定数
/**
 * @deprecated 履歴の14日間TTL削除仕様の撤廃に伴い非推奨。後方互換性のために保持。
 */
export const HISTORY_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14日間
export const STYLE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7日間
export const MAX_HISTORY_ITEMS = 100; // 最大100件

// ID生成ヘルパー
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

// 下書き保存
export function saveDraft(data) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('下書きの保存に失敗しました:', error);
  }
}

// 下書き取得
export function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('下書きの取得に失敗しました:', error);
    return null;
  }
}

// 下書き削除
export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('下書きの削除に失敗しました:', error);
  }
}

// 履歴ストレージ内部データ取得ヘルパー
function readHistoryRecord() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return { items: [], lastAccessedAt: Date.now() };
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) {
      const validItems = parsed.items.filter(it => it && typeof it === 'object' && typeof it.id === 'string');
      const lastAccessed = typeof parsed.lastAccessedAt === 'number' ? parsed.lastAccessedAt : Date.now();
      return { items: validItems, lastAccessedAt: lastAccessed };
    }
    // 生配列データが存在した場合の後方互換フォールバック
    if (Array.isArray(parsed)) {
      const validItems = parsed.filter(it => it && typeof it === 'object' && typeof it.id === 'string');
      return { items: validItems, lastAccessedAt: Date.now() };
    }
    return { items: [], lastAccessedAt: Date.now() };
  } catch (error) {
    console.error('履歴データの読み込みに失敗しました:', error);
    return { items: [], lastAccessedAt: Date.now() };
  }
}

// 履歴ストレージ内部データ保存ヘルパー
function writeHistoryRecord(record) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(record));
  } catch (error) {
    console.error('履歴データの書き込みに失敗しました:', error);
  }
}

// 履歴保存
export function saveHistory({ inputText, resultText, selectedStyle }) {
  const record = readHistoryRecord();
  const newItem = {
    id: generateId(),
    inputText: inputText || '',
    resultText: resultText || '',
    selectedStyle: selectedStyle || 'short',
    createdAt: Date.now()
  };

  record.items.unshift(newItem);
  if (record.items.length > MAX_HISTORY_ITEMS) {
    record.items = record.items.slice(0, MAX_HISTORY_ITEMS);
  }
  record.lastAccessedAt = Date.now();
  writeHistoryRecord(record);

  return newItem;
}

// 履歴取得
export function getHistories() {
  const record = readHistoryRecord();
  return record.items;
}

// 履歴単一削除
export function deleteHistory(id) {
  const record = readHistoryRecord();
  record.items = record.items.filter(item => item.id !== id);
  record.lastAccessedAt = Date.now();
  writeHistoryRecord(record);
}

// 選択スタイル保存
export function saveSelectedStyle(styleId) {
  try {
    const data = {
      styleId,
      lastAccessedAt: Date.now()
    };
    localStorage.setItem(STYLE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('スタイルの保存に失敗しました:', error);
  }
}

// 選択スタイル取得
export function getSelectedStyle() {
  try {
    const raw = localStorage.getItem(STYLE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.styleId !== 'string') return null;

    const lastAccessed = typeof parsed.lastAccessedAt === 'number' ? parsed.lastAccessedAt : null;
    if (lastAccessed && (Date.now() - lastAccessed > STYLE_TTL_MS)) {
      localStorage.removeItem(STYLE_KEY);
      return null;
    }
    return parsed.styleId;
  } catch (error) {
    console.error('スタイルの取得に失敗しました:', error);
    return null;
  }
}

// 期限切れデータクリーンアップ
export function cleanupExpiredData() {
  const now = Date.now();

  // スタイル設定クリーンアップ（7日アクセスなし）
  try {
    const styleRaw = localStorage.getItem(STYLE_KEY);
    if (styleRaw) {
      const styleRecord = JSON.parse(styleRaw);
      const lastAccessed = typeof styleRecord?.lastAccessedAt === 'number' ? styleRecord.lastAccessedAt : null;
      if (lastAccessed && (now - lastAccessed > STYLE_TTL_MS)) {
        localStorage.removeItem(STYLE_KEY);
      }
    }
  } catch (error) {
    console.error('スタイル設定のクリーンアップ中にエラーが発生しました:', error);
  }
}
