import { reactive } from 'vue';
import * as storage from './services/storage.js';
import * as api from './services/api.js';
import * as audio from './services/audio.js';

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
  // 録音時間のフォーマット表示（MM:SS）
  get formattedRecordTime() {
    const m = Math.floor(this.recordSeconds / 60).toString().padStart(2, '0');
    const s = (this.recordSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },
  errorMessage: '',
  histories: [],
  toast: {
    show: false,
    message: '',
    variant: 'primary',
    timestamp: 0
  },

  // 初期化処理
  init() {
    storage.cleanupExpiredData();
    this.histories = storage.getHistories();

    const savedStyle = storage.getSelectedStyle();
    if (savedStyle && SUMMARY_STYLES.some(s => s.id === savedStyle)) {
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

  // 録音のキャンセル・中断（文字起こしは実行せずリソースのみ解放）
  async cancelRecording() {
    this.isRecording = false;
    this.recordSeconds = 0;
    try {
      await audio.stopRecording();
    } catch (_) {
      // 停止処理の例外は安全に無視
    }
  },

  // 音声録音の開始
  async startRecording() {
    if (this.isRecording || this.isSummarizing || this.isTranscribing) {
      return;
    }
    try {
      await audio.startRecording({
        onTick: () => {
          this.recordSeconds++;
        },
        onError: (err) => {
          this.showToast('マイクエラー: ' + err.message, 'danger');
          this.cancelRecording();
        }
      });
      this.isRecording = true;
      this.recordSeconds = 0;
    } catch (err) {
      this.showToast('マイクの使用が拒否されたか、未接続です: ' + err.message, 'danger');
    }
  },

  // 録音停止と文字起こし実行
  async stopRecordingAndTranscribe() {
    if (!this.isRecording) {
      return;
    }
    this.isRecording = false;
    this.isTranscribing = true;
    try {
      const blob = await audio.stopRecording();
      const text = await api.transcribeAudio(blob);
      if (text) {
        this.inputText = (this.inputText ? this.inputText + '\n' : '') + text;
        this.setDraft();
        this.showToast('文字起こしが完了しました', 'success');
      }
    } catch (err) {
      this.showToast('文字起こしに失敗しました: ' + err.message, 'danger');
    } finally {
      this.isTranscribing = false;
      this.recordSeconds = 0;
    }
  },

  // 要約実行
  async executeSummarize() {
    const targetText = this.inputText.trim();
    const targetStyle = this.selectedStyle;

    if (!targetText || this.isSummarizing) {
      return;
    }

    this.isSummarizing = true;
    this.errorMessage = '';

    try {
      const summary = await api.summarizeText({
        text: targetText,
        summaryType: targetStyle
      });
      this.resultText = summary;

      const item = storage.saveHistory({
        inputText: targetText,
        resultText: summary,
        selectedStyle: targetStyle
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
    const styleCandidate = item.selectedStyle;
    this.selectedStyle = (styleCandidate && SUMMARY_STYLES.some(s => s.id === styleCandidate))
      ? styleCandidate
      : 'short';
    this.setDraft();
  },

  // トースト表示
  showToast(message, variant = 'primary') {
    this.toast.message = message;
    this.toast.variant = variant;
    this.toast.show = true;
    this.toast.timestamp = Date.now();
  }
});

export default store;
