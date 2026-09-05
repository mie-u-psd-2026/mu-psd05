import store, { SUMMARY_STYLES } from '../store.js';

export default {
  name: 'HistoryView',
  data() {
    return {
      store,
      itemToDelete: null
    };
  },
  methods: {
    // 要約スタイル情報の取得
    getStyleInfo(styleId) {
      return SUMMARY_STYLES.find(s => s.id === styleId) || { name: '要約', icon: 'bi-file-text' };
    },
    // 日時文字列のフォーマット (YYYY/MM/DD HH:mm)
    formatDate(timestamp) {
      if (!timestamp) return '';
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
    },
    // 履歴アイテムを選択してメイン画面へ復元
    handleSelect(item) {
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
  template: `
    <div class="container-fluid p-0">
      <!-- 履歴一覧カード -->
      <div class="card shadow-sm border">
        <div class="card-header bg-transparent d-flex justify-content-between align-items-center py-3">
          <h5 class="mb-0 fw-semibold">要約履歴一覧</h5>
          <span class="badge bg-secondary">{{ store.histories.length }}件</span>
        </div>
        <div class="card-body p-0">
          <!-- 0件の場合 -->
          <div v-if="store.histories.length === 0" class="text-center text-muted py-5">
            <i class="bi bi-clock-history fs-1"></i>
            <p class="mt-2 mb-0">履歴はありません</p>
          </div>

          <!-- 1件以上の場合 -->
          <div v-else class="list-group list-group-flush">
            <div
              v-for="item in store.histories"
              :key="item.id"
              class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3"
            >
              <div
                class="flex-grow-1 me-3 overflow-hidden cursor-pointer"
                role="button"
                tabindex="0"
                :aria-label="\`履歴を復元: \${getStyleInfo(item.selectedStyle).name} (\${formatDate(item.createdAt)})\`"
                @click="handleSelect(item)"
                @keydown.enter="handleSelect(item)"
                @keydown.space.prevent="handleSelect(item)"
              >
                <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center">
                    <i :class="getStyleInfo(item.selectedStyle).icon" class="me-1"></i>
                    {{ getStyleInfo(item.selectedStyle).name }}
                  </span>
                  <small class="text-muted">{{ formatDate(item.createdAt) }}</small>
                </div>
                <div
                  class="text-body small"
                  style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;"
                >
                  {{ item.resultText || item.inputText || '（内容なし）' }}
                </div>
              </div>
              <div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger ms-3"
                  @click.stop="openDeleteModal(item)"
                  title="削除"
                  aria-label="この要約履歴を削除"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 削除確認モーダル -->
      <div
        class="modal fade"
        ref="deleteModalRef"
        tabindex="-1"
        aria-labelledby="deleteModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="deleteModalLabel">履歴の削除</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-2">この要約履歴を削除してもよろしいですか？この操作は取り消せません。</p>
              <div v-if="itemToDelete" class="bg-light p-2 rounded small text-muted border">
                <div class="fw-semibold mb-1">{{ formatDate(itemToDelete.createdAt) }}</div>
                <div style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  {{ itemToDelete.resultText || itemToDelete.inputText }}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
              <button type="button" class="btn btn-danger" @click="confirmDelete">削除する</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
