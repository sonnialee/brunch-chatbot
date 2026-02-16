# 브런치 챗봇 개발 로그

> 최종 업데이트: 2026-02-15

---

## 📝 프로젝트 개요

**목적:** 시영님의 브런치 글(26개)을 기반으로 커리어 상담 챗봇 만들기

**핵심 기능:**
- 브런치 글 내용 기반 답변
- 시영님의 실제 대화 스타일 반영
- 자연스러운 한국어 대화

**기술 스택:**
- Next.js 15 (App Router)
- TypeScript
- Anthropic Claude API (claude-sonnet-4-5-20250929)
- Tailwind CSS

---

## 🎯 주요 작업 내역

### 1. 카카오톡 대화 패턴 분석 (2026-02-15)

**작업 내용:**
- 3개 카카오톡 대화 CSV 파일 분석
  - 이예종님과의 대화 (598줄)
  - dayoung wi님과의 대화 (522줄)
  - YJ님과의 대화 (465줄)

**추출한 패턴:**
```
공감 우선: "화이팅이에여!", "걱정마세요", "나도 그랬어요"
말투: "~예요", "~해요", "ㅋㅋㅋ", "!!"
짧게 끊어서: 한 번에 다 말하지 않고 대화 이어가기
개인 경험: "저도 ~했는데", "제 경험으로는"
열린 마무리: "궁금한 거 더 있어요?"
```

**생성 파일:**
- `lib/conversation-guide.ts` - 대화 패턴 데이터베이스 (참고용)

---

### 2. 시스템 프롬프트 업데이트

**파일:** `lib/claude-client.ts`

**변경 내용:**
- 실제 카톡 패턴을 시스템 프롬프트에 반영
- 대화 스타일 가이드 상세화
- 답변 방식 명확화 (짧게, 공감 먼저, 대화 이어가기)

**주요 프롬프트 구조:**
```
1. 페르소나 설정: "당신은 셩PM입니다..."
2. 말투와 특징
3. 답변 방식
4. 브런치 글 20개 내용 포함
```

---

### 3. 말투 조정 (진중하게)

**피드백:** "말투 너무 가벼움"

**Before (너무 가벼움):**
- "ㅋㅋㅋ" 자주 사용
- "화이팅이에여!!", "걱정마여"
- "~어때여?", "~할거같아요"

**After (진중하게):**
- 웃음 표현 제거
- "잘하고 계세요", "걱정하실 필요 없어요"
- "~해보시는 걸 추천합니다", "~할 것 같아요"
- "~합니다", "~해요" 자연스럽게 섞어서

---

## 📂 프로젝트 구조

```
brunch-chatbot/
├── data/
│   └── articles.json          # 브런치 글 20개 (13KB, 평균 200자)
│
├── lib/
│   ├── claude-client.ts       # ⭐ 핵심: Claude API 호출 + 대화 스타일
│   ├── conversation-guide.ts  # 카톡 패턴 분석 결과 (참고용)
│   ├── brunch-crawler.ts      # 브런치 크롤러
│   └── types.ts               # 타입 정의
│
├── app/
│   ├── page.tsx               # 채팅 UI
│   ├── layout.tsx             # 레이아웃
│   └── api/
│       ├── chat/route.ts      # 채팅 API 엔드포인트
│       └── crawl/route.ts     # 크롤링 API 엔드포인트
│
├── docs/
│   └── DEVELOPMENT_LOG.md     # 이 문서
│
└── .env.local                 # ANTHROPIC_API_KEY
```

---

## 🔄 동작 흐름

```
1. 사용자 질문 입력
   ↓
2. app/page.tsx → POST /api/chat
   ↓
3. app/api/chat/route.ts → chat() 호출
   ↓
4. lib/claude-client.ts
   - loadArticles() → 20개 글 로드
   - buildSystemPrompt() → 시스템 프롬프트 생성
     (페르소나 + 대화 스타일 + 20개 글 내용)
   - anthropic.messages.create() → Claude API 호출
   ↓
5. Claude 답변 생성
   ↓
6. 사용자에게 답변 표시
```

---

## 📚 브런치 글 관리

### 현재 상태
- **총 20개 글** 저장
- **파일 크기:** 13KB
- **평균 글자수:** 200자 (요약본)
- **위치:** `data/articles.json`

### 글 업데이트 방법

```bash
# 방법 1: 브라우저
http://localhost:3002/api/crawl

# 방법 2: 터미널
curl http://localhost:3002/api/crawl

# 결과
✅ data/articles.json 자동 업데이트
✅ 다음 채팅부터 새 글 반영
```

### 크롤링 작동 방식

```
1. 브런치 API 호출
   GET https://api.brunch.co.kr/v1/article/@103ab3ed4f1f4f6

2. 글 목록 받기 (제목, URL, 요약)

3. (선택) Puppeteer로 전체 글 크롤링
   - 현재는 요약본만 사용 중
   - 필요시 전체 글 크롤링 가능

4. data/articles.json 저장
```

### 유용한 명령어

```bash
# 글 개수 확인
cat data/articles.json | jq '. | length'

# 최신 글 5개 제목
cat data/articles.json | jq -r '.[0:5] | .[] | .title'

# 특정 키워드 검색
cat data/articles.json | jq '.[] | select(.title | contains("면접"))'

# 백업
cp data/articles.json data/articles.backup.json
```

---

## 💰 성능 & 비용

### 현재 설정 (요약본)
- 글당 ~200자 × 20개 = 4,000자
- 답변당 토큰: ~5,000 tokens
- 비용: 매우 저렴 ✅

### 전체 글로 변경시
- 글당 ~2,000자 × 20개 = 40,000자
- 답변당 토큰: ~50,000 tokens
- 비용: 10배 증가 ⚠️

**권장:** 현재 요약본으로도 충분히 좋은 답변이 나옴

---

## 🔧 개발 환경 설정

### 로컬 개발 서버 실행

```bash
cd ~/brunch-chatbot
npm run dev

# 결과
✓ Ready in 1004ms
Local: http://localhost:3002
```

### 환경 변수

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## 🎨 시스템 프롬프트 핵심 설정

### 현재 설정 (lib/claude-client.ts)

```typescript
return `당신은 셩PM입니다. 디자이너 출신 PM이고, 해커톤 25번 수상했고, 이직하면서 100번 떨어진 경험이 있습니다.

# 당신의 말투와 특징:
- 1인칭: "나는", "내 경험으로는", "저는", "제가"
- 존댓말: "~습니다", "~예요", "~해요" (자연스럽게 섞어서)
- 긍정 반응: "네", "좋습니다", "그렇습니다"
- 강조: 필요할 때만 "!" 사용 (과하지 않게)

# 공감과 격려 (진중하게):
- "걱정하실 필요 없어요"
- "충분히 가능합니다"
- "나도 비슷한 경험이 있어요"
- "잘하고 계세요"

# 답변 방식:
1. **짧게 2-3문장으로 시작**
2. **한 번에 다 말하지 말기**
3. **개인 경험 공유**
4. **마무리는 열린 질문으로**
5. **솔직하되 전문적으로**

# 내가 쓴 브런치 글들:
${articlesText}
`;
```

---

## ✅ 체크리스트

- [x] 카카오톡 대화 패턴 분석
- [x] conversation-guide.ts 생성
- [x] claude-client.ts 시스템 프롬프트 업데이트
- [x] 말투 조정 (진중하게)
- [x] 개발 서버 테스트 (http://localhost:3002)
- [x] 개발 로그 문서화
- [ ] 디자인 개선
- [ ] 배포 (Vercel)
- [ ] 도메인 연결 (선택)
- [ ] 실사용자 피드백 수집

---

## 🚀 다음 단계

### 1. 디자인 개선
- UI/UX 개선
- 브랜딩 (로고, 색상)
- 반응형 모바일 대응
- 로딩 상태 개선

### 2. 배포
- Vercel 배포
- 환경 변수 설정
- 도메인 연결 (선택)
- 분석 도구 연결 (Google Analytics 등)

### 3. 기능 추가 (선택)
- 대화 히스토리 저장
- 스트리밍 답변
- 특정 글 검색
- 피드백 수집

---

## 📝 참고 사항

### API 키 관리
- `.env.local` 파일은 절대 git에 커밋하지 않기
- Vercel 배포 시 환경 변수 별도 설정 필요

### 브런치 크롤링 주의사항
- Rate limiting: 각 요청마다 1초 대기
- 브런치 API 정책 변경 시 대응 필요
- Puppeteer는 서버리스 환경에서 제한적

### Claude API 사용량
- 현재 설정: 답변당 ~5,000 tokens
- 월간 예상 비용 계산 필요
- 사용량 모니터링 권장

---

## 🔗 관련 링크

- **프로젝트 경로:** `/Users/sonnia.l/brunch-chatbot`
- **개발 서버:** http://localhost:3002
- **브런치 프로필:** https://brunch.co.kr/@103ab3ed4f1f4f6
- **Anthropic API:** https://console.anthropic.com

---

## 📞 문의 및 개선 아이디어

이 문서는 프로젝트 진행 중 지속적으로 업데이트됩니다.
새로운 기능이나 개선사항이 있으면 이 문서에 추가해주세요.
