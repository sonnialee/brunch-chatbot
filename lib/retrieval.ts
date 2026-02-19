import { generateEmbedding, findTopK } from './embedding';
import type { BrunchArticle, ArticleWithEmbedding } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load embeddings from JSON file
 */
export async function loadEmbeddings(): Promise<ArticleWithEmbedding[]> {
  try {
    const embeddingsPath = path.join(process.cwd(), 'data', 'embeddings.json');

    if (!fs.existsSync(embeddingsPath)) {
      console.warn('[Retrieval] embeddings.json not found, falling back to all articles');
      return [];
    }

    const data = fs.readFileSync(embeddingsPath, 'utf-8');
    return JSON.parse(data) as ArticleWithEmbedding[];
  } catch (error) {
    console.error('[Retrieval] Error loading embeddings:', error);
    return [];
  }
}

/**
 * Retrieve top K most relevant articles for a given question
 */
export async function retrieveRelevantArticles(
  question: string,
  k: number = 5
): Promise<BrunchArticle[]> {
  console.log(`[Retrieval] Searching for top ${k} relevant articles...`);

  try {
    // Load pre-computed embeddings
    const articlesWithEmbeddings = await loadEmbeddings();

    // Fallback to empty if no embeddings
    if (articlesWithEmbeddings.length === 0) {
      console.warn('[Retrieval] No embeddings found, returning empty array');
      return [];
    }

    // Generate embedding for the question
    console.log('[Retrieval] Generating question embedding...');
    const questionEmbedding = await generateEmbedding(question);

    // Find top K most similar articles
    console.log('[Retrieval] Computing similarities...');
    const topArticles = findTopK(questionEmbedding, articlesWithEmbeddings, k);

    console.log(`[Retrieval] Found ${topArticles.length} relevant articles`);

    // Remove embeddings before returning
    return topArticles.map(({ embedding, ...article }) => article);
  } catch (error) {
    console.error('[Retrieval] Error retrieving articles:', error);
    return [];
  }
}
