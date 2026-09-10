FROM python:3.13-slim

# faster-whisperに必要なシステムライブラリをインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依存パッケージを先にインストールしてキャッシュを活用
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt gunicorn

# backendを配置
COPY . /app

# Pythonの標準出力バッファリング無効化と検索パスの設定
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend

EXPOSE 5000

# Gunicornでマルチスレッド稼働（長時間処理のためtimeoutを300秒に設定）
CMD ["gunicorn", "-b", "0.0.0.0:5000", "-w", "2", "--threads", "4", "--timeout", "300", "backend.app:app"]
