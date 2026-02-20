# 브런치 글 목록 페이지 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 브런치 글 목록을 표시하는 `/articles` 페이지를 추가하고, 썸네일 이미지를 포함한 매력적인 UI를 구현합니다.

**Architecture:** 기존 `articles.json`에 썸네일 필드를 추가하고, Server Component로 글 목록 페이지를 구현합니다. 크롤러를 수정하여 브런치 API에서 썸네일 정보를 추출합니다.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Puppeteer

---

## Task 1: TypeScript 타입 업데이트

**Files:**
- Modify: `lib/types.ts`

**Step 1: BrunchArticle 타입에 thumbnail과 subTitle 필드 추가**

```typescript
export interface BrunchArticle {
  title: string;
  url: string;
  content: string;
  date?: string;
  thumbnail?: string | null;  // 새로 추가
  subTitle?: string;          // 새로 추가
}
```

**Step 2: 파일 저장 확인**

Run: `cat lib/types.ts`
Expected: thumbnail과 subTitle 필드가 추가된 interface 확인

**Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add thumbnail and subTitle to BrunchArticle type

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 브런치 크롤러 수정

**Files:**
- Modify: `lib/brunch-crawler.ts`

**Step 1: API에서 thumbnail 추출 로직 추가**

`crawlAllArticles` 함수에서 articles 배열에 데이터를 추가하는 부분을 수정:

```typescript
articles.push({
  title: article.title,
  url: url,
  content: content || article.contentSummary || '',
  date: article.publishTime ? new Date(article.publishTime).toISOString() : undefined,
  thumbnail: article.articleImageForHome || null,
  subTitle: article.subTitle || undefined
});
```

**Step 2: 파일 저장 및 확인**

Run: `cat lib/brunch-crawler.ts | grep -A 10 "articles.push"`
Expected: thumbnail과 subTitle 필드가 추가된 것 확인

**Step 3: Commit**

```bash
git add lib/brunch-crawler.ts
git commit -m "feat: extract thumbnail and subTitle from Brunch API

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 크롤링 재실행

**Files:**
- Modify: `data/articles.json` (자동 생성)

**Step 1: 개발 서버 실행**

```bash
npm run dev
```

Expected: Server running on http://localhost:3000

**Step 2: 크롤링 API 호출**

새 터미널에서:
```bash
curl http://localhost:3000/api/crawl
```

Expected: `{"success":true,"count":26,"message":"Articles crawled and saved successfully"}`

**Step 3: articles.json 확인**

```bash
cat data/articles.json | head -30
```

Expected: thumbnail과 subTitle 필드가 포함된 JSON 확인

**Step 4: Commit**

```bash
git add data/articles.json
git commit -m "data: update articles.json with thumbnails

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 글 목록 페이지 생성 - 기본 구조

**Files:**
- Create: `app/articles/page.tsx`

**Step 1: 디렉토리 생성**

```bash
mkdir -p app/articles
```

**Step 2: 기본 Server Component 작성**

`app/articles/page.tsx`:

```tsx
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import type { BrunchArticle } from '@/lib/types';

function loadArticles(): BrunchArticle[] {
  const filePath = path.join(process.cwd(), 'data', 'articles.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const articles: BrunchArticle[] = JSON.parse(fileContent);

  // 날짜 역순 정렬 (최신 글 먼저)
  return articles.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
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
```

**Step 3: 브라우저에서 확인**

Visit: http://localhost:3000/articles
Expected: 헤더와 "전체 글 (N개)" 표시

**Step 4: Commit**

```bash
git add app/articles/page.tsx
git commit -m "feat: create articles page with basic layout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 글 목록 페이지 - 카드 UI 구현

**Files:**
- Modify: `app/articles/page.tsx`

**Step 1: 글 목록 렌더링 추가**

`<div className="space-y-4">` 부분을 다음으로 교체:

```tsx
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
```

**Step 2: 브라우저에서 확인**

Visit: http://localhost:3000/articles
Expected:
- 모든 글이 카드 형태로 표시
- 썸네일 이미지 표시 (없으면 플레이스홀더)
- 제목, 부제목, 날짜 표시
- 최신 글이 위에 표시

**Step 3: 카드 클릭 테스트**

Action: 아무 글 카드 클릭
Expected: 브런치 사이트가 새 탭에서 열림

**Step 4: Commit**

```bash
git add app/articles/page.tsx
git commit -m "feat: implement article cards with thumbnails

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: 메인 페이지에 브런치 글 링크 추가

**Files:**
- Modify: `app/page.tsx`

**Step 1: 헤더 부분 수정**

기존 헤더 부분을 찾아서:

```tsx
<header className="bg-white border-b border-gray-200 px-6 py-4">
  <h1 className="text-2xl font-bold text-gray-900">
    셩PM의 브런치 조언 봇
  </h1>
  <p className="text-sm text-gray-600 mt-1">
    이직, 이력서, AI 활용에 대한 조언을 받아보세요
  </p>
</header>
```

다음으로 교체:

```tsx
<header className="bg-white border-b border-gray-200 px-6 py-4">
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        셩PM의 브런치 조언 봇
      </h1>
      <p className="text-sm text-gray-600 mt-1">
        이직, 이력서, AI 활용에 대한 조언을 받아보세요
      </p>
    </div>
    <Link
      href="/articles"
      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
    >
      📝 브런치 글
    </Link>
  </div>
</header>
```

**Step 2: Link import 추가**

파일 상단에 Link import가 없다면 추가:

```tsx
import Link from 'next/link';
```

**Step 3: 브라우저에서 확인**

Visit: http://localhost:3000
Expected:
- 헤더 오른쪽에 "📝 브런치 글" 버튼 표시
- 버튼 클릭 시 /articles 페이지로 이동

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add brunch articles link to main page header

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: 반응형 디자인 개선

**Files:**
- Modify: `app/articles/page.tsx`

**Step 1: 모바일 레이아웃 개선**

썸네일 부분을 다음으로 수정:

```tsx
{/* Thumbnail */}
<div className="w-full md:w-32 h-48 md:h-32 flex-shrink-0">
  {article.thumbnail ? (
    <img
      src={article.thumbnail}
      alt={article.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <span className="text-gray-400 text-2xl md:text-sm">📝</span>
    </div>
  )}
</div>
```

**Step 2: 모바일에서 확인**

브라우저 개발자 도구에서 모바일 뷰포트로 전환:
- 375px (iPhone SE)
- 768px (Tablet)
- 1280px (Desktop)

Expected:
- 모바일: 썸네일이 위, 텍스트가 아래 (세로 레이아웃)
- 데스크탑: 썸네일이 왼쪽, 텍스트가 오른쪽 (가로 레이아웃)

**Step 3: Commit**

```bash
git add app/articles/page.tsx
git commit -m "feat: improve responsive layout for mobile

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: 메타데이터 추가

**Files:**
- Modify: `app/articles/page.tsx`

**Step 1: 메타데이터 export 추가**

파일 상단에 metadata export 추가:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '브런치 글 목록 | 셩PM의 브런치 조언 봇',
  description: '시영님의 브런치 글 모음입니다. 이직, 커리어, PM, AI 활용에 대한 다양한 이야기를 확인하세요.',
};
```

**Step 2: 브라우저에서 확인**

Visit: http://localhost:3000/articles
브라우저 탭 제목 확인
Expected: "브런치 글 목록 | 셩PM의 브런치 조언 봇"

**Step 3: Commit**

```bash
git add app/articles/page.tsx
git commit -m "feat: add metadata to articles page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: 최종 테스트

**Step 1: 전체 페이지 테스트**

1. 메인 페이지 (http://localhost:3000)
   - [ ] 채팅 기능 정상 작동
   - [ ] "브런치 글" 링크 표시
   - [ ] 클릭 시 /articles로 이동

2. 글 목록 페이지 (http://localhost:3000/articles)
   - [ ] 모든 글이 최신순으로 표시
   - [ ] 썸네일 이미지 정상 표시
   - [ ] 이미지 없는 글은 플레이스홀더 표시
   - [ ] 제목, 부제목, 날짜 표시
   - [ ] 카드 호버 시 스타일 변경
   - [ ] "채팅으로" 링크 클릭 시 메인으로 이동

3. 글 링크 테스트
   - [ ] 글 카드 클릭 시 브런치 사이트 새 탭 열림
   - [ ] 올바른 글로 이동

**Step 2: 반응형 테스트**

브라우저 개발자 도구에서 다양한 뷰포트 테스트:
- [ ] 375px (모바일): 세로 레이아웃
- [ ] 768px (태블릿): 가로 레이아웃 전환
- [ ] 1280px (데스크탑): 가로 레이아웃

**Step 3: 빌드 테스트**

```bash
npm run build
```

Expected: 빌드 성공, 에러 없음

**Step 4: 프로덕션 서버 테스트**

```bash
npm start
```

Visit: http://localhost:3000
Expected: 프로덕션 모드에서도 정상 작동

---

## Task 10: README 업데이트

**Files:**
- Modify: `README.md`

**Step 1: 프로젝트 구조 섹션 업데이트**

```markdown
## 프로젝트 구조

```
brunch-chatbot/
├── app/
│   ├── page.tsx              # 채팅 UI
│   ├── articles/
│   │   └── page.tsx          # 브런치 글 목록 (신규)
│   ├── layout.tsx            # 레이아웃
│   ├── globals.css           # 글로벌 스타일
│   └── api/
│       ├── chat/route.ts     # 채팅 API
│       └── crawl/route.ts    # 크롤링 API
├── lib/
│   ├── brunch-crawler.ts     # 브런치 크롤러 (썸네일 지원)
│   ├── claude-client.ts      # Claude API 클라이언트
│   └── types.ts              # 타입 정의
├── data/
│   ├── articles.json         # 크롤링된 글 데이터 (썸네일 포함)
│   └── embeddings.json       # 임베딩 데이터
└── docs/
    └── plans/                # 디자인 & 구현 계획
```
```

**Step 2: 주요 기능 섹션에 추가**

```markdown
## ✨ 주요 기능

- ✅ **브런치 글 20개 기반** - 실제 경험과 노하우 반영
- ✅ **브런치 글 목록** - 썸네일과 함께 모든 글 확인 가능
- ✅ **자연스러운 대화** - 실제 카톡 대화 패턴 분석 반영
- ✅ **진중한 말투** - 전문적이면서도 친근한 커리어 상담 톤
- ✅ **실시간 채팅** - 빠른 응답 속도
- ✅ **대화 히스토리** - 이전 대화 맥락 유지
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README with articles page feature

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: 최종 커밋 및 배포 준비

**Step 1: 모든 변경사항 확인**

```bash
git status
git log --oneline -10
```

Expected: 모든 변경사항이 커밋됨

**Step 2: 배포 전 체크리스트**

- [ ] 로컬에서 빌드 성공 (`npm run build`)
- [ ] 모든 페이지 정상 작동
- [ ] 반응형 레이아웃 확인
- [ ] 브런치 링크 정상 작동
- [ ] 메타데이터 확인

**Step 3: 배포 가이드 출력**

배포 시 필요한 작업:

```markdown
## 배포 후 작업

### 1. Vercel 배포
```bash
git push origin main
```

### 2. 프로덕션 크롤링 재실행
```bash
curl https://your-app.vercel.app/api/crawl
```

### 3. 임베딩 재생성
```bash
npm run generate-embeddings
git add data/embeddings.json
git commit -m "data: regenerate embeddings with new articles"
git push
```
```

---

## 구현 완료!

모든 작업이 완료되었습니다. 구현된 기능:

✅ TypeScript 타입 업데이트 (thumbnail, subTitle)
✅ 브런치 크롤러 수정 (썸네일 추출)
✅ articles.json 재생성
✅ 글 목록 페이지 생성 (/articles)
✅ 카드 UI 구현 (썸네일 포함)
✅ 메인 페이지 링크 추가
✅ 반응형 디자인
✅ 메타데이터 추가
✅ README 업데이트

다음 단계: 배포 및 프로덕션 크롤링
