# services/summarization.py

from services.ollama import generate


def summarize_text(text, summary_type):

    prompt = build_prompt(
        text,
        summary_type
    )

    return generate(prompt)


def build_prompt(text, summary_type):

    if summary_type == "short":
        instruction = """
以下の文章を簡潔に要約してください。
重要な情報だけを残し、3～5文程度でまとめてください。
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