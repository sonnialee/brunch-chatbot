# 브런치 글 목록 페이지 설계

> **작성일:** 2026-02-20
> **목적:** 서비스 메인에 브런치 글 목록 추가 및 관리 개선

---

## 📋 요구사항

### 문제점
- 현재 메인 페이지는 채팅 UI만 있음
- 브런치 글 목록을 확인할 방법이 없음
- `articles.json` 관리가 복잡함

### 목표
- 별도 페이지(`/articles`)에 브런치 글 목록 표시
- 각 글 클릭 시 실제 브런치 사이트로 이동
- 썸네일 이미지 포함한 매력적인 UI
- 기존 채팅 기능은 그대로 유지

---

## 🎯 설계 개요

### 선택한 방식
**방식 1: articles.json 활용**
- 기존 `articles.json`을 그대로 활용
- 썸네일 정보 추가
- 단일 데이터 소스로 관리 간소화

### 거부한 방식
- 방식 2: 별도 링크 파일 관리 (복잡도 증가)
- 방식 3: 하드코딩 링크 목록 (미리보기 불가)

---

## 🏗️ 아키텍처

### 페이지 구조

```
brunch-chatbot/
├── app/
│   ├── page.tsx              # 메인 채팅 페이지 (헤더 수정)
│   ├── articles/
│   │   └── page.tsx          # 새 페이지: 브런치 글 목록
│   └── api/
│       ├── chat/route.ts     # 기존 유지
│       └── crawl/route.ts    # 수정: thumbnail 추가
├── lib/
│   ├── brunch-crawler.ts     # 수정: thumbnail 크롤링
│   └── types.ts              # 수정: BrunchArticle 타입 업데이트
└── data/
    └── articles.json         # 수정: thumbnail 필드 추가
```

### 라우팅

| 경로 | 설명 |
|------|------|
| `/` | 메인 채팅 페이지 |
| `/articles` | 브런치 글 목록 페이지 (신규) |

### 네비게이션

- 메인 페이지 헤더: "📝 브런치 글" 링크 → `/articles`로 이동
- 글 목록 페이지 헤더: "← 채팅으로" 링크 → `/`로 이동

---

## 📊 데이터 구조

### articles.json 변경

**기존:**
```json
{
  "title": "글 제목",
  "url": "https://brunch.co.kr/...",
  "content": "전체 글 내용...",
  "date": "2026-02-19T16:00:32.105Z"
}
```

**변경 후:**
```json
{
  "title": "글 제목",
  "url": "https://brunch.co.kr/...",
  "content": "전체 글 내용...",
  "date": "2026-02-19T16:00:32.105Z",
  "thumbnail": "http://t1.kakaocdn.net/.../image.png",
  "subTitle": "부제목"
}
```

### TypeScript 타입 (lib/types.ts)

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

---

## 🎨 UI/UX 설계

### 메인 페이지 (/) 변경

**헤더 수정:**
```tsx
<header className="bg-white border-b border-gray-200 px-6 py-4">
  <div className="flex justify-between items-center">
    <div>
      <h1>셩PM의 브런치 조언 봇</h1>
      <p>이직, 이력서, AI 활용에 대한 조언을 받아보세요</p>
    </div>
    <Link href="/articles" className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
      📝 브런치 글
    </Link>
  </div>
</header>
```

### 글 목록 페이지 (/articles)

**레이아웃:**
```
┌────────────────────────────────────────────────┐
│ [← 채팅으로]        시영님의 브런치 글          │
├────────────────────────────────────────────────┤
│                                                │
│  📝 전체 글 (26개)                             │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ [썸네일]  PM의 도메인 분석 - 커머스편   │→│
│  │  이미지   2026-02-19                     │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ [썸네일]  AI 챗봇 만들고 하루 만에...   │→│
│  │  이미지   2026-02-19                     │ │
│  └──────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘
```

**카드 스타일:**
- **데스크탑 (≥ 768px):**
  - 가로 레이아웃: 썸네일(왼쪽) + 제목/날짜(오른쪽)
  - 썸네일 크기: 120px × 120px
  - 카드 전체 클릭 가능

- **모바일 (< 768px):**
  - 세로 레이아웃: 썸네일(위) + 제목/날짜(아래)
  - 썸네일 크기: 100% width, aspect-ratio 16:9

**인터랙션:**
- 호버: 배경색 변경 (`hover:bg-gray-50`), shadow 추가
- 클릭: 브런치 원문 새 탭으로 열기 (`target="_blank"`)

**이미지 처리:**
- 이미지 있음: `articleImageForHome` 사용
- 이미지 없음: 회색 플레이스홀더 (`bg-gray-200`)

---

## 🔧 구현 상세

### 1. 크롤러 수정 (lib/brunch-crawler.ts)

**변경 사항:**
1. 브런치 API에서 `articleImageForHome` 추출
2. `subTitle` 추출 (선택사항)
3. `articles.json`에 저장

**API 응답 구조:**
```json
{
  "title": "글 제목",
  "subTitle": "부제목",
  "articleImageForHome": "http://t1.kakaocdn.net/.../image.png",
  "articleImageForHomeOrDefault": "...",  // 기본 이미지 포함
  ...
}
```

**크롤링 로직:**
```typescript
articles.push({
  title: article.title,
  url: `https://brunch.co.kr/${article.contentId}`,
  content: content || article.contentSummary || '',
  date: article.publishTime ? new Date(article.publishTime).toISOString() : undefined,
  thumbnail: article.articleImageForHome || null,
  subTitle: article.subTitle || undefined
});
```

### 2. 글 목록 페이지 (app/articles/page.tsx)

**구현 방식:**
- **Server Component** 사용
- `fs.readFileSync`로 `data/articles.json` 읽기
- 날짜 역순 정렬 (최신 글 먼저)
- 클라이언트로 필요한 데이터만 전달

**데이터 전달:**
```typescript
interface ArticleCard {
  title: string;
  url: string;
  thumbnail: string | null;
  date: string;
}
```

**컴포넌트 구조:**
```tsx
export default function ArticlesPage() {
  const articles = loadArticles(); // Server-side

  return (
    <div>
      <Header />
      <ArticleList articles={articles} />
    </div>
  );
}
```

### 3. 메인 페이지 수정 (app/page.tsx)

헤더 부분만 수정:
```tsx
<header>
  <div className="flex justify-between items-center">
    <div>...</div>
    <Link href="/articles">📝 브런치 글</Link>
  </div>
</header>
```

---

## 🔄 데이터 흐름

### 크롤링 → 저장
```
브런치 API
  ↓ (GET /v1/article/@103ab3ed4f1f4f6)
크롤러 (lib/brunch-crawler.ts)
  ↓ (thumbnail 추출)
articles.json 저장
```

### 렌더링 → 표시
```
articles.json
  ↓ (Server-side read)
/articles 페이지
  ↓ (날짜 역순 정렬)
글 목록 카드 렌더링
  ↓ (클릭)
브런치 사이트 (새 탭)
```

---

## 📱 반응형 디자인

### 모바일 (< 768px)

```
┌─────────────────────────┐
│ ← 채팅으로   브런치 글  │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │   [썸네일 이미지]   │ │
│ │                     │ │
│ │ PM의 도메인 분석    │ │
│ │ 2026-02-19          │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 데스크탑 (≥ 768px)

```
┌──────────────────────────────────────┐
│ ← 채팅으로      시영님의 브런치 글   │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ [썸네일] PM의 도메인 분석        │ │
│ │ [이미지] 커머스편                │ │
│ │          2026-02-19              │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## ✅ 구현 체크리스트

### Phase 1: 크롤러 수정
- [ ] `lib/types.ts` - BrunchArticle 타입에 thumbnail, subTitle 추가
- [ ] `lib/brunch-crawler.ts` - API에서 thumbnail 추출 로직 추가
- [ ] `/api/crawl` 재실행 - articles.json 재생성

### Phase 2: 페이지 생성
- [ ] `app/articles/page.tsx` 생성
- [ ] Server Component로 articles.json 읽기
- [ ] 글 목록 UI 구현 (카드 스타일)
- [ ] 반응형 디자인 적용

### Phase 3: 네비게이션
- [ ] `app/page.tsx` 헤더에 "브런치 글" 링크 추가
- [ ] `app/articles/page.tsx` 헤더에 "채팅으로" 링크 추가

### Phase 4: 테스트
- [ ] 데스크탑 레이아웃 확인
- [ ] 모바일 레이아웃 확인
- [ ] 이미지 있는 글 / 없는 글 렌더링 확인
- [ ] 링크 클릭 → 브런치 사이트 이동 확인

---

## 🚀 배포 후 작업

### 1. 크롤링 재실행
```bash
# 로컬
npm run dev
curl http://localhost:3000/api/crawl

# Vercel
curl https://your-app.vercel.app/api/crawl
```

### 2. 임베딩 재생성
```bash
npm run generate-embeddings
```

### 3. 배포
```bash
git add .
git commit -m "feat: add brunch articles list page with thumbnails"
git push
```

---

## 🎯 성공 기준

- ✅ `/articles` 페이지가 정상적으로 렌더링됨
- ✅ 모든 글이 최신순으로 표시됨
- ✅ 썸네일 이미지가 올바르게 표시됨
- ✅ 이미지 없는 글도 플레이스홀더로 표시됨
- ✅ 클릭 시 브런치 원문으로 이동
- ✅ 모바일/데스크탑 반응형 정상 작동
- ✅ 메인 페이지 채팅 기능은 그대로 유지

---

## 📝 참고사항

### 브런치 API 엔드포인트
```
GET https://api.brunch.co.kr/v1/article/@103ab3ed4f1f4f6
```

### 주요 필드
- `title`: 글 제목
- `subTitle`: 부제목
- `contentId`: 글 ID (예: "eAe4_43")
- `publishTime`: 발행 시간 (timestamp)
- `articleImageForHome`: 대표 썸네일
- `articleImageList`: 글 내 모든 이미지

### 기본 이미지 URL
```
https://t1.kakaocdn.net/brunch/static/img/help/mw/membership/banner_article_default_image.png
```

---

**설계 완료일:** 2026-02-20
**다음 단계:** 구현 계획 작성 (`writing-plans` 스킬)
