import * as cheerio from 'cheerio';
import type { BrunchArticle } from './types';

const BRUNCH_PROFILE = '@103ab3ed4f1f4f6';
const BRUNCH_API_BASE = 'https://api.brunch.co.kr/v1';

export async function fetchArticleList(): Promise<{ title: string; url: string }[]> {
  try {
    const response = await fetch(`${BRUNCH_API_BASE}/article/${BRUNCH_PROFILE}`);
    const data = await response.json();

    if (!data.data || !data.data.list) {
      throw new Error('Invalid API response structure');
    }

    return data.data.list.map((article: any) => ({
      title: article.title,
      url: `https://brunch.co.kr/${article.contentId}`
    }));
  } catch (error) {
    console.error('Failed to fetch article list:', error);
    throw error;
  }
}

export async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract main content
    const content = $('.wrap_body')
      .find('p, h1, h2, h3, h4, li')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 0)
      .join('\n\n');

    return content;
  } catch (error) {
    console.error(`Failed to fetch content from ${url}:`, error);
    throw error;
  }
}

export async function crawlAllArticles(): Promise<BrunchArticle[]> {
  const articleList = await fetchArticleList();

  const articles: BrunchArticle[] = [];

  for (const { title, url } of articleList) {
    try {
      const content = await fetchArticleContent(url);
      articles.push({ title, url, content });

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error);
    }
  }

  return articles;
}
