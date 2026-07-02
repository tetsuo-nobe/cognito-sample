/**
 * ユーティリティ関数モジュール
 *
 * バリデーション関数やエラー表示などの共通ユーティリティを提供する。
 */

/**
 * 設定ファイルのバリデーション
 *
 * AppConfig の必須フィールド（userPoolId, appClientId, apiEndpoint）が
 * すべて非空かつ定義済みであることを確認する。
 *
 * @param {object} config - 検証対象の設定オブジェクト
 * @returns {boolean} すべての必須フィールドが有効な場合 true、それ以外は false
 */
function validateConfig(config) {
  // 設定オブジェクト自体が未定義またはnullの場合は無効
  if (!config || typeof config !== 'object') {
    return false;
  }

  // 必須フィールドの一覧
  const requiredFields = ['userPoolId', 'appClientId', 'apiEndpoint'];

  // 各フィールドが存在し、空文字でないことを確認
  for (const field of requiredFields) {
    const value = config[field];
    // undefined、null、空文字、ホワイトスペースのみの場合は無効
    if (value === undefined || value === null || String(value).trim() === '') {
      return false;
    }
  }

  return true;
}

/**
 * 設定エラーメッセージを画面に表示し、認証操作を無効化する
 *
 * #app コンテナにエラーメッセージを描画し、ユーザーに設定不備を通知する。
 * この関数が呼ばれた後、認証関連の操作は実行できない状態となる。
 */
function showConfigError() {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    return;
  }

  appContainer.innerHTML = `
    <div class="config-error">
      <h2>設定エラー</h2>
      <p>アプリケーションの設定に不備があります。</p>
      <p>管理者に連絡し、以下の設定値が正しく設定されていることを確認してください：</p>
      <ul>
        <li>Cognito User Pool ID</li>
        <li>Cognito App Client ID</li>
        <li>API Gateway エンドポイントURL</li>
      </ul>
      <p class="config-error-note">設定ファイル（config.js）を編集して、正しい値を設定してください。</p>
    </div>
  `;
}

/**
 * 設定バリデーションを実行し、不備がある場合はエラー表示と認証無効化を行う
 *
 * アプリケーション初期化時に呼び出し、設定が有効かどうかを判定する。
 * 無効な場合はエラーメッセージを画面に表示し、false を返す。
 *
 * @returns {boolean} 設定が有効な場合 true、無効な場合 false（エラー表示済み）
 */
function initConfigValidation() {
  if (!validateConfig(AppConfig)) {
    showConfigError();
    return false;
  }
  return true;
}

// ============================================================
// バリデーションユーティリティ関数
// ============================================================

/**
 * メールアドレス形式バリデーション
 *
 * @を含み、ローカル部とドメイン部がそれぞれ空でないことを確認する。
 *
 * @param {string} email - 検証対象のメールアドレス
 * @returns {boolean} 有効な形式の場合 true、それ以外は false
 */
function validateEmail(email) {
  // null、undefined、文字列以外は無効
  if (typeof email !== 'string') {
    return false;
  }

  // @が含まれているか確認
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return false;
  }

  // ローカル部（@より前）が空でないこと
  const localPart = email.substring(0, atIndex);
  if (localPart.length === 0) {
    return false;
  }

  // ドメイン部（@より後）が空でないこと
  const domainPart = email.substring(atIndex + 1);
  if (domainPart.length === 0) {
    return false;
  }

  return true;
}

/**
 * パスワードポリシーバリデーション
 *
 * 以下のすべてを満たすかチェックする:
 * - 8文字以上
 * - 英大文字を1文字以上含む
 * - 英小文字を1文字以上含む
 * - 数字を1文字以上含む
 * - 記号を1文字以上含む
 *
 * @param {string} password - 検証対象のパスワード
 * @returns {boolean} ポリシーを満たす場合 true、それ以外は false
 */
function validatePassword(password) {
  // null、undefined、文字列以外は無効
  if (typeof password !== 'string') {
    return false;
  }

  // 8文字以上
  if (password.length < 8) {
    return false;
  }

  // 英大文字を1文字以上含む
  if (!/[A-Z]/.test(password)) {
    return false;
  }

  // 英小文字を1文字以上含む
  if (!/[a-z]/.test(password)) {
    return false;
  }

  // 数字を1文字以上含む
  if (!/[0-9]/.test(password)) {
    return false;
  }

  // 記号を1文字以上含む（英数字以外の印字可能文字）
  if (!/[^A-Za-z0-9]/.test(password)) {
    return false;
  }

  return true;
}

/**
 * パスワード一致バリデーション
 *
 * 2つのパスワード入力値が完全一致するかを確認する。
 *
 * @param {string} password - パスワード
 * @param {string} confirmPassword - 確認用パスワード
 * @returns {boolean} 一致する場合 true、それ以外は false
 */
function validatePasswordMatch(password, confirmPassword) {
  return password === confirmPassword;
}

/**
 * 確認コード形式バリデーション
 *
 * 6桁の数字であることを確認する。
 *
 * @param {string} code - 検証対象の確認コード
 * @returns {boolean} 6桁の数字の場合 true、それ以外は false
 */
function validateVerificationCode(code) {
  // null、undefined、文字列以外は無効
  if (typeof code !== 'string') {
    return false;
  }

  // 6桁の数字のみで構成されていること
  return /^\d{6}$/.test(code);
}

/**
 * 必須フィールド空チェック
 *
 * 値が空文字、undefined、null、ホワイトスペースのみでないことを確認する。
 *
 * @param {*} value - 検証対象の値
 * @returns {boolean} 有効な値（非空）の場合 true、それ以外は false
 */
function validateRequired(value) {
  // undefined または null の場合は無効
  if (value === undefined || value === null) {
    return false;
  }

  // 文字列に変換してトリムし、空でないことを確認
  return String(value).trim().length > 0;
}

/**
 * エラーメッセージ表示
 *
 * 指定されたコンテナ要素にエラーメッセージを表示する。
 * 既存のエラーメッセージがある場合は上書きする。
 *
 * @param {string} containerId - エラーメッセージを表示するコンテナ要素のID
 * @param {string} message - 表示するエラーメッセージ（日本語）
 */
function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  container.textContent = message;
  container.style.display = 'block';
}

/**
 * エラーメッセージクリア
 *
 * 指定されたコンテナ要素のエラーメッセージを消去する。
 *
 * @param {string} containerId - クリア対象のコンテナ要素のID
 */
function clearError(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  container.textContent = '';
  container.style.display = 'none';
}
