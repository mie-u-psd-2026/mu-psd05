# services/summarization.py

from services.ollama import generate, generate_stream


def summarize_text(text, summary_type):
    """
    文字起こしされた文章を、
    指定された形式で要約する。
    """

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

まず、元の文章の意味を変えない範囲で、
文章として自然になるように「、」と「。」を補ってください。

その後、重要な情報だけを残し、
3～5文程度で要約してください。

要約した文章にも自然な「、」「。」を使用してください。
"""


    elif summary_type == "bullet":

        instruction = """
以下の文章を重要なポイントごとに箇条書きで要約してください。

まず、元の文章の意味を変えない範囲で、
文章として自然になるように「、」と「。」を補ってください。

その後、重要な内容を整理して箇条書きにしてください。

次の形式で出力してください。

・重要な内容1
・重要な内容2
・重要な内容3

重要度の低い情報は省略してください。
箇条書きの数は文章の内容に応じて適切に調整してください。

各箇条書きの文章には、
自然な「、」と「。」を使用してください。
"""


    elif summary_type == "meeting":

        instruction = """
以下の会議内容を整理してください。

まず、元の文章の意味を変えない範囲で、
文章として自然になるように「、」と「。」を補ってください。

その後、会議内容を整理してください。

次の形式で出力してください。

【会議概要】
会議全体の概要

【決定事項】
決定した内容

【課題】
現在の課題

【次のアクション】
今後行うこと

各項目では、自然な「、」と「。」を使用してください。
"""


    elif summary_type == "report":

        instruction = """
以下の文章をレポート形式に整理してください。

まず、元の文章の意味を変えない範囲で、
文章として自然になるように「、」と「。」を補ってください。

その後、重要な内容を整理してレポート形式にしてください。

次の形式で出力してください。

【概要】
文章全体の概要

【詳細】
重要な内容を整理

【結論】
文章から読み取れる結論

各項目では、自然な「、」と「。」を使用してください。
"""


    else:

        raise ValueError(
            f"対応していない要約形式です: {summary_type}"
        )


    prompt = f"""
あなたは日本語の文章を整理・要約するAIです。

{instruction}

【元の文章】
{text}

【重要な注意事項】
・元の文章にない情報を勝手に追加しないでください。
・元の文章の意味を変更しないでください。
・日本語で回答してください。
・指定された形式を必ず守ってください。
・不自然な位置に「、」や「。」を入れないでください。
・「、」は意味の区切れや文節の区切れに応じて自然に使用してください。
・「。」は文の終わりに使用してください。
・前置きや説明文を追加しないでください。
・回答には要約結果だけを出力してください。
"""

    return prompt