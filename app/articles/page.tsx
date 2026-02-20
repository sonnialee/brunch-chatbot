import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import type { BrunchArticle } from '@/lib/types';

function loadArticles(): BrunchArticle[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'articles.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const articles: BrunchArticle[] = JSON.parse(fileContent);

    // 날짜 역순 정렬 (최신 글 먼저)
    return articles.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  } catch (error) {
    console.error('Failed to load articles:', error);
    return [];
  }
}

export default function ArticlesPage() {
  const articles = loadArticles();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← 채팅으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            시영님의 브런치 글
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-gray-600 mb-6">
          📝 전체 글 ({articles.length}개)
        </p>

        {/* Article List */}
        <div className="space-y-4">
          {articles.map((article) => (
            <a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* Thumbnail */}
                <div className="w-full md:w-32 h-32 flex-shrink-0">
                  {article.thumbnail ? (
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">📝</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h2>
                  {article.subTitle && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                      {article.subTitle}
                    </p>
                  )}
                  {article.date && (
                    <p className="text-sm text-gray-500">
                      {new Date(article.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
