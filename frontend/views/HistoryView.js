import store, { SUMMARY_STYLES } from '../store.js';
import { loadTemplate } from '../services/templateLoader.js';

export default {
  name: 'HistoryView',
  data() {
    return {
      store,
      itemToDelete: null
    };
  },
  computed: {
    // 要約または文字起こしの処理実行中判定
    isProcessing() {
      return this.store.isSummarizing || this.store.isTranscribing;
    }
  },
  methods: {
    // 要約スタイル情報の取得
    getStyleInfo(styleId) {
      return SUMMARY_STYLES.find(s => s.id === styleId) || { name: '要約', icon: 'bi-file-text' };
    },
    // 日時文字列のフォーマット
    formatDate(timestamp) {
      if (!timestamp) return '';
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '';
      try {
        return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short' }).format(d);
      } catch (_) {
        return '';
      }
    },
    // 履歴アイテムを選択してメイン画面へ復元
    handleSelect(item) {
      if (this.isProcessing) {
        const action = this.store.isSummarizing ? '要約' : '文字起こし';
        this.store.showToast(`${action}処理中のため、履歴の復元はできません`, 'warning');
        return;
      }
      this.store.loadHistoryToMain(item);
      this.$router.push('/');
    },
    // 削除確認モーダルを表示
    openDeleteModal(item) {
      this.itemToDelete = item;
      if (this._deleteModalInstance) {
        this._deleteModalInstance.show();
      }
    },
    // 削除の確定処理
    confirmDelete() {
      if (this.itemToDelete) {
        this.store.deleteHistoryItem(this.itemToDelete.id);
      }
      if (this._deleteModalInstance) {
        this._deleteModalInstance.hide();
      }
    }
  },
  mounted() {
    const modalEl = this.$refs.deleteModalRef;
    if (modalEl && typeof bootstrap !== 'undefined') {
      this._deleteModalInstance = new bootstrap.Modal(modalEl);
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.itemToDelete = null;
      });
    }
  },
  beforeUnmount() {
    if (this._deleteModalInstance) {
      try {
        this._deleteModalInstance.hide();
        this._deleteModalInstance.dispose();
      } catch (e) {
        console.warn('モーダルインスタンスの破棄に失敗しました:', e);
      }
      this._deleteModalInstance = null;
    }

    // SPA画面遷移時に残存するBootstrapのバックドロップおよびbodyスクロールロックを確実に強制解除
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  },
  template: await loadTemplate(import.meta.url, './HistoryView.html')
};
