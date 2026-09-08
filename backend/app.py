from pathlib import Path

from flask import (
    Flask,
    request,
    jsonify,
    redirect,
    url_for,
    Response,
    stream_with_context
)

from services.transcription import transcribe_audio
from services.summarization import (
    summarize_text,
    summarize_text_stream
)


# ==========================================
# プロジェクトルート直下の frontend ディレクトリ
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path="/static"
)


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

        # 要約形式が正しいか確認
        # ストリーミング開始前に確認する
        from services.summarization import build_prompt

        build_prompt(
            text,
            summary_type
        )

        # ======================================
        # ストリーミング処理
        # ======================================

        @stream_with_context
        def generate_summary():

            try:

                # 要約を少しずつ生成
                for chunk in summarize_text_stream(
                    text,
                    summary_type
                ):

                    # 生成された文章を
                    # そのままフロントエンドへ送信
                    yield chunk

            except Exception as e:

                # ストリーミング途中でエラーが発生した場合
                yield f"\n\n[ERROR] {str(e)}"

        return Response(
            generate_summary(),
            status=200,
            mimetype="text/plain; charset=utf-8",
            headers={
                # プロキシなどによるバッファリングを防ぐ
                "X-Accel-Buffering": "no",

                # キャッシュさせない
                "Cache-Control": "no-cache",

                # 接続を維持
                "Connection": "keep-alive"
            }
        )

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
# `/`: ルートをstatic/へ転送する
# ==========================================

@app.route("/")
def index():

    return redirect(
        url_for(
            "static",
            filename="index.html"
        )
    )


# ==========================================
# Flask起動
# ==========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )