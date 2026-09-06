import { loadTemplate } from '../services/templateLoader.js';

export default {
  name: 'AboutView',
  data() {
    return {
      libraries: [
        {
          name: 'Vue.js',
          version: 'v3.5.13',
          license: 'MIT',
          url: 'https://vuejs.org/',
          siteName: 'vuejs.org'
        },
        {
          name: 'Vue Router',
          version: 'v4.4.5',
          license: 'MIT',
          url: 'https://router.vuejs.org/',
          siteName: 'router.vuejs.org'
        },
        {
          name: 'Bootstrap',
          version: 'v5.3.3',
          license: 'MIT',
          url: 'https://getbootstrap.com/',
          siteName: 'getbootstrap.com'
        },
        {
          name: 'Bootstrap Icons',
          version: 'v1.11.3',
          license: 'MIT',
          url: 'https://icons.getbootstrap.com/',
          siteName: 'icons.getbootstrap.com'
        }
      ]
    };
  },
  template: await loadTemplate(import.meta.url, './AboutView.html')
};
