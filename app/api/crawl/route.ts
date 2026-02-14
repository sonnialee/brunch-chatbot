import { NextResponse } from 'next/server';
import { crawlAllArticles } from '@/lib/brunch-crawler';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const articles = await crawlAllArticles();

    // Save to data directory
    const dataDir = path.join(process.cwd(), 'data');

    // Ensure directory exists
    try {
      await mkdir(dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    await writeFile(
      path.join(dataDir, 'articles.json'),
      JSON.stringify(articles, null, 2)
    );

    return NextResponse.json({
      success: true,
      count: articles.length,
      message: 'Articles crawled and saved successfully'
    });
  } catch (error) {
    console.error('Crawl error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to crawl articles' },
      { status: 500 }
    );
  }
}
