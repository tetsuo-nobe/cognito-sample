# 要件ドキュメント

## はじめに

Amazon Cognito ユーザープールを使用した認証機能を備えたシングルページアプリケーション（SPA）のサンプル実装です。フロントエンドはフレームワークを使用しないシンプルなHTML/CSS/JavaScriptで構成し、バックエンドはAPI Gateway（REST API）とLambda関数（Python 3.13）で構成します。Cognitoのマネージドログインや Amplify UI Library は使用せず、すべての認証UIをフロントエンドアプリとして実装します。

## 用語集

- **SPA**: シングルページアプリケーション。ページ遷移なしに画面を切り替えるWebアプリケーション
- **Cognito_User_Pool**: Amazon Cognitoのユーザープール。ユーザーの登録・認証を管理するサービス
- **App_Client**: Cognitoユーザープールのアプリケーションクライアント。SPAがCognitoと通信するための設定
- **Frontend**: HTML/CSS/JavaScriptで構成されるクライアントサイドのWebアプリケーション
- **Backend**: API GatewayとLambda関数で構成されるサーバーサイドのアプリケーション
- **API_Gateway**: Amazon API Gateway REST API。フロントエンドからのリクエストを受け付けるエンドポイント
- **Lambda_Function**: AWS Lambda関数（Python 3.13ランタイム）。Cognitoとの認証処理を実行する
- **Sign_In_Page**: サインインページ。ユーザーがユーザー名とパスワードでログインする画面
- **Username**: Cognitoユーザープールのユーザー名。サインイン時の識別子として使用
- **Sign_Up_Page**: サインアップページ。新規ユーザーが登録する画面
- **Verification_Page**: 検証ページ。サインアップ時の確認コードを入力する画面
- **Main_Page**: メインページ。サインイン後に表示されるユーザー情報画面
- **Password_Reset_Page**: パスワードリセットページ。パスワードの変更を行う画面
- **Session**: ユーザーのログイン状態を表すトークン群（IDトークン、アクセストークン、リフレッシュトークン）
- **Tokyo_Region**: AWSの東京リージョン（ap-northeast-1）

## 要件

### 要件 1: ページルーティングとナビゲーション

**ユーザーストーリー:** ユーザーとして、認証状態に応じて適切なページに自動遷移したい。ログインしていなければサインインページに、ログインしていればメインページに遷移する。

#### 受け入れ基準

1. WHEN ユーザーがアプリケーションにアクセスした場合、IF localStorageに有効期限内のIDトークンが存在しない場合、THEN THE Frontend SHALL Sign_In_Pageを表示する
2. WHEN ユーザーがアプリケーションにアクセスした場合、IF localStorageに有効期限内のIDトークンが存在する場合、THEN THE Frontend SHALL Main_Pageを表示する
3. THE Frontend SHALL フレームワーク（React等）を使用せず、HTML/CSS/JavaScriptのみで構成する
4. THE Frontend SHALL ページ遷移をSPAとして実現し、URLハッシュまたはHistory APIを用いてブラウザのリロードなしに画面を切り替える
5. WHEN ユーザーがブラウザの戻る・進むボタンを操作した場合、THE Frontend SHALL 現在の認証状態に基づいて適切なページを表示し、未認証状態でMain_Pageへの遷移を許可しない
6. WHILE FrontendがSession有効性を確認している間、THE Frontend SHALL ローディング表示を行い、確認完了後に適切なページへ遷移する

### 要件 2: サインイン機能

**ユーザーストーリー:** 登録済みユーザーとして、ユーザー名とパスワードでサインインしたい。サインインに成功するとメインページが表示される。

#### 受け入れ基準

1. THE Sign_In_Page SHALL ユーザー名入力フィールド、パスワード入力フィールド（マスキング表示）、サインインボタン、サインアップボタンを表示する
2. IF ユーザー名またはパスワードが未入力の状態でサインインボタンがクリックされた場合、THEN THE Frontend SHALL 未入力フィールドを示すエラーメッセージを表示し、認証リクエストを送信しない
3. WHEN ユーザー名とパスワードが入力された状態でユーザーがサインインボタンをクリックした場合、THE Frontend SHALL サインインボタンを無効化し、Backend経由でCognito_User_Poolに認証リクエストを送信する
4. WHEN 認証が成功した場合、THE Frontend SHALL Sessionを保存しMain_Pageに遷移する
5. IF 認証が失敗した場合、THEN THE Frontend SHALL 認証失敗の理由を示すエラーメッセージを日本語で表示し、パスワード入力フィールドをクリアし、サインインボタンを再度有効化する
6. WHEN ユーザーがサインアップボタンをクリックした場合、THE Frontend SHALL Sign_Up_Pageに遷移する

### 要件 3: サインアップ機能

**ユーザーストーリー:** 新規ユーザーとして、ユーザー名、メールアドレス、パスワードでアカウントを作成したい。アカウント作成後に確認コードの検証を行いサインアップを完了する。

#### 受け入れ基準

1. THE Sign_Up_Page SHALL ユーザー名入力フィールド、メールアドレス入力フィールド、パスワード入力フィールド（8文字以上、英大文字・英小文字・数字・記号をそれぞれ1文字以上含む）、パスワード確認入力フィールド、サインアップボタン、Sign_In_Pageへ戻るリンクを表示する
2. IF パスワードとパスワード確認の値が一致しない場合、THEN THE Frontend SHALL サインアップボタンのクリック時にパスワード不一致を示すエラーメッセージをSign_Up_Page上に日本語で表示し、登録リクエストを送信しない
3. IF ユーザー名が未入力、またはメールアドレスが未入力もしくはメールアドレス形式でない場合、THEN THE Frontend SHALL サインアップボタンのクリック時に入力不備を示すエラーメッセージをSign_Up_Page上に日本語で表示し、登録リクエストを送信しない
4. WHEN フロントエンドバリデーションが通過した状態でユーザーがサインアップボタンをクリックした場合、THE Frontend SHALL Backend経由でCognito_User_Poolにユーザー登録リクエストを送信する
5. WHEN ユーザー登録リクエストが成功した場合、THE Frontend SHALL 登録したユーザー名を保持した状態でVerification_Pageに遷移する
6. IF ユーザー登録リクエストが失敗した場合（既に登録済みのユーザー名、パスワードポリシー違反等）、THEN THE Frontend SHALL エラーの内容を示すメッセージをSign_Up_Page上に日本語で表示し、入力内容を保持する

### 要件 4: サインアップ検証機能

**ユーザーストーリー:** サインアップ済みユーザーとして、メールに届いた確認コードを入力してアカウントを有効化したい。検証成功後にメインページに遷移する。

#### 受け入れ基準

1. THE Verification_Page SHALL 確認コード入力フィールド（6桁の数字入力）、検証ボタン、および確認コード再送ボタンを表示する
2. IF ユーザーが確認コード入力フィールドを空のまま、または6桁の数字以外の値で検証ボタンをクリックした場合、THEN THE Frontend SHALL 入力形式の不備を示すエラーメッセージを日本語で表示し、Backendへのリクエストを送信しない
3. WHEN ユーザーが有効な確認コードを入力し検証ボタンをクリックした場合、THE Frontend SHALL 検証ボタンを無効化し、Backend経由でCognito_User_Poolに確認コード検証リクエストを送信する
4. WHEN 確認コード検証が成功した場合、THE Frontend SHALL サインアップ時に保持したユーザー名とパスワードを使用してBackend経由でサインインを実行し、Sessionを保存してMain_Pageに遷移する
5. IF 確認コード検証が失敗した場合、THEN THE Frontend SHALL 検証ボタンを再度有効化し、失敗理由（コード不正、コード期限切れ等）を示すエラーメッセージを日本語で表示する
6. WHEN ユーザーが確認コード再送ボタンをクリックした場合、THE Frontend SHALL Backend経由でCognito_User_Poolに確認コード再送リクエストを送信し、送信結果を日本語でユーザーに通知する
7. IF 自動サインインが失敗した場合、THEN THE Frontend SHALL Sign_In_Pageに遷移し、手動でのサインインを促すメッセージを日本語で表示する

### 要件 5: メインページ表示機能

**ユーザーストーリー:** サインイン済みユーザーとして、自分のユーザー情報を確認し、サインアウトやパスワードリセットの操作を行いたい。

#### 受け入れ基準

1. WHILE 有効なSessionが存在する状態で、THE Main_Page SHALL サインイン中のユーザーのユーザー名をユーザー識別情報として表示する
2. THE Main_Page SHALL サインアウトボタンを表示する
3. THE Main_Page SHALL パスワードリセットボタンを表示する
4. WHEN ユーザーがサインアウトボタンをクリックした場合、THE Main_Page SHALL サインアウト処理を開始する
5. WHEN ユーザーがパスワードリセットボタンをクリックした場合、THE Main_Page SHALL Password_Reset_Pageに遷移する
6. IF Main_Page表示時にSessionからユーザー情報の取得に失敗した場合、THEN THE Frontend SHALL Sign_In_Pageに遷移する

### 要件 6: サインアウト機能

**ユーザーストーリー:** サインイン済みユーザーとして、安全にサインアウトしたい。誤操作を防ぐため確認ダイアログを表示する。

#### 受け入れ基準

1. WHEN ユーザーがサインアウトボタンをクリックした場合、THE Frontend SHALL サインアウトする旨を確認するメッセージとOKボタンおよびキャンセルボタンを含む確認ダイアログを表示する
2. WHEN ユーザーが確認ダイアログでOKを選択した場合、THE Frontend SHALL localStorageに保存されたIDトークン、アクセストークン、リフレッシュトークンをすべて削除する
3. WHEN Sessionの削除が完了した場合、THE Frontend SHALL Sign_In_Pageに遷移する
4. WHEN ユーザーが確認ダイアログでキャンセルを選択した場合、THE Frontend SHALL ダイアログを閉じMain_Pageの表示を維持する
5. IF Sessionの削除処理中にエラーが発生した場合、THEN THE Frontend SHALL localStorageを強制的にクリアしSign_In_Pageに遷移する

### 要件 7: パスワードリセット機能

**ユーザーストーリー:** サインイン済みユーザーとして、パスワードを変更したい。パスワードリセット後は再度サインインが必要になる。

#### 受け入れ基準

1. WHEN ユーザーがパスワードリセットボタンをクリックした場合、THE Frontend SHALL Password_Reset_Pageに遷移する
2. THE Password_Reset_Page SHALL 新しいパスワード入力フィールド、新しいパスワード確認入力フィールド、リセットボタン、キャンセルボタンを表示する
3. IF 新しいパスワード入力フィールドまたは新しいパスワード確認入力フィールドが空の状態でリセットボタンがクリックされた場合、THEN THE Frontend SHALL 未入力項目を示すエラーメッセージを日本語で表示し、パスワード変更リクエストを送信しない
4. IF 新しいパスワード入力フィールドと新しいパスワード確認入力フィールドの値が一致しない場合、THEN THE Frontend SHALL パスワードが一致しないことを示すエラーメッセージを日本語で表示し、パスワード変更リクエストを送信しない
5. WHEN 新しいパスワードと確認パスワードが一致した状態でユーザーがリセットボタンをクリックした場合、THE Frontend SHALL Backend経由でCognito_User_Poolにパスワード変更リクエストを送信する
6. WHEN パスワード変更が成功した場合、THE Frontend SHALL 現在のSessionを削除しSign_In_Pageに遷移する
7. IF パスワード変更リクエストがCognito_User_Poolから拒否された場合、THEN THE Frontend SHALL 失敗理由を示すエラーメッセージを日本語でPassword_Reset_Page上に表示し、入力内容を保持する
8. WHEN ユーザーがキャンセルボタンをクリックした場合、THE Frontend SHALL Main_Pageに遷移する

### 要件 8: バックエンドAPI構成

**ユーザーストーリー:** 開発者として、Cognito認証処理をバックエンドAPIとして実装したい。フロントエンドからのリクエストをAPI Gateway経由でLambda関数で処理する。

#### 受け入れ基準

1. THE API_Gateway SHALL REST APIとしてTokyo_Regionにデプロイする
2. THE Lambda_Function SHALL Python 3.13ランタイムで実行し、タイムアウトを30秒に設定する
3. THE Backend SHALL サインイン（POST: usernameとpasswordを受け付ける）、サインアップ（POST: username、email、passwordを受け付ける）、確認コード検証（POST: usernameとcodeを受け付ける）、確認コード再送（POST: usernameを受け付ける）、パスワードリセット（POST）の5つのエンドポイントを提供し、リクエストおよびレスポンスはすべてJSON形式とする
4. THE Lambda_Function SHALL Cognito_User_Poolとの通信にAWS SDK（boto3）を使用する
5. WHEN Lambda_FunctionがCognito_User_Poolへのリクエストに成功した場合、THE Lambda_Function SHALL HTTPステータスコード200と処理結果をJSON形式で返却する
6. IF Lambda_FunctionでCognitoへのリクエストが失敗した場合、THEN THE Lambda_Function SHALL 認証エラーには401、入力検証エラーには400、サーバー側エラーには500のHTTPステータスコードと、エラー内容を示すメッセージをJSON形式で返却する
7. IF Lambda_Functionが不正なJSON形式のリクエストボディを受信した場合、THEN THE Lambda_Function SHALL HTTPステータスコード400とエラー内容を示すメッセージをJSON形式で返却する

### 要件 9: セキュリティとセッション管理

**ユーザーストーリー:** ユーザーとして、安全にアプリケーションを利用したい。トークンの管理やCORS設定が適切に行われている。

#### 受け入れ基準

1. WHEN 認証が成功しSessionのトークンを受信した場合、THE Frontend SHALL CognitoのIDトークン、アクセストークン、リフレッシュトークンをブラウザのlocalStorageにそれぞれ個別のキーとして保存する
2. THE API_Gateway SHALL CORS設定を有効にし、フロントエンドのオリジンからのGETおよびPOSTメソッドによるクロスオリジンリクエストを許可し、Content-TypeヘッダーおよびAuthorizationヘッダーを許可する
3. IF APIリクエストのレスポンスがトークン無効または期限切れを示すエラーを返した場合、THEN THE Frontend SHALL localStorageからすべてのトークンを削除しSign_In_Pageに遷移する
4. WHEN ユーザーがアプリケーションにアクセスした場合、THE Frontend SHALL localStorageに保存されたトークンの存在を確認し、トークンが存在しない場合はSign_In_Pageを表示する
5. THE Frontend SHALL APIリクエスト時にAuthorizationヘッダーにIDトークンを付与してBackendに送信する

### 要件 10: AWSリージョンと前提条件

**ユーザーストーリー:** 開発者として、東京リージョンで動作するアプリケーションを構築したい。Cognitoユーザープールとアプリケーションクライアントは作成済みの前提で実装する。

#### 受け入れ基準

1. THE Backend SHALL Tokyo_Region（ap-northeast-1）にデプロイする
2. THE Frontend SHALL JavaScriptの設定ファイル1つにてCognito_User_PoolのID、App_ClientのID、およびAPI_GatewayのエンドポイントURLを外部設定可能にし、ソースコードの変更なしに設定値のみの編集でデプロイ先環境を切り替え可能にする
3. WHEN Frontendが読み込まれた際に設定ファイルのCognito_User_PoolのID、App_ClientのID、またはAPI_GatewayのエンドポイントURLのいずれかが空文字または未定義の場合、THE Frontend SHALL 画面上に設定不備を示すエラーメッセージを日本語で表示し、認証操作を無効化する
