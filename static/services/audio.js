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

// 音声録音の開始
export async function startRecording({ onTick, onError } = {}) {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    return;
  }

  audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = getSupportedMimeType();
  const options = mimeType ? { mimeType } : {};

  audioChunks = [];
  mediaRecorder = new MediaRecorder(audioStream, options);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.onerror = (event) => {
    if (typeof onError === 'function') {
      onError(event.error || new Error('録音処理中にエラーが発生しました'));
    }
  };

  mediaRecorder.start(250);

  if (recordTimer) {
    clearInterval(recordTimer);
  }
  recordTimer = setInterval(() => {
    if (typeof onTick === 'function') {
      onTick();
    }
  }, 1000);
}

// 音声録音の停止と音声Blobの取得
export function stopRecording() {
  if (recordTimer) {
    clearInterval(recordTimer);
    recordTimer = null;
  }

  return new Promise((resolve) => {
    if (!mediaRecorder) {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        audioStream = null;
      }
      resolve(null);
      return;
    }

    mediaRecorder.onstop = () => {
      const mimeType = mediaRecorder ? mediaRecorder.mimeType : 'audio/webm';
      const audioBlob = new Blob(audioChunks, { type: mimeType || 'audio/webm' });
      audioChunks = [];
      mediaRecorder = null;

      resolve(audioBlob);
    };

    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    } else {
      mediaRecorder.onstop();
    }

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      audioStream = null;
    }
  });
}
