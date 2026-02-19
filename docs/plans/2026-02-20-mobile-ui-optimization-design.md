# 모바일 UI 최적화 디자인

**날짜:** 2026-02-20
**프로젝트:** brunch-chatbot
**목표:** 플레이스홀더 제거 및 모바일 키보드 대응 개선

## 문제 정의

### 현재 상태
1. 입력 필드에 그레이 플레이스홀더 텍스트("질문을 입력하세요...") 존재
2. 모바일에서 키보드가 올라올 때 입력창이 가려짐
3. 타이핑 중 전송 버튼이 화면 밖으로 나가는 경우 발생

### 사용자 피드백
- 플레이스홀더 텍스트가 불편함
- 모바일 환경에서 입력 UX가 최적화되지 않음

## 디자인 결정

### 1. 플레이스홀더 제거

**변경 사항:**
- `app/page.tsx` line 135의 `placeholder` 속성을 빈 문자열로 변경
- 깔끔한 입력창 제공

**근거:**
- 사용자 요청에 따름
- 헤더에 이미 충분한 컨텍스트 제공 ("이직, 이력서, AI 활용에 대한 조언")
- 빈 메시지 상태에서 예시 질문 표시됨

### 2. 모바일 고정 하단 입력창

**접근 방식:** CSS 미디어 쿼리 + Fixed Positioning

**모바일 (max-width: 768px):**
- 입력 영역: `position: fixed`, `bottom: 0`, `z-index: 50`
- 키보드 위에 항상 표시
- iOS safe-area 대응: `padding-bottom: env(safe-area-inset-bottom)`

**데스크톱 (min-width: 769px):**
- 현재 레이아웃 유지
- 반응형 분기로 기존 동작 보존

**메시지 영역 조정:**
- 모바일: `padding-bottom` 추가 (약 80px)
- 입력창이 메시지를 가리지 않도록 공간 확보

### 3. 모바일 사용성 향상

**터치 타겟 최적화:**
- 전송 버튼: 모바일에서 높이 증가 (`py-4`)
- 최소 너비 보장: `min-w-[80px]`
- Apple HIG/Material Design 권장 사항 준수 (최소 44px)

**입력창 개선:**
- 폰트 크기: `text-base` (16px 이상으로 iOS 자동 줌 방지)

**스크롤 동작:**
- `overscroll-behavior: none`으로 iOS 바운스 효과 차단
- 배경 스크롤 방지

## 기술 구현

### 파일 변경

**1. app/page.tsx**
- 플레이스홀더 제거
- 입력 컨테이너에 반응형 클래스 추가:
  - `fixed bottom-0 left-0 right-0 z-50 md:relative md:bottom-auto`
  - `pb-[env(safe-area-inset-bottom)]`
- 메시지 영역에 `pb-24 md:pb-4` 추가
- 전송 버튼에 `py-4 md:py-3` 및 `min-w-[80px]` 추가
- 입력창에 `text-base` 추가

**2. app/globals.css (선택사항)**
```css
@media (max-width: 768px) {
  body {
    overscroll-behavior: none;
  }
}
```

### CSS 클래스 구조

```tsx
// 입력 컨테이너
<div className="
  bg-white border-t border-gray-200 px-6 py-4
  fixed bottom-0 left-0 right-0 z-50
  md:relative md:bottom-auto
  pb-[env(safe-area-inset-bottom)]
">

// 메시지 영역
<div className="
  flex-1 overflow-y-auto px-6 py-4 space-y-4
  pb-24 md:pb-4
">

// 전송 버튼
<button className="
  px-6 py-4 md:py-3
  bg-blue-600 text-white rounded-lg
  font-medium hover:bg-blue-700
  disabled:bg-gray-300 disabled:cursor-not-allowed
  transition-colors
  min-w-[80px]
">

// 입력창
<input className="
  flex-1 px-4 py-3
  border border-gray-300 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  text-base
">
```

## 동작 시나리오

### 모바일
1. 페이지 로드 → 입력창이 하단에 고정
2. 키보드 열림 → 입력창이 키보드 바로 위에 표시
3. 메시지 스크롤 → 입력창은 하단에 계속 고정
4. 타이핑 → 버튼이 항상 보임, 화면 밖으로 나가지 않음

### 데스크톱
1. 페이지 로드 → 기존과 동일
2. 스크롤 → 기존과 동일
3. 입력 → 기존과 동일

## 테스트 전략

### 수동 테스트 (필수)

**모바일:**
- iOS Safari (iPhone SE, iPhone 14 Pro)
- Chrome Mobile (Android)
- 화면 회전 (가로/세로)
- 키보드 열림/닫힘 반복
- 긴 메시지 입력 시 UI 확인
- 768px 브레이크포인트 경계 확인

**데스크톱:**
- Chrome, Safari, Firefox
- 창 크기 조절
- 기존 기능 회귀 테스트

### 자동 테스트 (선택)

```tsx
// __tests__/mobile-ui.test.tsx
- placeholder가 빈 문자열인지 확인
- 모바일 뷰포트에서 fixed 클래스 적용 확인
- 데스크톱에서 relative 클래스 확인
```

### 크로스 브라우저

- iOS Safari 15+
- Chrome Mobile 90+
- Samsung Internet
- Firefox Mobile

## 성능 고려사항

- **리페인트 최소화:** `position: fixed`는 별도 레이어로 처리되어 성능 최적화
- **JavaScript 오버헤드:** 없음 (CSS only 솔루션)
- **렌더링 블로킹:** 없음
- **메모리:** 추가 메모리 사용 없음

## 엣지 케이스

| 케이스 | 대응 방법 |
|--------|-----------|
| 키보드 타입 변경 (한글↔영문) | 브라우저가 자동으로 입력창 위치 조정 |
| 화면 회전 | CSS 미디어 쿼리로 자동 대응 |
| 작은 화면 (iPhone SE) | safe-area-inset-bottom으로 대응 |
| 노치/Dynamic Island | env() 변수로 자동 대응 |
| 소프트 키보드 미표시 | 입력창이 하단에 고정되어 있어 문제없음 |
| 긴 입력 텍스트 | 입력창 높이는 고정, 텍스트는 스크롤 |

## 대안 검토

### 방식 1: CSS 미디어 쿼리 + Fixed Positioning ✅ 채택
- 구현 간단, 검증된 패턴
- 모든 브라우저 지원
- JavaScript 불필요

### 방식 2: VisualViewport API ❌ 기각
- 구현 복잡도 높음
- 일부 구형 브라우저 미지원
- 이 프로젝트에는 과도한 엔지니어링

### 방식 3: Hybrid ❌ 기각
- 방식 1로 충분히 해결 가능
- 추가 JavaScript 불필요

## 배포 전 체크리스트

- [ ] 플레이스홀더 제거 확인
- [ ] 모바일 Safari에서 키보드 테스트
- [ ] Android Chrome에서 키보드 테스트
- [ ] 데스크톱 회귀 테스트
- [ ] 768px 브레이크포인트 확인
- [ ] 화면 회전 테스트
- [ ] safe-area 대응 확인 (노치 있는 기기)
- [ ] 긴 메시지 입력 테스트
- [ ] 로딩 상태에서 UI 확인

## 향후 개선 가능사항

1. **타이핑 인디케이터:** 사용자가 타이핑 중일 때 버튼에 애니메이션 추가
2. **음성 입력:** 모바일에서 음성 입력 버튼 추가
3. **자동 높이 조절:** 입력창이 여러 줄일 때 자동 확장
4. **오프라인 대응:** 네트워크 끊김 시 입력창 비활성화

## 참고자료

- [iOS HIG - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/inputs)
- [Material Design - Touch Targets](https://m3.material.io/foundations/interaction/touch-targets)
- [CSS env() - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Mobile Web Best Practices](https://web.dev/mobile)
