# ブクログ取得ジョブ (Cloud Run ジョブ booklog-feed, asia-northeast1)。
# dist/booklog-job.cjs は deploy.sh が scripts/update-booklog-feed.ts を esbuild で 1 ファイルにしたもの。
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY dist/booklog-job.cjs ./
USER node
CMD ["node", "booklog-job.cjs"]
