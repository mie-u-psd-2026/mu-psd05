import { createApp } from 'vue';
import router from './router.js';
import AppSidebar from './components/AppSidebar.js';
import AppBrand from './components/AppBrand.js';

const app = createApp({});

app.component('app-brand', AppBrand);
app.component('app-sidebar', AppSidebar);
app.use(router);
app.mount('#app');
