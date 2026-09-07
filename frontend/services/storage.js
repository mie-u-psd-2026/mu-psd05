// セッション状態と履歴の永続化を管理
// ストレージキー定数
export const SESSION_STATE_KEY = 'summarizer_session_state';
export const HISTORY_KEY = 'summarizer_history';
export const STYLE_KEY = 'summarizer_style';

// 件数上限定数
export const MAX_HISTORY_ITEMS = 100; // 最大100件

// ID生成ヘルパー
export function generateId() {
  // cryptoが使えるならそれを使う
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // 使えないなら適当に作る
  return 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/* 現在のセッション */
// セッション状態保存
export function saveSessionState(data) {
  try {
    sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('セッション状態の保存に失敗しました:', error);
  }
}

// セッション状態取得
export function loadSessionState() {
  try {
    const raw = sessionStorage.getItem(SESSION_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('セッション状態の取得に失敗しました:', error);
    return null;
  }
}

// セッション状態削除
export function clearSessionState() {
  try {
    sessionStorage.removeItem(SESSION_STATE_KEY);
  } catch (error) {
    console.error('セッション状態の削除に失敗しました:', error);
  }
}

/* 履歴 */
// 履歴ストレージ内部データ取得ヘルパー
function readHistoryRecord() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return { items: [] };
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) {
      const validItems = parsed.items.filter(it => it && typeof it === 'object' && typeof it.id === 'string');
      return { items: validItems };
    }
    return { items: [] };
  } catch (error) {
    console.error('履歴データの読み込みに失敗しました:', error);
    return { items: [] };
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
  writeHistoryRecord(record);

  return newItem;
}

// 履歴取得
export function getHistory() {
  const record = readHistoryRecord();
  return record.items;
}

// 履歴単一削除
export function deleteHistory(id) {
  const record = readHistoryRecord();
  record.items = record.items.filter(item => item.id !== id);
  writeHistoryRecord(record);
}

// 選択スタイル保存
export function saveSelectedStyle(styleId) {
  try {
    const data = {
      styleId
    };
    localStorage.setItem(STYLE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('要約スタイルの保存に失敗しました:', error);
  }
}

// 選択スタイル取得
export function getSelectedStyle() {
  try {
    const raw = localStorage.getItem(STYLE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.styleId !== 'string') return null;

    return parsed.styleId;
  } catch (error) {
    console.error('要約スタイルの取得に失敗しました:', error);
    return null;
  }
}

