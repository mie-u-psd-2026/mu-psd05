import { APP_CONFIG } from '../config.js';

export default {
  name: 'AppBrand',
  props: {
    iconSize: {
      type: String,
      default: 'fs-4'
    },
    textSize: {
      type: String,
      default: 'fs-5'
    }
  },
  data() {
    return {
      appName: APP_CONFIG.name
    };
  },
  template: `
    <span class="d-inline-flex align-items-center fw-bold">
      <i class="bi bi-journal-arrow-down text-success me-2" :class="iconSize"></i>
      <span :class="textSize">{{ appName }}</span>
    </span>
  `
};
