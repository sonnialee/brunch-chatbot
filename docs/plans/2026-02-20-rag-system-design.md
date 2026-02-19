# RAG 시스템 설계 (임베딩 기반)

## 개요

현재 챗봇은 모든 브런치 글(24개)을 매번 Claude API에 전송하고 있습니다.
이는 토큰 낭비와 컨텍스트 오염을 발생시킵니다.

임베딩 기반 RAG로 개선하여 질문과 관련된 5개 글만 선택적으로 전송합니다.

## 목표

- **토큰 70% 절감**: 50,000 → 15,000 토큰
- **응답 품질 향상**: 관련 없는 정보 제거
- **비용 절감**: 무료 로컬 임베딩 사용
- **빠른 응답**: Cold start 없이 1초 내 검색

## 아키텍처

### 빌드 타임 (새 글 추가 시)

```
articles.json → generate-embeddings.ts → embeddings.json
```

- 24개 글을 Transformers.js로 임베딩 생성
- `data/embeddings.json`에 저장
- 배포 시 함께 포함

### 런타임 (사용자 질문 시)

```
질문 → 임베딩 생성 → 코사인 유사도 계산 → Top 5 선택 → Claude API
```

- 질문만 임베딩 생성 (~1초)
- 미리 계산된 임베딩과 비교
- 가장 유사한 5개 글만 LLM에 전달

## 컴포넌트

### 1. `scripts/generate-embeddings.ts` (신규)

**역할**: 빌드 시 모든 글의 임베딩 생성

```typescript
- loadArticles() from articles.json
- generateEmbedding(article.content) for each
- save to data/embeddings.json
```

**실행**: `npm run prebuild` (자동) 또는 `npm run generate-embeddings` (수동)

### 2. `lib/embedding.ts` (신규)

**역할**: 임베딩 유틸리티

```typescript
- generateEmbedding(text: string): Promise<number[]>
- cosineSimilarity(vec1: number[], vec2: number[]): number
- findTopK(query: number[], embeddings: Embedding[], k: number): Article[]
```

### 3. `lib/retrieval.ts` (신규)

**역할**: 검색 로직

```typescript
- retrieveRelevantArticles(question: string, k=5): Promise<Article[]>
  1. Load embeddings.json
  2. Generate question embedding
  3. Calculate similarity
  4. Return top 5
```

### 4. `lib/claude-client.ts` (수정)

**변경 전**:
```typescript
const articles = await loadArticles(); // 24개 전체
const systemPrompt = buildSystemPrompt(articles);
```

**변경 후**:
```typescript
const relevantArticles = await retrieveRelevantArticles(userMessage, 5);
const systemPrompt = buildSystemPrompt(relevantArticles);
```

### 5. `package.json` (수정)

```json
{
  "dependencies": {
    "@xenova/transformers": "^2.17.0"
  },
  "scripts": {
    "prebuild": "tsx scripts/generate-embeddings.ts",
    "generate-embeddings": "tsx scripts/generate-embeddings.ts"
  }
}
```

## 데이터 구조

### `data/embeddings.json`

```json
[
  {
    "title": "PM의 도메인 분석 - 커머스편",
    "url": "https://brunch.co.kr/eAe4_43",
    "content": "쿠팡, 무신사...",
    "embedding": [0.123, -0.456, 0.789, ...] // 384차원 벡터
  },
  ...
]
```

## 데이터 플로우

```
[사용자 질문]
    ↓
retrieveRelevantArticles(question)
    ↓ (~1초)
질문 임베딩 생성
    ↓
코사인 유사도 계산
    ↓
Top 5 글 선택
    ↓
buildSystemPrompt(top5)
    ↓
Claude API 호출 (토큰 70% 절감)
    ↓
[답변 반환]
```

## 에러 핸들링

1. **embeddings.json 없음**
   - Fallback: 전체 글 사용 (기존 방식)
   - 경고 로그 출력

2. **임베딩 생성 실패**
   - 에러 로그 + 전체 글 사용
   - 사용자에게 정상 응답 제공

3. **빌드 실패**
   - 명확한 에러 메시지
   - 스크립트 재실행 가이드

## 테스팅 계획

1. **단위 테스트**
   - 코사인 유사도 계산 정확성
   - 임베딩 생성 일관성

2. **통합 테스트**
   - 전체 파이프라인 실행
   - 검색 결과 품질

3. **수동 테스트**
   - 질문: "이직할 때 이력서 어떻게 써?"
   - 예상: 이력서 관련 글 5개 선택

## 기술 선택 이유

### Transformers.js
- ✅ 무료
- ✅ 로컬 실행 (API 키 불필요)
- ✅ Sentence-BERT 모델 지원
- ✅ Next.js와 호환

### 빌드 타임 생성
- ✅ Cold start 없음
- ✅ Vercel 서버리스 최적화
- ✅ 빠른 응답 속도
- ✅ 간단한 유지보수

### JSON 저장
- ✅ 추가 DB 불필요
- ✅ 24개 글 수준에 적합
- ✅ 배포 간단 (파일 포함)

## 성능 예상

- **빌드 시간**: +30초 (임베딩 생성)
- **런타임 검색**: ~1초
- **토큰 절감**: 70%
- **비용 절감**: 월 $10-20 → $3-6

## 향후 개선 가능성

1. **Hybrid Search**: BM25 + 임베딩
2. **Reranking**: Cross-encoder로 재정렬
3. **캐싱**: 자주 묻는 질문 캐싱
4. **벡터 DB**: 글이 수백 개로 늘어날 경우

---

**작성일**: 2026-02-20
**작성자**: Claude Code
**상태**: 승인됨
