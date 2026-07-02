/**
 * アプリケーション設定ファイル
 *
 * Cognito User Pool、App Client、API Gatewayの設定値を管理する。
 * デプロイ先環境に合わせて各設定値を編集することで、
 * ソースコードの変更なしに環境を切り替え可能。
 */

// アプリケーション設定オブジェクト
const AppConfig = {
  // Cognito User Pool ID（例: ap-northeast-1_XXXXXXXXX）
  userPoolId: 'ap-northeast-1_rJ61BZGW6',

  // Cognito App Client ID（例: xxxxxxxxxxxxxxxxxxxxxxxxxx）
  appClientId: '6nrfmt36otrai29m68449h3ph9',

  // API Gateway エンドポイントURL（例: https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod）
  apiEndpoint: 'https://wf4wgjtlt5.execute-api.ap-northeast-1.amazonaws.com/Prod'
};
