## リアクション上位を投稿するslackボットGASスクリプト

前日18:30～当日18:30間で公開チャンネルのpostのリアクション数上位を投稿します。

GASにこのコードをデプロイし、以下の環境変数をGASプロジェクトのプロパティに設定します。

### CONVERSATIONS_HISTORY_LIMIT
対象とするチャンネルの上限数

### SEND_CHANNEL
結果を投稿するチャンネル

### SLACK_BOT_TOKEN
結果を投稿するbotのトークン

### SLACK_TOKEN
slackのリアクション数を参照するユーザートークン

### TOP_NUM
上位何件を投稿するか
