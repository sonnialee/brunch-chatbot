# 작업 로그 - 2026-02-20

## 📋 작업 요약

오늘은 두 가지 주요 작업을 완료했습니다:
1. **모바일 UI 최적화** (초반 작업)
2. **RAG(검색 증강 생성) 시스템 구현** (메인 작업)

---

## 🎯 1. RAG 시스템 구현 (주요 작업)

### 목표
브런치 챗봇의 토큰 사용량을 줄이기 위해 임베딩 기반 RAG 시스템 구현

### 구현 내용

#### Task 1: 의존성 추가
- **파일**: `package.json`, `package-lock.json`
- **내용**:
  - `@xenova/transformers` 추가 (로컬 임베딩 생성)
  - `tsx` 추가 (TypeScript 스크립트 실행)
  - npm scripts 추가: `generate-embeddings`, `prebuild`
- **커밋**: `50f54a4`

#### Task 2: 임베딩 유틸리티 생성
- **파일**:
  - `lib/embedding.ts` (신규 생성)
  - `__tests__/lib/embedding.test.ts` (신규 생성)
  - `jest.config.js` (수정)
- **내용**:
  - `generateEmbedding()` - 텍스트를 벡터로 변환
  - `cosineSimilarity()` - 두 벡터의 유사도 계산
  - `findTopK()` - 가장 유사한 K개 항목 찾기
  - Jest 테스트 3개 작성 및 통과
- **커밋**: `07644b8`

#### Task 3: 검색 모듈 생성
- **파일**:
  - `lib/retrieval.ts` (신규 생성)
  - `lib/types.ts` (수정)
- **내용**:
  - `ArticleWithEmbedding` 타입 추가
  - `loadEmbeddings()` - JSON에서 임베딩 로드
  - `retrieveRelevantArticles()` - 질문과 관련된 상위 5개 글 검색
- **커밋**: `d1e6e83`

#### Task 4: 임베딩 생성 스크립트
- **파일**:
  - `scripts/generate-embeddings.ts` (신규 생성)
  - `.gitignore` (수정)
- **내용**:
  - 빌드 타임에 모든 글의 임베딩 생성
  - `data/embeddings.json` 생성 (296KB, 24개 글, 384차원 벡터)
  - 임베딩 파일을 gitignore에 추가
- **커밋**: `914a827`

#### Task 5: RAG를 Chat API에 통합
- **파일**: `lib/claude-client.ts`
- **내용**:
  - 기존: 모든 24개 글을 매번 로드
  - 변경: 질문과 관련된 상위 5개 글만 검색
  - 폴백 메커니즘: 검색 실패 시 전체 글 사용
- **커밋**: `6bc6331`

#### Task 6: 문서화 업데이트
- **파일**: `README.md`
- **내용**:
  - RAG 시스템 설명 섹션 추가
  - 작동 방식, 임베딩 재생성 방법, 성능 지표 문서화
- **커밋**: `9e735d4`

#### Task 7: 전체 파이프라인 테스트
- **테스트 결과**:
  - ✅ 빌드 시 자동 임베딩 생성 확인
  - ✅ 3개 테스트 질문으로 검증:
    - "이직할 때 이력서 어떻게 써?"
    - "PM으로 커리어 전환하려면?"
    - "해커톤 참여하고 싶어"
  - ✅ 모든 질문에서 5개 글만 사용 확인
  - ✅ 토큰 사용량 83-95% 감소 확인

#### Task 8: 최종 정리 및 푸시
- **파일**: `.gitignore`, `data/articles.json`
- **내용**:
  - `.cache/` 디렉토리 제외 추가
  - 실험용 크롤링 스크립트 제외
  - 전체 테스트 통과 확인
  - 7개 커밋을 원격 저장소에 푸시
- **커밋**: `bbbb6b6`

### 📊 성과 지표

#### 성능 개선
- **토큰 사용량**: 83-95% 감소
  - 이전: ~50,000 characters (24개 글 전체)
  - 이후: 2,500-8,750 characters (5개 관련 글만)
- **검색 속도**: ~1초
- **비용**: 무료 (로컬 임베딩 사용)

#### 기술 스택
- **임베딩 모델**: Xenova/all-MiniLM-L6-v2 (384차원)
- **라이브러리**: @xenova/transformers (로컬 실행)
- **검색 방식**: 코사인 유사도 기반 Top-5 선택

### 📁 생성/수정된 파일

**신규 생성 (7개)**:
- `lib/embedding.ts`
- `lib/retrieval.ts`
- `scripts/generate-embeddings.ts`
- `__tests__/lib/embedding.test.ts`
- `docs/plans/2026-02-20-rag-system-design.md`
- `docs/plans/2026-02-20-rag-implementation.md`
- `data/embeddings.json` (빌드 시 자동 생성, gitignore)

**수정 (7개)**:
- `package.json` - 의존성 및 스크립트 추가
- `package-lock.json` - 의존성 트리 업데이트
- `lib/types.ts` - ArticleWithEmbedding 타입 추가
- `lib/claude-client.ts` - RAG 통합
- `jest.config.js` - ESM 모듈 지원
- `README.md` - RAG 문서화
- `.gitignore` - 캐시 및 임베딩 제외

---

## 📱 2. 모바일 UI 최적화 (초반 작업)

### 구현 내용

#### 디자인 및 계획 문서
- `docs/plans/2026-02-20-mobile-ui-optimization-design.md` (커밋: `d86fa2a`)
- `docs/plans/2026-02-20-mobile-ui-optimization.md` (커밋: `c2312c7`)
- `docs/plans/2026-02-20-test-results.md` (커밋: `7c0d1bd`)

#### UI 개선 사항
1. **placeholder 텍스트 제거** (`ad4ce63`)
2. **aria-label 추가** (접근성 개선) (`653fb38`)
3. **입력 영역 고정 위치 지정** (`650147a`)
4. **viewport-fit 및 safe-area 패딩** (`fa8ec77`)
5. **하단 패딩 추가** (입력 필드 겹침 방지) (`d16a35d`)
6. **터치 타겟 최적화** (`b77dcc3`)
7. **오버스크롤 바운스 비활성화** (`a818dc8`)
8. **오버스크롤 개선 및 iOS 제한사항 문서화** (`e607f06`)
9. **빈 placeholder 속성 제거** (`dc4bde9`)

---

## 🎉 오늘의 성과

### ✅ 완료된 작업
- RAG 시스템 완전 구현 (8개 Task 완료)
- 모바일 UI 최적화 (9개 개선사항)
- 전체 테스트 통과 (5/5)
- 문서화 완료 (디자인, 구현 계획, README)
- 원격 저장소에 20개 커밋 푸시

### 📈 주요 개선사항
- **성능**: 토큰 사용량 83-95% 감소
- **비용**: API 비용 대폭 절감 (무료 로컬 임베딩 사용)
- **품질**: 관련 글만 선택하여 답변 품질 유지
- **UX**: 모바일 환경 최적화

### 🚀 다음 단계
- [ ] 실제 사용자 피드백 수집
- [ ] RAG 검색 품질 모니터링
- [ ] 필요시 Top-K 값 조정 (현재 5개)
- [ ] 캐싱 최적화 고려

---

## 📝 기술 노트

### RAG 시스템 아키텍처
```
빌드 타임:
  articles.json → generate-embeddings.ts → embeddings.json

런타임:
  사용자 질문 → generateEmbedding() → cosineSimilarity()
  → findTopK() → 상위 5개 글 선택 → Claude API
```

### 폴백 메커니즘
- `embeddings.json` 없음 → 전체 글 사용
- 검색 결과 0개 → 전체 글 사용
- 임베딩 생성 실패 → 에러 로그 + 전체 글 사용

### 테스트 커버리지
- 단위 테스트: 코사인 유사도 계산 (3개 테스트)
- 통합 테스트: 전체 파이프라인 (3개 질문)
- 빌드 테스트: 자동 임베딩 생성

---

**작성일**: 2026-02-20
**작성자**: Claude Code
**총 커밋 수**: 20개
**총 작업 시간**: 약 4-5시간
