import type { BrunchArticle } from './types';

const BRUNCH_PROFILE = '@103ab3ed4f1f4f6';
const BRUNCH_API_BASE = 'https://api.brunch.co.kr/v1';

export async function crawlAllArticles(): Promise<BrunchArticle[]> {
  try {
    const response = await fetch(`${BRUNCH_API_BASE}/article/${BRUNCH_PROFILE}`);
    const data = await response.json();

    if (!data.data || !data.data.list) {
      throw new Error('Invalid API response structure');
    }

    // Map articles with contentSummary
    const articles: BrunchArticle[] = data.data.list.map((article: any) => ({
      title: article.title,
      url: `https://brunch.co.kr/${article.contentId}`,
      content: article.contentSummary || '',
      date: article.publishTime ? new Date(article.publishTime).toISOString() : undefined
    }));

    return articles;
  } catch (error) {
    console.error('Failed to crawl articles:', error);
    throw error;
  }
}
