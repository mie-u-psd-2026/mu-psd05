// WaveSurfer.js と RecordPlugin によるリアルタイム音声波形ビジュアライザー
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/plugins/record';

let ws = null;
let micStream = null;

// 波形ビジュアライザーの描画開始
export function startVisualizer(container, stream) {
  stopVisualizer();

  if (!container || !stream || (typeof stream.active === 'boolean' && !stream.active)) {
    return;
  }

  try {
    const recordPlugin = RecordPlugin.create({
      scrollingWaveform: true,
      scrollingWaveformWindow: 2,
      renderRecordedAudio: false
    });

    ws = WaveSurfer.create({
      container,
      waveColor: '#0d6efd',
      height: 24,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      interact: false,
      plugins: [recordPlugin]
    });

    micStream = recordPlugin.renderMicStream(stream);
  } catch (err) {
    console.warn('波形ビジュアライザーの初期化に失敗しました:', err);
    stopVisualizer();
  }
}

// 波形ビジュアライザーの停止および全リソース解放
export function stopVisualizer() {
  if (micStream) {
    try {
      micStream?.onDestroy();
    } catch (_) {}
    micStream = null;
  }
  if (ws) {
    try {
      ws?.destroy();
    } catch (_) {}
    ws = null;
  }
}
