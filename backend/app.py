from flask import Flask, request, jsonify

from services.transcription import transcribe_audio
from services.summarization import summarize_text


app = Flask(__name__)


# ==========================================
# 1. 文字起こしAPI
# ==========================================

@app.route("/api/transcribe", methods=["POST"])
def transcribe():

    try:
        # フロントエンドから音声ファイルを受け取る
        if "audio" not in request.files:
            return jsonify({
                "success": False,
                "error": "音声ファイルがありません"
            }), 400

        audio_file = request.files["audio"]

        # 文字起こし処理
        text = transcribe_audio(audio_file)

        return jsonify({
            "success": True,
            "text": text
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ==========================================
# 2. 要約API
# ==========================================

@app.route("/api/summarize", methods=["POST"])
def summarize():

    try:
        # フロントエンドからJSONを受け取る
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "JSONデータがありません"
            }), 400

        # 文字起こしされた文章
        text = data.get("text")

        # フロントエンドで選択された要約形式
        summary_type = data.get("summary_type")

        # textの確認
        if not text:
            return jsonify({
                "success": False,
                "error": "textがありません"
            }), 400

        # summary_typeの確認
        if not summary_type:
            return jsonify({
                "success": False,
                "error": "summary_typeがありません"
            }), 400

        # Ollamaを使って要約
        summary = summarize_text(
            text,
            summary_type
        )

        # フロントエンドへ要約結果を返す
        return jsonify({
            "success": True,
            "summary_type": summary_type,
            "summary": summary
        }), 200

    except ValueError as e:

        # 対応していない要約形式の場合
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    except Exception as e:

        # その他のエラー
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ==========================================
# 3. 要約送信API
# ==========================================

@app.route("/api/submit", methods=["POST"])
def submit():

    try:
        # フロントエンドからJSONを受け取る
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "JSONデータがありません"
            }), 400

        # 完成した要約
        summary = data.get("summary")

        if not summary:
            return jsonify({
                "success": False,
                "error": "summaryがありません"
            }), 400

        # TODO:
        # ここでデータベースへの保存や
        # 他のシステムへの送信を行う

        print("受信した要約:")
        print(summary)

        return jsonify({
            "success": True,
            "message": "要約を送信しました"
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ==========================================
# Flask起動
# ==========================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )