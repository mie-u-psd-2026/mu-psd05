import store from '../store.js';

// グローバルトースト通知コンポーネント
export default {
  name: 'AppToast',
  data() {
    return {
      store
    };
  },
  computed: {
    toastClass() {
      return this.store.toast.variant ? `text-bg-${this.store.toast.variant}` : 'text-bg-primary';
    },
    toastRole() {
      return this.store.toast.variant === 'danger' ? 'alert' : 'status';
    },
    toastAriaLive() {
      return this.store.toast.variant === 'danger' ? 'assertive' : 'polite';
    },
    toastIcon() {
      switch (this.store.toast.variant) {
        case 'success':
          return 'bi bi-check-circle-fill';
        case 'danger':
          return 'bi bi-exclamation-triangle-fill';
        case 'info':
          return 'bi bi-info-circle-fill';
        default:
          return 'bi bi-info-circle';
      }
    }
  },
  watch: {
    // DOM更新完了後にコールバックを実行するため flush: 'post' を指定
    'store.toast.timestamp': {
      handler() {
        this.triggerToast();
      },
      flush: 'post'
    }
  },
  methods: {
    async triggerToast() {
      // DOM属性のパッチ完了を確実に待機してクラス上書き競合を防止
      await this.$nextTick();
      const el = this.$refs.toastRef;
      if (!el || typeof bootstrap === 'undefined') return;

      if (!this._toastInstance) {
        this._toastInstance = bootstrap.Toast.getOrCreateInstance(el, {
          delay: 3000,
          autohide: true
        });
      }
      this._toastInstance.show();
    }
  },
  mounted() {
    const el = this.$refs.toastRef;
    if (el && typeof bootstrap !== 'undefined') {
      this._toastInstance = bootstrap.Toast.getOrCreateInstance(el, {
        delay: 3000,
        autohide: true
      });
      el.addEventListener('hidden.bs.toast', () => {
        this.store.toast.show = false;
      });
    }
  },
  unmounted() {
    if (this._toastInstance) {
      this._toastInstance.dispose();
      this._toastInstance = null;
    }
  },
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3 d-print-none" style="z-index: 1090;">
      <div
        ref="toastRef"
        class="toast fade align-items-center border-0"
        :class="toastClass"
        :role="toastRole"
        :aria-live="toastAriaLive"
        aria-atomic="true"
      >
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center">
            <i :class="toastIcon" class="fs-5 me-2 flex-shrink-0"></i>
            <span>{{ store.toast.message }}</span>
          </div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  `
};
