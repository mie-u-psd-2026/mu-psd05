# services/summarization.py

from services.ollama import generate, generate_stream


def summarize_text(text, summary_type):

    prompt = build_prompt(
        text,
        summary_type
    )

    return generate(prompt)

def summarize_text_stream(text, summary_type):
    """
    要約をストリーミング形式で生成する。

    Ollamaが生成した文章を、
    生成された順番に返す。
    """

    prompt = build_prompt(
        text,
        summary_type
    )

    for chunk in generate_stream(prompt):
        yield chunk

def build_prompt(text, summary_type):

    if summary_type == "short":
        instruction = """
以下の文章を簡潔に要約してください。
重要な情報だけを残し、3～5文程度でまとめてください。
"""

    elif summary_type == "bullet":
        instruction = """
以下の文章を重要なポイントごとに箇条書きで要約してください。

次の形式で出力してください。

・重要な内容1
・重要な内容2
・重要な内容3

重要度の低い情報は省略し、内容が分かりやすいように整理してください。
箇条書きの数は文章の内容に応じて適切に調整してください。
"""

    elif summary_type == "meeting":
        instruction = """
以下の会議内容を整理してください。

次の形式で出力してください。

【会議概要】
会議全体の概要

【決定事項】
決定した内容

【課題】
現在の課題

【次のアクション】
今後行うこと
"""

    elif summary_type == "report":
        instruction = """
以下の文章をレポート形式に整理してください。

次の形式で出力してください。

【概要】
文章全体の概要

【詳細】
重要な内容を整理

【結論】
文章から読み取れる結論
"""

    else:
        raise ValueError(
            f"対応していない要約形式です: {summary_type}"
        )

    prompt = f"""
あなたは文章要約を行うAIです。

{instruction}

【元の文章】
{text}

【注意事項】
・元の文章にない情報を勝手に追加しないでください。
・日本語で回答してください。
・指定された形式を守ってください。
"""

    return prompt