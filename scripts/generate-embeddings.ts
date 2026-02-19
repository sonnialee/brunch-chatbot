import * as fs from 'fs';
import * as path from 'path';
import { generateEmbedding } from '../lib/embedding';
import type { BrunchArticle, ArticleWithEmbedding } from '../lib/types';

async function generateEmbeddings() {
  console.log('[Generate] Starting embedding generation...');

  // Load articles
  const articlesPath = path.join(process.cwd(), 'data', 'articles.json');

  if (!fs.existsSync(articlesPath)) {
    console.error('[Generate] ERROR: data/articles.json not found!');
    process.exit(1);
  }

  const articlesData = fs.readFileSync(articlesPath, 'utf-8');
  const articles: BrunchArticle[] = JSON.parse(articlesData);

  console.log(`[Generate] Loaded ${articles.length} articles`);

  // Generate embeddings for each article
  const articlesWithEmbeddings: ArticleWithEmbedding[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`[Generate] Processing ${i + 1}/${articles.length}: ${article.title}`);

    try {
      // Use title + content for better semantic representation
      const textToEmbed = `${article.title}\n\n${article.content}`;
      const embedding = await generateEmbedding(textToEmbed);

      articlesWithEmbeddings.push({
        ...article,
        embedding
      });

      console.log(`[Generate] ✓ Embedding generated (${embedding.length} dimensions)`);
    } catch (error) {
      console.error(`[Generate] ✗ Failed to generate embedding for: ${article.title}`);
      console.error(error);
      process.exit(1);
    }
  }

  // Save embeddings to JSON
  const embeddingsPath = path.join(process.cwd(), 'data', 'embeddings.json');
  fs.writeFileSync(
    embeddingsPath,
    JSON.stringify(articlesWithEmbeddings, null, 2),
    'utf-8'
  );

  console.log(`[Generate] ✓ Embeddings saved to ${embeddingsPath}`);
  console.log(`[Generate] Total: ${articlesWithEmbeddings.length} articles with embeddings`);
}

// Run the script
generateEmbeddings()
  .then(() => {
    console.log('[Generate] ✓ Embedding generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Generate] ✗ Embedding generation failed:', error);
    process.exit(1);
  });
