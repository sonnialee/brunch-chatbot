# 브런치 챗봇 작업 로그

> **최종 업데이트:** 2026-02-18
> **작업 세션:** Vercel 배포 및 디버깅

---

## 🎯 오늘 작업 요약

1. ✅ 브런치 글 크롤링 (20개)
2. ✅ GitHub 저장소 생성 및 연결
3. ✅ Vercel 배포 완료
4. ✅ 배포 오류 디버깅 및 해결
5. ✅ TDD 환경 설정 (Jest)

**최종 결과:** https://brunch-chatbot.vercel.app (정상 작동 중) ✅

---

## 📋 상세 작업 내역

### 1. 브런치 글 크롤링

**문제:** 로컬 크롤링 필요

**해결:**
```bash
cd /Users/sonnia.l/brunch-chatbot
npx tsx crawl-now.ts
```

**결과:**
- 20개 글 크롤링 완료
- `data/articles.json` 저장 (13KB)
- 일부 글 Puppeteer 타임아웃 → fallback으로 API 요약본 사용

**크롤링된 글:**
1. 내 브런치 글로 나를 복제했다
2. 면접에서 너무 솔직하게 말하고 오지 마세요
3. 이직에도 시즌이 있다
... (총 20개)

---

### 2. GitHub 저장소 생성

**명령어:**
```bash
gh repo create brunch-chatbot --public --source=. --remote=origin --push
```

**결과:**
- 저장소: https://github.com/sonnialee/brunch-chatbot
- main 브랜치 푸시 완료

---

### 3. Vercel 배포 초기 설정

**문제들:**
1. Next.js 보안 취약점 (CVE-2025-66478)
2. `lib/conversation-guide.ts` 문법 오류
3. articles.json이 .gitignore에 포함됨

**해결 과정:**

#### 3.1 Next.js 업데이트
```bash
npm install next@latest react@latest react-dom@latest
```
- Next.js 15.1.6 → 16.1.6
- React 19.0.0 → 19.2.4

#### 3.2 문법 오류 수정
**파일:** `lib/conversation-guide.ts:38`
```typescript
// Before (오류)
emphasis: "!!", "...!",

// After (수정)
emphasis: ["!!", "...!"],
```

#### 3.3 articles.json을 git에 포함
**이유:** Vercel 서버리스 환경에서 Puppeteer 작동 불가

```bash
# .gitignore 수정
# data/articles.json - keeping this in git for production

git add data/articles.json
```

---

### 4. 배포 오류 디버깅 (핵심!)

#### 문제 1: "Bad escaped character in JSON at position 19"

**원인:** JSON 파일 로딩 방식 문제

**해결:**
```typescript
// Before - fs.readFile 사용
import { readFile } from 'fs/promises';
const data = await readFile(dataPath, 'utf-8');
return JSON.parse(data);

// After - 직접 import
import articlesData from '@/data/articles.json';
return articlesData as BrunchArticle[];
```

**결과:** 여전히 동일 에러 발생

---

#### 문제 2: "Connection error" + "not a legal HTTP header value"

**핵심 에러 로그:**
```
TypeError: [ANTHROPIC_API_KEY]
 is not a legal HTTP header value
```

**원인:** API 키에 줄바꿈/공백 포함

**해결 1 - 코드 수정:**
```typescript
// lib/claude-client.ts
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY?.trim(), // trim() 추가!
  baseURL: 'https://api.anthropic.com',
});
```

**해결 2 - articles.json ASCII 인코딩:**
```python
import json
with open('data/articles.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
# Save with ASCII encoding
with open('data/articles.json', 'w', encoding='utf-8') as out:
    json.dump(data, out, ensure_ascii=True, indent=2)
```

**최종 해결:** ASCII 인코딩 후 정상 작동!

---

### 5. 디버깅 설정 추가

**파일 생성:** `vercel.json`
```json
{
  "env": {
    "NODE_ENV": "production",
    "DEBUG": "*"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**로그 추가:** `lib/claude-client.ts`
```typescript
console.log('[DEBUG] Step 1: Loading articles...');
console.log('[DEBUG] Step 2: Loaded ${articles.length} articles');
console.log('[DEBUG] Step 3: API key confirmed');
// ... 총 9단계 로그
```

**로그 확인 방법:**
```bash
vercel logs brunch-chatbot.vercel.app --follow
```

---

### 6. TDD 환경 설정

**설치:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest
```

**설정 파일:**

1. `jest.config.js` - Next.js 통합 설정
2. `jest.setup.js` - jest-dom import
3. `__tests__/example.test.tsx` - 예제 테스트

**테스트 스크립트:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**테스트 실행:**
```bash
npm test
# PASS __tests__/example.test.tsx
# Test Suites: 1 passed
# Tests: 2 passed
```

---

## 🔧 주요 Git 커밋

```bash
# 1. 문법 오류 수정
git commit -m "Fix syntax error in conversation-guide.ts"

# 2. Next.js 보안 업데이트
git commit -m "Update Next.js to fix security vulnerability"

# 3. articles.json 포함
git commit -m "Include articles.json in deployment"

# 4. JSON import 방식 변경
git commit -m "Fix JSON loading in serverless environment"

# 5. API 키 trim 추가
git commit -m "Fix: Trim API key to remove whitespace"

# 6. ASCII 인코딩
git commit -m "Encode articles.json with ASCII for better compatibility"

# 7. TDD 설정
git commit -m "Add TDD setup with Jest and Testing Library"
```

---

## 🚨 발생한 주요 이슈와 해결

### Issue 1: Puppeteer가 Vercel에서 작동 안 함

**원인:** 서버리스 환경 제약

**해결:**
- 로컬에서 크롤링 수행
- articles.json을 git에 포함
- 프로덕션에서는 정적 파일 사용

### Issue 2: JSON 파싱 에러

**원인:** 한글 인코딩 문제

**해결:**
- JSON import 방식으로 변경
- ASCII 인코딩 적용
- ensure_ascii=True 옵션 사용

### Issue 3: API 연결 오류

**원인:**
1. API 키에 공백 포함
2. 환경 변수 trim 필요

**해결:**
```typescript
apiKey: process.env.ANTHROPIC_API_KEY?.trim()
```

### Issue 4: 환경 변수 재설정

**명령어:**
```bash
# 기존 변수 덮어쓰기
echo "YOUR_API_KEY" | vercel env add ANTHROPIC_API_KEY production --force --sensitive --yes

# 재배포
vercel --prod --yes
```

---

## 📁 프로젝트 구조

```
brunch-chatbot/
├── app/
│   ├── page.tsx              # 메인 채팅 UI
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── chat/route.ts     # 채팅 API (에러 처리 강화)
│       └── crawl/route.ts
├── lib/
│   ├── claude-client.ts      # ⭐ API 키 trim, 디버그 로그
│   ├── conversation-guide.ts # 문법 오류 수정됨
│   ├── brunch-crawler.ts
│   └── types.ts
├── data/
│   └── articles.json         # ⭐ ASCII 인코딩, git 포함
├── __tests__/
│   └── example.test.tsx      # 예제 테스트
├── jest.config.js            # Jest 설정
├── jest.setup.js
├── vercel.json               # ⭐ 디버그 & 타임아웃 설정
├── tsconfig.json             # jsx: react-jsx
└── package.json              # 테스트 스크립트 추가
```

---

## 🔍 디버깅 팁

### Vercel 로그 실시간 확인
```bash
vercel logs brunch-chatbot.vercel.app --follow
```

### 로컬 테스트
```bash
# 빌드
npm run build

# 프로덕션 서버
npm start

# API 테스트
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "안녕하세요", "history": []}'
```

### 환경 변수 확인
```bash
vercel env ls
vercel env pull  # .env.local로 다운로드
```

---

## 🎯 다음 작업 시 체크리스트

### 시작 전 확인사항
- [ ] `npm run dev` 실행 확인
- [ ] `npm test` 통과 확인
- [ ] `.env.local` 파일 존재 확인
- [ ] `data/articles.json` 파일 존재 확인

### 새 기능 추가 시
1. [ ] TDD: 테스트 먼저 작성
2. [ ] 기능 구현
3. [ ] 로컬 테스트 (`npm test`)
4. [ ] 로컬 빌드 (`npm run build`)
5. [ ] Git commit & push
6. [ ] Vercel 자동 배포 확인
7. [ ] 프로덕션 테스트

### 배포 이슈 발생 시
1. Vercel 로그 확인: `vercel logs URL --follow`
2. 환경 변수 확인: `vercel env ls`
3. 로컬에서 동일 조건 재현
4. [DEBUG] 로그 추가하여 단계별 확인

---

## 📊 성능 메트릭

**현재 상태:**
- Articles: 20개
- API 응답 시간: ~5-7초
- 함수 타임아웃: 30초
- 토큰 사용량: ~5,000 tokens/response

**최적화 포인트:**
- 스트리밍 응답 구현 가능
- Articles 캐싱 고려
- API 응답 속도 개선

---

## 🛠️ 유용한 명령어

```bash
# 개발
npm run dev                 # 개발 서버
npm run build              # 프로덕션 빌드
npm start                  # 프로덕션 서버

# 테스트
npm test                   # 전체 테스트
npm run test:watch        # Watch 모드
npm run test:coverage     # 커버리지

# 배포
vercel --prod --yes       # 프로덕션 배포
vercel logs URL           # 로그 확인
vercel env ls             # 환경 변수 확인

# 크롤링
npx tsx crawl-now.ts      # 브런치 글 재크롤링
```

---

## 💡 알아두면 좋은 것들

### 1. Anthropic SDK 초기화 주의사항
```typescript
// ❌ 잘못된 방식
apiKey: process.env.ANTHROPIC_API_KEY

// ✅ 올바른 방식
apiKey: process.env.ANTHROPIC_API_KEY?.trim()
```

### 2. JSON import vs fs.readFile
- **Serverless:** JSON import 사용 (빌드 시 번들링)
- **Server:** fs.readFile 사용 가능

### 3. 한글 처리
- JSON: `ensure_ascii=True` 옵션 사용
- 또는 UTF-8 인코딩 명시적 처리

### 4. Vercel 환경 변수
- Production, Preview, Development 각각 설정 가능
- `--force` 옵션으로 덮어쓰기 가능
- 배포 후 자동 적용 (재배포 필요 없음)

---

## 🔗 중요 링크

- **프로덕션:** https://brunch-chatbot.vercel.app
- **GitHub:** https://github.com/sonnialee/brunch-chatbot
- **Vercel 대시보드:** https://vercel.com/sees-projects-cb872980/brunch-chatbot
- **Anthropic API:** https://console.anthropic.com

---

## ✅ 최종 상태

- **배포 상태:** ✅ 정상 작동
- **테스트:** ✅ 통과 (2/2)
- **환경 변수:** ✅ 설정 완료
- **디버깅:** ✅ 로그 설정 완료
- **TDD:** ✅ Jest 설정 완료

**마지막 성공 테스트:**
```json
{
  "success": true,
  "response": "안녕하세요! 반갑습니다 😊..."
}
```

---

**작성자:** Claude Opus 4.6
**작성일:** 2026-02-18
