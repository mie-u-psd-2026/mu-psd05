import { reactive } from 'vue';
import * as storage from './services/storage.js';
import * as api from './services/api.js';
import * as audio from './services/audio.js';

// 要約スタイル定数定義
export const SUMMARY_STYLES = [
  {
    id: 'short',
    name: '簡潔',
    icon: 'bi-lightning-charge',
    desc: '重要な情報だけで3〜5文にまとめます'
  },
  {
    id: 'meeting',
    name: '議事録',
    icon: 'bi-journal-text',
    desc: '内容を4項目に整理します：「会議概要」「決定事項」「課題」「次のアクション」'
  },
  {
    id: 'report',
    name: 'レポート',
    icon: 'bi-file-earmark-text',
    desc: '論理的に、概要、詳細、結論の3段構成でまとめます'
  },
  {
    id: 'bullet',
    name: '箇条書き',
    icon: 'bi-list-ol',
    desc: '要点を箇条書きで並べます'
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
  lastTranscribeTimeMs: null,
  lastSummarizeTimeMs: null,
  errorMessage: '',
  historyItems: [],
  get histories() {
    return this.historyItems;
  },
  set histories(val) {
    this.historyItems = val;
  },
  samples: [],
  toast: {
    show: false,
    message: '',
    variant: 'primary',
    id: null
  },

  // 初期化処理
  async init() {
    storage.cleanupExpiredData();
    this.historyItems = storage.getHistories();

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

    // サンプル文章データの非同期読み込み
    try {
      const sampleUrl = new URL('./data/samples.json', import.meta.url).href;
      const res = await fetch(sampleUrl);
      if (res.ok) {
        const data = await res.json();
        this.samples = Array.isArray(data) ? data : [];
      } else {
        console.warn(`[store] samples.json の取得に失敗しました (HTTP ${res.status})`);
        this.samples = [];
      }
    } catch (err) {
      console.warn('[store] samples.json の読み込み中にエラーが発生しました:', err);
      this.samples = [];
    }
  },

  // サンプル文章の適用
  applySample(sample) {
    if (!sample || typeof sample.text !== 'string') {
      return;
    }
    this.inputText = sample.text;
    this.setDraft();
    // this.showToast(`「${sample.title}」のサンプル文章を挿入しました`, 'info');
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

  // 下書き保存（互換用エイリアス）
  saveDraft() {
    this.setDraft();
  },

  // 音声認識成功時の共通処理
  handleTranscriptionSuccess(text) {
    this.inputText = (this.inputText ? this.inputText + '\n' : '') + text;
    this.setDraft();
    this.showToast('文字起こしが完了しました', 'success');
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
    this.isRecording = true;
    this.recordSeconds = 0;
    try {
      await audio.startRecording({
        onTick: () => {
          this.recordSeconds++;
        },
        onError: (err) => {
          this.showToast('マイクでエラーが発生しました: ' + err.message, 'danger');
          this.cancelRecording();
        }
      });
    } catch (err) {
      this.isRecording = false;
      this.recordSeconds = 0;
      this.showToast('マイクが利用できません: ' + err.message, 'danger');
    }
  },

  // 録音停止と文字起こし実行
  async stopRecordingAndTranscribe() {
    if (!this.isRecording) {
      return;
    }
    this.isRecording = false;
    this.isTranscribing = true;
    const startTime = Date.now();
    try {
      const blob = await audio.stopRecording();
      if (!blob || blob.size === 0) {
        this.showToast('録音時間が短すぎるため破棄しました', 'info');
        return;
      }
      const text = await api.transcribeAudio(blob);
      if (text) {
        this.lastTranscribeTimeMs = Date.now() - startTime;
        this.handleTranscriptionSuccess(text);
      }
    } catch (err) {
      this.lastTranscribeTimeMs = null;
      this.showToast('文字起こしに失敗しました: ' + err.message, 'danger');
    } finally {
      this.isTranscribing = false;
      this.recordSeconds = 0;
    }
  },

  // 音声ファイルの文字起こし
  async transcribeAudioFile(file) {
    if (!file) return;

    if (this.isSummarizing || this.isRecording || this.isTranscribing) {
      this.showToast('処理中です。終了してからもう一度操作してください', 'warning');
      return;
    }

    const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE_BYTES) {
      this.showToast('ファイルサイズが大きすぎます (100MB以下)', 'warning');
      return;
    }

    const validExtensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.aac', '.flac'];
    const fileNameLower = (file.name || '').toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileNameLower.endsWith(ext));
    const isAudioType = file.type && file.type.startsWith('audio/');

    if (!hasValidExt && !isAudioType) {
      this.showToast('対応していない音声ファイルです (対応形式：mp3, wav, m4a等)', 'warning');
      return;
    }

    this.isTranscribing = true;
    const startTime = Date.now();
    try {
      const text = await api.transcribeAudio(file);
      if (text) {
        this.lastTranscribeTimeMs = Date.now() - startTime;
        this.handleTranscriptionSuccess(text);
      }
    } catch (err) {
      this.lastTranscribeTimeMs = null;
      this.showToast('文字起こしに失敗しました: ' + err.message, 'danger');
    } finally {
      this.isTranscribing = false;
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
    const startTime = Date.now();

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

      this.historyItems.unshift(item);
      if (this.historyItems.length > 100) {
        this.historyItems.pop();
      }

      this.setDraft();
      this.lastSummarizeTimeMs = Date.now() - startTime;
      this.showToast('要約が完了しました', 'success');
    } catch (err) {
      this.lastSummarizeTimeMs = null;
      this.errorMessage = err.message || '要約中にエラーが発生しました';
      this.showToast(this.errorMessage, 'danger');
    } finally {
      this.isSummarizing = false;
    }
  },

  // 履歴アイテム削除
  deleteHistoryItem(id) {
    storage.deleteHistory(id);
    this.historyItems = this.historyItems.filter(h => h.id !== id);
    this.showToast('履歴を削除しました', 'info');
  },

  // 履歴をメイン入力へ反映
  loadHistoryToMain(item) {
    this.errorMessage = '';
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
    this.toast.id = storage.generateId();
  }
});

export default store;
