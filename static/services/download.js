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

// テキストファイルをBlob経由でダウンロード
export function downloadTextFile(filename, text) {
  const blob = new Blob([text ?? ''], { type: 'text/plain;charset=utf-8' });
  downloadBlob(filename, blob);
}

// Markdown形式でダウンロード
export function downloadMarkdownFile(filename = 'summary.md', content = '') {
  const blob = new Blob([content ?? ''], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(filename, blob);
}

// 印刷ダイアログ表示（PDF形式での保存に利用）
export function printAsPdf() {
  // UIドロップダウンのトランジション完了を待機
  setTimeout(() => {
    window.print();
  }, 150);
}
