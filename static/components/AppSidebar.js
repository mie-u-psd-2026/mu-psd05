export default {
  name: 'AppSidebar',
  emits: ['new-summary'],
  methods: {
    handleNewSummary() {
      if (this.$store) {
        this.$store.resetCurrentSummary();
      }
      this.$emit('new-summary');
      if (this.$route.path !== '/') {
        this.$router.push('/');
      }
      this.closeOffcanvas();
    },
    closeOffcanvas() {
      const offcanvasEl = document.getElementById('sidebarOffcanvas');
      if (offcanvasEl && window.bootstrap) {
        const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (bsOffcanvas) {
          bsOffcanvas.hide();
        }
      }
    }
  },
  watch: {
    '$route'() {
      this.closeOffcanvas();
    }
  },
  template: `
    <!-- モバイル用トップナビゲーションバー (768px未満で表示、左側に開閉ボタン配置) -->
    <header class="navbar bg-body-tertiary border-bottom d-md-none px-3 py-2 d-print-none w-100">
      <div class="container-fluid px-0 d-flex justify-content-start align-items-center">
        <button class="navbar-toggler me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas" aria-controls="sidebarOffcanvas" aria-label="メニュー開閉">
          <span class="navbar-toggler-icon"></span>
        </button>
        <span class="navbar-brand mb-0 h1">
          <app-brand icon-size="fs-5" text-size="fs-6"></app-brand>
        </span>
      </div>
    </header>

    <!-- サイドバー本体 (PC/タブレット: 768px以上で左常時表示 / モバイル: 768px未満でオフキャンバス) -->
    <aside id="sidebarOffcanvas" class="offcanvas-md offcanvas-start bg-light border-end d-print-none flex-shrink-0" tabindex="-1" style="width: 230px;">
      <!-- モバイル用オフキャンバスヘッダー -->
      <div class="offcanvas-header border-bottom d-md-none">
        <h5 class="offcanvas-title" id="sidebarOffcanvasLabel">
          <app-brand icon-size="fs-5" text-size="fs-5"></app-brand>
        </h5>
        <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" data-bs-target="#sidebarOffcanvas" aria-label="閉じる"></button>
      </div>

      <!-- サイドバーコンテンツ -->
      <div class="offcanvas-body d-flex flex-column p-3 h-100">
        <!-- PC用アプリタイトル (768px以上) -->
        <div class="d-none d-md-flex align-items-center mb-4 text-decoration-none">
          <app-brand icon-size="fs-2" text-size="fs-5"></app-brand>
        </div>

        <!-- 新規要約ボタン -->
        <div class="mb-3 text-center">
          <button type="button" class="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center fw-semibold shadow-sm" @click="handleNewSummary">
            <i class="bi bi-plus-lg me-1"></i>
            <span>新規要約</span>
          </button>
        </div>

        <hr class="my-2">

        <!-- ナビゲーションリンク (リンククリック時にも確実にドロワーを閉じる) -->
        <ul class="nav nav-pills flex-column mb-auto" @click="closeOffcanvas">
          <li class="nav-item mb-1">
            <router-link to="/" class="nav-link d-flex align-items-center" active-class="active">
              <i class="bi bi-house-door me-2 fs-5"></i>
              <span>メイン</span>
            </router-link>
          </li>
          <li class="nav-item mb-1">
            <router-link to="/history" class="nav-link d-flex align-items-center" active-class="active">
              <i class="bi bi-clock-history me-2 fs-5"></i>
              <span>履歴</span>
            </router-link>
          </li>
          <li class="nav-item mb-1">
            <router-link to="/about" class="nav-link d-flex align-items-center" active-class="active">
              <i class="bi bi-info-circle me-2 fs-5"></i>
              <span>About</span>
            </router-link>
          </li>
        </ul>
      </div>
    </aside>
  `
};
