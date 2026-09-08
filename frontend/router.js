import { createRouter, createWebHashHistory } from 'vue-router';
import { APP_CONFIG } from './config.js';
import HomeView from './views/HomeView.js';
import HistoryView from './views/HistoryView.js';
import AboutView from './views/AboutView.js';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '' }
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryView,
    meta: { title: '履歴' }
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: { title: 'About' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 画面遷移時にブラウザタブのタイトルを自動更新
router.afterEach((to) => {
  const pageTitle = to.meta?.title;
  document.title = pageTitle ? `${pageTitle} - ${APP_CONFIG.name}` : APP_CONFIG.name;
});

export default router;
