import puppeteer from 'puppeteer';
import type { BrunchArticle } from './types';

const BRUNCH_PROFILE = '@103ab3ed4f1f4f6';
const BRUNCH_API_BASE = 'https://api.brunch.co.kr/v1';

async function fetchArticleContent(url: string, browser: any): Promise<string> {
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Extract article content from the page
    const content = await page.evaluate(() => {
      // Try multiple selectors to find the article content
      const contentDiv = document.querySelector('.wrap_body');
      if (!contentDiv) return '';

      // Get all paragraphs and headings
      const elements = contentDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
      const textArray: string[] = [];

      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 0) {
          textArray.push(text);
        }
      });

      return textArray.join('\n\n');
    });

    return content;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return '';
  } finally {
    await page.close();
  }
}

export async function crawlAllArticles(): Promise<BrunchArticle[]> {
  let browser;

  try {
    // Get article list from API
    const response = await fetch(`${BRUNCH_API_BASE}/article/${BRUNCH_PROFILE}`);
    const data = await response.json();

    if (!data.data || !data.data.list) {
      throw new Error('Invalid API response structure');
    }

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const articles: BrunchArticle[] = [];

    // Crawl each article
    for (const article of data.data.list) {
      const url = `https://brunch.co.kr/${article.contentId}`;
      console.log(`Crawling: ${article.title}`);

      const content = await fetchArticleContent(url, browser);

      articles.push({
        title: article.title,
        url: url,
        content: content || article.contentSummary || '',
        date: article.publishTime ? new Date(article.publishTime).toISOString() : undefined
      });

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return articles;
  } catch (error) {
    console.error('Failed to crawl articles:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
