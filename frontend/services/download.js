// Blobダウンロード機能とプリンタ機能
// 内部共通Blobダウンロード関数
function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // ブラウザの非同期読み出し完了を待つため破棄を遅延（1秒）
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// テキストファイルをダウンロード
export function downloadTextFile(filename = 'summary.txt', content = '') {
  const blob = new Blob([content ?? ''], { type: 'text/plain;charset=utf-8' });
  downloadBlob(filename, blob);
}

// Markdownファイルをダウンロード
export function downloadMarkdownFile(filename = 'summary.md', content = '') {
  const blob = new Blob([content ?? ''], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(filename, blob);
}

// 印刷ダイアログ表示
export function triggerPrint() {
  // UIドロップダウンのトランジション完了を待機
  setTimeout(() => {
    window.print();
  }, 150);
}
