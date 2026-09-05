// サポートされている安全なMIMEタイプの判定
export function getSupportedMimeType() {
  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg'
  ];

  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }

  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
}

// 録音管理用モジュール内部状態
let mediaRecorder = null;
let audioStream = null;
let audioChunks = [];
let recordTimer = null;
let stopPromise = null;

// MediaStream のトラックを安全に全停止するヘルパー
function stopStreamTracks(stream) {
  if (stream && typeof stream.getTracks === 'function') {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (_) {
        // トラック停止時の例外は無視して他のトラック停止を継続
      }
    });
  }
}

// 音声録音の開始
export async function startRecording({ onTick, onError } = {}) {
  // すでに録音中または停止処理中の場合は多重起動を防止
  if ((mediaRecorder && mediaRecorder.state !== 'inactive') || stopPromise) {
    return;
  }

  // 残存タイマーのクリーンアップ
  if (recordTimer) {
    clearInterval(recordTimer);
    recordTimer = null;
  }
  audioChunks = [];

  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStream = stream;

    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};

    const recorder = new MediaRecorder(stream, options);
    mediaRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      if (typeof onError === 'function') {
        onError(event.error || new Error('録音処理中にエラーが発生しました'));
      }
    };

    recorder.start(250);

    recordTimer = setInterval(() => {
      if (typeof onTick === 'function') {
        onTick();
      }
    }, 1000);
  } catch (err) {
    // 初期化または start() 失敗時にマイクストリームを確実に停止・解放
    stopStreamTracks(stream);
    audioStream = null;
    mediaRecorder = null;
    audioChunks = [];
    if (recordTimer) {
      clearInterval(recordTimer);
      recordTimer = null;
    }
    throw err;
  }
}

// 音声録音の停止と音声Blobの取得
export function stopRecording() {
  // 停止処理が進行中の場合は同一のPromiseを返却（二重呼び出し・競合防止）
  if (stopPromise) {
    return stopPromise;
  }

  // 停止要求と同時にUI秒数カウントタイマーを即座に停止
  if (recordTimer) {
    clearInterval(recordTimer);
    recordTimer = null;
  }

  stopPromise = new Promise((resolve) => {
    // mediaRecorder が存在しない場合（未開始または既に停止・破棄済み）
    if (!mediaRecorder) {
      stopStreamTracks(audioStream);
      audioStream = null;
      audioChunks = [];
      resolve(null);
      return;
    }

    const currentRecorder = mediaRecorder;
    const currentStream = audioStream;

    // クリーンアップとBlob返却の共通処理
    const cleanupAndResolve = () => {
      // onstop 発火後にトラックを停止して音声末尾の欠落を防止
      stopStreamTracks(currentStream);
      if (audioStream === currentStream) {
        audioStream = null;
      }
      if (mediaRecorder === currentRecorder) {
        mediaRecorder = null;
      }

      const mimeType = currentRecorder.mimeType || 'audio/webm';
      const audioBlob = audioChunks.length > 0 ? new Blob(audioChunks, { type: mimeType }) : null;
      audioChunks = [];
      resolve(audioBlob);
    };

    // 既に inactive 状態の場合（stop() を呼ぶとエラーになるため即座にフォールバック処理）
    if (currentRecorder.state === 'inactive') {
      cleanupAndResolve();
      return;
    }

    // 正常系: onstop 内でトラック停止とBlob生成を行う
    currentRecorder.onstop = () => {
      cleanupAndResolve();
    };

    try {
      currentRecorder.stop();
    } catch (err) {
      // stop() 呼び出し例外時の安全なフォールバック
      cleanupAndResolve();
    }
  }).finally(() => {
    stopPromise = null;
  });

  return stopPromise;
}
