/**
 * SPAルーター・アプリケーション初期化モジュール
 *
 * ハッシュベースのルーティングによる画面切り替え、
 * 初期化処理（設定バリデーション → トークンチェック → ページ遷移）を管理する。
 */

/**
 * ページマッピング定義
 * ハッシュパスと対応するページ描画関数・認証要否を管理する
 */
const routes = {
  '#/signin': {
    render: () => renderSignInPage(),
    requiresAuth: false
  },
  '#/signup': {
    render: () => renderSignUpPage(),
    requiresAuth: false
  },
  '#/verify': {
    render: () => renderVerificationPage(),
    requiresAuth: false
  },
  '#/main': {
    render: () => renderMainPage(),
    requiresAuth: true
  },
  '#/reset-password': {
    render: () => renderPasswordResetPage(),
    requiresAuth: true
  }
};

/**
 * 認証不要ページのハッシュ一覧
 * 認証済みユーザーがこれらのページにアクセスした場合、#/main にリダイレクトする
 */
const guestOnlyPages = ['#/signin', '#/signup'];

/**
 * 認証必要ページのハッシュ一覧
 * 未認証ユーザーがこれらのページにアクセスした場合、#/signin にリダイレクトする
 */
const authRequiredPages = ['#/main', '#/reset-password'];

/**
 * ローディング表示を描画する
 * トークン確認中にユーザーに待機状態を伝える
 */
function showLoading() {
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.innerHTML = `
      <div class="loading">
        <p>読み込み中...</p>
      </div>
    `;
  }
}

/**
 * 指定されたハッシュパスに遷移する
 * @param {string} hash - 遷移先のハッシュパス（例: '#/signin'）
 */
function navigateTo(hash) {
  window.location.hash = hash;
}

/**
 * ルーティング処理
 * 現在のハッシュに基づいて適切なページを描画する。
 * 認証状態に応じたリダイレクト（ルーティングガード）も実施する。
 */
function handleRoute() {
  const hash = window.location.hash || '#/signin';
  const route = routes[hash];

  // 未定義のルートはサインインページにリダイレクト
  if (!route) {
    navigateTo('#/signin');
    return;
  }

  // 認証状態を取得
  const authenticated = isAuthenticated();

  // ルーティングガード: 認証必要ページに未認証でアクセスした場合
  if (route.requiresAuth && !authenticated) {
    navigateTo('#/signin');
    return;
  }

  // ルーティングガード: 認証不要ページ（サインイン/サインアップ）に認証済みでアクセスした場合
  if (guestOnlyPages.includes(hash) && authenticated) {
    navigateTo('#/main');
    return;
  }

  // ページ描画
  route.render();
}

/**
 * アプリケーション初期化処理
 * 設定バリデーション → トークンチェック → 適切なページへの遷移を行う
 */
function initApp() {
  // 1. 設定バリデーション
  if (!initConfigValidation()) {
    // 設定エラーが表示されるため、ここで処理を終了
    return;
  }

  // 2. ローディング表示（トークン確認中）
  showLoading();

  // 3. トークンの存在と有効性を確認し、適切なページに遷移
  const authenticated = isAuthenticated();
  const currentHash = window.location.hash;

  if (!currentHash || !routes[currentHash]) {
    // ハッシュが未設定または無効な場合、認証状態に基づいて初期ページを決定
    if (authenticated) {
      navigateTo('#/main');
    } else {
      navigateTo('#/signin');
    }
  } else {
    // 現在のハッシュが有効な場合、ルーティング処理を実行
    handleRoute();
  }

  // 4. hashchange イベント監視を開始（ブラウザの戻る・進むにも対応）
  window.addEventListener('hashchange', handleRoute);
}

// DOMContentLoaded でアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initApp);
