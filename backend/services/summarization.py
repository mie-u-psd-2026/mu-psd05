# services/summarization.py

from pathlib import Path

from services.ollama import (
    generate,
    generate_stream
)


# ==========================================
# promptsディレクトリ
# ==========================================

# services/summarization.py
#        ↓
# backend/
#        ↓
# prompts/

BASE_DIR = Path(__file__).resolve().parent.parent

PROMPTS_DIR = BASE_DIR / "prompts"


# ==========================================
# プロンプト読み込み
# ==========================================

def load_prompts():
    """
    promptsフォルダにあるtxtファイルを
    自動的に読み込む。

    例えば、

    prompts/
        short.txt
        bullet.txt
        meeting.txt

    の場合、

    {
        "short": "short.txtの内容",
        "bullet": "bullet.txtの内容",
        "meeting": "meeting.txtの内容"
    }

    という辞書を作成する。
    """

    prompts = {}

    # promptsフォルダが存在しない場合
    if not PROMPTS_DIR.exists():

        return prompts

    # .txtファイルをすべて取得
    for file_path in PROMPTS_DIR.glob("*.txt"):

        # 拡張子を除いたファイル名をキーにする
        #
        # short.txt
        #   ↓
        # short
        key = file_path.stem

        # UTF-8でファイルを読み込む
        prompt_text = file_path.read_text(
            encoding="utf-8"
        ).strip()

        prompts[key] = prompt_text

    return prompts


# ==========================================
# 要約形式一覧取得
# ==========================================

def get_summary_types():
    """
    利用可能な要約形式の一覧を返す。

    promptsフォルダに

        short.txt
        bullet.txt
        meeting.txt

    があれば、

        ["short", "bullet", "meeting"]

    を返す。
    """

    prompts = load_prompts()

    return list(prompts.keys())


# ==========================================
# プロンプト作成
# ==========================================

def build_prompt(text, summary_type):
    """
    指定された要約形式のtxtファイルを読み込み、
    Ollamaに渡すプロンプトを作成する。
    """

    # promptsフォルダの内容を読み込む
    prompts = load_prompts()

    # 指定された要約形式が存在するか確認
    if summary_type not in prompts:

        raise ValueError(
            f"対応していない要約形式です: {summary_type}"
        )

    # txtファイルに書かれている指示
    instruction = prompts[summary_type]

    # Ollamaに送るプロンプト
    prompt = f"""
以下の指示に従って対象の文章を整理・要約し、要約結果のみを出力します。

[指示]
{instruction}

---

[注意事項]
・**元の文章にない情報を追加しない**
・元の文章の意味を変更しない
・日本語で回答する
・指示を守る
・前置きや説明文を追加しない
・回答には結果だけを出力します
・対象の文章は音声の文字起こしである可能性があり、文字起こし結果が不正確な場合があります。その場合は、最小限の推測を行なって良いです
・必要なら、Markdownの記法を使用できます
・ここより上の指示について触れない。出力しない。要約結果のみを出力する。

---

[対象の文章]
{text}
"""

    return prompt


# ==========================================
# 通常の要約
# ==========================================

def summarize_text(
    text,
    summary_type,
    model=None
):
    """
    文字起こしされた文章を、
    指定された形式で要約する。

    modelを指定すると、
    そのモデルをOllamaで使用する。

    modelを指定しない場合は、
    Ollama側のデフォルトモデルを使用する。
    """

    prompt = build_prompt(
        text,
        summary_type
    )

    return generate(
        prompt,
        model=model
    )


# ==========================================
# ストリーミング要約
# ==========================================

def summarize_text_stream(
    text,
    summary_type,
    model=None
):
    """
    要約をストリーミング形式で生成する。

    Ollamaが生成した文章を、
    生成された順番に返す。

    modelを指定すると、
    そのモデルを使用する。
    """

    prompt = build_prompt(
        text,
        summary_type
    )

    for chunk in generate_stream(
        prompt,
        model=model
    ):

        yield chunk
