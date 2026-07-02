"""
handle_signin関数のユニットテスト

タスク4.2の実装検証用テスト。
boto3をモック化してCognito APIレスポンスをシミュレーションする。
"""

import json
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, r"c:\Users\tnobe\Desktop\cognito-sample\backend")


def setup_module():
    """テストモジュールのセットアップ: boto3をモック化してlambda_functionをインポート"""
    pass


def test_empty_input_returns_400():
    """空入力の場合、400エラーを返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        result = lambda_function.handle_signin({}, {})
        assert result["statusCode"] == 400
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "ユーザー名とパスワードを入力してください" in body["error"]


def test_successful_signin_returns_tokens():
    """認証成功時、200とトークン群を返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        mock_cognito.initiate_auth.return_value = {
            "AuthenticationResult": {
                "IdToken": "test-id-token",
                "AccessToken": "test-access-token",
                "RefreshToken": "test-refresh-token",
            }
        }

        result = lambda_function.handle_signin(
            {"username": "testuser", "password": "Pass123!"}, {}
        )
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert body["success"] is True
        assert body["tokens"]["id_token"] == "test-id-token"
        assert body["tokens"]["access_token"] == "test-access-token"
        assert body["tokens"]["refresh_token"] == "test-refresh-token"


def test_not_authorized_returns_401():
    """NotAuthorizedException発生時、401エラーを返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        from botocore.exceptions import ClientError

        mock_cognito.initiate_auth.side_effect = ClientError(
            {
                "Error": {
                    "Code": "NotAuthorizedException",
                    "Message": "Incorrect username or password",
                }
            },
            "InitiateAuth",
        )

        result = lambda_function.handle_signin(
            {"username": "testuser", "password": "wrong"}, {}
        )
        assert result["statusCode"] == 401
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "ユーザー名またはパスワードが正しくありません" in body["error"]


def test_user_not_found_returns_401():
    """UserNotFoundException発生時、401エラーを返却する（セキュリティ上NotAuthorizedと同じメッセージ）"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        from botocore.exceptions import ClientError

        mock_cognito.initiate_auth.side_effect = ClientError(
            {
                "Error": {
                    "Code": "UserNotFoundException",
                    "Message": "User does not exist",
                }
            },
            "InitiateAuth",
        )

        result = lambda_function.handle_signin(
            {"username": "notexist", "password": "Pass123!"}, {}
        )
        assert result["statusCode"] == 401
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "ユーザー名またはパスワードが正しくありません" in body["error"]


def test_unexpected_error_returns_500():
    """予期しないエラー発生時、500エラーを返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        mock_cognito.initiate_auth.side_effect = RuntimeError("unexpected")

        result = lambda_function.handle_signin(
            {"username": "testuser", "password": "Pass123!"}, {}
        )
        assert result["statusCode"] == 500
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "システムエラー" in body["error"]


def test_user_not_confirmed_returns_400():
    """UserNotConfirmedException発生時、400エラーを返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        from botocore.exceptions import ClientError

        mock_cognito.initiate_auth.side_effect = ClientError(
            {
                "Error": {
                    "Code": "UserNotConfirmedException",
                    "Message": "User is not confirmed",
                }
            },
            "InitiateAuth",
        )

        result = lambda_function.handle_signin(
            {"username": "testuser", "password": "Pass123!"}, {}
        )
        assert result["statusCode"] == 400
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "アカウントが未確認です" in body["error"]


if __name__ == "__main__":
    test_empty_input_returns_400()
    print("テスト1 合格: 空入力チェック")

    test_successful_signin_returns_tokens()
    print("テスト2 合格: 認証成功")

    test_not_authorized_returns_401()
    print("テスト3 合格: NotAuthorizedException")

    test_user_not_found_returns_401()
    print("テスト4 合格: UserNotFoundException")

    test_unexpected_error_returns_500()
    print("テスト5 合格: 予期しないエラー")

    test_user_not_confirmed_returns_400()
    print("テスト6 合格: UserNotConfirmedException")

    print("\n全テスト合格!")
