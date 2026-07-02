# Cognito 認証 SPA サンプル

Amazon Cognito ユーザープールを使用した認証機能付きシングルページアプリケーション（SPA）のサンプル実装です。

## 概要

- **フロントエンド**: フレームワークを使用しないシンプルな HTML/CSS/JavaScript（SPA）
- **バックエンド**: API Gateway REST API + Lambda関数（Python 3.13）
- **認証基盤**: Amazon Cognito User Pool
- **リージョン**: ap-northeast-1（東京）
- **IaC**: AWS SAM (Serverless Application Model)

### 機能

- ユーザー名とパスワードによるサインイン
- ユーザー名・メールアドレス・パスワードによるサインアップ
- メール確認コードによるアカウント有効化
- パスワード変更
- サインアウト（確認ダイアログ付き）

## 前提条件

- AWS CLI がインストール・設定済みであること
- AWS SAM CLI がインストール済みであること
- Python 3.13 がインストール済みであること
- Cognito ユーザープールおよびアプリケーションクライアントが作成済みであること

### Cognito ユーザープールの設定要件

| 項目 | 設定値 |
|------|--------|
| サインイン方法 | ユーザー名（Username） |
| 必須属性 | Eメール（email） |
| 認証フロー | ALLOW_USER_PASSWORD_AUTH を有効化 |
| クライアントシークレット | **生成しない**（SPAのため） |
| 自己登録 | 有効化（サインアップを許可するため） |
| メール送信 | 許可（サインアップ時の検証コードの送付のため） |



## プロジェクト構成

```
cognito-sample/
├── frontend/                # フロントエンド（SPA）
│   ├── index.html           # エントリポイント
│   ├── css/
│   │   └── style.css        # スタイルシート
│   └── js/
│       ├── config.js        # 設定ファイル（Cognito/API設定値）
│       ├── app.js           # SPAルーター・アプリ初期化
│       ├── auth.js          # 認証API通信・トークン管理
│       ├── pages.js         # ページ描画・イベントハンドラ
│       └── utils.js         # バリデーション・ユーティリティ
├── backend/
│   └── lambda_function.py   # Lambda関数（認証処理）
├── tests/
│   ├── backend/             # バックエンドテスト（pytest）
│   └── frontend/            # フロントエンドテスト
├── template.yaml            # SAMテンプレート
├── samconfig.toml           # SAMデプロイ設定
└── .gitignore
```

## セットアップ

### 1. フロントエンドの設定

`frontend/js/config.js` を開き、以下の値を自分の環境に合わせて設定してください：

```javascript
const AppConfig = {
  userPoolId: 'ap-northeast-1_XXXXXXXXX',     // Cognito User Pool ID
  appClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',   // App Client ID
  apiEndpoint: 'https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/Prod'
};
```

### 2. バックエンドのデプロイ

```bash
# ビルド
sam build

# デプロイ（初回はガイド付き）
sam deploy --guided
```

デプロイ時に以下のパラメータを指定します：

| パラメータ | 説明 |
|-----------|------|
| `CognitoClientId` | Cognito App Client ID |
| `CognitoUserPoolArn` | Cognito User Pool の ARN |

### 3. フロントエンドの起動

フロントエンドは静的ファイルのため、任意のHTTPサーバーで配信できます：

```bash
# Python の簡易HTTPサーバーを使用する例
cd frontend
python -m http.server 8000
```

ブラウザで `http://localhost:8000` にアクセスしてください。

### 4. AWS Amplify ホスティングでのデプロイ

本リポジトリはモノリポ構成のため、Amplify ホスティングでフロントエンドのみをデプロイするにはビルド設定で `frontend/` ディレクトリを指定する必要があります。

Amplify コンソールでアプリを作成する際、または `amplify.yml` をリポジトリルートに配置して以下の内容を設定してください：

```yaml
version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        build:
          commands: []
      artifacts:
        baseDirectory: /
        files:
          - '**/*'
      cache:
        paths: []
```

#### 設定のポイント

| 項目 | 説明 |
|------|------|
| `appRoot: frontend` | モノリポ内のフロントエンドディレクトリをルートとして指定 |
| `phases.build.commands: []` | ビルドコマンドなし（静的ファイルのためビルド不要） |
| `artifacts.baseDirectory: /` | `appRoot` からの相対パスで成果物ディレクトリを指定 |
| `artifacts.files: '**/*'` | 全ファイルをデプロイ対象とする |

#### Amplify コンソールでの設定手順

1. Amplify コンソールで「新しいアプリ」→「ウェブアプリケーションをホスト」を選択
2. リポジトリプロバイダー（GitHub等）を接続
3. 「モノリポ」にチェックを入れ、ルートディレクトリに `frontend` を指定
4. ビルド設定は上記 `amplify.yml` の内容が自動適用される（または手動で入力）
5. デプロイ後、`frontend/js/config.js` の `apiEndpoint` を実際の API Gateway URL に設定済みであることを確認

> **注意**: SPA のハッシュベースルーティング（`#/signin` 等）を使用しているため、Amplify のリライトルール設定は不要です。

## API エンドポイント

| メソッド | パス | 説明 | リクエストボディ |
|---------|------|------|----------------|
| POST | /signin | サインイン | `{ "username", "password" }` |
| POST | /signup | サインアップ | `{ "username", "email", "password" }` |
| POST | /verify | 確認コード検証 | `{ "username", "code" }` |
| POST | /change-password | パスワード変更 | `{ "previous_password", "new_password" }` + Authorizationヘッダー |
| POST | /resend-code | 確認コード再送 | `{ "username" }` |

## テスト

```bash
# バックエンドテスト実行
pytest tests/backend/ -v
```

## 注意事項

- `frontend/js/config.js` には実際の設定値が含まれるため、公開リポジトリにプッシュする際は値をプレースホルダーに置き換えてください
- `samconfig.toml` にもデプロイ先の情報が含まれます
- localStorage にトークンを保存しているため、本番利用時はXSS対策を別途検討してください
- App Client のクライアントシークレットは **生成しないでください**（SPAではシークレットを安全に保持できないため）
