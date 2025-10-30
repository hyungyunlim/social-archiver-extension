# Debug Guide

## 콘솔에서 빠르게 디버깅하기

### 1. Background Service Worker 콘솔

`chrome://extensions/` → "service worker" 링크 클릭

```javascript
// 스토리지 확인
chrome.storage.sync.get(null, (data) => console.log('Sync Storage:', data));
chrome.storage.local.get(null, (data) => console.log('Local Storage:', data));

// 설정 확인
chrome.storage.sync.get('extensionSettings', (data) =>
  console.log('Settings:', JSON.stringify(data, null, 2))
);
```

### 2. Content Script 콘솔

페이스북/인스타/링크드인 페이지에서 F12 → Console

```javascript
// 현재 플랫폼 확인
console.log('Current platform:', window.location.hostname);

// Content script가 로드되었는지 확인
console.log('Content script loaded?', typeof chrome !== 'undefined');

// 메시지 보내기 테스트
chrome.runtime.sendMessage(
  { type: 'GET_PLATFORM_INFO' },
  (response) => console.log('Response:', response)
);
```

### 3. Popup 디버깅

확장 아이콘 우클릭 → "팝업 검사"

```javascript
// Svelte DevTools 사용 가능
// 컴포넌트 상태 확인 가능
```

## 자주 발생하는 문제

### ❌ "확장이 로드되지 않음"
```bash
# 해결방법
npm run build
# dist 폴더가 최신인지 확인
# Chrome에서 확장 새로고침 (⟳ 버튼)
```

### ❌ "플랫폼이 감지되지 않음"
- Manifest의 host_permissions 확인
- Content script가 inject되었는지 확인: DevTools → Sources → Content Scripts
- 페이지 새로고침 필요

### ❌ "설정이 저장되지 않음"
```javascript
// 콘솔에서 확인
chrome.storage.sync.get('extensionSettings', console.log);

// 강제 초기화
chrome.storage.sync.clear(() => console.log('Cleared'));
```

### ❌ "Popup이 열리지 않음"
- Popup inspector에서 에러 확인
- manifest.json의 action.default_popup 경로 확인
- Svelte 컴파일 에러 확인: `npm run build`

## 유용한 Chrome URLs

- `chrome://extensions/` - 확장 관리
- `chrome://inspect/#service-workers` - Service Worker 디버깅
- `chrome://serviceworker-internals/` - Service Worker 상세 정보

## 빌드 문제 해결

```bash
# 깨끗하게 다시 빌드
rm -rf dist node_modules
npm install
npm run build

# TypeScript 타입 체크
npm run type-check

# 개발 모드 (자동 리로드)
npm run dev
```

## 로그 레벨 조정

각 파일의 맨 위에 추가:

```typescript
const DEBUG = true;
const log = DEBUG ? console.log : () => {};
const error = console.error; // 에러는 항상 출력

// 사용
log('Debug message:', data);
error('Error occurred:', err);
```

## Performance 프로파일링

```javascript
// 콘솔에서 실행
console.time('archive');
// ... 아카이빙 작업 ...
console.timeEnd('archive');

// 메모리 사용량
console.log('Memory:', performance.memory);
```
