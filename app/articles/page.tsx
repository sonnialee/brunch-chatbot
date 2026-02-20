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

        {/* Article List - 다음 Task에서 구현 */}
        <div className="space-y-4">
          <p className="text-gray-500">글 목록이 여기 표시됩니다</p>
        </div>
      </main>
    </div>
  );
}
