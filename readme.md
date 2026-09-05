# 生成AI活用サンプルアプリ

![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1.3-000000?logo=flask&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vuedotjs&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-qwen3.5:0.8b-black?logo=ollama&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-lightgrey)

# 概要

このアプリはPythonとVue.jsを用いて作られた簡易的な生成AI活用アプリです。

ブラウザ上で動作し、録音からの文字起こし、ローカルLLMでの要約、要約履歴機能を持ちます。

- フロントエンド: Vue.jsとBootstrap 5.3のCDN版を用いています。
- バックエンド: Python, FlaskとOllama APIを用いてローカル起動のOllamaを叩いています。

# 環境

- [Visual Studio Code](https://code.visualstudio.com/)
- [OpenCode](https://opencode.ai/ja)
- [Ollama](https://ollama.com/)
- [Python](https://www.python.org/)

## アーキテクチャ構成

```mermaid
flowchart LR
    subgraph Client["フロントエンド (Vue 3 SPA)"]
        UI["録音 / 要約 / 履歴UI"]
    end

    subgraph Backend["バックエンド (Flask :5000)"]
        API_T["/api/transcribe<br>(音声文字起こしAPI)"]
        API_S["/api/summarize<br>(テキスト要約API)"]
        API_Sub["/api/submit<br>(要約送信・保存API)"]
    end

    subgraph AI["ローカルLLM (Ollama :11434)"]
        Model["qwen3.5:0.8b"]
    end

    UI -->|音声データ送信| API_T
    UI -->|要約リクエスト| API_S
    UI -->|要約データ送信| API_Sub
    API_S -->|Generate API| Model
```

# 開発ツールインストール

## Windows

- 管理者権限でコマンドプロンプトを起動します。
- 以下のコマンドを実行し、`winget`で必要なソフトウェアを入手します。

```pwsh
winget install --id Microsoft.VisualStudioCode -e --source winget --accept-package-agreements --accept-source-agreements
winget install --id Python.Python.3.13 -e --source winget --accept-package-agreements --accept-source-agreements
winget install --id SST.opencode -e --source winget --accept-package-agreements --accept-source-agreements
winget install --id Ollama.Ollama -e --source winget --accept-package-agreements --accept-source-agreements
start /b ollama serve > NUL 2>&1
timeout /t 3 /nobreak > NUL
ollama pull qwen3.5:0.8b
```

- vscodeを起動し、アクティビティバーの拡張機能から、以下のプラグインをインストールしてください。
  - Python
  - Vue.js Extension Pack

## macOS

[Homebrew](https://brew.sh/ja/)などのパッケージマネージャを使用して必要なソフトをインストールしてください。

```sh
brew install -y visual-studio-code python@3.13 opencode ollama
ollama serve &
ollama pull qwen3.5:0.8b
```

（Pythonはuvを使用して`uv pin python 3.13`も可）

# 環境セットアップ

## Python ライブラリインストール

以下のコマンドでPythonの利用ライブラリをインストールします。

```bash
pip install -r requirements.txt
```

あるいは、`uv`を使うこともできます。

```sh
uv venv
uv pip install -r requirements.txt
```

# 実行方法

- 以下のコマンドでサーバを起動します。
  ```sh
  cd backend
  python app.py
  ```
- ブラウザで[以下のURL](http://localhost:5000/static/)にアクセスしてみてください。
  ```
  http://localhost:5000/static/
  ```

# 開発の参考資料

## ローカルの Ollama を使う場合（低性能だが利用制限なし）：

- VSCode上でターミナルを開いて、以下を入力します。

```sh
ollama launch opencode --model=qwen3.5:0.8b
```

## クラウドの無料モデルを使う場合：(中性能、無料枠少ない)

- VSCode上でターミナルを開いて、 `opencode` と入力し、実行します。
- /models と入力し、Free 表示のあるモデルを選択します。（例: DeepSeek V4 Flash Free）

## Google AI Studioを使う場合:(高性能、無料枠多い)

- [Google AI Studio](https://aistudio.google.com/api-keys)を開きます。
- APIキーを作成、を押下し、キー名を適当に命名し、プロジェクトを新規作成します。

- APIキーが表示されるので、クリップボードにコピーしておきます。

- [プロジェクト一覧](https://aistudio.google.com/projects)を開き、新規作成したプロジェクトが無料枠となっていることを確認します。

- VSCode上でターミナルを開いて、 `opencode` と入力します。

- /connect と入力、プロバイダ一覧が表示されるので、Googleを選択、APIキーに先ほどのAPIキーを貼り付けます。

# AIを用いたコード修正

- opencodeに修正を依頼してみてください。（例：猫語で回答するボタンを追加して ）

- フロントエンド担当者は、html/JavaScriptを追加／修正して画面を構築してください。

- バックエンド担当者は、app.py上にURLとAPIを作成してください。

## 実装状況と今後の課題

- **フロントエンド実装**:
  - [x] Vue Routerによるマルチビュー構成（Home / History / About）
  - [x] MediaRecorderによる音声録音・タイマー計測UI
  - [x] 3種類の要約スタイル切り替え（簡潔・会議録・レポート）
  - [x] LocalStorage永続化（要約履歴の復元・個別削除）
  - [x] トースト通知・テキストファイルダウンロード・印刷レイアウト
  - [ ] 内容からカレンダーの予定の生成
  - [ ] 文字起こしのリアルタイム表示
- **バックエンドAPI実装**:
  - [x] `/api/transcribe`: 音声受付・文字起こしエンドポイント
  - [x] `/api/summarize`: 要約プロンプト生成・Ollama連携
  - [x] `/api/submit`: 要約データ送信受付
  - [ ] `services/transcription.py`: Whisper等による実音声文字起こしの実装
  - [ ] `/api/submit`: （実装するか未定）SQLite等を用いた要約履歴のサーバーサイドDB永続化

# 参考リンク

- [Flask](https://flask.palletsprojects.com/en/stable/)
  - Python で書かれた Webアプリケーションサーバ

- [Vue.js](https://vuejs.org/)
  - JavaScript製製のWebフロントエンド フレームワーク

- [Vue.js Tutorial](https://ja.vuejs.org/tutorial/)
  - Vue.jsの入門用チュートリアル

- [OpenAI API](https://github.com/openai/openai-python)
  - Pythonから、OpenAI APIを呼び出すライブラリ
