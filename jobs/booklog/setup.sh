#!/usr/bin/env bash
# ブクログ取得ジョブの GCP 側の準備 (最初の 1 回だけ。2026-11-22 に実行済み)。
#
# 何を通して何を拒むか:
#   - 専用サービスアカウント booklog-job に付けるのは 2 つだけ
#       1. gs://basecamp-feeds/booklog-feed.json 1 ファイルの読み書き
#          (roles/storage.objectUser。IAM 条件でオブジェクト名を固定。他のファイル・他のバケットは不可)
#       2. Cloud Run ジョブ booklog-feed の起動 (roles/run.invoker をジョブ単位で。Scheduler が使う)
#   - プロジェクト単位の権限は付けない。秘密情報 (Discord の Webhook など) は置かない
#   - GitHub Actions のサービスアカウント gha-feed-writer には何も足さない
#
# 費用の目安: 1 日 1 回 × 約 1 分。Cloud Run jobs の単価 $0.000018/vCPU 秒で月 1,800 vCPU 秒 ≈ $0.03
# (無料枠内なら 0)。Scheduler は課金アカウントあたり 3 件まで無料。イメージは最新 2 版だけ残す。
set -euo pipefail
cd "$(dirname "$0")/../.."

PROJECT=basecamp-satory074
REGION=asia-northeast1
SA_NAME=booklog-job
SA="$SA_NAME@$PROJECT.iam.gserviceaccount.com"
BUCKET=basecamp-feeds
OBJECT=booklog-feed.json

gcloud services enable cloudscheduler.googleapis.com --project "$PROJECT"

# イメージ置き場 (最新 2 版を残し、それより古いものは消す)
gcloud artifacts repositories create booklog-job --project "$PROJECT" --location "$REGION" \
    --repository-format docker --description "ブクログ取得ジョブ (jobs/booklog)"
POLICY="$(mktemp)"
cat > "$POLICY" <<'JSON'
[
  { "name": "keep-latest-2", "action": { "type": "Keep" }, "mostRecentVersions": { "keepCount": 2 } },
  { "name": "delete-older", "action": { "type": "Delete" }, "condition": { "tagState": "any", "olderThan": "1d" } }
]
JSON
gcloud artifacts repositories set-cleanup-policies booklog-job --project "$PROJECT" --location "$REGION" \
    --policy "$POLICY" --no-dry-run
rm -f "$POLICY"

gcloud iam service-accounts create "$SA_NAME" --project "$PROJECT" \
    --display-name "Booklog feed job (Cloud Run)" \
    --description "gs://$BUCKET/$OBJECT だけ書ける。jobs/booklog/setup.sh"

gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
    --member "serviceAccount:$SA" --role roles/storage.objectUser \
    --condition "expression=resource.name == \"projects/_/buckets/$BUCKET/objects/$OBJECT\",title=booklog-feed-only,description=booklog-feed.json だけ"

# ジョブ本体 (イメージのビルドとデプロイ)
jobs/booklog/deploy.sh

gcloud run jobs add-iam-policy-binding booklog-feed --project "$PROJECT" --region "$REGION" \
    --member "serviceAccount:$SA" --role roles/run.invoker

# 毎日 08:15 JST (09:00 のサイト再ビルドの前)
gcloud scheduler jobs create http booklog-feed-daily --project "$PROJECT" --location "$REGION" \
    --schedule "15 8 * * *" --time-zone "Asia/Tokyo" \
    --uri "https://run.googleapis.com/v2/projects/$PROJECT/locations/$REGION/jobs/booklog-feed:run" \
    --http-method POST --oauth-service-account-email "$SA" \
    --description "ブクログ取得ジョブを起動 (jobs/booklog/setup.sh)"
