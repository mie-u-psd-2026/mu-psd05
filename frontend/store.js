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
  summarizeAbortController: null,
  // 要約・文字起こし・録音のいずれかが進行中か判定する算出プロパティ
  get isBusy() {
    return this.isSummarizing || this.isRecording || this.isTranscribing;
  },
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
  samples: [],
  toast: {
    show: false,
    message: '',
    variant: 'primary',
    id: null
  },

  // 初期化処理
  async init() {
    this.historyItems = storage.getHistory();

    const savedStyle = storage.getSelectedStyle();
    if (savedStyle && SUMMARY_STYLES.some(s => s.id === savedStyle)) {
      this.selectedStyle = savedStyle;
    }

    const sessionState = storage.loadSessionState();
    if (sessionState) {
      if (typeof sessionState.inputText === 'string') {
        this.inputText = sessionState.inputText;
      }
      if (typeof sessionState.resultText === 'string') {
        this.resultText = sessionState.resultText;
      }
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
    this.setSessionState();
    // this.showToast(`「${sample.title}」のサンプル文章を挿入しました`, 'info');
  },

  // スタイル選択と永続化
  setSelectedStyle(styleId) {
    if (!styleId || typeof styleId !== 'string') return;
    this.selectedStyle = styleId;
    storage.saveSelectedStyle(styleId);
  },

  // 現在の要約入出力をリセット
  resetCurrentSummary() {
    this.inputText = '';
    this.resultText = '';
    this.errorMessage = '';
    this.lastTranscribeTimeMs = null;
    this.lastSummarizeTimeMs = null;
    if (this.isRecording) {
      this.cancelRecording();
    }
    if (this.isSummarizing) {
      this.cancelSummarize();
    }
    storage.clearSessionState();
  },

  // 要約処理の中断
  cancelSummarize() {
    if (this.summarizeAbortController) {
      this.summarizeAbortController.abort();
      this.summarizeAbortController = null;
    }
    this.isSummarizing = false;
  },

  // セッション状態保存
  setSessionState() {
    storage.saveSessionState({
      inputText: this.inputText,
      resultText: this.resultText
    });
  },

  // 音声認識成功時の共通処理
  handleTranscriptionSuccess(text) {
    this.inputText = (this.inputText ? this.inputText + '\n' : '') + text;
    this.setSessionState();
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
    if (this.isBusy) {
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

  // 文字起こし実行の共通内部ヘルパー
  async _runTranscription(audioBlobOrFile) {
    this.isTranscribing = true;
    const startTime = Date.now();
    try {
      const text = await api.transcribeAudio(audioBlobOrFile);
      if (text && text.trim()) {
        this.lastTranscribeTimeMs = Date.now() - startTime;
        this.handleTranscriptionSuccess(text);
      } else {
        this.lastTranscribeTimeMs = null;
        this.showToast('音声を認識できませんでした', 'info');
      }
    } catch (err) {
      this.lastTranscribeTimeMs = null;
      this.showToast('文字起こしに失敗しました: ' + err.message, 'danger');
    } finally {
      this.isTranscribing = false;
      this.recordSeconds = 0;
    }
  },

  // 録音停止と文字起こし実行
  async stopRecordingAndTranscribe() {
    if (!this.isRecording) {
      return;
    }
    this.isRecording = false;
    let blob;
    try {
      blob = await audio.stopRecording();
    } catch (err) {
      this.recordSeconds = 0;
      this.showToast('録音の停止に失敗しました: ' + err.message, 'danger');
      return;
    }

    if (!blob || blob.size === 0) {
      this.recordSeconds = 0;
      this.showToast('録音時間が短すぎるため破棄しました', 'info');
      return;
    }

    await this._runTranscription(blob);
  },

  // 音声ファイルの文字起こし
  async transcribeAudioFile(file) {
    if (!file) return;

    if (this.isBusy) {
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

    await this._runTranscription(file);
  },

  // 要約実行
  async executeSummarize() {
    const targetText = this.inputText.trim();
    const targetStyle = this.selectedStyle;

    if (!targetText || this.isBusy) {
      return;
    }

    this.isSummarizing = true;
    this.errorMessage = '';
    this.resultText = '';
    const startTime = Date.now();
    this.summarizeAbortController = new AbortController();

    try {
      const summary = await api.summarizeTextStream(
        {
          text: targetText,
          summaryType: targetStyle
        },
        (chunk) => {
          this.resultText += chunk;
        },
        this.summarizeAbortController.signal
      );

      const item = storage.saveHistory({
        inputText: targetText,
        resultText: summary,
        selectedStyle: targetStyle
      });

      this.historyItems.unshift(item);
      if (this.historyItems.length > storage.MAX_HISTORY_ITEMS) {
        this.historyItems.pop();
      }

      this.setSessionState();
      this.lastSummarizeTimeMs = Date.now() - startTime;
      this.showToast('要約が完了しました', 'success');
    } catch (err) {
      this.lastSummarizeTimeMs = null;
      const isAborted =
        err.message === '要約を中断しました' ||
        err.name === 'AbortError' ||
        (typeof err.message === 'string' && err.message.toLowerCase().includes('aborted'));

      if (isAborted) {
        this.showToast('要約を中断しました', 'info');
      } else {
        this.errorMessage = err.message || '要約中にエラーが発生しました';
        this.showToast(this.errorMessage, 'danger');
      }
    } finally {
      this.isSummarizing = false;
      this.summarizeAbortController = null;
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
    this.setSessionState();
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
