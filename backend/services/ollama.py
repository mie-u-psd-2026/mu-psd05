# services/ollama.py

import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen3.5:0.8b"


def generate(prompt):
    """
    Ollamaにプロンプトを送信して、生成結果を返す。
    """

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "think":False
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload
    )

    response.raise_for_status()

    result = response.json()

    return result["response"]

def generate_stream(prompt):
    """
    Ollamaから生成された文章を
    少しずつ受け取って返す。

    yieldを使用することで、
    生成途中の文章を順次取得できる。
    """

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": True,
        "think": False
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        stream=True
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