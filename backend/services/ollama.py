# services/ollama.py

import requests
import json
import os


# ==========================================
# Ollamaの設定
# ==========================================

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

OLLAMA_URL = f"{OLLAMA_BASE_URL}/api/generate"

OLLAMA_TAGS_URL = f"{OLLAMA_BASE_URL}/api/tags"

# デフォルトで使用するモデル
MODEL_NAME = "qwen3.5:0.8b"


# ==========================================
# 通常の生成
# ==========================================

def generate(prompt, model=None):
    """
    Ollamaにプロンプトを送信して、
    生成結果をすべて受け取って返す。

    modelが指定されていない場合は、
    MODEL_NAMEを使用する。
    """

    # モデルが指定されていない場合
    # デフォルトモデルを使用
    if not model:
        model = MODEL_NAME

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "think": False
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=300
    )

    response.raise_for_status()

    result = response.json()

    return result["response"].strip()


# ==========================================
# ストリーミング生成
# ==========================================

def generate_stream(prompt, model=None):
    """
    Ollamaから生成された文章を
    少しずつ受け取って返す。

    yieldを使用することで、
    生成途中の文章を順次取得できる。

    modelが指定されていない場合は、
    MODEL_NAMEを使用する。
    """

    # モデルが指定されていない場合
    # デフォルトモデルを使用
    if not model:
        model = MODEL_NAME

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": True,
        "think": False
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        stream=True,
        timeout=300
    )

    response.raise_for_status()

    try:

        for line in response.iter_lines(
            decode_unicode=True
        ):

            if not line:
                continue

            data = json.loads(line)

            # Ollamaから生成された文章
            chunk = data.get("response", "")

            if chunk:
                yield chunk

            # 生成終了
            if data.get("done", False):
                break

    finally:

        response.close()


# ==========================================
# Ollamaモデル一覧取得
# ==========================================

def get_models():
    """
    Ollamaで現在利用可能なモデル一覧を取得する。

    以下の3つの情報を取得する。

    - model_name
        モデル名

    - parameter_size
        パラメータ数

    - quantization_level
        量子化レベル
    """

    response = requests.get(
        OLLAMA_TAGS_URL,
        timeout=30
    )

    response.raise_for_status()

    result = response.json()

    models = []

    for model in result.get("models", []):

        details = model.get("details", {})

        models.append({
            "model_name": model.get("name"),
            "parameter_size": details.get(
                "parameter_size"
            ),
            "quantization_level": details.get(
                "quantization_level"
            )
        })

    return models