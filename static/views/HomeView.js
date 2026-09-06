import store, { SUMMARY_STYLES } from '../store.js';
import * as storage from '../services/storage.js';
import * as download from '../services/download.js';
import * as audio from '../services/audio.js';
import { loadTemplate } from '../services/templateLoader.js';

export default {
  name: 'HomeView',
  data() {
    return {
      store,
      storage,
      styles: SUMMARY_STYLES
    };
  },
  methods: {
    // クリップボードからのテキスト貼り付け
    async handlePaste() {
      try {
        const text = await navigator.clipboard.readText();
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
    // テキスト形式でダウンロード
    downloadText() {
      if (!this.store.resultText) {
        return;
      }
      download.downloadTextFile('summary.txt', this.store.resultText);
      this.store.showToast('テキストファイルをダウンロードしました', 'success');
    },
    // PDF形式で印刷・保存
    downloadPdf() {
      if (!this.store.resultText) {
        return;
      }
      download.printAsPdf();
    }
  },
  unmounted() {
    if (this.store.isRecording) {
      this.store.cancelRecording();
    }
  },
  template: await loadTemplate(import.meta.url, './HomeView.html')
};
