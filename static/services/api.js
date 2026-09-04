// テキスト要約API呼び出し
export async function summarizeText({ text, summaryType }) {
  let response;
  try {
    response = await fetch('/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        summary_type: summaryType
      })
    });
  } catch (networkError) {
    throw new Error(`ネットワークエラーが発生しました: ${networkError.message}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`レスポンスの解析に失敗しました (ステータス: ${response.status})`);
  }

  if (!response.ok || !data.success) {
    const errorMessage = data && data.error ? data.error : `要約処理に失敗しました (ステータス: ${response.status})`;
    throw new Error(errorMessage);
  }

  return data.summary;
}

// 音声文字起こしAPI呼び出し
export async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'record.webm');

  let response;
  try {
    response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    });
  } catch (networkError) {
    throw new Error(`ネットワークエラーが発生しました: ${networkError.message}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`レスポンスの解析に失敗しました (ステータス: ${response.status})`);
  }

  if (!response.ok || !data.success) {
    const errorMessage = data && data.error ? data.error : `文字起こし処理に失敗しました (ステータス: ${response.status})`;
    throw new Error(errorMessage);
  }

  return data.text;
}
