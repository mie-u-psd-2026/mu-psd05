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
  template: `
    <span class="d-inline-flex align-items-center fw-bold">
      <i class="bi bi-journal-arrow-down text-success me-2" :class="iconSize"></i>
      <span :class="textSize">AppName</span>
    </span>
  `
};
