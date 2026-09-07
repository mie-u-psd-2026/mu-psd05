import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from './views/HomeView.js';
import HistoryView from './views/HistoryView.js';
import AboutView from './views/AboutView.js';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryView
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView
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

export default router;
