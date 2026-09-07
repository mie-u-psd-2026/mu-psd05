# services/transcription.py

from faster_whisper import WhisperModel
import tempfile
import os


# Whisperモデルを読み込む
# 初回実行時にモデルが自動ダウンロードされます
MODEL_SIZE = "small"

model = WhisperModel(
    MODEL_SIZE,
    device="cpu",
    compute_type="int8"
)


def transcribe_audio(audio_file):
    """
    音声ファイルをWhisperで文字起こしする。

    Parameters
    ----------
    audio_file : FileStorage
        Flaskで受け取った音声ファイル

    Returns
    -------
    str
        文字起こしされた文章
    """

    # 一時ファイルを作成
    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=os.path.splitext(audio_file.filename)[1]
    )

    temp_path = temp_file.name

    try:
        # アップロードされた音声を一時ファイルに保存
        audio_file.save(temp_path)

        # Whisperで文字起こし
        segments, info = model.transcribe(
            temp_path,
            language="ja",
            beam_size=5
        )

        # 各セグメントの文字を結合
        text = "".join(
            segment.text
            for segment in segments
        )

        # 前後の空白を削除
        text = text.strip()

        return text

    finally:
        # 一時ファイルを削除
        if os.path.exists(temp_path):
            os.remove(temp_path)