// Bootstrap Popover ディレクティブ
export const vPopover = {
  mounted(el) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
      el._popover = new bootstrap.Popover(el, { trigger: 'click', placement: 'top' });
    }
  },
  updated(el) {
    if (el._popover) {
      if (typeof el._popover.setContent === 'function') {
        el._popover.setContent({
          '.popover-body': el.getAttribute('data-bs-content') || '',
          '.popover-header': el.getAttribute('data-bs-title') || el.getAttribute('title') || ''
        });
      }
    }
  },
  unmounted(el) {
    if (el._popover) {
      el._popover.dispose();
      delete el._popover;
    }
  }
};
