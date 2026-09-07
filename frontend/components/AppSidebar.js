import store from '../store.js';
import { loadTemplate } from '../services/templateLoader.js';

export default {
  name: 'AppSidebar',
  emits: ['new-summary'],
  data() {
    return {
      store
    };
  },
  methods: {
    handleNewSummary() {
      if (this.store.isSummarizing || this.store.isTranscribing || this.store.isRecording) {
        return;
      }
      if (this.store) {
        this.store.resetCurrentSummary();
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
  template: await loadTemplate(import.meta.url, './AppSidebar.html')
};
