/**
 * 認証関連ロジックモジュール
 *
 * API通信、トークンのlocalStorage保存/取得/削除、認証状態チェック、
 * JWTデコードによるユーザー情報抽出を提供する。
 */

// localStorageのキー定義
const TOKEN_KEYS = {
  idToken: 'cognito_id_token',
  accessToken: 'cognito_access_token',
  refreshToken: 'cognito_refresh_token'
};

/**
 * JWTトークンのペイロード部分をデコードする
 *
 * Base64URLデコードによりJWTの第2部（ペイロード）をパースする。
 * 署名検証は行わない（バックエンド側の責務）。
 *
 * @param {string} token - JWT文字列
 * @returns {object|null} デコードされたペイロードオブジェクト、失敗時はnull
 */
function parseJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    // Base64URLデコード: '-' を '+' に、'_' を '/' に置換
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * 認証状態を確認する
 *
 * localStorageに有効期限内のIDトークンが存在するかを判定する。
 *
 * @returns {boolean} 有効なトークンが存在する場合 true
 */
function isAuthenticated() {
  const idToken = localStorage.getItem(TOKEN_KEYS.idToken);
  if (!idToken) {
    return false;
  }

  // IDトークンのexpクレームを確認
  try {
    const payload = parseJwtPayload(idToken);
    if (!payload || !payload.exp) {
      return false;
    }
    // 現在時刻（秒）と比較
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (e) {
    return false;
  }
}

/**
 * IDトークンからユーザー名を抽出する
 *
 * localStorageに保存されたIDトークンをデコードし、cognito:usernameフィールドを返す。
 *
 * @returns {string|null} ユーザー名、取得失敗時はnull
 */
function getUsernameFromToken() {
  const idToken = localStorage.getItem(TOKEN_KEYS.idToken);
  if (!idToken) {
    return null;
  }

  const payload = parseJwtPayload(idToken);
  if (!payload || !payload['cognito:username']) {
    return null;
  }
  return payload['cognito:username'];
}

/**
 * IDトークンからメールアドレスを抽出する
 *
 * localStorageに保存されたIDトークンをデコードし、emailフィールドを返す。
 *
 * @returns {string|null} メールアドレス、取得失敗時はnull
 */
function getEmailFromToken() {
  const idToken = localStorage.getItem(TOKEN_KEYS.idToken);
  if (!idToken) {
    return null;
  }

  const payload = parseJwtPayload(idToken);
  if (!payload || !payload.email) {
    return null;
  }
  return payload.email;
}

/**
 * トークンをlocalStorageに保存する
 *
 * 認証成功時に受信したトークン群をlocalStorageに個別のキーで保存する。
 *
 * @param {object} tokens - トークンオブジェクト
 * @param {string} tokens.id_token - IDトークン
 * @param {string} tokens.access_token - アクセストークン
 * @param {string} tokens.refresh_token - リフレッシュトークン
 */
function saveTokens(tokens) {
  if (tokens.id_token) {
    localStorage.setItem(TOKEN_KEYS.idToken, tokens.id_token);
  }
  if (tokens.access_token) {
    localStorage.setItem(TOKEN_KEYS.accessToken, tokens.access_token);
  }
  if (tokens.refresh_token) {
    localStorage.setItem(TOKEN_KEYS.refreshToken, tokens.refresh_token);
  }
}

/**
 * IDトークンを取得する
 *
 * @returns {string|null} IDトークン文字列、存在しない場合はnull
 */
function getIdToken() {
  return localStorage.getItem(TOKEN_KEYS.idToken);
}

/**
 * アクセストークンを取得する
 *
 * @returns {string|null} アクセストークン文字列、存在しない場合はnull
 */
function getAccessToken() {
  return localStorage.getItem(TOKEN_KEYS.accessToken);
}

/**
 * すべてのトークンをlocalStorageから削除する
 *
 * サインアウト時やセッション無効化時に呼び出す。
 */
function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.idToken);
  localStorage.removeItem(TOKEN_KEYS.accessToken);
  localStorage.removeItem(TOKEN_KEYS.refreshToken);
}

/**
 * バックエンドAPIにリクエストを送信する
 *
 * fetch APIを使用してJSON形式のPOSTリクエストを送信する。
 * IDトークンが存在する場合、AuthorizationヘッダーにBearer形式で付与する。
 *
 * @param {string} endpoint - APIエンドポイントの相対パス（例: '/signin'）
 * @param {object} data - リクエストボディに含めるデータ
 * @param {object} [options={}] - 追加オプション
 * @param {boolean} [options.useAccessToken=false] - アクセストークンを使用する場合true
 * @returns {Promise<object>} レスポンスのJSONオブジェクト
 * @throws {Error} ネットワークエラーまたはレスポンスパースエラー時
 */
async function apiRequest(endpoint, data, options = {}) {
  const url = AppConfig.apiEndpoint + endpoint;

  // リクエストヘッダーの構築
  const headers = {
    'Content-Type': 'application/json'
  };

  // Authorizationヘッダーの付与
  if (options.useAccessToken) {
    // パスワード変更等ではアクセストークンを使用
    const accessToken = getAccessToken();
    if (accessToken) {
      headers['Authorization'] = 'Bearer ' + accessToken;
    }
  } else {
    // 通常のAPIリクエストではIDトークンを使用
    const idToken = getIdToken();
    if (idToken) {
      headers['Authorization'] = 'Bearer ' + idToken;
    }
  }

  // fetch APIでPOSTリクエストを送信
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  });

  // レスポンスのJSONパース
  const responseData = await response.json();

  // 401レスポンスの場合、トークンを削除してサインインページへ遷移
  if (response.status === 401 && !endpoint.includes('/signin')) {
    clearTokens();
    location.hash = '#/signin';
    return responseData;
  }

  return responseData;
}
