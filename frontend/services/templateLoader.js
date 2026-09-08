// HTMLテンプレートの非同期読み込みとキャッシュを管理
const templateCache = new Map();

/**
 * 相対パスからHTMLテンプレートを非同期で読み込む
 * @param {string} baseUrl - 呼び出し元モジュールの import.meta.url
 * @param {string} relativePath - HTMLテンプレートへの相対パス (例: './HomeView.html')
 * @returns {Promise<string>} テンプレートHTML文字列
 */
export async function loadTemplate(baseUrl, relativePath) {
  const url = new URL(relativePath, baseUrl).href;

  if (templateCache.has(url)) {
    return templateCache.get(url);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    templateCache.set(url, html);
    return html;
  } catch (error) {
    console.error(`[templateLoader] Failed to load template from: ${url}`, error);
    throw error;
  }
}
