import { reactive } from 'vue';
import * as storage from './services/storage.js';
import * as api from './services/api.js';

// 要約スタイル定数定義
export const SUMMARY_STYLES = [
  {
    id: 'short',
    name: '簡潔要約',
    icon: 'bi-lightning-charge',
    desc: '重要な情報だけを残し、3〜5文程度でコンパクトにまとめます。'
  },
  {
    id: 'meeting',
    name: '会議議事録',
    icon: 'bi-journal-text',
    desc: '会議概要、決定事項、課題、次のアクションの4項目で整理します。'
  },
  {
    id: 'report',
    name: 'レポート形式',
    icon: 'bi-file-earmark-text',
    desc: '概要、詳細、結論の3段構成で論理的に整理します。'
  }
];

// トースト自動非表示タイマー
let toastTimer = null;

// アプリケーション全体の状態管理ストア
const store = reactive({
  // 状態プロパティ
  inputText: '',
  resultText: '',
  selectedStyle: 'short',
  isSummarizing: false,
  isTranscribing: false,
  isRecording: false,
  recordSeconds: 0,
  errorMessage: '',
  histories: [],
  toast: {
    show: false,
    message: '',
    variant: 'primary'
  },

  // 初期化処理
  init() {
    storage.cleanupExpiredData();
    this.histories = storage.getHistories();

    const savedStyle = storage.getSelectedStyle();
    if (savedStyle) {
      this.selectedStyle = savedStyle;
    }

    const draft = storage.loadDraft();
    if (draft) {
      if (typeof draft.inputText === 'string') {
        this.inputText = draft.inputText;
      }
      if (typeof draft.resultText === 'string') {
        this.resultText = draft.resultText;
      }
    }

    if (typeof window !== 'undefined') {
      window.store = this;
    }
  },

  // 現在の要約入出力をリセット
  resetCurrentSummary() {
    this.inputText = '';
    this.resultText = '';
    this.errorMessage = '';
    storage.clearDraft();
  },

  // 下書き保存
  setDraft() {
    storage.saveDraft({
      inputText: this.inputText,
      resultText: this.resultText
    });
  },

  // 要約実行
  async executeSummarize() {
    if (!this.inputText.trim() || this.isSummarizing) {
      return;
    }

    this.isSummarizing = true;
    this.errorMessage = '';

    try {
      const summary = await api.summarizeText({
        text: this.inputText,
        summaryType: this.selectedStyle
      });
      this.resultText = summary;

      const item = storage.saveHistory({
        inputText: this.inputText,
        resultText: summary,
        selectedStyle: this.selectedStyle
      });

      this.histories.unshift(item);
      if (this.histories.length > 100) {
        this.histories.pop();
      }

      this.setDraft();
      this.showToast('要約が完了しました', 'success');
    } catch (err) {
      this.errorMessage = err.message || '要約中にエラーが発生しました';
      this.showToast(this.errorMessage, 'danger');
    } finally {
      this.isSummarizing = false;
    }
  },

  // 履歴アイテム削除
  deleteHistoryItem(id) {
    storage.deleteHistory(id);
    this.histories = this.histories.filter(h => h.id !== id);
    this.showToast('履歴を削除しました', 'info');
  },

  // 履歴をメイン入力へ反映
  loadHistoryToMain(item) {
    this.inputText = item.inputText || '';
    this.resultText = item.resultText || '';
    this.selectedStyle = item.selectedStyle || 'short';
    this.setDraft();
  },

  // トースト表示
  showToast(message, variant = 'primary') {
    this.toast.message = message;
    this.toast.variant = variant;
    this.toast.show = true;

    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
      this.toast.show = false;
    }, 3000);
  }
});

export default store;
