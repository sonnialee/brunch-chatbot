# 브런치 챗봇 🤖

시영님의 브런치 글을 기반으로 한 커리어 상담 챗봇

> **최종 업데이트:** 2026-02-15
> **상태:** 개발 완료, 배포 준비 중

---

## ✨ 주요 기능

- ✅ **브런치 글 20개 기반** - 실제 경험과 노하우 반영
- ✅ **브런치 글 목록** - 썸네일과 함께 모든 글 확인 가능
- ✅ **자연스러운 대화** - 실제 카톡 대화 패턴 분석 반영
- ✅ **진중한 말투** - 전문적이면서도 친근한 커리어 상담 톤
- ✅ **실시간 채팅** - 빠른 응답 속도
- ✅ **대화 히스토리** - 이전 대화 맥락 유지

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

## RAG (검색 증강 생성)

이 챗봇은 임베딩 기반 RAG를 사용하여 질문과 관련된 글만 선택적으로 사용합니다.

### 작동 방식

1. **빌드 타임**: 모든 브런치 글의 임베딩 생성 (Transformers.js)
2. **런타임**: 질문 임베딩 생성 → 코사인 유사도로 상위 5개 글 선택
3. **답변 생성**: 선택된 5개 글만 Claude API에 전달

### 임베딩 재생성

새 글을 추가한 후:

```bash
npm run generate-embeddings
```

빌드 시 자동으로 실행됩니다 (`prebuild` 스크립트).

### 성능

- **토큰 사용량**: 70% 절감 (50,000 → 15,000 토큰)
- **검색 속도**: ~1초
- **비용**: 무료 (로컬 임베딩)

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

## 📚 문서

- **개발 로그:** [`docs/DEVELOPMENT_LOG.md`](docs/DEVELOPMENT_LOG.md) - 상세 작업 내역 및 다음 작업 시 참고 자료 ⭐
- **대화 가이드:** [`lib/conversation-guide.ts`](lib/conversation-guide.ts) - 실제 카톡 패턴 분석 결과
- **디자인:** `docs/plans/2026-02-13-brunch-chatbot-design.md`
- **구현 계획:** `docs/plans/2026-02-13-brunch-chatbot-implementation.md`

> 💡 **다음 작업 시 참고:** `docs/DEVELOPMENT_LOG.md` 문서를 먼저 확인하세요!

## 🚀 다음 단계 (TODO)

### 1. 디자인 개선
- [ ] UI/UX 개선 (색상, 레이아웃, 로고)
- [ ] 브랜딩 적용
- [ ] 반응형 모바일 대응
- [ ] 로딩 상태 개선

### 2. Vercel 배포
- [ ] GitHub 푸시
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 도메인 연결 (선택)

### 3. 기능 개선 (선택)
- [ ] 스트리밍 답변
- [ ] 대화 히스토리 저장
- [ ] 피드백 수집 기능
- [ ] 분석 도구 연결

---

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 브런치 글 업데이트
curl http://localhost:3002/api/crawl

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
