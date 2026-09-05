// テキストファイルをBlob経由でダウンロード
export function downloadTextFile(filename, text) {
  const blob = new Blob([text ?? ''], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // ブラウザの非同期読み出し完了を待つため破棄を遅延（1秒）
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// 印刷ダイアログ表示（PDF形式での保存に利用）
export function printAsPdf() {
  // UIドロップダウンのトランジション完了を待機
  setTimeout(() => {
    window.print();
  }, 150);
}
