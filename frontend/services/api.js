const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

// タイムアウトおよびエラーハンドリングを統一した共通JSONリクエスト関数
async function requestJson(url, options = {}, { timeoutMs = DEFAULT_TIMEOUT_MS, actionName = '処理' } = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (networkError) {
    if (networkError.name === 'TimeoutError' || networkError.name === 'AbortError') {
      throw new Error(`${actionName}がタイムアウトしました（${timeoutMs / 1000}秒）`);
    }
    throw new Error(`ネットワークエラーが発生しました: ${networkError.message}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`バックエンドからの応答の解析に失敗しました (ステータス: ${response.status})`);
  }

  if (!response.ok || !data.success) {
    const errorMessage = data && data.error ? data.error : `${actionName}に失敗しました (ステータス: ${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

// テキスト要約API呼び出し
export async function summarizeText({ text, summaryType, timeoutMs } = {}, optionalTimeoutMs) {
  const effectiveTimeout = optionalTimeoutMs ?? timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const data = await requestJson(
    '/api/summarize',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        summary_type: summaryType
      })
    },
    { timeoutMs: effectiveTimeout, actionName: '要約処理' }
  );

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
export async function transcribeAudio(audioBlob, timeoutMs = 180000) {
  if (!audioBlob || !(audioBlob instanceof Blob)) {
    throw new Error('文字起こし対象の音声データが不正です');
  }

  let filename = (typeof audioBlob.name === 'string' && audioBlob.name)
    ? audioBlob.name
    : `record.${getAudioExtension(audioBlob)}`;

  // ファイル名に拡張子が含まれていない場合、MIMEタイプから適切な拡張子を補完
  if (!/\.[a-zA-Z0-9]+$/.test(filename)) {
    filename = `${filename}.${getAudioExtension(audioBlob)}`;
  }

  const formData = new FormData();
  formData.append('audio', audioBlob, filename);

  const data = await requestJson(
    '/api/transcribe',
    {
      method: 'POST',
      body: formData
    },
    { timeoutMs, actionName: '文字起こし処理' }
  );

  return data.text;
}

