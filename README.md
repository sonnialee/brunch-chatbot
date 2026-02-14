# Brunch Chatbot

AI 챗봇으로 브런치 글 기반 커리어 조언 제공

## 기능

- 26개 브런치 글 기반 대화형 AI
- 이직, 이력서, PM 업무, AI 활용 관련 조언
- Claude API 기반 자연스러운 대화
- 실시간 채팅 인터페이스

## 기술 스택

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Claude API (Anthropic)
- Vercel 배포

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일에 Anthropic API 키 추가:
```
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 3. 브런치 글 크롤링

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 크롤링 실행
# http://localhost:3000/api/crawl 방문
```

크롤링은 약 26-30초 소요됩니다 (글당 1초 대기).

### 4. 챗봇 사용

http://localhost:3000 에서 챗봇 사용 가능

## 배포 (Vercel)

1. GitHub에 푸시
```bash
git remote add origin https://github.com/YOUR_USERNAME/brunch-chatbot.git
git push -u origin main
```

2. Vercel에서 프로젝트 import
   - https://vercel.com 접속
   - "New Project" 클릭
   - GitHub repository import

3. Environment Variables 추가
   - `ANTHROPIC_API_KEY`: Claude API 키

4. Deploy 클릭

5. 배포 후 크롤링 실행
   - `https://your-app.vercel.app/api/crawl` 방문

## 프로젝트 구조

```
brunch-chatbot/
├── app/
│   ├── page.tsx              # 채팅 UI
│   ├── layout.tsx            # 레이아웃
│   ├── globals.css           # 글로벌 스타일
│   └── api/
│       ├── chat/route.ts     # 채팅 API
│       └── crawl/route.ts    # 크롤링 API
├── lib/
│   ├── brunch-crawler.ts     # 브런치 크롤러
│   ├── claude-client.ts      # Claude API 클라이언트
│   └── types.ts              # 타입 정의
├── data/
│   └── articles.json         # 크롤링된 글 데이터
└── docs/
    └── plans/                # 디자인 & 구현 계획
```

## API 엔드포인트

### GET /api/crawl
브런치 글을 크롤링하고 `data/articles.json`에 저장

**Response:**
```json
{
  "success": true,
  "count": 26,
  "message": "Articles crawled and saved successfully"
}
```

### POST /api/chat
사용자 질문에 대한 AI 답변 생성

**Request:**
```json
{
  "message": "이직할 때 이력서 어떻게 써야 해?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "이력서 작성 시 가장 중요한 것은..."
}
```

## 문서

- 디자인: `docs/plans/2026-02-13-brunch-chatbot-design.md`
- 구현 계획: `docs/plans/2026-02-13-brunch-chatbot-implementation.md`

## 개발

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 트러블슈팅

### 크롤링 실패
- 네트워크 연결 확인
- 브런치 API 상태 확인
- `data/articles.json` 파일 권한 확인

### Claude API 에러
- `.env.local`에 API 키 올바르게 설정되었는지 확인
- API 키 유효성 확인
- Anthropic 계정 크레딧 확인

### 빌드 에러
- `npm install`로 의존성 재설치
- `.next` 폴더 삭제 후 재빌드

## 라이선스

MIT
