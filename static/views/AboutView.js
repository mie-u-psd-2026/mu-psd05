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
        },
        {
          name: 'Marked',
          version: 'v15.0.7',
          license: 'MIT',
          url: 'https://marked.js.org/',
          siteName: 'marked.js.org'
        },
        {
          name: 'DOMPurify',
          version: 'v3.2.4',
          license: 'MPL-2.0 / Apache-2.0',
          url: 'https://github.com/cure53/DOMPurify',
          siteName: 'github.com/cure53/DOMPurify'
        },
        {
          name: 'wavesurfer.js',
          version: 'v7.9.1',
          license: 'BSD-3-Clause',
          url: 'https://wavesurfer.xyz/',
          siteName: 'wavesurfer.xyz'
        }
      ]
    };
  },
  template: await loadTemplate(import.meta.url, './AboutView.html')
};
