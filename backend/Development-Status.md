2026/9/7
```text
----------------------------
【現状】

フロントエンド
    ↓
① 音声ファイル送信
    ↓
/api/transcribe
    ↓
transcription.py
    ↓
⚠ 現在はダミー文章を返すだけ
    ↓
文字起こし結果
    ↓
② 要約形式を選択して送信
    ↓
/api/summarize
    ↓
summarization.py
    ↓
ollama.py
    ↓
Ollama（qwen3.5:0.8b）
    ↓
要約結果
    ↓
③ 要約を送信
    ↓
/api/submit
    ↓
⚠ 現在はprintするだけ
----------------------------
```
