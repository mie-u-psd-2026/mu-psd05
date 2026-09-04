import { createApp } from 'vue';
import router from './router.js';
import AppSidebar from './components/AppSidebar.js';
import AppBrand from './components/AppBrand.js';
import store from './store.js';
import { vPopover } from './directives/popover.js';

// コアストア初期化（クリーンアップ、下書き・履歴・スタイルの復元）
store.init();

const app = createApp({});

// 全コンポーネントからアクセス可能なプロパティとして登録
app.config.globalProperties.$store = store;

// グローバルカスタムディレクティブ登録
app.directive('popover', vPopover);

app.component('app-brand', AppBrand);
app.component('app-sidebar', AppSidebar);
app.use(router);
app.mount('#app');
