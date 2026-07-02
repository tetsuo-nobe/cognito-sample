"""
handle_change_password関数のユニットテスト

タスク4.5の実装検証用テスト。
boto3をモック化してCognito APIレスポンスをシミュレーションする。
"""

import json
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, r"c:\Users\tnobe\Desktop\cognito-sample\backend")


def test_missing_access_token_returns_401():
    """アクセストークンが無い場合、401エラーを返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        result = lambda_function.handle_change_password(
            {"previous_password": "OldPass123!", "new_password": "NewPass456!"}, {}
        )
        assert result["statusCode"] == 401
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "認証が必要です" in body["error"]


def test_empty_authorization_header_returns_401():
    """Authorizationヘッダーが空の場合、401エラーを返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        result = lambda_function.handle_change_password(
            {"previous_password": "OldPass123!", "new_password": "NewPass456!"},
            {"Authorization": ""},
        )
        assert result["statusCode"] == 401
        body = json.loads(result["body"])
        assert body["success"] is False


def test_empty_passwords_returns_400():
    """パスワードが空の場合、400エラーを返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        result = lambda_function.handle_change_password(
            {"previous_password": "", "new_password": ""},
            {"Authorization": "Bearer test-access-token"},
        )
        assert result["statusCode"] == 400
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "現在のパスワードと新しいパスワードを入力してください" in body["error"]


def test_successful_change_password_returns_200():
    """パスワード変更成功時、200と成功メッセージを返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        mock_cognito.change_password.return_value = {}

        result = lambda_function.handle_change_password(
            {"previous_password": "OldPass123!", "new_password": "NewPass456!"},
            {"Authorization": "Bearer test-access-token"},
        )
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert body["success"] is True
        assert body["message"] == "パスワードが変更されました"

        # change_passwordが正しいパラメータで呼ばれたことを確認
        mock_cognito.change_password.assert_called_once_with(
            PreviousPassword="OldPass123!",
            ProposedPassword="NewPass456!",
            AccessToken="test-access-token",
        )


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

        mock_cognito.change_password.side_effect = ClientError(
            {
                "Error": {
                    "Code": "NotAuthorizedException",
                    "Message": "Incorrect username or password",
                }
            },
            "ChangePassword",
        )

        result = lambda_function.handle_change_password(
            {"previous_password": "WrongPass!", "new_password": "NewPass456!"},
            {"Authorization": "Bearer test-access-token"},
        )
        assert result["statusCode"] == 401
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "ユーザー名またはパスワードが正しくありません" in body["error"]


def test_invalid_password_returns_400():
    """InvalidPasswordException発生時、400エラーを返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        from botocore.exceptions import ClientError

        mock_cognito.change_password.side_effect = ClientError(
            {
                "Error": {
                    "Code": "InvalidPasswordException",
                    "Message": "Password does not conform to policy",
                }
            },
            "ChangePassword",
        )

        result = lambda_function.handle_change_password(
            {"previous_password": "OldPass123!", "new_password": "weak"},
            {"Authorization": "Bearer test-access-token"},
        )
        assert result["statusCode"] == 400
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "パスワードポリシーを満たしていません" in body["error"]


def test_limit_exceeded_returns_400():
    """LimitExceededException発生時、400エラーを返却する"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        from botocore.exceptions import ClientError

        mock_cognito.change_password.side_effect = ClientError(
            {
                "Error": {
                    "Code": "LimitExceededException",
                    "Message": "Attempt limit exceeded",
                }
            },
            "ChangePassword",
        )

        result = lambda_function.handle_change_password(
            {"previous_password": "OldPass123!", "new_password": "NewPass456!"},
            {"Authorization": "Bearer test-access-token"},
        )
        assert result["statusCode"] == 400
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "リクエスト回数の上限" in body["error"]


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

        mock_cognito.change_password.side_effect = RuntimeError("unexpected")

        result = lambda_function.handle_change_password(
            {"previous_password": "OldPass123!", "new_password": "NewPass456!"},
            {"Authorization": "Bearer test-access-token"},
        )
        assert result["statusCode"] == 500
        body = json.loads(result["body"])
        assert body["success"] is False
        assert "システムエラー" in body["error"]


def test_lowercase_authorization_header():
    """小文字のauthorizationヘッダーでもトークンを取得できる"""
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito

        if "lambda_function" in sys.modules:
            del sys.modules["lambda_function"]
        import lambda_function

        lambda_function.cognito_client = mock_cognito
        lambda_function.CLIENT_ID = "test-client-id"

        mock_cognito.change_password.return_value = {}

        result = lambda_function.handle_change_password(
            {"previous_password": "OldPass123!", "new_password": "NewPass456!"},
            {"authorization": "Bearer test-access-token"},
        )
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert body["success"] is True


if __name__ == "__main__":
    test_missing_access_token_returns_401()
    print("テスト1 合格: アクセストークン無し")

    test_empty_authorization_header_returns_401()
    print("テスト2 合格: 空Authorizationヘッダー")

    test_empty_passwords_returns_400()
    print("テスト3 合格: 空パスワード")

    test_successful_change_password_returns_200()
    print("テスト4 合格: パスワード変更成功")

    test_not_authorized_returns_401()
    print("テスト5 合格: NotAuthorizedException")

    test_invalid_password_returns_400()
    print("テスト6 合格: InvalidPasswordException")

    test_limit_exceeded_returns_400()
    print("テスト7 合格: LimitExceededException")

    test_unexpected_error_returns_500()
    print("テスト8 合格: 予期しないエラー")

    test_lowercase_authorization_header()
    print("テスト9 合格: 小文字authorizationヘッダー")

    print("\n全テスト合格!")
