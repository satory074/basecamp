// Script to generate summaries for Hatena and Zenn posts using Google's Gemini API
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// 記事URLからカスタムIDを生成する関数
function convertUrlToCustomSchema(url, platform) {
  if (platform === "hatena" && url.includes("hatenablog.com")) {
    // https://xxx.hatenablog.com/entry/2023/04/01/123456 または
    // https://xxx.hatenablog.com/entry/数字ID の形式を処理
    const idMatch = url.match(/\/entry\/(\d+)$/) || url.match(/\/entry\/\d{4}\/\d{2}\/\d{2}\/(\d+)$/);
    if (idMatch && idMatch[1]) {
      return `hatenablog://entry/${idMatch[1]}`;
    }

    // 年月日形式の場合はそのパスを使用
    const datePathMatch = url.match(/\/entry\/(\d{4}\/\d{2}\/\d{2}\/\d+)$/);
    if (datePathMatch) {
      return `hatenablog://entry/${datePathMatch[1]}`;
    }

    // その他のパターン（最後のパスコンポーネントをIDとして使用）
    const lastPathComponent = url.split("/").pop();
    return `hatenablog://entry/${lastPathComponent}`;
  }

  if (platform === "zenn" && url.includes("zenn.dev")) {
    // https://zenn.dev/username/articles/article-id 形式を処理
    const idMatch = url.match(/\/articles\/([^\/]+)$/);
    if (idMatch && idMatch[1]) {
      return `zenn://articles/${idMatch[1]}`;
    }
  }

  if (platform === "github" && url.includes("github.com")) {
    // https://github.com/username/repo 形式を処理
    const repoPath = url.replace("https://github.com/", "");
    return `github://${repoPath}`;
  }

  return url; // 変換できない場合は元のURLを返す
}

// APIから記事を取得する関数
async function fetchPosts() {
  try {
    let allPosts = [];

    // Hatena記事を取得
    try {
      console.log('Fetching Hatena posts...');
      const hatenaResponse = await axios.get('/api/hatena');
      if (hatenaResponse.data && Array.isArray(hatenaResponse.data)) {
        const hatenaPosts = hatenaResponse.data.map(post => ({
          ...post,
          platform: 'hatena'
        }));
        allPosts = [...allPosts, ...hatenaPosts];
        console.log(`Fetched ${hatenaPosts.length} Hatena posts`);
      }
    } catch (error) {
      console.error('Error fetching Hatena posts:', error.message);
    }

    // Zenn記事を取得
    try {
      console.log('Fetching Zenn posts...');
      const zennResponse = await axios.get('/api/zenn');
      if (zennResponse.data && Array.isArray(zennResponse.data)) {
        const zennPosts = zennResponse.data.map(post => ({
          ...post,
          platform: 'zenn'
        }));
        allPosts = [...allPosts, ...zennPosts];
        console.log(`Fetched ${zennPosts.length} Zenn posts`);
      }
    } catch (error) {
      console.error('Error fetching Zenn posts:', error.message);
    }

    return allPosts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Gemini APIで要約を生成する関数
async function generateSummaryWithGemini(post) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    console.log(`Generating summary for: ${post.title}`);

    const response = await axios.post(
      `${endpoint}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `次の記事の内容を日本語で100文字程度に要約してください。専門用語や技術的な情報があれば保持してください。

                タイトル: ${post.title}

                内容: ${post.description || ''}

                要約：`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
        }
      }
    );

    // レスポンスから要約テキストを抽出
    if (response.data.candidates &&
        response.data.candidates.length > 0 &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts.length > 0) {

      return response.data.candidates[0].content.parts[0].text.trim();
    }

    throw new Error('Unexpected response structure from Gemini API');
  } catch (error) {
    console.error(`Error generating summary for ${post.title}:`, error.message);
    return null;
  }
}

// メイン関数
async function main() {
  try {
    // Gemini APIキーが設定されているか確認
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    console.log('Starting summary generation process...');

    // 既存の要約データを読み込む
    let summaries = {};
    try {
      const data = await fs.readFile(path.resolve(__dirname, 'public/data/summaries.json'), 'utf8');
      summaries = JSON.parse(data);
      console.log(`Loaded ${Object.keys(summaries).length} existing summaries`);
    } catch (error) {
      console.log('No existing summaries found or error reading file, creating new file');
    }

    // 記事を取得
    const posts = await fetchPosts();
    console.log(`Fetched ${posts.length} posts total`);

    // 各記事の要約を生成
    for (const post of posts) {
      const customId = convertUrlToCustomSchema(post.url, post.platform);
      console.log(`Processing post: ${post.title} (${customId})`);

      // 既存の要約がなければ生成
      if (!summaries[customId]) {
        console.log(`No existing summary found for: ${post.title}, generating...`);
        const summary = await generateSummaryWithGemini(post);

        if (summary) {
          summaries[customId] = summary;
          console.log(`Summary generated for: ${post.title}`);

          // API呼び出しのレート制限を回避するための遅延
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        console.log(`Using existing summary for: ${post.title}`);
      }
    }

    // 要約データを保存
    await fs.writeFile(
      path.resolve(__dirname, 'public/data/summaries.json'),
      JSON.stringify(summaries, null, 4),
      'utf8'
    );

    console.log('Summaries updated successfully');
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// スクリプトを実行
main();
