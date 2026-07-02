# 要件ドキュメント: SAMデプロイメント

## Introduction

本ドキュメントは、既存のCognito認証SPAバックエンド（Lambda関数 + API Gateway REST API）をAWS SAM（Serverless Application Model）を使用してデプロイ可能にするための要件を定義する。既存のLambda関数（backend/lambda_function.py）をSAMテンプレートでインフラストラクチャ・アズ・コードとして管理し、再現可能なデプロイを実現する。

## 用語集

- **SAM_Template**: AWS SAMのテンプレートファイル（template.yaml）。CloudFormation拡張構文でサーバーレスリソースを定義する
- **Stack**: AWS CloudFormationスタック。SAMテンプレートからデプロイされるリソースの集合
- **Stack_Name**: CloudFormationスタックの名前。リソースの命名に接頭辞として使用される
- **REST_API**: Amazon API Gateway REST APIリソース。HTTPエンドポイントを提供する
- **Lambda_Function**: AWS Lambda関数リソース。バックエンドのビジネスロジックを実行する
- **SAM_CLI**: AWS SAMコマンドラインインターフェース。ビルド・デプロイ操作を実行する

## 要件

### 要件 1: SAMテンプレートファイルの作成

**ユーザーストーリー:** 開発者として、SAMテンプレートファイルを使用してバックエンドリソースを定義したい。これにより、インフラをコードとして管理し、再現可能なデプロイを実現できる。

#### 受け入れ基準

1. THE SAM_Template SHALL define the AWS SAM template format version as "2010-09-09" with Transform "AWS::Serverless-2016-10-31"
2. THE SAM_Template SHALL be located at the project root directory as "template.yaml"
3. THE SAM_Template SHALL contain all comments written in English
4. THE SAM_Template SHALL include a Description field summarizing the stack purpose

### 要件 2: Lambda関数リソースの定義

**ユーザーストーリー:** 開発者として、Lambda関数をSAMテンプレートで定義したい。これにより、関数の設定（ランタイム、タイムアウト、環境変数等）をコードで管理できる。

#### 受け入れ基準

1. THE SAM_Template SHALL define a Lambda_Function resource with Type "AWS::Serverless::Function"
2. THE SAM_Template SHALL configure the Lambda_Function with Python 3.13 runtime
3. THE SAM_Template SHALL configure the Lambda_Function with a timeout of 30 seconds
4. THE SAM_Template SHALL configure the Lambda_Function handler as "lambda_function.lambda_handler"
5. THE SAM_Template SHALL configure the Lambda_Function CodeUri pointing to the "backend/" directory
6. THE SAM_Template SHALL configure the Lambda_Function with environment variable COGNITO_CLIENT_ID as a parameter
7. WHEN the stack is deployed, THE Lambda_Function SHALL have its function name prefixed with the Stack_Name using the format "${AWS::StackName}-<logical-name>"

### 要件 3: API Gateway REST APIリソースの定義

**ユーザーストーリー:** 開発者として、API GatewayをSAMテンプレートで定義したい。これにより、APIエンドポイントの設定をコードで管理し、一貫したデプロイができる。

#### 受け入れ基準

1. THE SAM_Template SHALL define a REST_API resource with Type "AWS::Serverless::Api"
2. THE SAM_Template SHALL configure the REST_API with StageName "Prod"
3. WHEN the stack is deployed, THE REST_API SHALL have its name prefixed with the Stack_Name using the format "${AWS::StackName}-<logical-name>"
4. THE SAM_Template SHALL configure CORS on the REST_API with AllowOrigin "'*'", AllowMethods "'GET,POST,OPTIONS'", and AllowHeaders "'Content-Type,Authorization'"

### 要件 4: APIエンドポイントの定義

**ユーザーストーリー:** 開発者として、5つの認証エンドポイントをSAMテンプレートで定義したい。これにより、APIパス構成がコードで管理される。

#### 受け入れ基準

1. THE SAM_Template SHALL define a POST method event for the "/signin" path linked to the REST_API
2. THE SAM_Template SHALL define a POST method event for the "/signup" path linked to the REST_API
3. THE SAM_Template SHALL define a POST method event for the "/verify" path linked to the REST_API
4. THE SAM_Template SHALL define a POST method event for the "/change-password" path linked to the REST_API
5. THE SAM_Template SHALL define a POST method event for the "/resend-code" path linked to the REST_API
6. THE SAM_Template SHALL associate all API events with the explicitly defined REST_API resource using RestApiId

### 要件 5: テンプレートパラメータの定義

**ユーザーストーリー:** 開発者として、環境ごとに異なる値（Cognito Client ID等）をパラメータとして外部化したい。これにより、同一テンプレートで複数環境へのデプロイが可能になる。

#### 受け入れ基準

1. THE SAM_Template SHALL define a CognitoClientId parameter of type String with a description in English
2. THE SAM_Template SHALL pass the CognitoClientId parameter value to the Lambda_Function as the COGNITO_CLIENT_ID environment variable

### 要件 6: スタック出力の定義

**ユーザーストーリー:** 開発者として、デプロイ後にAPIエンドポイントURLを確認したい。これにより、フロントエンドの設定値を容易に取得できる。

#### 受け入れ基準

1. THE SAM_Template SHALL define an Outputs section containing the API endpoint URL
2. THE SAM_Template SHALL output the full API endpoint URL including the stage name in the format "https://{api-id}.execute-api.{region}.amazonaws.com/Prod"

### 要件 7: IAMポリシーの定義

**ユーザーストーリー:** 開発者として、Lambda関数に必要最小限のIAM権限を付与したい。これにより、セキュリティのベストプラクティスに従ったデプロイができる。

#### 受け入れ基準

1. THE SAM_Template SHALL grant the Lambda_Function permissions to invoke Cognito User Pool operations (cognito-idp:InitiateAuth, cognito-idp:SignUp, cognito-idp:ConfirmSignUp, cognito-idp:ChangePassword, cognito-idp:ResendConfirmationCode)
2. THE SAM_Template SHALL restrict the Cognito permissions to the specific User Pool resource using a parameter or wildcard appropriate for multi-environment deployment

### 要件 8: SAM CLIによるビルドとデプロイ

**ユーザーストーリー:** 開発者として、SAM CLIコマンドでビルドとデプロイを実行したい。これにより、標準的なワークフローでバックエンドをデプロイできる。

#### 受け入れ基準

1. WHEN "sam build" is executed in the project root, THE SAM_CLI SHALL successfully build the Lambda_Function package
2. WHEN "sam deploy --guided" is executed, THE SAM_CLI SHALL prompt for parameter values including CognitoClientId and Stack_Name
3. THE SAM_Template SHALL be compatible with SAM CLI version 1.x for build and deploy operations

### 要件 9: リソース命名規則

**ユーザーストーリー:** 開発者として、デプロイされたリソースにスタック名が接頭辞として付与されることを確認したい。これにより、同一アカウントに複数スタックをデプロイしても名前の衝突が発生しない。

#### 受け入れ基準

1. WHEN the stack is deployed, THE Lambda_Function SHALL have a function name following the pattern "${AWS::StackName}-<FunctionLogicalId>"
2. WHEN the stack is deployed, THE REST_API SHALL have a name following the pattern "${AWS::StackName}-<ApiLogicalId>"
3. THE SAM_Template SHALL use the !Sub intrinsic function to embed the Stack_Name in resource names
