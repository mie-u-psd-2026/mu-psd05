import store from '../store.js';
import { loadTemplate } from '../services/templateLoader.js';

export default {
  name: 'AppSidebar',
  data() {
    return {
      store
    };
  },
  methods: {
    handleNewSummary() {
      if (this.store.isBusy) {
        return;
      }
      if (this.store) {
        this.store.resetCurrentSummary();
      }
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
  template: await loadTemplate(import.meta.url, './AppSidebar.html')
};
