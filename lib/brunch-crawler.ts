import puppeteer from 'puppeteer';
import type { BrunchArticle } from './types';

const BRUNCH_PROFILE = '@103ab3ed4f1f4f6';
const BRUNCH_API_BASE = 'https://api.brunch.co.kr/v1';

async function fetchArticleContent(url: string, browser: any): Promise<string> {
  const page = await browser.newPage();

  try {
    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Wait for the content to be loaded
    await page.waitForSelector('.wrap_body', { timeout: 10000 });

    // Wait an additional moment for dynamic content
    await page.waitForTimeout(2000);

    // Extract article content from the page
    const content = await page.evaluate(() => {
      // Find the article content
      const contentDiv = document.querySelector('.wrap_body');
      if (!contentDiv) return '';

      // Get all text content with better selectors
      const elements = contentDiv.querySelectorAll('.wrap_item p, .wrap_item h1, .wrap_item h2, .wrap_item h3, .wrap_item h4, .wrap_item li, p.text');
      const textArray: string[] = [];

      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 0) {
          textArray.push(text);
        }
      });

      // If nothing found, try alternative selector
      if (textArray.length === 0) {
        const allText = contentDiv.textContent?.trim();
        if (allText) return allText;
      }

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
        date: article.publishTime ? new Date(article.publishTime).toISOString() : undefined,
        thumbnail: article.articleImageForHome || null,
        subTitle: article.subTitle || undefined
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
