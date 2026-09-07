import { createApp } from 'vue';
import router from './router.js';
import AppSidebar from './components/AppSidebar.js';
import AppBrand from './components/AppBrand.js';
import AppToast from './components/AppToast.js';
import store from './store.js';
import { APP_CONFIG } from './config.js';
import { vPopover } from './directives/popover.js';

// 初期ページタイトルの設定
document.title = APP_CONFIG.name;

// コアストア初期化（クリーンアップ、下書き・履歴・スタイルの復元）
store.init();

const app = createApp({});

// グローバルカスタムディレクティブ登録
app.directive('popover', vPopover);

app.component('app-brand', AppBrand);
app.component('app-sidebar', AppSidebar);
app.component('app-toast', AppToast);
app.use(router);
app.mount('#app');
