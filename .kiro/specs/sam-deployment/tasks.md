# 実装計画: SAMデプロイメント

## 概要

設計ドキュメントに定義された`template.yaml`をプロジェクトルートに作成し、SAM CLIによるビルド・バリデーションが成功することを確認する。既存の`backend/lambda_function.py`は変更しない。

## Tasks

- [x] 1. SAMテンプレートファイルの作成
  - [x] 1.1 プロジェクトルートに template.yaml を作成する
    - 設計ドキュメントの「Data Models」セクションに定義された完全なテンプレート内容を使用する
    - AWSTemplateFormatVersion, Transform, Description, Parameters, Resources, Outputs の全セクションを含める
    - CognitoAuthApi（AWS::Serverless::Api）: CORS設定、Name に `!Sub "${AWS::StackName}-CognitoAuthApi"` を指定
    - CognitoAuthFunction（AWS::Serverless::Function）: Python 3.13、タイムアウト30秒、5つのAPIイベント定義
    - IAMポリシー: Cognito操作5種の最小権限、CognitoUserPoolArn パラメータでリソース制約
    - Outputs: ApiEndpoint URL を `!Sub` で構築
    - コメントはすべて英語で記述すること
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 6.1, 6.2, 7.1, 7.2, 9.1, 9.2, 9.3_

- [x] 2. テンプレートの検証
  - [x] 2.1 `sam validate` でテンプレート構文を検証する
    - プロジェクトルートで `sam validate --template template.yaml` を実行
    - バリデーションが成功することを確認する
    - エラーが発生した場合は template.yaml を修正する
    - _Requirements: 8.3_

  - [x] 2.2 `sam build` でビルドが成功することを検証する
    - プロジェクトルートで `sam build` を実行
    - Lambda関数のパッケージングが成功することを確認する
    - `.aws-sam/` ビルドアーティファクトが生成されることを確認する
    - _Requirements: 8.1_

- [x] 3. 最終チェックポイント
  - テンプレートのバリデーションとビルドが成功していることを確認し、問題があればユーザーに質問する。

## Notes

- 本機能はIaC（Infrastructure as Code）のため、プロパティベーステスト（PBT）は非適用
- `sam deploy --guided` による実際のデプロイはユーザーが手動で実行する（コーディングタスク外）
- 既存の `backend/lambda_function.py` は変更不要
- テンプレート内のコメントはすべて英語で記述する
- `.aws-sam/` ディレクトリはビルドアーティファクトであり、git管理対象外とすることを推奨

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] }
  ]
}
```
