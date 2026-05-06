#!/usr/bin/env bash
# AWS Amplify ビルド完了/失敗を Discord webhook に通知する EventBridge ルール構築スクリプト。
#
# 構成:
#   Amplify build event → EventBridge Rule
#                         → API Destination (Discord webhook URL を保持)
#                         → Discord webhook へ POST
#
# Lambda 不要。EventBridge の Input Transformer で Amplify event を Discord embed に変換する。
#
# 関連 AWS リソース:
#   - IAM Role:           basecamp-amplify-discord-events-role
#   - EventBridge Conn:   basecamp-discord-webhook-conn (API_KEY auth, dummy header)
#   - API Destination:    basecamp-discord-webhook (Discord webhook URL を保持)
#   - EventBridge Rule:   basecamp-amplify-build-status (SUCCEED / FAILED のみ)
#
# 使い方:
#   DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...' ./scripts/aws-amplify-discord-notifications.sh create
#   ./scripts/aws-amplify-discord-notifications.sh status
#   ./scripts/aws-amplify-discord-notifications.sh test     # Amplify を 1 回手動 build → Discord 着信確認
#   ./scripts/aws-amplify-discord-notifications.sh delete

set -euo pipefail

ACCOUNT_ID="596973927685"
REGION="ap-northeast-1"
APP_ID="d3t5r6cslebe5k"
BRANCH="main"

ROLE_NAME="basecamp-amplify-discord-events-role"
POLICY_NAME="EventsInvokeApiDestinationPolicy"
CONNECTION_NAME="basecamp-discord-webhook-conn"
API_DEST_NAME="basecamp-discord-webhook"
RULE_NAME="basecamp-amplify-build-status"
TARGET_ID="discord-webhook"

cmd="${1:-status}"

case "$cmd" in
  create)
    if [[ -z "${DISCORD_WEBHOOK_URL:-}" ]]; then
      echo "ERROR: DISCORD_WEBHOOK_URL env var is required for 'create'." >&2
      echo "  e.g.: DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...' $0 create" >&2
      exit 1
    fi

    echo "==> EventBridge Connection 作成 (API_KEY auth, dummy header)"
    CONN_ARN=$(aws events create-connection \
      --name "$CONNECTION_NAME" \
      --authorization-type API_KEY \
      --auth-parameters '{"ApiKeyAuthParameters":{"ApiKeyName":"X-Discord-Forwarder","ApiKeyValue":"ignored"}}' \
      --region "$REGION" \
      --query ConnectionArn --output text)
    echo "    ConnectionArn: $CONN_ARN"

    echo "==> EventBridge API Destination 作成"
    DEST_ARN=$(aws events create-api-destination \
      --name "$API_DEST_NAME" \
      --connection-arn "$CONN_ARN" \
      --invocation-endpoint "$DISCORD_WEBHOOK_URL" \
      --http-method POST \
      --region "$REGION" \
      --query ApiDestinationArn --output text)
    echo "    ApiDestinationArn: $DEST_ARN"

    echo "==> IAM Role 作成 (EventBridge → InvokeApiDestination)"
    aws iam create-role \
      --role-name "$ROLE_NAME" \
      --description "EventBridge role for Amplify build -> Discord webhook forwarding" \
      --assume-role-policy-document "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "events.amazonaws.com" },
    "Action": "sts:AssumeRole",
    "Condition": { "StringEquals": { "aws:SourceAccount": "$ACCOUNT_ID" } }
  }]
}
JSON
)" >/dev/null

    aws iam put-role-policy \
      --role-name "$ROLE_NAME" \
      --policy-name "$POLICY_NAME" \
      --policy-document "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "events:InvokeApiDestination",
    "Resource": "arn:aws:events:$REGION:$ACCOUNT_ID:api-destination/$API_DEST_NAME/*"
  }]
}
JSON
)"

    echo "==> IAM 伝播待ち (10s)"
    sleep 10

    echo "==> EventBridge Rule 作成 (Amplify build SUCCEED/FAILED のみ)"
    aws events put-rule \
      --name "$RULE_NAME" \
      --description "Amplify build SUCCEED/FAILED for $APP_ID/$BRANCH -> Discord" \
      --state ENABLED \
      --region "$REGION" \
      --event-pattern "$(cat <<JSON
{
  "source": ["aws.amplify"],
  "detail-type": ["Amplify Deployment Status Change"],
  "detail": {
    "appId": ["$APP_ID"],
    "branchName": ["$BRANCH"],
    "jobStatus": ["SUCCEED", "FAILED"]
  }
}
JSON
)" >/dev/null

    echo "==> Target 設定 (Input Transformer で Discord embed 生成)"
    TARGETS_FILE=$(mktemp)
    cat > "$TARGETS_FILE" <<JSON
[
  {
    "Id": "$TARGET_ID",
    "Arn": "$DEST_ARN",
    "RoleArn": "arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME",
    "InputTransformer": {
      "InputPathsMap": {
        "status": "\$.detail.jobStatus",
        "branch": "\$.detail.branchName",
        "jobId": "\$.detail.jobId",
        "appId": "\$.detail.appId"
      },
      "InputTemplate": "{\"username\":\"AWS Amplify\",\"embeds\":[{\"title\":\"Amplify build <status>\",\"url\":\"https://$REGION.console.aws.amazon.com/amplify/apps/<appId>/branches/<branch>/deployments/<jobId>\",\"fields\":[{\"name\":\"branch\",\"value\":\"<branch>\",\"inline\":true},{\"name\":\"jobId\",\"value\":\"<jobId>\",\"inline\":true}]}]}"
    }
  }
]
JSON
    aws events put-targets \
      --rule "$RULE_NAME" \
      --region "$REGION" \
      --targets "file://$TARGETS_FILE" >/dev/null
    rm -f "$TARGETS_FILE"

    echo "==> 完了。次回 Amplify ビルド完了/失敗時に Discord に通知が飛びます。"
    echo "    疎通確認は: $0 test"
    ;;

  delete)
    echo "==> Target / Rule 削除"
    aws events remove-targets --rule "$RULE_NAME" --ids "$TARGET_ID" --region "$REGION" >/dev/null 2>&1 || true
    aws events delete-rule --name "$RULE_NAME" --region "$REGION" >/dev/null 2>&1 || true

    echo "==> API Destination 削除"
    aws events delete-api-destination --name "$API_DEST_NAME" --region "$REGION" >/dev/null 2>&1 || true

    echo "==> Connection 削除"
    aws events delete-connection --name "$CONNECTION_NAME" --region "$REGION" >/dev/null 2>&1 || true

    echo "==> Role policy / Role 削除"
    aws iam delete-role-policy --role-name "$ROLE_NAME" --policy-name "$POLICY_NAME" >/dev/null 2>&1 || true
    aws iam delete-role --role-name "$ROLE_NAME" >/dev/null 2>&1 || true

    echo "==> 撤去完了"
    ;;

  status)
    echo "==> EventBridge Rule"
    aws events describe-rule --name "$RULE_NAME" --region "$REGION" \
      --query '{name:Name,state:State,pattern:EventPattern}' --output json 2>/dev/null \
      || echo "(Rule 未作成)"
    echo
    echo "==> Targets"
    aws events list-targets-by-rule --rule "$RULE_NAME" --region "$REGION" \
      --query 'Targets[].{id:Id,arn:Arn}' --output table 2>/dev/null \
      || echo "(Targets なし)"
    echo
    echo "==> API Destination"
    aws events describe-api-destination --name "$API_DEST_NAME" --region "$REGION" \
      --query '{name:Name,state:ApiDestinationState,endpoint:InvocationEndpoint}' --output json 2>/dev/null \
      || echo "(API Destination 未作成)"
    echo
    echo "==> Connection"
    aws events describe-connection --name "$CONNECTION_NAME" --region "$REGION" \
      --query '{name:Name,state:ConnectionState}' --output json 2>/dev/null \
      || echo "(Connection 未作成)"
    ;;

  test)
    echo "==> Amplify を 1 回手動 build → 完了時に Discord に SUCCEED 通知が来るか確認"
    aws amplify start-job \
      --app-id "$APP_ID" \
      --branch-name "$BRANCH" \
      --job-type RELEASE \
      --job-reason "Discord notification connectivity test" \
      --region "$REGION" \
      --query 'jobSummary.{jobId:jobId,status:status}' \
      --output json
    echo "==> ビルド完了 (~3-4 min) を待って Discord を確認してください"
    ;;

  *)
    echo "Usage: DISCORD_WEBHOOK_URL=... $0 {create|delete|status|test}" >&2
    exit 2
    ;;
esac
