"""
Cognito認証SPA バックエンド Lambda関数

Amazon Cognito User Poolと連携した認証処理を行うLambda関数。
API Gateway REST APIからのリクエストをパスベースでルーティングし、
各認証操作（サインイン、サインアップ、確認コード検証、パスワード変更、確認コード再送）を処理する。
"""

import json
import os

import boto3
from botocore.exceptions import ClientError

# Cognitoクライアントの初期化（東京リージョン）
cognito_client = boto3.client("cognito-idp", region_name="ap-northeast-1")
CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID", "")


def build_response(status_code, body):
    """
    CORSヘッダー付きのHTTPレスポンスを構築する。

    API Gateway Lambda統合で必要なレスポンス形式を返却し、
    フロントエンドからのクロスオリジンリクエストを許可するCORSヘッダーを付与する。

    Args:
        status_code (int): HTTPステータスコード
        body (dict): レスポンスボディ（JSON形式で返却される）

    Returns:
        dict: API Gateway互換のレスポンスオブジェクト
    """
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


def handle_signin(body, headers):
    """
    サインイン処理。

    Cognito User PoolにUSER_PASSWORD_AUTHフローで認証リクエストを送信し、
    成功時はトークン群を、失敗時はエラーメッセージを返却する。

    Args:
        body (dict): リクエストボディ（username, password）
        headers (dict): リクエストヘッダー

    Returns:
        dict: API Gatewayレスポンス
    """
    username = body.get("username", "")
    password = body.get("password", "")

    # 入力値の簡易チェック
    if not username or not password:
        return build_response(400, {"success": False, "error": "ユーザー名とパスワードを入力してください"})

    try:
        # Cognito USER_PASSWORD_AUTHフローで認証
        response = cognito_client.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": username,
                "PASSWORD": password,
            },
        )

        # 認証成功: トークン群を返却
        tokens = response["AuthenticationResult"]
        return build_response(200, {
            "success": True,
            "tokens": {
                "id_token": tokens["IdToken"],
                "access_token": tokens["AccessToken"],
                "refresh_token": tokens["RefreshToken"],
            },
        })

    except ClientError as e:
        # Cognitoエラーコードに応じたエラーメッセージを返却
        error_code = e.response["Error"]["Code"]
        status_code, error_message = translate_error(error_code)
        return build_response(status_code, {"success": False, "error": error_message})

    except Exception:
        # 予期しないエラー
        return build_response(500, {"success": False, "error": "システムエラーが発生しました。しばらく待ってから再度お試しください"})


def handle_signup(body, headers):
    """
    サインアップ処理。

    boto3を使用してCognito User Poolにユーザー登録リクエストを送信する。
    ユーザー名をCognitoのユーザー名として使用し、確認コードがメールに送信される。

    Args:
        body (dict): リクエストボディ（username, email, password）
        headers (dict): リクエストヘッダー

    Returns:
        dict: API Gatewayレスポンス
            - 成功時: 200 + 確認コード送信メッセージ
            - 失敗時: 適切なHTTPステータスコード + 日本語エラーメッセージ
    """
    # リクエストボディからユーザー名、メールアドレス、パスワードを取得
    username = body.get("username", "")
    email = body.get("email", "")
    password = body.get("password", "")

    # 入力値の基本チェック
    if not username or not email or not password:
        return build_response(400, {"success": False, "error": "ユーザー名、メールアドレス、パスワードは必須です"})

    try:
        # Cognito User Poolにサインアップリクエストを送信
        cognito_client.sign_up(
            ClientId=CLIENT_ID,
            Username=username,
            Password=password,
            UserAttributes=[
                {"Name": "email", "Value": email}
            ],
        )
        return build_response(200, {"success": True, "message": "確認コードをメールに送信しました"})
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        status_code, message = translate_error(error_code)
        return build_response(status_code, {"success": False, "error": message})
    except Exception:
        return build_response(500, {"success": False, "error": "システムエラーが発生しました。しばらく待ってから再度お試しください"})


def handle_verify(body, headers):
    """
    確認コード検証処理。

    Cognito User Poolに確認コード検証リクエストを送信し、
    成功時はアカウント有効化メッセージを、失敗時はエラーメッセージを返却する。

    Args:
        body (dict): リクエストボディ（username, code）
        headers (dict): リクエストヘッダー

    Returns:
        dict: API Gatewayレスポンス
    """
    username = body.get("username", "")
    code = body.get("code", "")

    # 入力値の簡易チェック
    if not username or not code:
        return build_response(400, {"success": False, "error": "ユーザー名と確認コードを入力してください"})

    try:
        # Cognitoに確認コード検証リクエストを送信
        cognito_client.confirm_sign_up(
            ClientId=CLIENT_ID,
            Username=username,
            ConfirmationCode=code,
        )

        # 検証成功
        return build_response(200, {"success": True, "message": "アカウントが有効化されました"})

    except ClientError as e:
        # Cognitoエラーコードに応じたエラーメッセージを返却
        error_code = e.response["Error"]["Code"]
        status_code, error_message = translate_error(error_code)
        return build_response(status_code, {"success": False, "error": error_message})

    except Exception:
        # 予期しないエラー
        return build_response(500, {"success": False, "error": "システムエラーが発生しました。しばらく待ってから再度お試しください"})


def handle_change_password(body, headers):
    """
    パスワード変更処理。

    Authorizationヘッダーからアクセストークンを取得し、
    Cognito User Poolにパスワード変更リクエストを送信する。

    Args:
        body (dict): リクエストボディ（previous_password, new_password）
        headers (dict): リクエストヘッダー

    Returns:
        dict: API Gatewayレスポンス
    """
    # Authorizationヘッダーからアクセストークンを取得
    auth_header = headers.get("Authorization", "") or headers.get("authorization", "")
    access_token = ""
    if auth_header.startswith("Bearer "):
        access_token = auth_header[len("Bearer "):]

    # アクセストークンの存在チェック
    if not access_token:
        return build_response(401, {"success": False, "error": "認証が必要です"})

    # リクエストボディからパスワードを取得
    previous_password = body.get("previous_password", "")
    new_password = body.get("new_password", "")

    # 入力値の簡易チェック
    if not previous_password or not new_password:
        return build_response(400, {"success": False, "error": "現在のパスワードと新しいパスワードを入力してください"})

    try:
        # Cognitoにパスワード変更リクエストを送信
        cognito_client.change_password(
            PreviousPassword=previous_password,
            ProposedPassword=new_password,
            AccessToken=access_token,
        )

        # パスワード変更成功
        return build_response(200, {"success": True, "message": "パスワードが変更されました"})

    except ClientError as e:
        # Cognitoエラーコードに応じたエラーメッセージを返却
        error_code = e.response["Error"]["Code"]
        status_code, error_message = translate_error(error_code)
        return build_response(status_code, {"success": False, "error": error_message})

    except Exception:
        # 予期しないエラー
        return build_response(500, {"success": False, "error": "システムエラーが発生しました。しばらく待ってから再度お試しください"})


def handle_resend_code(body, headers):
    """
    確認コード再送処理。

    Cognito User Poolに確認コード再送リクエストを送信し、
    成功時は再送完了メッセージを、失敗時はエラーメッセージを返却する。

    Args:
        body (dict): リクエストボディ（username）
        headers (dict): リクエストヘッダー

    Returns:
        dict: API Gatewayレスポンス
    """
    username = body.get("username", "")

    # 入力値の簡易チェック
    if not username:
        return build_response(400, {"success": False, "error": "ユーザー名を入力してください"})

    try:
        # Cognitoに確認コード再送リクエストを送信
        cognito_client.resend_confirmation_code(
            ClientId=CLIENT_ID,
            Username=username,
        )

        # 再送成功
        return build_response(200, {"success": True, "message": "確認コードを再送しました"})

    except ClientError as e:
        # Cognitoエラーコードに応じたエラーメッセージを返却
        error_code = e.response["Error"]["Code"]
        status_code, error_message = translate_error(error_code)
        return build_response(status_code, {"success": False, "error": error_message})

    except Exception:
        # 予期しないエラー
        return build_response(500, {"success": False, "error": "システムエラーが発生しました。しばらく待ってから再度お試しください"})


def translate_error(error_code):
    """
    Cognitoエラーコードを日本語メッセージとHTTPステータスコードに変換する。

    設計ドキュメントのマッピング表に基づき、既知のエラーコードには
    対応するメッセージを返却し、未知のエラーコードにはデフォルトメッセージを返却する。

    Args:
        error_code (str): CognitoのエラーコードCode（例: 'NotAuthorizedException'）

    Returns:
        tuple: (HTTPステータスコード, 日本語エラーメッセージ)
    """
    error_map = {
        "NotAuthorizedException": (401, "ユーザー名またはパスワードが正しくありません"),
        "UserNotFoundException": (401, "ユーザー名またはパスワードが正しくありません"),
        "UsernameExistsException": (400, "このユーザー名は既に登録されています"),
        "InvalidPasswordException": (400, "パスワードポリシーを満たしていません（8文字以上、英大文字・英小文字・数字・記号を含む）"),
        "CodeMismatchException": (400, "確認コードが正しくありません"),
        "ExpiredCodeException": (400, "確認コードの有効期限が切れています。再送してください"),
        "LimitExceededException": (400, "リクエスト回数の上限に達しました。しばらく待ってから再度お試しください"),
        "InvalidParameterException": (400, "入力内容に不備があります"),
        "UserNotConfirmedException": (400, "アカウントが未確認です。確認コードを入力してください"),
    }

    if error_code in error_map:
        return error_map[error_code]

    return (500, "システムエラーが発生しました。しばらく待ってから再度お試しください")


# パスとハンドラー関数のルーティングマッピング
ROUTE_MAP = {
    "/signin": handle_signin,
    "/signup": handle_signup,
    "/verify": handle_verify,
    "/change-password": handle_change_password,
    "/resend-code": handle_resend_code,
}


def lambda_handler(event, context):
    """
    Lambda関数のエントリポイント。

    API Gatewayからのイベントを受け取り、パスに基づいて適切なハンドラー関数にルーティングする。
    OPTIONSリクエスト（CORSプリフライト）には200を返却する。
    不正なJSON形式のリクエストボディには400エラーを返却する。

    Args:
        event (dict): API Gatewayイベントオブジェクト
            - path (str): リクエストパス
            - httpMethod (str): HTTPメソッド
            - body (str): リクエストボディ（JSON文字列）
            - headers (dict): リクエストヘッダー
        context: Lambda実行コンテキスト（未使用）

    Returns:
        dict: API Gateway互換のレスポンスオブジェクト
    """
    # OPTIONSリクエスト（CORSプリフライト）への対応
    http_method = event.get("httpMethod", "")
    if http_method == "OPTIONS":
        return build_response(200, {})

    # リクエストパスの取得
    path = event.get("path", "")

    # ルーティング: パスに対応するハンドラーを検索
    handler = ROUTE_MAP.get(path)
    if handler is None:
        return build_response(404, {"success": False, "error": "エンドポイントが見つかりません"})

    # リクエストボディのJSONパース
    try:
        raw_body = event.get("body", "")
        if raw_body is None:
            raw_body = ""
        body = json.loads(raw_body)
    except (json.JSONDecodeError, TypeError):
        return build_response(400, {"success": False, "error": "リクエスト形式が不正です"})

    # ヘッダーの取得（大文字小文字を正規化）
    headers = event.get("headers", {}) or {}

    # ハンドラー関数を呼び出し
    return handler(body, headers)
