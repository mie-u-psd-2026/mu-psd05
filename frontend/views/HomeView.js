import store, { SUMMARY_STYLES } from '../store.js';
import * as storage from '../services/storage.js';
import * as download from '../services/download.js';
import * as audio from '../services/audio.js';
import * as visualizer from '../services/visualizer.js';
import { loadTemplate } from '../services/templateLoader.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// GFMおよび改行オプションを有効化
marked.use({ breaks: true, gfm: true });

// Markdownリンクにtarget="_blank"とrel="noopener noreferrer"を付与してSPA離脱を防止
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export default {
  name: 'HomeView',
  data() {
    return {
      store,
      storage,
      styles: SUMMARY_STYLES,
      isDragging: false,
      viewMode: 'preview'
    };
  },
  computed: {
    // Markdown形式で要約結果をパース＆サニタイズ
    renderedMarkdown() {
      if (!this.store.resultText) return '';
      try {
        const rawHtml = marked.parse(this.store.resultText);
        return DOMPurify.sanitize(rawHtml);
      } catch (_) {
        // パース失敗時は特殊文字をエスケープして安全に返却
        return (this.store.resultText || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }
    }
  },
  methods: {
    // クリップボードからのテキスト貼り付け
    async handlePaste() {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) {
          return;
        }
        this.store.inputText = text;
        this.store.setDraft();
      } catch (err) {
        this.store.showToast('クリップボードの読み取りに失敗しました', 'danger');
      }
    },
    // 要約結果のクリップボードコピー
    async handleCopy() {
      if (!this.store.resultText) {
        return;
      }
      try {
        await navigator.clipboard.writeText(this.store.resultText);
        this.store.showToast('コピーしました', 'success');
      } catch (err) {
        this.store.showToast('クリップボードへのコピーに失敗しました', 'danger');
      }
    },
    // Markdown形式でダウンロード
    downloadMd() {
      if (!this.store.resultText) {
        return;
      }
      download.downloadMarkdownFile('summary.md', this.store.resultText);
      this.store.showToast('Markdownファイルをダウンロードしました', 'success');
    },
    // テキスト形式でダウンロード
    downloadText() {
      if (!this.store.resultText) {
        return;
      }
      download.downloadTextFile('summary.txt', this.store.resultText);
      this.store.showToast('テキストファイルをダウンロードしました', 'success');
    },
    // PDF形式で印刷・保存（プレビュー表示を保証）
    downloadPdf() {
      if (!this.store.resultText) {
        return;
      }
      this.viewMode = 'preview';
      this.$nextTick(() => {
        download.printAsPdf();
      });
    },
    // サンプル文章の適用とフォーカス移動
    handleApplySample(sample) {
      this.store.applySample(sample);
      this.$nextTick(() => {
        const textarea = this.$el?.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      });
    },
    // ドラッグオーバー処理
    handleDragOver(e) {
      if (!e.dataTransfer?.types?.includes('Files')) {
        return;
      }
      e.preventDefault();
      if (this.store.isBusy) {
        return;
      }
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
      this.isDragging = true;
    },
    // ドラッグ離脱処理
    handleDragLeave(e) {
      e.preventDefault();
      if (!e.currentTarget.contains(e.relatedTarget)) {
        this.isDragging = false;
      }
    },
    // 音声ファイルドロップ処理
    handleFileDrop(e) {
      if (!e.dataTransfer?.types?.includes('Files')) {
        return;
      }
      e.preventDefault();
      this.isDragging = false;
      if (this.store.isBusy) {
        return;
      }
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        if (files.length > 1) {
          this.store.showToast('先頭の音声ファイルのみ文字起こしします', 'info');
        }
        this.store.transcribeAudioFile(files[0]);
      }
    },
    // 音声ファイル選択変更処理
    handleFileInputChange(e) {
      const input = e.target;
      const files = input.files;
      if (files && files.length > 0) {
        this.store.transcribeAudioFile(files[0]);
      }
      input.value = '';
    }
  },
  watch: {
    // 録音状態に応じたリアルタイム音声波形ビジュアライザーの制御
    'store.isRecording'(isRecording) {
      if (isRecording) {
        this.$nextTick(() => {
          if (this.store.isRecording && this.$refs.waveformCanvas) {
            visualizer.startVisualizer(this.$refs.waveformCanvas, audio.getActiveStream());
          }
        });
      } else {
        visualizer.stopVisualizer();
      }
    }
  },
  unmounted() {
    visualizer.stopVisualizer();
    if (this.store.isRecording) {
      this.store.cancelRecording();
    }
  },
  template: await loadTemplate(import.meta.url, './HomeView.html')
};
