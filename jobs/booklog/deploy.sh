#!/usr/bin/env bash
# ブクログ取得ジョブを作り直してデプロイする。
# scripts/update-booklog-feed.ts か scripts/lib/booklog/・feed-storage.ts・discord-notification.ts を変えたら、
# main にマージしてから実行する (GitHub Actions はブクログの bot チェックで本棚が読めないので Cloud Run で動かしている)。
# 初回の GCP の準備 (サービスアカウント・権限・Scheduler) は setup.sh。
set -euo pipefail
cd "$(dirname "$0")/../.."

PROJECT=basecamp-satory074
REGION=asia-northeast1
SA="booklog-job@$PROJECT.iam.gserviceaccount.com"

# 作りかけの変更をデプロイしない (イメージのタグ = コミット)
if [ -n "$(git status --porcelain -- scripts package.json package-lock.json jobs)" ]; then
    echo "scripts/ jobs/ package*.json に未コミットの変更があるのでデプロイしない" >&2
    exit 1
fi
IMAGE="$REGION-docker.pkg.dev/$PROJECT/booklog-job/booklog-feed:$(git rev-parse --short HEAD)"

# npx は使わない (nvm の遅延読み込みだと bash から見えない)。esbuild はネイティブバイナリ
node_modules/.bin/esbuild scripts/update-booklog-feed.ts --bundle --platform=node --target=node22 --format=cjs \
    --outfile=jobs/booklog/dist/booklog-job.cjs --log-level=warning
gcloud builds submit jobs/booklog --project "$PROJECT" --region "$REGION" --tag "$IMAGE"
gcloud run jobs deploy booklog-feed --project "$PROJECT" --region "$REGION" --image "$IMAGE" \
    --service-account "$SA" \
    --set-env-vars GCS_BUCKET=basecamp-feeds \
    --cpu 1 --memory 512Mi --task-timeout 300s --max-retries 1
echo "デプロイ済み: $IMAGE"
echo "手動で 1 回動かす: gcloud run jobs execute booklog-feed --project $PROJECT --region $REGION --wait"
