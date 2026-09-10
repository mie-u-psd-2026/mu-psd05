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
      <img src="assets/icon.svg" alt="" aria-hidden="true" class="me-2" style="width: 32px; height: 32px; object-fit: contain; flex-shrink: 0;">
      <span :class="textSize">{{ appName }}</span>
    </span>
  `
};
