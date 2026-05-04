#!/usr/bin/env bash
# AWS Amplify の日次 1 回スケジュール再ビルドを構築するスクリプト。
#
# 背景:
# 8 本の cron workflow が data-only commit を main に push する運用 ([skip-cd] 付き)。
# Amplify は [skip-cd] commit のビルドを skip するため、サイトに表示される JSON
# (public/data/*.json は SSR Lambda にバンドルされる) が古いビルド時点で凍結する。
# これを防ぐため、JST 00:30 (diary が JST 23:59 commit する 31 分後) に Amplify を
# 1 日 1 回だけ rebuild する EventBridge Scheduler を構築する。
#
# 月コスト試算:
# - 1 ビルド ≈ 3.3 分 × $0.01/min = $0.033
# - 30 ビルド/月 = $0.99 (≈ ¥150) — 旧 $44.54 から 97.8% 削減
#
# 使い方:
#   ./scripts/aws-scheduled-build.sh create   # 構築 (1 回だけ実行)
#   ./scripts/aws-scheduled-build.sh delete   # 撤去
#   ./scripts/aws-scheduled-build.sh status   # 状態確認
#   ./scripts/aws-scheduled-build.sh test     # 即時 1 回手動実行（疎通テスト）

set -euo pipefail

ACCOUNT_ID="596973927685"
REGION="ap-northeast-1"
APP_ID="d3t5r6cslebe5k"
BRANCH="main"
ROLE_NAME="basecamp-amplify-scheduler-role"
POLICY_NAME="AmplifyStartJobPolicy"
SCHEDULE_NAME="basecamp-daily-amplify-build"
# UTC 15:30 = JST 00:30 (毎日)
CRON="cron(30 15 * * ? *)"

cmd="${1:-status}"

case "$cmd" in
  create)
    echo "==> IAM role 作成"
    aws iam create-role \
      --role-name "$ROLE_NAME" \
      --description "EventBridge Scheduler role to trigger Amplify daily build for basecamp" \
      --assume-role-policy-document "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "scheduler.amazonaws.com" },
    "Action": "sts:AssumeRole",
    "Condition": { "StringEquals": { "aws:SourceAccount": "$ACCOUNT_ID" } }
  }]
}
JSON
)"

    echo "==> 権限ポリシー attach"
    aws iam put-role-policy \
      --role-name "$ROLE_NAME" \
      --policy-name "$POLICY_NAME" \
      --policy-document "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "amplify:StartJob",
    "Resource": "arn:aws:amplify:$REGION:$ACCOUNT_ID:apps/$APP_ID/branches/$BRANCH/jobs/*"
  }]
}
JSON
)"

    echo "==> EventBridge Schedule 作成"
    aws scheduler create-schedule \
      --name "$SCHEDULE_NAME" \
      --schedule-expression "$CRON" \
      --schedule-expression-timezone "UTC" \
      --description "Daily 1x Amplify rebuild at JST 00:30 to refresh content frozen by [skip-cd] cron commits" \
      --flexible-time-window '{"Mode":"OFF"}' \
      --target "{
        \"Arn\": \"arn:aws:scheduler:::aws-sdk:amplify:startJob\",
        \"RoleArn\": \"arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME\",
        \"Input\": \"{\\\"AppId\\\":\\\"$APP_ID\\\",\\\"BranchName\\\":\\\"$BRANCH\\\",\\\"JobType\\\":\\\"RELEASE\\\",\\\"JobReason\\\":\\\"Daily scheduled rebuild for content freshness\\\"}\"
      }"

    echo "==> 完了。次回発火: 翌日 JST 00:30 (UTC 15:30)"
    ;;

  delete)
    echo "==> Schedule 削除"
    aws scheduler delete-schedule --name "$SCHEDULE_NAME" || true
    echo "==> Role policy 削除"
    aws iam delete-role-policy --role-name "$ROLE_NAME" --policy-name "$POLICY_NAME" || true
    echo "==> Role 削除"
    aws iam delete-role --role-name "$ROLE_NAME" || true
    echo "==> 撤去完了"
    ;;

  status)
    echo "==> Schedule 状態"
    aws scheduler get-schedule --name "$SCHEDULE_NAME" \
      --query '{name:Name,state:State,cron:ScheduleExpression,tz:ScheduleExpressionTimezone}' \
      --output table || echo "(Schedule 未作成)"
    echo
    echo "==> 直近の Amplify ビルドジョブ (最新 5)"
    aws amplify list-jobs --app-id "$APP_ID" --branch-name "$BRANCH" --max-items 5 \
      --query 'jobSummaries[].{jobId:jobId,status:status,start:startTime,reason:jobReason}' \
      --output table
    ;;

  test)
    echo "==> 手動でビルドを 1 回トリガー (疎通テスト)"
    aws amplify start-job \
      --app-id "$APP_ID" \
      --branch-name "$BRANCH" \
      --job-type RELEASE \
      --job-reason "Manual test trigger from aws-scheduled-build.sh" \
      --query 'jobSummary.{jobId:jobId,status:status}' \
      --output json
    ;;

  *)
    echo "Usage: $0 {create|delete|status|test}" >&2
    exit 2
    ;;
esac
