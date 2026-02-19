import { pipeline, env } from '@xenova/transformers';

// Disable local model cache in development
env.cacheDir = './.cache/transformers';

let embeddingPipeline: any = null;

/**
 * Initialize the embedding pipeline (lazy loading)
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('[Embedding] Loading model...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('[Embedding] Model loaded');
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a given text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getEmbeddingPipeline();
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error('[Embedding] Error generating embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Find top K most similar items
 */
export function findTopK<T>(
  queryEmbedding: number[],
  items: Array<T & { embedding: number[] }>,
  k: number
): T[] {
  const similarities = items.map(item => ({
    item,
    similarity: cosineSimilarity(queryEmbedding, item.embedding)
  }));

  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, k).map(s => s.item);
}
