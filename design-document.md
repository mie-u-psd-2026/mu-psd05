# Webアプリ仕様書

## 1. 概要

テキスト情報（具体的なものが望ましい）を入力として、LLMを用いて、
回答（これも具体的に指定）を表示するアプリ。

入力：スケジュールの音声入力
出力：音声入力を文字起こし
入力：要約のオプションを選択
出力：要約の型に当てはめて表示
後半の入出力はやり直しができるようにする。

## 2. 主な機能
1. 音声入力を文字起こし
2. 要約の仕方を選択し、要約テンプレに当てはめる
3. 要約当てはめのやり直し
4. 要約内容のダウンロード ← +α
5. 要約からカレンダーの予定を作成 ← +α

### 2.1 入出力フォーム機能
- テキストエリアでユーザーが質問・指示を入力
- 2.2 生成AIリクエストAPIを実行し、応答を取得する。
- 同一画面上に回答を表示する。

### 2.2 生成AIリクエスト API
- ユーザー入力と定型プロンプトを合成し、LLMに渡すコンテキストを生成
- その際に、適切なコンテキストを追加し、望ましい回答を得られるように情報を付加する。
- OpenRouter経由で各種LLM（例：GPT-4, Claude, Geminiなど）へリクエスト
- 応答をJSON形式でフロントエンドに返す。


## 3. 使用技術

| 分類         | 技術・ライブラリ |
|--------------|------------------|
| フロントエンド | Vue.js / HTML5 + CSS3 |
| バックエンド  | Flask |
| 通信方式     | Fetch API / JSON |
| LLMモデル    | OpenRouter API（OpenAI, Anthropic, Mistral等） |

## 4. 入出力例

### 入力
- ユーザー入力：「竹取物語」

- 付与コンテキスト：あなたは太宰治です。小難しい近代風のしゃべり方をします。

### 出力

- 出力例：月の光が眩しい。眩しすぎて、なんだか吐き気がする。老夫婦が見つけた竹の中から、あの憎らしいほど可愛らしい女の子が出てきたらしい。

### (R：れい、K：かいと)
```text
[Webアプリ開発 ]
├── 1. 要件定義 & 設計
│     ├── 1.1 画面設計書作成 (担当: R, 2h)
│     └── 1.2 API仕様書作成 (担当: R, 2h)
├── 2. フロントエンド実装
│     ├── 2.1 フォームUI作成 (担当: R, 4h)
│     └── 2.2 API通信連携 (担当: R, 4h)
└── 3. バックエンド実装
      ├── 3.1 Flask API構築 (担当: K, 4h)
      └── 3.2 Ollama連携 (担当: K, 4h)
```

|タスク名:担当者 ↓   | Day1 | Day2 | Day3 | Day4 | Day5 | Day6 | Day7 | Day8 | Day9 | Day10 |
|-------------------|------|------|------|------|------|------|------|------|------|-------|
|1. 要件定義：R & K |      |      |      |      |      |      |      |      |      |       |
|2. 設計    : R & K |      |      |      |      |      |      |      |      |      |       |
|3. バック  : K     |      |      |      |      |      |      |      |      |      |       |
|4. フロント : R    |      |      |      |      |      |      |      |      |      |       |
|5. 結合テスト:R & K|      |      |      |      |      |      |      |      |      |       |
|6. 成果発表: R or K|      |      |      |      |      |      |      |      |      |       |

API全体の処理フロー
```text
[フロントエンド]
       │
       │ 音声ファイル + 要約形式
       ▼
POST /api/summary-jobs
       │
       ▼
[バックエンド]
       │
       ├─① 音声認識
       │       ↓
       │   文字起こしテキスト
       │
       ├─② 要約形式を確認
       │       ↓
       │   指定されたテンプレート
       │
       ├─③ LLMによる要約
       │       ↓
       │   要約結果
       │
       ▼
GET /api/summary-jobs/{jobId}
       │
       ▼
[フロントエンド]
       │
       ▼
要約結果を画面に表示
```

APIエンドポイント一覧
| No. | エンドポイント                     | HTTPメソッド | 機能                | 入力           | 出力      |
| --- | --------------------------- | -------- | ----------------- | ------------ | ------- |
| 1   | `/api/transcriptions`       | POST     | 音声ファイルを文字起こしする    | 音声ファイル       | 文字起こし結果 |
| 2   | `/api/summary-templates`    | GET      | 利用可能な要約形式を取得する    | なし           | 要約形式一覧  |
| 3   | `/api/summaries`            | POST     | 文字起こし結果を指定形式で要約する | 文字起こし結果・要約形式 | 要約結果    |
| 4   | `/api/summary-jobs`         | POST     | 文字起こし～要約までを一括実行する | 音声ファイル・要約形式  | 処理結果    |
| 5   | `/api/summary-jobs/{jobId}` | GET      | 処理状況・結果を取得する      | ジョブID        | 処理状況・結果 |

### APIについて
**音声文字起こしAPI** <br>
POST/api/transcriptions <br>
→音声ファイルを受け取り、音声認識によってテキストへ変換する <br>

-入力：音声データはJSONではなく、multipart/form-data を想定
| パラメータ | 型 | 必須 | 内容 |
|-----------|----|------|------|
| audio | File | 〇 | 音声ファイル | 
| language | String | △ | 音声の言語 ex:ja |

-出力JSON
```JSON
{
  "transcriptionId": "tr_001",
  "text": "本日の会議では、新商品の開発スケジュールについて確認しました。",
  "language": "ja",
  "duration": 125.4,
  "createdAt": "2026-09-02T13:00:00+09:00"
}
```

**要約形式取得API** <br>
GET/api/summary-templates<br>
→ユーザーが選択可能な要約形式を取得する<br>
→箇条書き、会議議事録、要点3つ、短い要約etc...

-入力なし

-出力JSON
```JSON
{
  "templates": [
    {
      "id": "bullet",
      "name": "箇条書き",
      "description": "内容を重要なポイントごとに箇条書きで整理します。"
    },
    {
      "id": "meeting",
      "name": "会議議事録",
      "description": "会議の概要、決定事項、課題、TODOを整理します。"
    },
    {
      "id": "three-points",
      "name": "要点3つ",
      "description": "内容を特に重要な3つのポイントにまとめます。"
    }
  ]
}
```

**要約生成API**<br>
POST/api/summaries<br>
→文字起こしされたテキストとユーザーが選択した要約形式を受け取り、LLM等を利用して要約する<br>

-入力JSON
```JSON
{
  "transcriptionId": "tr_001",
  "templateId": "meeting"
}
```
または、文字起こし結果を直接渡す設計なら、
```JSON
{
  "text": "本日の会議では、新商品の開発スケジュールについて確認しました。",
  "templateId": "meeting"
}
```

-出力JSON
```JSON
{
  "summaryId": "sum_001",
  "templateId": "meeting",
  "templateName": "会議議事録",
  "summary": {
    "overview": "新商品の開発スケジュールについて確認した。",
    "decisions": [
      "9月末までに試作品を完成させる。"
    ],
    "issues": [
      "開発担当者の人員が不足している。"
    ],
    "todos": [
      {
        "task": "追加の開発担当者を検討する",
        "assignee": "田中",
        "deadline": "2026-09-10"
      }
    ]
  },
  "createdAt": "2026-09-02T13:05:00+09:00"
}
```

**一括処理API**<br>
今回のシステムでは、このAPIを中心にすると設計しやすい(by chat GPT)<br>
POST/api/summary-jobs<br>
→音声ファイルのアップロードから、文字起こし、要約までを一括して実行するAPI

-入力：multipart/form-data
| パラメータ | 型 | 必須 | 内容 |
|------------|----|-----|-----|
| audio | File | 〇 | 音声ファイル |
| templateId | String | 〇 | 使用する要約形式 |
| language | String | △ | 音声言語 |

例：
audio: meeting.mp3<br>
templateId: meeting<br>
language: ja

-出力JSON：処理を非同期にする場合は、まずジョブIDを返す
```JSON
{
  "jobId": "job_001",
  "status": "processing",
  "createdAt": "2026-09-02T13:10:00+09:00"
}
```
その後、GET/api/summaries-jobs/{jobID} で結果を取得する

**処理状況・結果取得API**<br>
GET/api/summary-jobs/{jobID}

-入力：URLパラメータ→ jobID=job_001

-処理中の出力
```JSON
{
  "jobId": "job_001",
  "status": "processing",
  "progress": 60
}
```

-処理完了時の出力
```JSON
{
  "jobId": "job_001",
  "status": "completed",
  "progress": 100,
  "transcription": {
    "text": "本日の会議では、新商品の開発スケジュールについて確認しました。"
  },
  "summary": {
    "templateId": "meeting",
    "templateName": "会議議事録",
    "content": {
      "overview": "新商品の開発スケジュールについて確認した。",
      "decisions": [
        "9月末までに試作品を完成させる。"
      ],
      "issues": [
        "開発担当者の人員が不足している。"
      ],
      "todos": [
        {
          "task": "追加の開発担当者を検討する",
          "assignee": "田中",
          "deadline": "2026-09-10"
        }
      ]
    }
  },
  "completedAt": "2026-09-02T13:12:00+09:00"
}
```