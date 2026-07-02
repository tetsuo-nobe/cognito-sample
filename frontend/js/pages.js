/**
 * ページ描画関数モジュール（スタブ）
 *
 * 各ページのHTML生成・DOM操作・イベントリスナー登録を提供する。
 * 本ファイルはタスク6.3〜6.7で本実装に置き換えられる。
 */

/**
 * サインインページを描画する
 *
 * ユーザー名・パスワード入力フィールド、サインインボタン、
 * サインアップリンクを表示し、認証処理のイベントリスナーを登録する。
 * 要件: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
function renderSignInPage() {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    return;
  }

  // サインインフォームのHTML描画
  appContainer.innerHTML = `
    <div class="page" id="signin-page">
      <h2>サインイン</h2>
      <div class="form-group">
        <label for="signin-username">ユーザー名</label>
        <input type="text" id="signin-username" placeholder="ユーザー名" autocomplete="username" />
      </div>
      <div class="form-group">
        <label for="signin-password">パスワード</label>
        <input type="password" id="signin-password" placeholder="パスワード" autocomplete="current-password" />
      </div>
      <div id="signin-error" class="error-message" style="display: none;"></div>
      <button id="signin-button" class="btn btn-primary">サインイン</button>
      <p class="page-link">
        アカウントをお持ちでない方は <a href="#" id="goto-signup-link">サインアップ</a>
      </p>
    </div>
  `;

  // イベントリスナー登録
  const signinButton = document.getElementById('signin-button');
  const gotoSignupLink = document.getElementById('goto-signup-link');

  // サインインボタンクリック時の処理
  signinButton.addEventListener('click', async function () {
    // エラーメッセージをクリア
    clearError('signin-error');

    // 入力値の取得
    const username = document.getElementById('signin-username').value;
    const password = document.getElementById('signin-password').value;

    // 入力バリデーション（空入力チェック）
    if (!validateRequired(username)) {
      showError('signin-error', 'ユーザー名を入力してください');
      return;
    }
    if (!validateRequired(password)) {
      showError('signin-error', 'パスワードを入力してください');
      return;
    }

    // サインインボタンを無効化
    signinButton.disabled = true;

    try {
      // バックエンドAPIにサインインリクエストを送信
      const result = await apiRequest('/signin', { username: username, password: password });

      if (result.success) {
        // 成功時: トークンを保存してメインページに遷移
        saveTokens(result.tokens);
        navigateTo('#/main');
      } else {
        // 失敗時: エラーメッセージ表示、パスワードクリア、ボタン再有効化
        showError('signin-error', result.error || '認証に失敗しました');
        document.getElementById('signin-password').value = '';
        signinButton.disabled = false;
      }
    } catch (e) {
      // ネットワークエラー等の例外処理
      showError('signin-error', '通信エラーが発生しました。ネットワーク接続を確認してください');
      document.getElementById('signin-password').value = '';
      signinButton.disabled = false;
    }
  });

  // サインアップリンククリック時の処理
  gotoSignupLink.addEventListener('click', function (e) {
    e.preventDefault();
    navigateTo('#/signup');
  });
}

/**
 * サインアップページを描画する
 *
 * ユーザー名、メールアドレス、パスワード、パスワード確認フィールド、サインアップボタン、
 * サインインページへ戻るリンクを描画し、入力バリデーションとAPI呼び出しを行う。
 */
function renderSignUpPage() {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    return;
  }

  appContainer.innerHTML = `
    <div class="page" id="signup-page">
      <h2>サインアップ</h2>
      <form id="signup-form" novalidate>
        <div class="form-group">
          <label for="signup-username">ユーザー名</label>
          <input type="text" id="signup-username" placeholder="ユーザー名" autocomplete="username" />
          <div class="error-message" id="signup-username-error"></div>
        </div>
        <div class="form-group">
          <label for="signup-email">メールアドレス</label>
          <input type="email" id="signup-email" placeholder="example@example.com" autocomplete="email" />
          <div class="error-message" id="signup-email-error"></div>
        </div>
        <div class="form-group">
          <label for="signup-password">パスワード</label>
          <input type="password" id="signup-password" placeholder="パスワードを入力" autocomplete="new-password" />
          <p class="hint">※ 8文字以上、英大文字・英小文字・数字・記号をそれぞれ1文字以上含む</p>
          <div class="error-message" id="signup-password-error"></div>
        </div>
        <div class="form-group">
          <label for="signup-password-confirm">パスワード（確認）</label>
          <input type="password" id="signup-password-confirm" placeholder="パスワードを再入力" autocomplete="new-password" />
          <div class="error-message" id="signup-password-confirm-error"></div>
        </div>
        <div class="error-message" id="signup-general-error"></div>
        <button type="submit" id="signup-button" class="btn btn-primary">サインアップ</button>
      </form>
      <p class="link-text"><a href="#" id="back-to-signin-link">サインインページに戻る</a></p>
    </div>
  `;

  // フォーム送信イベント（サインアップボタンクリック）
  const form = document.getElementById('signup-form');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // エラーメッセージをクリア
    clearError('signup-username-error');
    clearError('signup-email-error');
    clearError('signup-password-error');
    clearError('signup-password-confirm-error');
    clearError('signup-general-error');

    // 入力値を取得
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;

    // バリデーション
    let hasError = false;

    // ユーザー名必須チェック
    if (!validateRequired(username)) {
      showError('signup-username-error', 'ユーザー名を入力してください');
      hasError = true;
    }

    // メールアドレス必須チェック・形式チェック
    if (!validateRequired(email)) {
      showError('signup-email-error', 'メールアドレスを入力してください');
      hasError = true;
    } else if (!validateEmail(email)) {
      showError('signup-email-error', '有効なメールアドレス形式で入力してください');
      hasError = true;
    }

    // パスワード必須チェック・ポリシーチェック
    if (!validateRequired(password)) {
      showError('signup-password-error', 'パスワードを入力してください');
      hasError = true;
    } else if (!validatePassword(password)) {
      showError('signup-password-error', 'パスワードは8文字以上、英大文字・英小文字・数字・記号をそれぞれ1文字以上含めてください');
      hasError = true;
    }

    // パスワード確認必須チェック・一致チェック
    if (!validateRequired(passwordConfirm)) {
      showError('signup-password-confirm-error', 'パスワード（確認）を入力してください');
      hasError = true;
    } else if (!validatePasswordMatch(password, passwordConfirm)) {
      showError('signup-password-confirm-error', 'パスワードが一致しません');
      hasError = true;
    }

    // バリデーションエラーがある場合は処理中断
    if (hasError) {
      return;
    }

    // サインアップボタンを無効化
    const signupButton = document.getElementById('signup-button');
    signupButton.disabled = true;
    signupButton.textContent = '処理中...';

    try {
      // API呼び出し
      const result = await apiRequest('/signup', { username: username, email: email, password: password });

      if (result.success) {
        // 成功時: ユーザー名を保持して検証ページに遷移
        window._signupUsername = username;
        window._signupPassword = password;
        navigateTo('#/verify');
      } else {
        // 失敗時: エラーメッセージを表示し入力内容を保持
        showError('signup-general-error', result.error || 'サインアップに失敗しました');
        signupButton.disabled = false;
        signupButton.textContent = 'サインアップ';
      }
    } catch (error) {
      // 通信エラー時
      showError('signup-general-error', '通信エラーが発生しました。ネットワーク接続を確認してください');
      signupButton.disabled = false;
      signupButton.textContent = 'サインアップ';
    }
  });

  // サインインページへ戻るリンク
  const backLink = document.getElementById('back-to-signin-link');
  backLink.addEventListener('click', function (e) {
    e.preventDefault();
    navigateTo('#/signin');
  });
}

/**
 * 検証ページを描画する
 *
 * 確認コード入力フィールド（6桁数字）、検証ボタン、確認コード再送ボタンを表示し、
 * 検証成功時は自動サインインを実行してMain_Pageに遷移する。
 * 自動サインイン失敗時はSign_In_Pageに遷移し手動サインインを促す。
 *
 * 要件: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
function renderVerificationPage() {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    return;
  }

  appContainer.innerHTML = `
    <div class="page" id="verify-page">
      <h2>確認コード入力</h2>
      <p>登録したメールアドレスに送信された6桁の確認コードを入力してください。</p>
      <form id="verify-form" novalidate>
        <div class="form-group">
          <label for="verification-code">確認コード</label>
          <input type="text" id="verification-code" maxlength="6" pattern="[0-9]{6}" placeholder="123456" inputmode="numeric" autocomplete="one-time-code" />
        </div>
        <div id="verify-error" class="error-message" style="display:none;"></div>
        <div id="verify-info" class="info-message" style="display:none;"></div>
        <button type="submit" id="verify-btn" class="btn btn-primary">検証</button>
        <button type="button" id="resend-btn" class="btn btn-secondary">確認コードを再送</button>
      </form>
    </div>
  `;

  // 要素取得
  const form = document.getElementById('verify-form');
  const codeInput = document.getElementById('verification-code');
  const verifyBtn = document.getElementById('verify-btn');
  const resendBtn = document.getElementById('resend-btn');

  /**
   * 情報メッセージを表示する
   * @param {string} message - 表示するメッセージ
   */
  function showInfo(message) {
    const infoEl = document.getElementById('verify-info');
    if (infoEl) {
      infoEl.textContent = message;
      infoEl.style.display = 'block';
    }
  }

  /**
   * 情報メッセージをクリアする
   */
  function clearInfo() {
    const infoEl = document.getElementById('verify-info');
    if (infoEl) {
      infoEl.textContent = '';
      infoEl.style.display = 'none';
    }
  }

  // 検証ボタンクリック時の処理
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // エラー・情報メッセージをクリア
    clearError('verify-error');
    clearInfo();

    const code = codeInput.value.trim();

    // 確認コード形式バリデーション（6桁数字チェック）
    if (!validateVerificationCode(code)) {
      showError('verify-error', '確認コードは6桁の数字で入力してください。');
      return;
    }

    // 検証ボタンを無効化
    verifyBtn.disabled = true;
    verifyBtn.textContent = '検証中...';

    try {
      // 確認コード検証API呼び出し
      const verifyResult = await apiRequest('/verify', {
        username: window._signupUsername,
        code: code
      });

      if (verifyResult.success) {
        // 検証成功: 自動サインインを実行
        try {
          const signinResult = await apiRequest('/signin', {
            username: window._signupUsername,
            password: window._signupPassword
          });

          if (signinResult.success && signinResult.tokens) {
            // 自動サインイン成功: トークン保存してMain_Pageに遷移
            saveTokens(signinResult.tokens);
            navigateTo('#/main');
          } else {
            // 自動サインイン失敗: Sign_In_Pageに遷移し手動サインインを促す
            window._signinMessage = 'アカウントが有効化されました。サインインしてください。';
            navigateTo('#/signin');
          }
        } catch (signinError) {
          // 自動サインインで通信エラー: Sign_In_Pageに遷移
          window._signinMessage = 'アカウントが有効化されました。サインインしてください。';
          navigateTo('#/signin');
        }
      } else {
        // 検証失敗: エラーメッセージ表示、ボタン再有効化
        showError('verify-error', verifyResult.error || '確認コードの検証に失敗しました。');
        verifyBtn.disabled = false;
        verifyBtn.textContent = '検証';
      }
    } catch (error) {
      // 通信エラー
      showError('verify-error', '通信エラーが発生しました。ネットワーク接続を確認してください。');
      verifyBtn.disabled = false;
      verifyBtn.textContent = '検証';
    }
  });

  // 再送ボタンクリック時の処理
  resendBtn.addEventListener('click', async function () {
    // エラー・情報メッセージをクリア
    clearError('verify-error');
    clearInfo();

    resendBtn.disabled = true;
    resendBtn.textContent = '再送中...';

    try {
      const resendResult = await apiRequest('/resend-code', {
        username: window._signupUsername
      });

      if (resendResult.success) {
        showInfo('確認コードを再送しました。メールを確認してください。');
      } else {
        showError('verify-error', resendResult.error || '確認コードの再送に失敗しました。');
      }
    } catch (error) {
      showError('verify-error', '通信エラーが発生しました。ネットワーク接続を確認してください。');
    } finally {
      resendBtn.disabled = false;
      resendBtn.textContent = '確認コードを再送';
    }
  });
}

/**
 * メインページを描画する
 *
 * IDトークンからユーザー名を取得して表示し、
 * サインアウト・パスワードリセットの操作ボタンを提供する。
 * ユーザー名取得に失敗した場合はサインインページに遷移する。
 */
function renderMainPage() {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    return;
  }

  // IDトークンからユーザー名を取得
  const username = getUsernameFromToken();
  if (!username) {
    // ユーザー情報取得失敗時はサインインページに遷移
    navigateTo('#/signin');
    return;
  }

  // メインページのHTML描画
  appContainer.innerHTML = `
    <div class="page" id="main-page">
      <h2>メインページ</h2>
      <div class="user-info">
        <p>ログイン中: <strong>${username}</strong></p>
      </div>
      <div class="button-group">
        <button id="signout-button" class="btn btn-danger">サインアウト</button>
        <button id="reset-password-button" class="btn btn-secondary">パスワードリセット</button>
      </div>
    </div>
  `;

  // サインアウトボタンのイベントリスナー
  const signoutButton = document.getElementById('signout-button');
  if (signoutButton) {
    signoutButton.addEventListener('click', function () {
      // 確認ダイアログを表示
      const confirmed = confirm('サインアウトしますか？');
      if (confirmed) {
        // OKの場合: トークン全削除 → サインインページに遷移
        clearTokens();
        navigateTo('#/signin');
      }
      // キャンセルの場合: 何もしない（ダイアログが閉じるのみ）
    });
  }

  // パスワードリセットボタンのイベントリスナー
  const resetPasswordButton = document.getElementById('reset-password-button');
  if (resetPasswordButton) {
    resetPasswordButton.addEventListener('click', function () {
      navigateTo('#/reset-password');
    });
  }
}

/**
 * パスワードリセットページを描画する
 *
 * 現在のパスワード、新しいパスワード、新しいパスワード確認フィールド、
 * リセットボタン、キャンセルボタンを表示し、パスワード変更処理のイベントリスナーを登録する。
 * 要件: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */
function renderPasswordResetPage() {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    return;
  }

  // パスワードリセットフォームのHTML描画
  appContainer.innerHTML = `
    <div class="page" id="reset-password-page">
      <h2>パスワード変更</h2>
      <div class="form-group">
        <label for="reset-current-password">現在のパスワード</label>
        <input type="password" id="reset-current-password" placeholder="現在のパスワード" autocomplete="current-password" />
      </div>
      <div class="form-group">
        <label for="reset-new-password">新しいパスワード</label>
        <input type="password" id="reset-new-password" placeholder="新しいパスワード" autocomplete="new-password" />
      </div>
      <div class="form-group">
        <label for="reset-confirm-password">新しいパスワード（確認）</label>
        <input type="password" id="reset-confirm-password" placeholder="新しいパスワード（確認）" autocomplete="new-password" />
      </div>
      <div id="reset-error" class="error-message" style="display: none;"></div>
      <button id="reset-button" class="btn btn-primary">パスワードを変更</button>
      <button id="reset-cancel-button" class="btn btn-secondary">キャンセル</button>
    </div>
  `;

  // イベントリスナー登録
  const resetButton = document.getElementById('reset-button');
  const cancelButton = document.getElementById('reset-cancel-button');

  // リセットボタンクリック時の処理
  resetButton.addEventListener('click', async function () {
    // エラーメッセージをクリア
    clearError('reset-error');

    // 入力値の取得
    const currentPassword = document.getElementById('reset-current-password').value;
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;

    // バリデーション: 空入力チェック
    if (!validateRequired(currentPassword)) {
      showError('reset-error', '現在のパスワードを入力してください');
      return;
    }
    if (!validateRequired(newPassword)) {
      showError('reset-error', '新しいパスワードを入力してください');
      return;
    }
    if (!validateRequired(confirmPassword)) {
      showError('reset-error', '新しいパスワード（確認）を入力してください');
      return;
    }

    // バリデーション: パスワード一致チェック
    if (!validatePasswordMatch(newPassword, confirmPassword)) {
      showError('reset-error', '新しいパスワードが一致しません');
      return;
    }

    // リセットボタンを無効化
    resetButton.disabled = true;

    try {
      // バックエンドAPIにパスワード変更リクエストを送信（アクセストークン使用）
      const result = await apiRequest('/change-password', {
        previous_password: currentPassword,
        new_password: newPassword
      }, { useAccessToken: true });

      if (result.success) {
        // 成功時: セッション削除 → サインインページに遷移
        clearTokens();
        navigateTo('#/signin');
      } else {
        // 失敗時: エラーメッセージ表示、入力内容保持、ボタン再有効化
        showError('reset-error', result.error || 'パスワードの変更に失敗しました');
        resetButton.disabled = false;
      }
    } catch (e) {
      // ネットワークエラー等の例外処理
      showError('reset-error', '通信エラーが発生しました。ネットワーク接続を確認してください');
      resetButton.disabled = false;
    }
  });

  // キャンセルボタンクリック時: メインページに遷移
  cancelButton.addEventListener('click', function () {
    navigateTo('#/main');
  });
}
