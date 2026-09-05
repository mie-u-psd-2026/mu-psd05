const DEFAULT_TIMEOUT_MS = 60000;

// テキスト要約API呼び出し
export async function summarizeText({ text, summaryType, timeoutMs } = {}, optionalTimeoutMs) {
  const effectiveTimeout = optionalTimeoutMs ?? timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), effectiveTimeout);

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
      }),
      signal: controller.signal
    });
  } catch (networkError) {
    if (networkError.name === 'AbortError') {
      throw new Error('要約処理がタイムアウトしました。しばらく待ってから再試行してください');
    }
    throw new Error(`ネットワークエラーが発生しました: ${networkError.message}`);
  } finally {
    clearTimeout(timer);
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

// 音声BlobのMIMEタイプから適切なファイル拡張子を判定
export function getAudioExtension(audioBlob) {
  const MIME_TO_EXT = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'm4a',
    'audio/ogg': 'ogg',
    'audio/opus': 'ogg',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/wave': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3'
  };

  const rawType = (typeof audioBlob?.type === 'string' ? audioBlob.type : '').toLowerCase();
  const baseMime = rawType.split(';')[0].trim();

  if (MIME_TO_EXT[baseMime]) {
    return MIME_TO_EXT[baseMime];
  }

  // フォールバック: Safari/iOSなどWebM非対応環境ではm4a、それ以外はwebm
  if (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    typeof window.MediaRecorder.isTypeSupported === 'function'
  ) {
    if (!window.MediaRecorder.isTypeSupported('audio/webm') && window.MediaRecorder.isTypeSupported('audio/mp4')) {
      return 'm4a';
    }
  }

  return 'webm';
}

// 音声文字起こしAPI呼び出し
export async function transcribeAudio(audioBlob, timeoutMs = DEFAULT_TIMEOUT_MS) {
  if (!audioBlob || !(audioBlob instanceof Blob)) {
    throw new Error('文字起こし対象の音声データが不正です');
  }

  const extension = getAudioExtension(audioBlob);
  const formData = new FormData();
  formData.append('audio', audioBlob, `record.${extension}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
  } catch (networkError) {
    if (networkError.name === 'AbortError') {
      throw new Error('文字起こし処理がタイムアウトしました');
    }
    throw new Error(`ネットワークエラーが発生しました: ${networkError.message}`);
  } finally {
    clearTimeout(timer);
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
