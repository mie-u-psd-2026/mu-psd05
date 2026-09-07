// Bootstrap Popover ディレクティブ
export const vPopover = {
  mounted(el) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
      el._popover = new bootstrap.Popover(el, { trigger: 'focus', placement: 'top' });
    }
  },
  unmounted(el) {
    if (el._popover) {
      el._popover.dispose();
      delete el._popover;
    }
  }
};
