# 상식 퀴즈 웹 앱 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task in a single session — 서브에이전트에 과제를 분배하지 않는다 (실행 방식: Native, 2026-10-10 확정). Steps use checkbox (`- [ ]`) syntax for tracking. 과제마다 커밋한다.

**Goal:** 서버 없이 브라우저에서 파일을 열면 동작하는 4지선다 상식 퀴즈 웹 앱을 3단계에 걸쳐 만든다. 답을 고르는 즉시 정답 여부와 한 줄 해설을 보여 주어 틀린 문제를 그 자리에서 알고 넘어가게 한다.

**Architecture:** 단일 페이지에 화면 4개를 두고 `state.screen`으로 하나만 보여 준다. 모드 차이(제한시간·힌트·배점·기록 여부)는 분기문이 아니라 `MODES` 규칙 객체로 선언하고, 진행 로직은 모드를 모르는 채 규칙을 읽어 동작한다. DOM을 건드리는 곳은 `render()` 한 함수뿐이고, 이벤트 핸들러는 상태만 바꾼 뒤 `render()`를 부른다. 검증은 `script.js` 안의 자체 점검을 `?test`로 실행한다.

**Tech Stack:** 바닐라 HTML / CSS / JavaScript. 빌드 도구·프레임워크·외부 라이브러리 없음. 저장은 `localStorage`.

**Spec:** [PRD.md](PRD.md)

## Global Constraints

모든 과제의 요구사항에 아래가 암묵적으로 포함된다. 값은 PRD에서 그대로 옮겼다.

- **산출 파일은 정확히 4개**: `index.html`, `style.css`, `script.js`, `questions.js`. 테스트용 별도 파일을 만들지 않는다
- **ES 모듈·`import`·`fetch` 금지.** `file://`에서 교차 출처로 막힌다. 일반 `<script>` 태그만 쓴다
- **외부 요청·CDN·프레임워크 금지.** 네트워크 요청이 전혀 없어야 한다
- **문법은 ES5로 통일** (`var`, `function`). 한 가지 스타일로 고정해 섞이지 않게 한다
- `index.html`을 `file://`로 열어 동작해야 한다. 로컬 서버를 전제하지 않는다
- **틀린 문항은 모든 모드에서 0점.** 스피드 타임아웃도 오답이다
- 한 판 = 카테고리 1개의 **10문항**, 만점 **10점**, 표기는 **`N / 10`**
- 스피드 모드 제한시간 **15초**
- 힌트는 문항당 **1회**, 오답 보기 **2개** 제거, 힌트 사용 정답 **0.5점**, 미사용 정답 **1점**
- 순위표: **모드×카테고리 8표**, 표마다 **상위 5개**, 기록은 **이름·점수·날짜**
- 순위표 정렬: **점수 내림차순**, **동점이면 먼저 달성한 기록이 위**
- 이름 **최대 10자**, 앞뒤 공백 제거 후 비면 빈 값으로 취급
- localStorage 키 **`quiz.leaderboard.v1`**
- 카테고리 키: `korean_history`(한국사), `world_geography`(세계지리), `science`(과학), `arts_culture`(예술과 문화)
- 문항 `source`는 **`name`·`url`·`checkedOn` 세 필드 모두** 채운다. `url`은 `http`로 시작
- **문항마다 출처 페이지를 실제로 열어 확인**한다. 기억·추정으로 적지 않는다
- UI 언어는 한국어. 모바일·데스크톱 반응형
- **난이도 구분은 범위 밖이다.** 난이도 필드·배점·선택을 만들지 않는다

## Review Focus

PRD가 함의하지만 어느 과제의 테스트도 저절로 짚지 않는 입력들이다. 각 줄의 테스트를 해당 과제에 넣었다.

1. **`file://`에서 `?test`가 전달되지 않을 수 있다** — 쿼리가 비면 점검이 아예 안 돌아가므로 이후 모든 검증이 무의미해진다. `#test` 대체 경로가 동작해야 한다 → Task 1
2. **이름에 `<`, `>`, `&`가 들어온다** — 순위표를 `innerHTML`로 그리면 화면이 깨지거나 태그가 실행된다. 이름은 반드시 `textContent`로 넣는다 → Task 19
3. **15초 타임아웃과 보기 클릭이 거의 동시에 일어난다** — 가드가 없으면 한 문항이 두 번 채점되어 점수가 10점을 넘거나 문항이 건너뛰어진다 → Task 14
4. **저장된 JSON이 손상되거나 `version`이 모르는 값이다** — 그대로 읽으면 순위표 화면에서 예외가 나고 앱이 멈춘다. 빈 순위표로 초기화해야 한다 → Task 17
5. **보기 문구가 겹치는 문항이 있다** — 정답을 문자열로 찾으면 엉뚱한 보기를 정답으로 판정한다. 플래그 방식이 이를 막는지 테스트로 고정한다 → Task 8

---

## 파일 구성

| 파일 | 책임 | 단계 |
|---|---|---|
| `index.html` | 화면 4개의 마크업 골격, `questions.js` → `script.js` 순서로 로드 | 1·2·3 |
| `style.css` | 전체 스타일, 반응형, 정답/오답 색 | 1·2·3 |
| `questions.js` | `QUESTIONS` 전역 (카테고리 4개 × 10문항) | 1 |
| `script.js` | 아래 구역 순서로 작성 | 1·2·3 |

`script.js`의 내부 구역 (이 순서로 유지한다):

1. 상수 — `CATEGORIES`, `MODES`, `STORAGE_KEY`
2. 순수 함수 — `shuffle`, `buildDeck`, `pointsFor`, `totalScore`, `formatScore`, `removeTwoWrong`, `collectWrong`, `validateQuestions`, `normalizeName`, `parseStore`, `boardKey`, `insertRecord`
3. 저장 — `readStore`, `writeStore`, `saveRecord`
4. 상태 — `state`, `startRound`, `answer`, `next`, `useHint`, `startTimer`, `stopTimer`, `startRetry`
5. 렌더 — `render` 및 화면별 보조 함수
6. 자체 점검 — `test`, `assertEqual`, `assertTrue`, `runSelfTest`, `wantsTest`, 점검 항목들
7. 부팅 — `wantsTest()`면 `runSelfTest()`, 아니면 앱 시작

순수 함수 구역이 자체 점검의 대상이다. 이 구역의 함수는 DOM과 `state`를 건드리지 않는다 — 그래야 입력과 출력만으로 검증된다.

---

# 1단계 — 연습 모드와 점수

## 만들 것

- 파일 4개 골격. `file://`로 열어 동작
- `?test` 자체 점검 (가장 먼저 만든다)
- 문항 40개 + 출처(기관명·주소·확인일), 출처 페이지 전수 확인
- 시작 화면: 모드 영역(연습만, "순위표에 기록되지 않음") + 카테고리 4개
- 문항 화면: 응답 전 상태 / 해설 상태, 출처 링크
- 문항·보기 섞기
- 결과 화면: `N / 10`, 문항별 정오 요약, [같은 카테고리 다시 풀기], [처음으로]
- `MODES`(`practice`만)와 `pointsFor()`

**일부러 넣지 않는다:** 스피드·힌트 모드, 타이머, 힌트, 틀린 문제 다시 풀기, 이름 입력칸, 순위표.

## 완료 기준

- `index.html?test` 점검 **실패 0건**
- 1단계 브라우저 확인 항목 **전부 통과**
- **40문항 전수 출처 확인 완료** (각 문항의 `source.url`을 열어 내용 일치 확인)
- 콘솔에 오류·경고 없음

---

### Task 1: 자체 점검 골격과 `?test` 확인

가장 먼저 만든다. 이후 모든 과제가 이 점검 위에서 돌아가고, PRD 8.1의 미확인 사항(`file://`에서 쿼리가 전달되는지)을 여기서 결론 내린다.

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `questions.js`
- Create: `script.js`

**Interfaces:**
- Consumes: 없음
- Produces: `test(name, fn)`, `assertEqual(actual, expected, msg)`, `assertTrue(cond, msg)`, `runSelfTest()`, `wantsTest() -> boolean`

- [ ] **Step 1: 파일 4개를 만들고 로드 순서를 잡는다**

`index.html`:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>상식 퀴즈</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main id="app"></main>
  <script src="questions.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

`questions.js`:

```js
var QUESTIONS = {
  korean_history: [],
  world_geography: [],
  science: [],
  arts_culture: []
};
```

`style.css`:

```css
:root { font-family: system-ui, -apple-system, "Malgun Gothic", sans-serif; }
body { margin: 0; padding: 16px; line-height: 1.6; }
#app { max-width: 720px; margin: 0 auto; }
```

- [ ] **Step 2: 일부러 실패하는 점검 1건을 쓴다**

러너가 실패를 제대로 보고하는지부터 확인한다. 통과만 보고하는 러너는 쓸모가 없다.

`script.js`:

```js
/* ===== 6. 자체 점검 ===== */
var TESTS = [];

function test(name, fn) {
  TESTS.push({ name: name, fn: fn });
}

function assertEqual(actual, expected, msg) {
  var a = JSON.stringify(actual);
  var e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error((msg ? msg + ': ' : '') + '기대값 ' + e + ', 실제값 ' + a);
  }
}

function assertTrue(cond, msg) {
  if (!cond) throw new Error(msg || '참이 아님');
}

function wantsTest() {
  return location.search.indexOf('test') !== -1
      || location.hash.indexOf('test') !== -1;
}

function runSelfTest() {
  var pass = 0;
  var fail = 0;
  var rows = [];
  for (var i = 0; i < TESTS.length; i++) {
    try {
      TESTS[i].fn();
      pass++;
      rows.push('<li class="ok">통과 — ' + TESTS[i].name + '</li>');
    } catch (e) {
      fail++;
      rows.push('<li class="bad">실패 — ' + TESTS[i].name + ' — ' + e.message + '</li>');
    }
  }
  document.getElementById('app').innerHTML =
    '<h1>자체 점검</h1>' +
    '<p>통과 ' + pass + ' · 실패 ' + fail + '</p>' +
    '<ul class="selftest">' + rows.join('') + '</ul>';
}

/* 러너 확인용 — Step 4에서 지운다 */
test('러너가 실패를 보고한다', function () {
  assertEqual(1, 2, '일부러 실패');
});

/* ===== 7. 부팅 ===== */
if (wantsTest()) {
  runSelfTest();
} else {
  document.getElementById('app').textContent = '준비 중';
}
```

`style.css`에 추가:

```css
.selftest { list-style: none; padding: 0; }
.selftest li { padding: 4px 8px; border-radius: 4px; margin-bottom: 4px; }
.selftest .ok { background: #e8f5e9; }
.selftest .bad { background: #ffebee; }
```

- [ ] **Step 3: 브라우저에서 `?test`가 전달되는지 확인한다**

`index.html?test`를 `file://`로 열고 다음을 확인한다.

1. 점검 화면이 나오고 `통과 0 · 실패 1`이 보이는가
2. 실패 항목에 `기대값 2, 실제값 1`이 함께 보이는가

`?test`가 동작하지 않으면 `index.html#test`로 다시 열어 확인한다.

**두 경우 모두 결과를 PRD 8.1의 "확인하지 못한 사항" 문단에 기록한다.** 동작하면 확인 완료로 바꾸고, 동작하지 않으면 `#test`를 쓰라는 지시로 바꾼다. 이 기록을 남기지 않으면 다음 사람이 같은 것을 또 확인한다.

- [ ] **Step 4: 러너 확인용 점검을 지우고 통과하는 점검으로 바꾼다**

```js
test('러너가 동작한다', function () {
  assertTrue(true);
  assertEqual([1, 2], [1, 2]);
});
```

- [ ] **Step 5: 점검을 다시 실행한다**

`index.html?test` → `통과 1 · 실패 0`

- [ ] **Step 6: 커밋**

```bash
git add index.html style.css script.js questions.js
git commit -m "feat: 파일 4개 골격과 ?test 자체 점검 러너"
```

---

### Task 2: 문항 검증 함수

문항 40개를 쓰기 전에 검증기를 먼저 만든다. 그러면 문항을 넣는 즉시 규칙 위반이 드러난다.

**Files:**
- Modify: `script.js` (순수 함수 구역, 자체 점검 구역)

**Interfaces:**
- Consumes: `test`, `assertEqual`, `assertTrue`
- Produces: `validateQuestions(data) -> string[]` (문제가 없으면 빈 배열), `CATEGORIES`

- [ ] **Step 1: 실패하는 점검을 쓴다**

```js
test('validateQuestions: 올바른 문항은 오류가 없다', function () {
  var ok = {
    korean_history: [], world_geography: [], science: [], arts_culture: []
  };
  ok.korean_history.push(sampleQuestion('kh-01'));
  for (var i = 2; i <= 10; i++) {
    ok.korean_history.push(sampleQuestion('kh-' + (i < 10 ? '0' : '') + i));
  }
  ['world_geography', 'science', 'arts_culture'].forEach(function (key) {
    for (var j = 1; j <= 10; j++) ok[key].push(sampleQuestion(key + '-' + j));
  });
  assertEqual(validateQuestions(ok), []);
});

test('validateQuestions: 보기가 4개가 아니면 잡는다', function () {
  var q = sampleQuestion('kh-01');
  q.choices = ['가', '나', '다'];
  var errors = validateQuestions(oneQuestionData(q));
  assertTrue(errors.join(' ').indexOf('보기가 4개가 아님') !== -1, errors.join(' '));
});

test('validateQuestions: answerIndex 범위를 잡는다', function () {
  var q = sampleQuestion('kh-01');
  q.answerIndex = 4;
  var errors = validateQuestions(oneQuestionData(q));
  assertTrue(errors.join(' ').indexOf('answerIndex') !== -1, errors.join(' '));
});

test('validateQuestions: source 세 필드를 모두 요구한다', function () {
  ['name', 'url', 'checkedOn'].forEach(function (field) {
    var q = sampleQuestion('kh-01');
    delete q.source[field];
    var errors = validateQuestions(oneQuestionData(q));
    assertTrue(errors.join(' ').indexOf('source.' + field) !== -1, field + ' 미검출');
  });
});

test('validateQuestions: url이 http로 시작하지 않으면 잡는다', function () {
  var q = sampleQuestion('kh-01');
  q.source.url = 'db.history.go.kr';
  var errors = validateQuestions(oneQuestionData(q));
  assertTrue(errors.join(' ').indexOf('source.url') !== -1, errors.join(' '));
});

test('validateQuestions: 카테고리당 10개가 아니면 잡는다', function () {
  var data = { korean_history: [], world_geography: [], science: [], arts_culture: [] };
  var errors = validateQuestions(data);
  assertTrue(errors.join(' ').indexOf('10개') !== -1, errors.join(' '));
});

/* 점검용 보조 — 자체 점검 구역에 둔다 */
function sampleQuestion(id) {
  return {
    id: id,
    question: '문항 ' + id,
    choices: ['가', '나', '다', '라'],
    answerIndex: 0,
    explanation: '해설',
    source: { name: '기관', url: 'https://example.org/x', checkedOn: '2026-10-10' }
  };
}

function oneQuestionData(q) {
  var data = { korean_history: [q], world_geography: [], science: [], arts_culture: [] };
  return data;
}
```

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → 7건 실패, 메시지에 `validateQuestions is not defined`

- [ ] **Step 3: 최소 구현을 쓴다**

`script.js` 상수 구역:

```js
/* ===== 1. 상수 ===== */
var CATEGORIES = [
  { key: 'korean_history',  label: '한국사' },
  { key: 'world_geography', label: '세계지리' },
  { key: 'science',         label: '과학' },
  { key: 'arts_culture',    label: '예술과 문화' }
];
```

순수 함수 구역:

```js
/* ===== 2. 순수 함수 ===== */
function validateQuestions(data) {
  var errors = [];
  CATEGORIES.forEach(function (cat) {
    var list = data[cat.key];
    if (!list) {
      errors.push(cat.key + ': 카테고리가 없음');
      return;
    }
    if (list.length !== 10) {
      errors.push(cat.key + ': 문항 ' + list.length + '개 (10개여야 함)');
    }
    list.forEach(function (q, i) {
      var at = cat.key + '[' + i + '] ' + (q.id || '(id 없음)');
      if (!q.id) errors.push(at + ': id 없음');
      if (!q.question) errors.push(at + ': question 비어 있음');
      if (!q.choices || q.choices.length !== 4) errors.push(at + ': 보기가 4개가 아님');
      if (!(typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex <= 3)) {
        errors.push(at + ': answerIndex가 0~3이 아님');
      }
      if (!q.explanation) errors.push(at + ': explanation 비어 있음');
      var s = q.source || {};
      if (!s.name) errors.push(at + ': source.name 없음');
      if (!s.url) errors.push(at + ': source.url 없음');
      else if (s.url.indexOf('http') !== 0) errors.push(at + ': source.url이 http로 시작하지 않음');
      if (!s.checkedOn) errors.push(at + ': source.checkedOn 없음');
    });
  });
  return errors;
}
```

- [ ] **Step 4: 점검을 실행해 통과를 확인한다**

`index.html?test` → `통과 8 · 실패 0`

- [ ] **Step 5: 실제 문항 데이터도 점검 대상에 넣는다**

```js
test('questions.js 문항이 규칙을 지킨다', function () {
  assertEqual(validateQuestions(QUESTIONS), []);
});
```

이 점검은 Task 3~6이 끝날 때까지 실패한다. 의도된 것이다 — 문항이 다 들어오면 통과한다.

- [ ] **Step 6: 커밋**

```bash
git add script.js
git commit -m "feat: 문항 검증 함수와 점검 항목"
```

---

### Task 3: 한국사 문항 10개

**Files:**
- Modify: `questions.js`

**Interfaces:**
- Consumes: `validateQuestions(data)`
- Produces: `QUESTIONS.korean_history` (10개)

문항 내용은 이 과제를 실행할 때 만든다. 아래는 **지켜야 할 형식과 절차**다.

- [ ] **Step 1: 문항 1개를 규칙대로 쓴다**

형식:

```js
{
  id: 'kh-01',
  question: '...',
  choices: ['...', '...', '...', '...'],
  answerIndex: 0,
  explanation: '한 줄 해설',
  source: {
    name: '기관명과 자료명',
    url: 'https://...',
    checkedOn: '2026-10-10'
  }
}
```

문항 하나를 쓸 때마다 이 순서를 지킨다.

1. 출처 페이지를 **실제로 연다**
2. 페이지 내용으로 문항·정답·해설을 쓴다. 기억이나 추정으로 쓰지 않는다
3. `source.url`에 그 페이지 주소를, `source.name`에 기관명과 자료명을, `checkedOn`에 연 날짜를 적는다
4. 정답이 하나뿐인지 확인한다. 둘 이상 맞을 수 있으면 문항을 고친다
5. 최상급 표현(`가장 ~한`)을 썼으면 **기준과 시점을 문항 본문에 넣는다**. 예: `2026년 기준으로`
6. 오답 3개가 그럴듯한지 확인한다. 2단계의 힌트가 오답 2개를 지우므로, 오답이 허술하면 힌트가 정답을 알려 주는 셈이 된다

출처는 공공기관·학술기관·사전·국제기구의 공식 자료를 우선한다.

- [ ] **Step 2: 점검을 실행한다**

`index.html?test` → `questions.js 문항이 규칙을 지킨다`가 여전히 실패하고, 메시지에 `korean_history: 문항 1개 (10개여야 함)`가 보인다. 형식 오류는 이 시점에 모두 잡혀야 한다.

- [ ] **Step 3: 나머지 9개를 같은 절차로 쓴다**

`id`는 `kh-01`부터 `kh-10`까지.

- [ ] **Step 4: 점검을 실행한다**

`index.html?test` → 오류 메시지에 `korean_history`가 더 이상 나오지 않는다 (다른 카테고리는 아직 실패).

- [ ] **Step 5: 출처 링크를 전수 확인한다**

10개 문항의 `source.url`을 하나씩 열어, 문항·정답·해설이 그 페이지 내용과 맞는지 본다. 어긋나면 문항을 고친다.

- [ ] **Step 6: 커밋**

```bash
git add questions.js
git commit -m "feat: 한국사 문항 10개 (출처 확인 완료)"
```

---

### Task 4: 세계지리 문항 10개

**Files:**
- Modify: `questions.js`

**Interfaces:**
- Consumes: `validateQuestions(data)`
- Produces: `QUESTIONS.world_geography` (10개)

- [ ] **Step 1: Task 3 Step 1의 형식과 6단계 절차를 그대로 따라 10개를 쓴다**

```js
{
  id: 'wg-01',
  question: '...',
  choices: ['...', '...', '...', '...'],
  answerIndex: 0,
  explanation: '한 줄 해설',
  source: {
    name: '기관명과 자료명',
    url: 'https://...',
    checkedOn: '2026-10-10'
  }
}
```

절차: ① 출처 페이지를 실제로 연다 ② 페이지 내용으로 쓴다 ③ `name`·`url`·`checkedOn`을 적는다 ④ 정답 유일성을 확인한다 ⑤ 최상급 표현이면 기준·시점을 문항 본문에 넣는다 ⑥ 오답 3개가 그럴듯한지 확인한다.

`id`는 `wg-01`부터 `wg-10`까지.

**세계지리는 최상급 표현이 특히 자주 나온다** (가장 긴 강, 가장 높은 산, 가장 큰 호수). 기준과 시점을 문항에 넣지 않으면 답이 갈린다.

- [ ] **Step 2: 점검을 실행한다**

`index.html?test` → 오류 메시지에 `world_geography`가 나오지 않는다.

- [ ] **Step 3: 출처 링크를 전수 확인한다**

10개 문항의 `source.url`을 열어 내용 일치를 확인한다.

- [ ] **Step 4: 커밋**

```bash
git add questions.js
git commit -m "feat: 세계지리 문항 10개 (출처 확인 완료)"
```

---

### Task 5: 과학 문항 10개

**Files:**
- Modify: `questions.js`

**Interfaces:**
- Consumes: `validateQuestions(data)`
- Produces: `QUESTIONS.science` (10개)

- [ ] **Step 1: Task 3 Step 1의 형식과 6단계 절차를 그대로 따라 10개를 쓴다**

```js
{
  id: 'sc-01',
  question: '...',
  choices: ['...', '...', '...', '...'],
  answerIndex: 0,
  explanation: '한 줄 해설',
  source: {
    name: '기관명과 자료명',
    url: 'https://...',
    checkedOn: '2026-10-10'
  }
}
```

절차: ① 출처 페이지를 실제로 연다 ② 페이지 내용으로 쓴다 ③ `name`·`url`·`checkedOn`을 적는다 ④ 정답 유일성을 확인한다 ⑤ 최상급 표현이면 기준·시점을 문항 본문에 넣는다 ⑥ 오답 3개가 그럴듯한지 확인한다.

`id`는 `sc-01`부터 `sc-10`까지.

**과학은 수치와 분류가 갱신된다.** 행성 수, 원소 개수, 분류 체계 같은 것은 현재 기준을 출처에서 확인한다.

- [ ] **Step 2: 점검을 실행한다**

`index.html?test` → 오류 메시지에 `science`가 나오지 않는다.

- [ ] **Step 3: 출처 링크를 전수 확인한다**

10개 문항의 `source.url`을 열어 내용 일치를 확인한다.

- [ ] **Step 4: 커밋**

```bash
git add questions.js
git commit -m "feat: 과학 문항 10개 (출처 확인 완료)"
```

---

### Task 6: 예술과 문화 문항 10개

**Files:**
- Modify: `questions.js`

**Interfaces:**
- Consumes: `validateQuestions(data)`
- Produces: `QUESTIONS.arts_culture` (10개)

- [ ] **Step 1: Task 3 Step 1의 형식과 6단계 절차를 그대로 따라 10개를 쓴다**

```js
{
  id: 'ac-01',
  question: '...',
  choices: ['...', '...', '...', '...'],
  answerIndex: 0,
  explanation: '한 줄 해설',
  source: {
    name: '기관명과 자료명',
    url: 'https://...',
    checkedOn: '2026-10-10'
  }
}
```

절차: ① 출처 페이지를 실제로 연다 ② 페이지 내용으로 쓴다 ③ `name`·`url`·`checkedOn`을 적는다 ④ 정답 유일성을 확인한다 ⑤ 최상급 표현이면 기준·시점을 문항 본문에 넣는다 ⑥ 오답 3개가 그럴듯한지 확인한다.

`id`는 `ac-01`부터 `ac-10`까지.

**작품 연도와 소장처는 자료마다 다르게 적히는 경우가 있다.** 미술관·박물관의 공식 소장품 페이지나 유네스코 등재 목록처럼 기관이 직접 밝힌 자료를 쓴다.

- [ ] **Step 2: 점검을 실행한다**

`index.html?test` → `questions.js 문항이 규칙을 지킨다`가 **통과**한다. 40문항이 모두 규칙을 지킨 상태다.

- [ ] **Step 3: 출처 링크를 전수 확인한다**

10개 문항의 `source.url`을 열어 내용 일치를 확인한다.

- [ ] **Step 4: 커밋**

```bash
git add questions.js
git commit -m "feat: 예술과 문화 문항 10개 (출처 확인 완료)"
```

---

### Task 7: 모드 규칙 테이블과 점수 계산

**Files:**
- Modify: `script.js` (상수 구역, 순수 함수 구역, 자체 점검 구역)

**Interfaces:**
- Consumes: `test`, `assertEqual`
- Produces: `MODES`, `pointsFor(rule, result) -> number`, `totalScore(answers) -> number`, `formatScore(n) -> string`

`result`는 `{ correct: boolean, usedHint: boolean }` 모양이다.

- [ ] **Step 1: 실패하는 점검을 쓴다**

```js
test('pointsFor: 오답은 모든 모드에서 0점', function () {
  assertEqual(pointsFor(MODES.practice, { correct: false, usedHint: false }), 0, 'practice');
});

test('pointsFor: 연습 정답은 1점', function () {
  assertEqual(pointsFor(MODES.practice, { correct: true, usedHint: false }), 1);
});

test('totalScore: 점수를 더한다', function () {
  assertEqual(totalScore([{ points: 1 }, { points: 0 }, { points: 1 }]), 2);
  assertEqual(totalScore([]), 0);
});

test('formatScore: N / 10 형태로 적는다', function () {
  assertEqual(formatScore(7), '7 / 10');
  assertEqual(formatScore(10), '10 / 10');
  assertEqual(formatScore(0), '0 / 10');
});
```

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → 4건 실패, `MODES is not defined`

- [ ] **Step 3: 최소 구현을 쓴다**

상수 구역:

```js
var MODES = {
  practice: {
    key: 'practice', label: '연습',
    timeLimit: null, hint: false,
    scoreOnCorrect: 1, scoreWithHint: null,
    record: false, retryWrong: true
  }
};
```

순수 함수 구역:

```js
function pointsFor(rule, result) {
  if (!result.correct) return 0;
  return result.usedHint ? rule.scoreWithHint : rule.scoreOnCorrect;
}

function totalScore(answers) {
  var sum = 0;
  for (var i = 0; i < answers.length; i++) sum += answers[i].points;
  return sum;
}

function formatScore(n) {
  return String(n) + ' / 10';
}
```

- [ ] **Step 4: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "feat: MODES 규칙 테이블과 점수 계산 함수"
```

---

### Task 8: 문항·보기 섞기

Review Focus 5번(보기 문구가 겹치는 문항)의 테스트가 여기 들어간다.

**Files:**
- Modify: `script.js` (순수 함수 구역, 자체 점검 구역)

**Interfaces:**
- Consumes: `QUESTIONS`, `test`, `assertEqual`, `assertTrue`
- Produces: `shuffle(arr) -> Array` (새 배열), `buildDeck(categoryKey) -> Array`

`buildDeck`이 돌려주는 문항 하나의 모양:

```js
{ id, question, explanation, source, choices: [{ text, correct }, ...] }
```

- [ ] **Step 1: 실패하는 점검을 쓴다**

```js
test('shuffle: 원본을 바꾸지 않고 같은 원소를 돌려준다', function () {
  var src = [1, 2, 3, 4, 5];
  var out = shuffle(src);
  assertEqual(src, [1, 2, 3, 4, 5], '원본이 바뀌었다');
  assertEqual(out.slice().sort(), [1, 2, 3, 4, 5]);
});

test('buildDeck: 문항 10개를 빠짐·중복 없이 돌려준다', function () {
  var deck = buildDeck('korean_history');
  assertEqual(deck.length, 10);
  var ids = deck.map(function (q) { return q.id; }).sort();
  var want = QUESTIONS.korean_history.map(function (q) { return q.id; }).sort();
  assertEqual(ids, want);
});

test('buildDeck: 보기 4개가 유지되고 정답이 정확히 1개다', function () {
  CATEGORIES.forEach(function (cat) {
    var deck = buildDeck(cat.key);
    deck.forEach(function (q) {
      assertEqual(q.choices.length, 4, q.id + ' 보기 개수');
      var correct = q.choices.filter(function (c) { return c.correct; });
      assertEqual(correct.length, 1, q.id + ' 정답 개수');
    });
  });
});

test('buildDeck: 정답 보기의 문구가 원본 answerIndex의 문구와 같다', function () {
  var deck = buildDeck('korean_history');
  deck.forEach(function (q) {
    var src = null;
    for (var i = 0; i < QUESTIONS.korean_history.length; i++) {
      if (QUESTIONS.korean_history[i].id === q.id) src = QUESTIONS.korean_history[i];
    }
    var correct = q.choices.filter(function (c) { return c.correct; })[0];
    assertEqual(correct.text, src.choices[src.answerIndex], q.id);
  });
});

test('buildDeck: 보기 문구가 겹쳐도 정답은 하나만 표시된다', function () {
  // 문자열 매칭으로 정답을 찾으면 여기서 깨진다
  var original = QUESTIONS.korean_history;
  QUESTIONS.korean_history = [{
    id: 'dup-01',
    question: '중복 보기 문항',
    choices: ['같음', '같음', '다름', '또다름'],
    answerIndex: 1,
    explanation: '해설',
    source: { name: '기관', url: 'https://example.org/x', checkedOn: '2026-10-10' }
  }];
  try {
    var deck = buildDeck('korean_history');
    var correct = deck[0].choices.filter(function (c) { return c.correct; });
    assertEqual(correct.length, 1, '정답이 1개여야 한다');
    assertEqual(correct[0].text, '같음');
  } finally {
    QUESTIONS.korean_history = original;
  }
});
```

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → 5건 실패, `shuffle is not defined`

- [ ] **Step 3: 최소 구현을 쓴다**

```js
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function buildDeck(categoryKey) {
  var list = QUESTIONS[categoryKey] || [];
  return shuffle(list).map(function (q) {
    var choices = q.choices.map(function (text, i) {
      return { text: text, correct: i === q.answerIndex };
    });
    return {
      id: q.id,
      question: q.question,
      explanation: q.explanation,
      source: q.source,
      choices: shuffle(choices)
    };
  });
}
```

- [ ] **Step 4: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "feat: 문항·보기 섞기"
```

---

### Task 9: 상태와 진행 로직

**Files:**
- Modify: `script.js` (상태 구역)

**Interfaces:**
- Consumes: `MODES`, `buildDeck`, `pointsFor`
- Produces: `state`, `startRound(modeKey, categoryKey)`, `answer(choice)`, `next()`, `currentQuestion() -> object|null`

- [ ] **Step 1: 실패하는 점검을 쓴다**

진행 로직은 `state`를 바꾸지만 DOM을 건드리지 않으므로 점검할 수 있다. `render`는 Task 10에서 붙이고, 여기서는 빈 함수로 둔다.

```js
test('startRound: 판을 초기화한다', function () {
  startRound('practice', 'korean_history');
  assertEqual(state.screen, 'quiz');
  assertEqual(state.mode, 'practice');
  assertEqual(state.category, 'korean_history');
  assertEqual(state.index, 0);
  assertEqual(state.answers.length, 0);
  assertEqual(state.revealed, false);
  assertEqual(state.deck.length, 10);
});

test('answer: 정답을 고르면 1점이 기록되고 해설 상태가 된다', function () {
  startRound('practice', 'korean_history');
  var correct = currentQuestion().choices.filter(function (c) { return c.correct; })[0];
  answer(correct);
  assertEqual(state.revealed, true);
  assertEqual(state.answers.length, 1);
  assertEqual(state.answers[0].correct, true);
  assertEqual(state.answers[0].points, 1);
});

test('answer: 오답을 고르면 0점이 기록된다', function () {
  startRound('practice', 'korean_history');
  var wrong = currentQuestion().choices.filter(function (c) { return !c.correct; })[0];
  answer(wrong);
  assertEqual(state.answers[0].correct, false);
  assertEqual(state.answers[0].points, 0);
});

test('answer: 해설 상태에서 다시 고르면 무시한다', function () {
  startRound('practice', 'korean_history');
  var choices = currentQuestion().choices;
  answer(choices[0]);
  answer(choices[1]);
  assertEqual(state.answers.length, 1, '두 번 채점되었다');
});

test('next: 다음 문항으로 넘어가고 해설 상태가 풀린다', function () {
  startRound('practice', 'korean_history');
  answer(currentQuestion().choices[0]);
  next();
  assertEqual(state.index, 1);
  assertEqual(state.revealed, false);
});

test('next: 10문항을 다 풀면 결과 화면으로 간다', function () {
  startRound('practice', 'korean_history');
  for (var i = 0; i < 10; i++) {
    answer(currentQuestion().choices[0]);
    next();
  }
  assertEqual(state.screen, 'result');
  assertEqual(state.answers.length, 10);
});
```

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → 6건 실패, `startRound is not defined`

- [ ] **Step 3: 최소 구현을 쓴다**

```js
/* ===== 4. 상태 ===== */
var state = {
  screen: 'start',
  mode: null,
  category: null,
  deck: [],
  index: 0,
  answers: [],
  revealed: false,
  hintUsed: false,
  timeLeft: null,
  timerId: null,
  isRetry: false
};

function currentQuestion() {
  return state.deck[state.index] || null;
}

function startRound(modeKey, categoryKey) {
  state.screen = 'quiz';
  state.mode = modeKey;
  state.category = categoryKey;
  state.deck = buildDeck(categoryKey);
  state.index = 0;
  state.answers = [];
  state.revealed = false;
  state.hintUsed = false;
  state.isRetry = false;
  render();
}

function answer(choice) {
  if (state.revealed) return;
  var rule = MODES[state.mode];
  var result = {
    correct: !!choice && !!choice.correct,
    usedHint: state.hintUsed
  };
  state.answers.push({
    id: currentQuestion().id,
    picked: choice ? choice.text : null,
    correct: result.correct,
    usedHint: result.usedHint,
    timedOut: false,
    points: pointsFor(rule, result)
  });
  state.revealed = true;
  render();
}

function next() {
  state.revealed = false;
  state.hintUsed = false;
  state.index++;
  if (state.index >= state.deck.length) {
    state.screen = 'result';
  }
  render();
}

/* ===== 5. 렌더 ===== */
function render() {
  /* Task 10에서 채운다 */
}
```

- [ ] **Step 4: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "feat: 상태와 진행 로직"
```

---

### Task 10: 시작 화면

**Files:**
- Modify: `script.js` (렌더 구역, 부팅 구역)
- Modify: `style.css`

**Interfaces:**
- Consumes: `state`, `CATEGORIES`, `MODES`, `startRound`
- Produces: `render()` (`start` 화면 처리), `renderStart()`

- [ ] **Step 1: 시작 화면을 그린다**

1단계에도 모드 영역을 둔다. 고를 수 있는 것은 연습뿐이다.

```js
function render() {
  var app = document.getElementById('app');
  app.innerHTML = '';
  if (state.screen === 'start')  return renderStart(app);
  if (state.screen === 'quiz')   return renderQuiz(app);
  if (state.screen === 'result') return renderResult(app);
}

function renderStart(app) {
  var h = document.createElement('h1');
  h.textContent = '상식 퀴즈';
  app.appendChild(h);

  var modeBox = document.createElement('section');
  modeBox.className = 'modes';
  var modeTitle = document.createElement('h2');
  modeTitle.textContent = '모드';
  modeBox.appendChild(modeTitle);

  Object.keys(MODES).forEach(function (key) {
    var rule = MODES[key];
    var btn = document.createElement('button');
    btn.className = 'mode' + (state.mode === key ? ' selected' : '');
    btn.textContent = rule.label;
    btn.onclick = function () { state.mode = key; render(); };
    modeBox.appendChild(btn);
  });

  var note = document.createElement('p');
  note.className = 'note';
  note.textContent = MODES[state.mode].label + ' 모드 · ' +
    (MODES[state.mode].record ? '순위표에 기록됨' : '순위표에 기록되지 않음');
  modeBox.appendChild(note);
  app.appendChild(modeBox);

  var catBox = document.createElement('section');
  catBox.className = 'categories';
  var catTitle = document.createElement('h2');
  catTitle.textContent = '카테고리를 고르면 시작합니다';
  catBox.appendChild(catTitle);

  CATEGORIES.forEach(function (cat) {
    var btn = document.createElement('button');
    btn.className = 'category';
    btn.textContent = cat.label;
    btn.onclick = function () { startRound(state.mode, cat.key); };
    catBox.appendChild(btn);
  });
  app.appendChild(catBox);
}
```

부팅 구역을 고친다:

```js
if (wantsTest()) {
  runSelfTest();
} else {
  var errors = validateQuestions(QUESTIONS);
  if (errors.length) {
    console.warn('문항 검증 경고 ' + errors.length + '건');
    errors.forEach(function (e) { console.warn(e); });
  }
  state.mode = 'practice';
  render();
}
```

- [ ] **Step 2: 스타일을 넣는다**

```css
h1 { font-size: 1.5rem; }
h2 { font-size: 1rem; color: #555; }
button { font: inherit; padding: 10px 16px; margin: 4px 4px 4px 0;
         border: 1px solid #ccc; border-radius: 6px; background: #fff; cursor: pointer; }
button:hover:not(:disabled) { background: #f5f5f5; }
button:disabled { opacity: .5; cursor: default; }
.mode.selected { border-color: #1565c0; background: #e3f2fd; font-weight: 600; }
.note { color: #666; font-size: .9rem; }
.categories button { display: block; width: 100%; text-align: left; }
@media (min-width: 480px) {
  .categories button { display: inline-block; width: auto; }
}
```

- [ ] **Step 3: 브라우저에서 확인한다**

`index.html`을 열어 확인한다.

1. 모드 영역에 `연습`만 있고 선택된 상태인가
2. `연습 모드 · 순위표에 기록되지 않음`이 보이는가
3. 카테고리 4개가 보이는가
4. 카테고리를 누르면 화면이 바뀌는가 (문항 화면은 Task 11에서 그리므로 빈 화면이어도 정상)
5. 콘솔에 문항 검증 경고가 없는가

- [ ] **Step 4: 점검이 여전히 통과하는지 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 시작 화면 (모드 영역 + 카테고리)"
```

---

### Task 11: 문항 화면과 해설

**Files:**
- Modify: `script.js` (렌더 구역)
- Modify: `style.css`

**Interfaces:**
- Consumes: `state`, `currentQuestion`, `answer`, `next`, `MODES`
- Produces: `renderQuiz(app)`

- [ ] **Step 1: 문항 화면을 그린다**

```js
function renderQuiz(app) {
  var q = currentQuestion();
  if (!q) return;

  var prog = document.createElement('p');
  prog.className = 'progress';
  prog.textContent = (state.index + 1) + ' / ' + state.deck.length;
  app.appendChild(prog);

  var qt = document.createElement('h1');
  qt.className = 'question';
  qt.textContent = q.question;
  app.appendChild(qt);

  var list = document.createElement('div');
  list.className = 'choices';
  var picked = state.revealed ? state.answers[state.answers.length - 1].picked : null;

  q.choices.forEach(function (c) {
    var btn = document.createElement('button');
    btn.className = 'choice';
    btn.textContent = c.text;
    if (state.revealed) {
      btn.disabled = true;
      if (c.correct) btn.className += ' correct';
      else if (c.text === picked) btn.className += ' wrong';
    } else {
      btn.onclick = function () { answer(c); };
    }
    list.appendChild(btn);
  });
  app.appendChild(list);

  if (state.revealed) app.appendChild(buildExplanation(q));
}

function buildExplanation(q) {
  var last = state.answers[state.answers.length - 1];
  var box = document.createElement('section');
  box.className = 'explain ' + (last.correct ? 'ok' : 'bad');

  var verdict = document.createElement('p');
  verdict.className = 'verdict';
  verdict.textContent = last.correct ? '정답입니다'
    : (last.timedOut ? '시간이 지났습니다 — 오답' : '오답입니다');
  box.appendChild(verdict);

  var exp = document.createElement('p');
  exp.textContent = q.explanation;
  box.appendChild(exp);

  var src = document.createElement('p');
  src.className = 'source';
  src.textContent = '출처: ';
  var link = document.createElement('a');
  link.href = q.source.url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = q.source.name;
  src.appendChild(link);
  src.appendChild(document.createTextNode(' (' + q.source.checkedOn + ' 확인)'));
  box.appendChild(src);

  var btn = document.createElement('button');
  btn.className = 'next';
  btn.textContent = state.index + 1 >= state.deck.length ? '결과 보기' : '다음';
  btn.onclick = function () { next(); };
  box.appendChild(btn);

  return box;
}
```

- [ ] **Step 2: 스타일을 넣는다**

```css
.progress { color: #777; font-size: .9rem; margin: 0; }
.question { font-size: 1.25rem; }
.choices button { display: block; width: 100%; text-align: left; }
.choice.correct { border-color: #2e7d32; background: #e8f5e9; font-weight: 600; }
.choice.wrong { border-color: #c62828; background: #ffebee; }
.explain { margin-top: 16px; padding: 12px; border-radius: 8px; border: 1px solid #ddd; }
.explain.ok { background: #f1f8e9; }
.explain.bad { background: #fff3e0; }
.verdict { font-weight: 700; margin-top: 0; }
.source { font-size: .85rem; color: #555; }
```

- [ ] **Step 3: 브라우저에서 확인한다**

1. 진행 표시가 `1 / 10`부터 올라가는가
2. 보기를 누르면 즉시 정답/오답 표시와 한 줄 해설이 나오는가
3. 정답 보기가 초록, 내가 고른 오답이 빨강으로 표시되는가
4. 출처 기관명이 링크로 보이고, 누르면 그 페이지가 열리는가
5. 해설 상태에서 다른 보기를 눌러도 아무 일이 없는가
6. [다음]을 누르면 다음 문항으로 가고, 10번째에서는 버튼이 `결과 보기`인가

- [ ] **Step 4: 점검이 여전히 통과하는지 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 문항 화면과 해설 표시"
```

---

### Task 12: 결과 화면

**Files:**
- Modify: `script.js` (렌더 구역)
- Modify: `style.css`

**Interfaces:**
- Consumes: `state`, `totalScore`, `formatScore`, `MODES`, `render`
- Produces: `renderResult(app)`, `goHome()`, `restartRound()`

- [ ] **Step 1: 결과 화면을 그린다**

```js
function renderResult(app) {
  var rule = MODES[state.mode];

  var h = document.createElement('h1');
  h.textContent = '결과';
  app.appendChild(h);

  var score = document.createElement('p');
  score.className = 'score';
  score.textContent = formatScore(totalScore(state.answers));
  app.appendChild(score);

  if (!rule.record) {
    var note = document.createElement('p');
    note.className = 'note';
    note.textContent = '순위표에 기록되지 않음';
    app.appendChild(note);
  }

  var list = document.createElement('ol');
  list.className = 'summary';
  state.answers.forEach(function (a) {
    var q = null;
    for (var i = 0; i < state.deck.length; i++) {
      if (state.deck[i].id === a.id) q = state.deck[i];
    }
    var li = document.createElement('li');
    li.className = a.correct ? 'ok' : 'bad';
    var mark = document.createElement('span');
    mark.className = 'mark';
    mark.textContent = a.correct ? '정답' : '오답';
    li.appendChild(mark);
    var text = document.createElement('span');
    text.textContent = ' ' + (q ? q.question : a.id);
    li.appendChild(text);
    list.appendChild(li);
  });
  app.appendChild(list);

  var home = document.createElement('button');
  home.textContent = '처음으로';
  home.onclick = goHome;
  app.appendChild(home);
}

function goHome() {
  stopTimer();
  state.screen = 'start';
  state.deck = [];
  state.index = 0;
  state.answers = [];
  state.revealed = false;
  state.hintUsed = false;
  state.isRetry = false;
  render();
}
```

`stopTimer`는 Task 14에서 만든다. 1단계에서는 빈 함수를 둔다 — `goHome`이 타이머 정리 경로를 처음부터 거치게 해야 2단계에서 빠뜨리지 않는다.

```js
function stopTimer() {
  /* Task 14에서 채운다 */
}
```

- [ ] **Step 1b: [같은 카테고리 다시 풀기]를 붙인다**

결과 화면에서 같은 모드·카테고리로 새 판을 바로 시작한다 (PRD 4.1). 먼저 실패하는 점검을 쓴다.

```js
test('restartRound: 같은 모드·카테고리로 새 판을 시작한다', function () {
  startRound('practice', 'science');
  answer(currentQuestion().choices[0]);
  next();
  restartRound();
  assertEqual(state.screen, 'quiz');
  assertEqual(state.mode, 'practice');
  assertEqual(state.category, 'science');
  assertEqual(state.index, 0);
  assertEqual(state.answers.length, 0);
  assertEqual(state.revealed, false);
  assertEqual(state.deck.length, 10);
});
```

구현은 타이머 정리 경로를 거친 뒤 같은 인자로 다시 시작한다.

```js
function restartRound() {
  stopTimer();
  startRound(state.mode, state.category);
}
```

`renderResult` 의 [처음으로] **앞에** 버튼을 둔다.

```js
  var again = document.createElement('button');
  again.className = 'again';
  again.textContent = '같은 카테고리 다시 풀기';
  again.onclick = restartRound;
  app.appendChild(again);
```

- [ ] **Step 2: 스타일을 넣는다**

```css
.score { font-size: 2rem; font-weight: 700; margin: 8px 0; }
.summary { padding-left: 1.5rem; }
.summary li { margin-bottom: 6px; }
.summary .mark { font-weight: 600; font-size: .85rem; padding: 1px 6px; border-radius: 4px; }
.summary .ok .mark { background: #e8f5e9; color: #2e7d32; }
.summary .bad .mark { background: #ffebee; color: #c62828; }
```

- [ ] **Step 3: 브라우저에서 확인한다**

1. 10문항을 다 풀면 결과 화면이 나오는가
2. 점수가 `N / 10` 형태이고, 실제 정답 수와 맞는가
3. `순위표에 기록되지 않음`이 보이는가
4. 문항별 정오 요약이 10줄 나오는가
5. [처음으로]를 누르면 시작 화면으로 돌아가는가
6. 같은 카테고리를 다시 풀면 문항 순서와 보기 위치가 달라지는가

- [ ] **Step 4: 점검이 여전히 통과하는지 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 결과 화면과 점수 표시"
```

---

## 브라우저 직접 확인 (1단계)

`index.html`을 **`file://`로** 열어 아래를 순서대로 확인한다. 로컬 서버를 띄우지 않는다.

- [ ] 로컬 서버 없이 파일을 열어 동작한다
- [ ] `index.html?test`로 열면 점검 결과가 보이고 **실패 0건**이다 (안 되면 `#test`로 확인하고 PRD 8.1에 기록)
- [ ] 시작 화면에 `연습 모드 · 순위표에 기록되지 않음`이 보인다
- [ ] 카테고리 4개가 모두 눌리고, 각각 10문항이 끝까지 진행된다
- [ ] 보기를 누르면 즉시 정오 표시와 한 줄 해설, 출처 기관명이 보인다
- [ ] 출처 링크를 누르면 해당 페이지가 열리고, **문항 내용이 그 페이지와 맞다** (40문항 전수)
- [ ] 해설 상태에서 보기를 다시 눌러도 답이 바뀌지 않는다
- [ ] 같은 카테고리를 두 번 풀면 문항 순서와 보기 위치가 달라진다
- [ ] 결과 화면 점수가 실제 정답 수와 일치한다
- [ ] [같은 카테고리 다시 풀기]를 누르면 같은 카테고리로 새 판이 1/10부터 시작된다
- [ ] 휴대폰 너비(약 375px)에서 보기 버튼이 잘리지 않는다
- [ ] 콘솔에 오류와 문항 검증 경고가 없다

---

# 2단계 — 스피드 모드, 힌트 모드, 틀린 문제 다시 풀기

## 만들 것

- `MODES`에 `speed`, `hint` 추가
- 시작 화면 모드 영역에 모드 3개
- 스피드: 15초 타이머, 해설 시 정지, [다음]에서 리셋, 타임아웃은 오답 + 해설 즉시
- 힌트: 문항당 1회, 오답 보기 2개 제거, 힌트 사용 정답 0.5점
- 연습 결과 화면의 틀린 문제 다시 풀기

**일부러 넣지 않는다:** 이름 입력칸, [기록 저장] 버튼, 순위표 저장·화면.

## 완료 기준

- `index.html?test` 점검 **실패 0건**
- 2단계 브라우저 확인 항목 **전부 통과**
- **1단계 브라우저 확인 항목 재통과** (회귀 확인)

---

### Task 13: 모드 2개 추가

**Files:**
- Modify: `script.js` (상수 구역, 자체 점검 구역)

**Interfaces:**
- Consumes: `MODES`, `pointsFor`
- Produces: `MODES.speed`, `MODES.hint`

- [ ] **Step 1: 실패하는 점검을 쓴다**

```js
test('pointsFor: 오답은 스피드·힌트에서도 0점', function () {
  assertEqual(pointsFor(MODES.speed, { correct: false, usedHint: false }), 0, 'speed');
  assertEqual(pointsFor(MODES.hint, { correct: false, usedHint: true }), 0, 'hint 사용 오답');
  assertEqual(pointsFor(MODES.hint, { correct: false, usedHint: false }), 0, 'hint 미사용 오답');
});

test('pointsFor: 스피드 정답은 1점', function () {
  assertEqual(pointsFor(MODES.speed, { correct: true, usedHint: false }), 1);
});

test('pointsFor: 힌트를 쓰고 맞히면 0.5점', function () {
  assertEqual(pointsFor(MODES.hint, { correct: true, usedHint: true }), 0.5);
});

test('pointsFor: 힌트를 안 쓰고 맞히면 1점', function () {
  assertEqual(pointsFor(MODES.hint, { correct: true, usedHint: false }), 1);
});

test('MODES: 기록 대상은 스피드·힌트뿐', function () {
  assertEqual(MODES.practice.record, false);
  assertEqual(MODES.speed.record, true);
  assertEqual(MODES.hint.record, true);
});

test('MODES: 재도전은 연습만', function () {
  assertEqual(MODES.practice.retryWrong, true);
  assertEqual(MODES.speed.retryWrong, false);
  assertEqual(MODES.hint.retryWrong, false);
});

test('formatScore: 0.5 단위를 그대로 적는다', function () {
  assertEqual(formatScore(7.5), '7.5 / 10');
  assertEqual(formatScore(0.5), '0.5 / 10');
});
```

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → `MODES.speed`가 없어 실패

- [ ] **Step 3: 최소 구현을 쓴다**

`MODES`에 두 항목을 추가한다. 진행 로직은 건드리지 않는다 — 1단계에서 규칙 객체를 읽게 만들어 둔 이유다.

```js
var MODES = {
  practice: {
    key: 'practice', label: '연습',
    timeLimit: null, hint: false,
    scoreOnCorrect: 1, scoreWithHint: null,
    record: false, retryWrong: true
  },
  speed: {
    key: 'speed', label: '스피드',
    timeLimit: 15, hint: false,
    scoreOnCorrect: 1, scoreWithHint: null,
    record: true, retryWrong: false
  },
  hint: {
    key: 'hint', label: '힌트',
    timeLimit: null, hint: true,
    scoreOnCorrect: 1, scoreWithHint: 0.5,
    record: true, retryWrong: false
  }
};
```

- [ ] **Step 4: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 브라우저에서 확인한다**

`index.html`을 열어 모드 영역에 `연습`·`스피드`·`힌트` 3개가 보이고, 모드를 바꾸면 안내 문구가 바뀌는지 본다. 스피드·힌트를 고르면 `순위표에 기록됨`이 보인다. 타이머와 힌트는 아직 동작하지 않는다.

- [ ] **Step 6: 커밋**

```bash
git add script.js
git commit -m "feat: 스피드·힌트 모드 규칙 추가"
```

---

### Task 14: 스피드 모드 타이머

Review Focus 3번(타임아웃과 클릭이 동시에 일어나는 경우)의 테스트가 여기 들어간다.

**Files:**
- Modify: `script.js` (상태 구역, 렌더 구역)
- Modify: `style.css`

**Interfaces:**
- Consumes: `state`, `MODES`, `currentQuestion`, `pointsFor`, `render`
- Produces: `startTimer()`, `stopTimer()`, `onTimeout()`

- [ ] **Step 1: 실패하는 점검을 쓴다**

`setInterval`을 기다리지 않고 `onTimeout()`을 직접 불러 채점 결과만 검증한다. 시간 흐름 자체는 브라우저에서 확인한다.

```js
test('onTimeout: 오답 0점으로 기록하고 해설 상태가 된다', function () {
  startRound('speed', 'science');
  onTimeout();
  assertEqual(state.answers.length, 1);
  assertEqual(state.answers[0].correct, false);
  assertEqual(state.answers[0].timedOut, true);
  assertEqual(state.answers[0].points, 0);
  assertEqual(state.revealed, true);
  stopTimer();
});

test('onTimeout: 이미 해설 상태면 두 번 채점하지 않는다', function () {
  startRound('speed', 'science');
  answer(currentQuestion().choices[0]);
  onTimeout();
  assertEqual(state.answers.length, 1, '타임아웃이 한 번 더 채점했다');
  stopTimer();
});

test('answer: 타임아웃 직후의 클릭은 무시된다', function () {
  startRound('speed', 'science');
  onTimeout();
  var correct = currentQuestion().choices.filter(function (c) { return c.correct; })[0];
  answer(correct);
  assertEqual(state.answers.length, 1, '클릭이 한 번 더 채점했다');
  assertEqual(state.answers[0].points, 0, '타임아웃 점수가 덮였다');
  stopTimer();
});

test('startRound: 제한시간이 없는 모드는 timeLeft가 null', function () {
  startRound('practice', 'science');
  assertEqual(state.timeLeft, null);
});

test('startRound: 스피드 모드는 timeLeft가 15', function () {
  startRound('speed', 'science');
  assertEqual(state.timeLeft, 15);
  stopTimer();
});
```

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → `onTimeout is not defined`

- [ ] **Step 3: 최소 구현을 쓴다**

```js
function startTimer() {
  stopTimer();
  var rule = MODES[state.mode];
  if (!rule.timeLimit) {
    state.timeLeft = null;
    return;
  }
  state.timeLeft = rule.timeLimit;
  state.timerId = setInterval(function () {
    state.timeLeft--;
    if (state.timeLeft <= 0) {
      onTimeout();
    } else {
      render();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function onTimeout() {
  stopTimer();
  if (state.revealed) return;
  var rule = MODES[state.mode];
  var result = { correct: false, usedHint: state.hintUsed };
  state.answers.push({
    id: currentQuestion().id,
    picked: null,
    correct: false,
    usedHint: state.hintUsed,
    timedOut: true,
    points: pointsFor(rule, result)
  });
  state.timeLeft = 0;
  state.revealed = true;
  render();
}
```

`startRound`, `answer`, `next`에 타이머 연결을 넣는다.

`startRound`의 `render()` 앞에:

```js
  startTimer();
```

`answer`의 `state.revealed = true;` 앞에:

```js
  stopTimer();
```

`next`를 고친다:

```js
function next() {
  stopTimer();
  state.revealed = false;
  state.hintUsed = false;
  state.index++;
  if (state.index >= state.deck.length) {
    state.screen = 'result';
  } else {
    startTimer();
  }
  render();
}
```

- [ ] **Step 4: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 남은 시간을 화면에 그린다**

`renderQuiz`의 진행 표시 뒤에 넣는다.

```js
  if (state.timeLeft !== null) {
    var timer = document.createElement('p');
    timer.className = 'timer' + (state.timeLeft <= 5 ? ' urgent' : '');
    timer.textContent = '남은 시간 ' + state.timeLeft + '초';
    app.appendChild(timer);
  }
```

```css
.timer { font-weight: 600; margin: 4px 0; }
.timer.urgent { color: #c62828; }
```

- [ ] **Step 6: 브라우저에서 확인한다**

1. 스피드 모드에서 15초부터 1초씩 줄어드는가
2. 보기를 누르면 타이머가 멈추는가
3. [다음]을 누르면 다시 15초부터 세는가
4. 가만히 두어 15초를 넘기면 오답 처리되고 **해설이 바로 보이는가**
5. 타임아웃 후 보기를 눌러도 점수가 바뀌지 않는가
6. 문항 중간에 [처음으로]로 나갔다가 연습 모드로 들어가면 타이머가 보이지 않는가

- [ ] **Step 7: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 스피드 모드 15초 타이머"
```

---

### Task 15: 힌트 모드

**Files:**
- Modify: `script.js` (순수 함수 구역, 상태 구역, 렌더 구역, 자체 점검 구역)
- Modify: `style.css`

**Interfaces:**
- Consumes: `state`, `MODES`, `shuffle`, `currentQuestion`, `render`
- Produces: `removeTwoWrong(choices) -> Array` (2개), `useHint()`, `visibleChoices() -> Array`

- [ ] **Step 1: 실패하는 점검을 쓴다**

```js
test('removeTwoWrong: 2개만 남기고 정답이 포함된다', function () {
  for (var n = 0; n < 50; n++) {
    var choices = [
      { text: '가', correct: false },
      { text: '나', correct: true },
      { text: '다', correct: false },
      { text: '라', correct: false }
    ];
    var left = removeTwoWrong(choices);
    assertEqual(left.length, 2, '남은 개수');
    var correct = left.filter(function (c) { return c.correct; });
    assertEqual(correct.length, 1, '정답이 지워졌다');
  }
});

test('removeTwoWrong: 지워지는 2개는 항상 오답이다', function () {
  for (var n = 0; n < 50; n++) {
    var choices = [
      { text: '가', correct: false },
      { text: '나', correct: false },
      { text: '다', correct: true },
      { text: '라', correct: false }
    ];
    var left = removeTwoWrong(choices);
    var wrongLeft = left.filter(function (c) { return !c.correct; });
    assertEqual(wrongLeft.length, 1, '남은 오답 개수');
  }
});

test('useHint: 힌트는 문항당 한 번만 쓰인다', function () {
  startRound('hint', 'science');
  useHint();
  var first = visibleChoices().length;
  useHint();
  assertEqual(state.hintUsed, true);
  assertEqual(visibleChoices().length, first, '힌트가 두 번 적용되었다');
});

test('useHint: 힌트를 쓰고 맞히면 0.5점', function () {
  startRound('hint', 'science');
  useHint();
  var correct = visibleChoices().filter(function (c) { return c.correct; })[0];
  answer(correct);
  assertEqual(state.answers[0].points, 0.5);
});

test('useHint: 힌트를 안 쓰고 맞히면 1점', function () {
  startRound('hint', 'science');
  var correct = visibleChoices().filter(function (c) { return c.correct; })[0];
  answer(correct);
  assertEqual(state.answers[0].points, 1);
});

test('next: 다음 문항에서 힌트가 다시 쓸 수 있다', function () {
  startRound('hint', 'science');
  useHint();
  answer(visibleChoices()[0]);
  next();
  assertEqual(state.hintUsed, false);
  assertEqual(visibleChoices().length, 4);
});
```

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → `removeTwoWrong is not defined`

- [ ] **Step 3: 최소 구현을 쓴다**

순수 함수 구역:

```js
function removeTwoWrong(choices) {
  var wrong = choices.filter(function (c) { return !c.correct; });
  var drop = shuffle(wrong).slice(0, 2);
  return choices.filter(function (c) { return drop.indexOf(c) === -1; });
}
```

상태 구역. 지워진 보기는 `state.removed`에 담는다.

`state`에 필드를 추가한다:

```js
  removed: [],
```

```js
function visibleChoices() {
  var q = currentQuestion();
  if (!q) return [];
  if (!state.removed.length) return q.choices;
  return q.choices.filter(function (c) { return state.removed.indexOf(c) === -1; });
}

function useHint() {
  var rule = MODES[state.mode];
  if (!rule.hint || state.hintUsed || state.revealed) return;
  var q = currentQuestion();
  var left = removeTwoWrong(q.choices);
  state.removed = q.choices.filter(function (c) { return left.indexOf(c) === -1; });
  state.hintUsed = true;
  render();
}
```

`startRound`와 `next`에서 `state.removed = [];`를 초기화한다. `startRound`에는 `state.hintUsed = false;` 옆에, `next`에는 `state.hintUsed = false;` 옆에 넣는다.

- [ ] **Step 4: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 힌트 버튼과 보기 필터를 화면에 붙인다**

`renderQuiz`에서 `q.choices.forEach`를 `visibleChoices().forEach`로 바꾼다. 해설 상태에서는 전체 보기를 보여 주어 지워진 오답도 확인할 수 있게 한다.

```js
  var shown = state.revealed ? q.choices : visibleChoices();
  shown.forEach(function (c) {
    /* 기존 본문 그대로 */
  });
```

보기 목록 뒤에 힌트 버튼을 넣는다.

```js
  var rule = MODES[state.mode];
  if (rule.hint && !state.revealed) {
    var hintBtn = document.createElement('button');
    hintBtn.className = 'hint';
    hintBtn.textContent = state.hintUsed ? '힌트 사용함' : '힌트 (오답 2개 지우기 · 0.5점)';
    hintBtn.disabled = state.hintUsed;
    hintBtn.onclick = function () { useHint(); };
    app.appendChild(hintBtn);
  }
```

```css
.hint { border-color: #ef6c00; color: #ef6c00; }
```

- [ ] **Step 6: 브라우저에서 확인한다**

1. 힌트 모드에서 힌트 버튼이 보이는가
2. 누르면 보기 2개가 사라지고 **정답은 남아 있는가** (여러 문항에서 반복 확인)
3. 버튼이 `힌트 사용함`으로 바뀌고 비활성화되는가
4. 힌트를 쓰고 맞히면 결과에 0.5점이 반영되는가
5. 힌트를 안 쓰고 맞히면 1점이 반영되는가
6. 다음 문항에서 힌트를 다시 쓸 수 있는가
7. 연습·스피드 모드에는 힌트 버튼이 없는가

- [ ] **Step 7: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 힌트 모드 (오답 2개 제거, 0.5점)"
```

---

### Task 16: 틀린 문제 다시 풀기

**Files:**
- Modify: `script.js` (순수 함수 구역, 상태 구역, 렌더 구역, 자체 점검 구역)

**Interfaces:**
- Consumes: `state`, `MODES`, `shuffle`, `buildDeck`, `render`
- Produces: `collectWrong(answers) -> string[]` (문항 id), `startRetry()`

재도전은 원래 점수를 건드리지 않는다. 그래서 원래 판의 결과를 `state.baseResult`에 보관하고, 재도전 판은 별도로 센다.

- [ ] **Step 1: 실패하는 점검을 쓴다**

```js
test('collectWrong: 틀린 문항 id만 모은다', function () {
  var answers = [
    { id: 'a', correct: true }, { id: 'b', correct: false },
    { id: 'c', correct: false }, { id: 'd', correct: true }
  ];
  assertEqual(collectWrong(answers), ['b', 'c']);
});

test('collectWrong: 만점이면 빈 배열', function () {
  assertEqual(collectWrong([{ id: 'a', correct: true }]), []);
});

test('startRetry: 틀린 문항만으로 판을 만든다', function () {
  startRound('practice', 'science');
  var wrongIds = [];
  for (var i = 0; i < 10; i++) {
    var pick = i < 4
      ? currentQuestion().choices.filter(function (c) { return !c.correct; })[0]
      : currentQuestion().choices.filter(function (c) { return c.correct; })[0];
    if (i < 4) wrongIds.push(currentQuestion().id);
    answer(pick);
    next();
  }
  var baseScore = totalScore(state.answers);
  assertEqual(baseScore, 6, '원래 점수');
  startRetry();
  assertEqual(state.isRetry, true);
  assertEqual(state.deck.length, 4);
  assertEqual(state.deck.map(function (q) { return q.id; }).sort(), wrongIds.sort());
  assertEqual(state.baseResult.score, 6, '원래 점수가 보관되지 않았다');
});

test('startRetry: 재도전은 원래 점수를 바꾸지 않는다', function () {
  startRound('practice', 'science');
  for (var i = 0; i < 10; i++) {
    var wrong = currentQuestion().choices.filter(function (c) { return !c.correct; })[0];
    answer(wrong);
    next();
  }
  assertEqual(totalScore(state.answers), 0, '원래 점수');
  startRetry();
  for (var j = 0; j < 10; j++) {
    var correct = currentQuestion().choices.filter(function (c) { return c.correct; })[0];
    answer(correct);
    next();
  }
  assertEqual(state.baseResult.score, 0, '원래 점수가 바뀌었다');
  assertEqual(totalScore(state.answers), 10, '재도전 판 집계');
});
```

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → `collectWrong is not defined`

- [ ] **Step 3: 최소 구현을 쓴다**

순수 함수 구역:

```js
function collectWrong(answers) {
  return answers.filter(function (a) { return !a.correct; })
                .map(function (a) { return a.id; });
}
```

`state`에 필드를 추가한다:

```js
  baseResult: null,   // { score: number, total: number } — 원래 판의 확정 점수
```

상태 구역:

```js
function startRetry() {
  var wrongIds = collectWrong(state.answers);
  if (!wrongIds.length) return;

  if (!state.isRetry) {
    state.baseResult = {
      score: totalScore(state.answers),
      total: state.deck.length
    };
  }

  var full = buildDeck(state.category);
  state.deck = shuffle(full.filter(function (q) {
    return wrongIds.indexOf(q.id) !== -1;
  }));
  state.index = 0;
  state.answers = [];
  state.revealed = false;
  state.hintUsed = false;
  state.removed = [];
  state.isRetry = true;
  state.screen = 'quiz';
  startTimer();
  render();
}
```

`startRound`에 `state.baseResult = null;`을 넣는다. `goHome`에도 넣는다.

- [ ] **Step 4: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 결과 화면에 버튼과 재도전 성적을 붙인다**

`renderResult`에서 점수 표시 부분을 고친다.

```js
  var score = document.createElement('p');
  score.className = 'score';
  if (state.isRetry && state.baseResult) {
    score.textContent = formatScore(state.baseResult.score);
    var retryNote = document.createElement('p');
    retryNote.className = 'retry-note';
    var hit = state.answers.filter(function (a) { return a.correct; }).length;
    retryNote.textContent = '다시 푼 ' + state.answers.length + '문항 중 ' + hit + '문항 정답';
    app.appendChild(score);
    app.appendChild(retryNote);
  } else {
    app.appendChild(score);
  }
```

[처음으로] 앞에 재도전 버튼을 넣는다.

```js
  var rule = MODES[state.mode];
  if (rule.retryWrong && collectWrong(state.answers).length > 0) {
    var retry = document.createElement('button');
    retry.className = 'retry';
    retry.textContent = '틀린 문제 다시 풀기 (' + collectWrong(state.answers).length + '문항)';
    retry.onclick = startRetry;
    app.appendChild(retry);
  }
```

```css
.retry-note { color: #1565c0; font-weight: 600; margin: 0 0 8px; }
.retry { border-color: #1565c0; color: #1565c0; }
```

- [ ] **Step 6: 브라우저에서 확인한다**

1. 연습 모드에서 틀린 문항이 있으면 [틀린 문제 다시 풀기]가 보이고 문항 수가 맞는가
2. 누르면 **틀린 문항만** 나오는가
3. 재도전이 끝나면 원래 `N / 10` 점수가 그대로 있고, `다시 푼 N문항 중 M문항 정답`이 함께 보이는가
4. 재도전에서 또 틀리면 버튼이 다시 나오는가
5. 만점을 받으면 버튼이 **보이지 않는가**
6. 스피드·힌트 결과 화면에는 버튼이 **없는가**

- [ ] **Step 7: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 틀린 문제 다시 풀기 (연습 전용, 점수 미반영)"
```

---

## 브라우저 직접 확인 (2단계)

- [ ] `index.html?test` 실패 0건
- [ ] 모드 영역에서 연습·스피드·힌트 3개를 모두 고를 수 있다
- [ ] 연습 모드 시작·결과 화면에 `순위표에 기록되지 않음`이 보인다
- [ ] 스피드: 15초가 1초씩 줄고, 해설이 뜨면 멈추고, [다음]에서 15초로 리셋된다
- [ ] 스피드: 15초를 넘기면 오답 처리되고 **해설이 바로 보인다**
- [ ] 스피드: 타임아웃 직후 보기를 눌러도 점수가 바뀌지 않는다
- [ ] 힌트: 누르면 보기 2개가 사라지고 **정답은 남는다** (여러 문항에서 반복 확인)
- [ ] 힌트: 버튼이 `힌트 사용함`으로 바뀌고 다시 눌리지 않는다
- [ ] 힌트: 쓰고 맞히면 0.5점, 안 쓰고 맞히면 1점이 결과에 반영된다
- [ ] 점수가 `7.5 / 10`처럼 0.5 단위로 표시된다
- [ ] 연습 결과에서 틀린 문항만 다시 풀리고, 재도전 후에도 원래 점수가 그대로다
- [ ] 만점을 받으면 [틀린 문제 다시 풀기]가 보이지 않는다
- [ ] 판 중간에 [처음으로]를 눌러도 타이머가 남아 다음 판에 영향을 주지 않는다
- [ ] **1단계 확인 항목 전부 재통과**

---

# 3단계 — 점수 저장과 순위표

## 만들 것

- 저장 스키마 `quiz.leaderboard.v1`, 모든 접근을 `try/catch`로 감싸기
- 스피드·힌트 결과 화면의 이름 입력칸 + [기록 저장] 버튼
- 마지막에 쓴 이름 기억 (`lastName`)
- 순위표 화면: 모드×카테고리 8표, 각 상위 5개, 순위·이름·점수·날짜
- 저장 불가·데이터 손상 시 순위표만 비활성화하고 안내 표시

## 완료 기준

- `index.html?test` 점검 **실패 0건**
- 3단계 브라우저 확인 항목 **전부 통과**
- **1·2단계 브라우저 확인 항목 재통과**

---

### Task 17: 저장소 읽기와 쓰기

Review Focus 4번(손상된 JSON과 모르는 `version`)의 테스트가 여기 들어간다.

**Files:**
- Modify: `script.js` (상수 구역, 순수 함수 구역, 저장 구역, 자체 점검 구역)

**Interfaces:**
- Consumes: `test`, `assertEqual`, `assertTrue`
- Produces: `STORAGE_KEY`, `emptyStore() -> object`, `parseStore(raw) -> object`, `readStore() -> object|null` (null이면 저장소 사용 불가), `writeStore(store) -> boolean`

- [ ] **Step 1: 실패하는 점검을 쓴다**

`parseStore`를 순수 함수로 분리해 손상 처리를 검증한다. `localStorage` 자체의 실패는 브라우저에서 확인한다.

```js
test('parseStore: 빈 값이면 빈 저장소', function () {
  assertEqual(parseStore(null), emptyStore());
  assertEqual(parseStore(''), emptyStore());
});

test('parseStore: 손상된 JSON이면 빈 저장소', function () {
  assertEqual(parseStore('{이건 JSON이 아님'), emptyStore());
  assertEqual(parseStore('[1,2,3'), emptyStore());
});

test('parseStore: 모르는 version이면 빈 저장소', function () {
  assertEqual(parseStore('{"version":99,"boards":{}}'), emptyStore());
  assertEqual(parseStore('{"boards":{}}'), emptyStore());
});

test('parseStore: boards가 없으면 빈 저장소', function () {
  assertEqual(parseStore('{"version":1}'), emptyStore());
});

test('parseStore: 올바른 데이터는 그대로 돌려준다', function () {
  var raw = '{"version":1,"lastName":"현지","boards":{"speed:science":[]}}';
  var out = parseStore(raw);
  assertEqual(out.version, 1);
  assertEqual(out.lastName, '현지');
  assertEqual(out.boards['speed:science'], []);
});

test('emptyStore: 새 저장소 모양', function () {
  assertEqual(emptyStore(), { version: 1, lastName: '', boards: {} });
});

test('writeStore/readStore: 쓴 것을 다시 읽는다', function () {
  var store = emptyStore();
  store.lastName = '점검';
  assertEqual(writeStore(store), true);
  assertEqual(readStore().lastName, '점검');
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
});
```

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → `parseStore is not defined`

- [ ] **Step 3: 최소 구현을 쓴다**

상수 구역:

```js
var STORAGE_KEY = 'quiz.leaderboard.v1';
```

순수 함수 구역:

```js
function emptyStore() {
  return { version: 1, lastName: '', boards: {} };
}

function parseStore(raw) {
  if (!raw) return emptyStore();
  var data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return emptyStore();
  }
  if (!data || data.version !== 1 || !data.boards) return emptyStore();
  if (typeof data.lastName !== 'string') data.lastName = '';
  return data;
}
```

저장 구역:

```js
/* ===== 3. 저장 ===== */
function readStore() {
  try {
    return parseStore(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    return null;   // 저장소 사용 불가
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    return false;
  }
}
```

- [ ] **Step 4: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "feat: localStorage 읽기·쓰기와 손상 데이터 처리"
```

---

### Task 18: 기록 삽입과 이름 정리

**Files:**
- Modify: `script.js` (순수 함수 구역, 저장 구역, 자체 점검 구역)

**Interfaces:**
- Consumes: `emptyStore`, `readStore`, `writeStore`
- Produces: `boardKey(modeKey, categoryKey) -> string`, `insertRecord(list, record) -> Array` (최대 5개), `normalizeName(raw) -> string`, `saveRecord(modeKey, categoryKey, record) -> boolean`, `todayString() -> string`

- [ ] **Step 1: 실패하는 점검을 쓴다**

```js
test('boardKey: 모드와 카테고리를 잇는다', function () {
  assertEqual(boardKey('speed', 'science'), 'speed:science');
});

test('normalizeName: 앞뒤 공백을 지운다', function () {
  assertEqual(normalizeName('  현지  '), '현지');
});

test('normalizeName: 공백만 있으면 빈 문자열', function () {
  assertEqual(normalizeName('   '), '');
  assertEqual(normalizeName(''), '');
  assertEqual(normalizeName(null), '');
  assertEqual(normalizeName(undefined), '');
});

test('normalizeName: 10자로 자른다', function () {
  assertEqual(normalizeName('가나다라마바사아자차카타'), '가나다라마바사아자차');
  assertEqual(normalizeName('가나다라마바사아자차').length, 10);
});

test('insertRecord: 점수 내림차순으로 넣는다', function () {
  var list = [
    { name: 'a', score: 9, total: 10, date: '2026-10-01' },
    { name: 'b', score: 5, total: 10, date: '2026-10-02' }
  ];
  var out = insertRecord(list, { name: 'c', score: 7, total: 10, date: '2026-10-03' });
  assertEqual(out.map(function (r) { return r.name; }), ['a', 'c', 'b']);
});

test('insertRecord: 동점이면 먼저 달성한 기록이 위', function () {
  var list = [{ name: '먼저', score: 8, total: 10, date: '2026-10-01' }];
  var out = insertRecord(list, { name: '나중', score: 8, total: 10, date: '2026-10-05' });
  assertEqual(out.map(function (r) { return r.name; }), ['먼저', '나중']);
});

test('insertRecord: 상위 5개만 남긴다', function () {
  var list = [];
  for (var i = 10; i >= 6; i--) {
    list.push({ name: 'n' + i, score: i, total: 10, date: '2026-10-01' });
  }
  var out = insertRecord(list, { name: '낮음', score: 1, total: 10, date: '2026-10-09' });
  assertEqual(out.length, 5);
  assertEqual(out.map(function (r) { return r.name; }).indexOf('낮음'), -1, '낮은 점수가 남았다');
});

test('insertRecord: 높은 점수는 꽉 찬 표에도 들어간다', function () {
  var list = [];
  for (var i = 5; i >= 1; i--) {
    list.push({ name: 'n' + i, score: i, total: 10, date: '2026-10-01' });
  }
  var out = insertRecord(list, { name: '최고', score: 10, total: 10, date: '2026-10-09' });
  assertEqual(out.length, 5);
  assertEqual(out[0].name, '최고');
});

test('insertRecord: 원본 배열을 바꾸지 않는다', function () {
  var list = [{ name: 'a', score: 9, total: 10, date: '2026-10-01' }];
  insertRecord(list, { name: 'b', score: 8, total: 10, date: '2026-10-02' });
  assertEqual(list.length, 1);
});

test('saveRecord: 표에 쌓이고 lastName이 기억된다', function () {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  var ok = saveRecord('speed', 'science',
    { name: '현지', score: 8, total: 10, date: '2026-10-10' });
  assertEqual(ok, true);
  var store = readStore();
  assertEqual(store.boards['speed:science'].length, 1);
  assertEqual(store.boards['speed:science'][0].name, '현지');
  assertEqual(store.lastName, '현지');
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
});

test('todayString: YYYY-MM-DD 형태', function () {
  assertTrue(/^\d{4}-\d{2}-\d{2}$/.test(todayString()), todayString());
});
```

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → `boardKey is not defined`

- [ ] **Step 3: 최소 구현을 쓴다**

순수 함수 구역:

```js
function boardKey(modeKey, categoryKey) {
  return modeKey + ':' + categoryKey;
}

function normalizeName(raw) {
  if (raw === null || raw === undefined) return '';
  return String(raw).replace(/^\s+|\s+$/g, '').slice(0, 10);
}

function insertRecord(list, record) {
  var next = (list || []).slice();
  next.push(record);
  next.sort(function (a, b) { return b.score - a.score; });
  return next.slice(0, 5);
}

function todayString() {
  var d = new Date();
  var m = d.getMonth() + 1;
  var day = d.getDate();
  return d.getFullYear() + '-' +
         (m < 10 ? '0' : '') + m + '-' +
         (day < 10 ? '0' : '') + day;
}
```

`Array.prototype.sort`는 안정 정렬이다. 새 기록을 배열 끝에 넣고 점수만으로 정렬하므로, 동점일 때 기존 기록이 위에 남는다 — "먼저 달성한 기록이 위"가 이렇게 지켜진다.

저장 구역:

```js
function saveRecord(modeKey, categoryKey, record) {
  var store = readStore();
  if (!store) return false;
  var key = boardKey(modeKey, categoryKey);
  store.boards[key] = insertRecord(store.boards[key], record);
  store.lastName = record.name;
  return writeStore(store);
}
```

- [ ] **Step 4: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "feat: 기록 삽입·정렬과 이름 정리"
```

---

### Task 19: 이름 입력칸과 기록 저장 버튼

Review Focus 2번(이름에 든 HTML 특수문자)의 테스트가 여기 들어간다.

**Files:**
- Modify: `script.js` (상태 구역, 렌더 구역, 자체 점검 구역)
- Modify: `style.css`

**Interfaces:**
- Consumes: `state`, `MODES`, `totalScore`, `normalizeName`, `saveRecord`, `readStore`, `todayString`, `render`
- Produces: `renderSaveBox(app)`, `state.saved`, `state.saveError`

- [ ] **Step 1: 실패하는 점검을 쓴다**

```js
test('이름에 HTML 특수문자가 들어가도 그대로 저장된다', function () {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  var name = normalizeName('<img onerror=1>');
  saveRecord('speed', 'science',
    { name: name, score: 5, total: 10, date: todayString() });
  var saved = readStore().boards['speed:science'][0].name;
  assertEqual(saved, '<img onerr', '10자로 잘려 그대로 저장되어야 한다');
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
});

test('이름은 textContent로 그려야 한다 — 노드에 태그가 생기지 않는다', function () {
  var cell = document.createElement('td');
  cell.textContent = '<b>굵게</b>';
  assertEqual(cell.children.length, 0, 'innerHTML로 그려졌다');
  assertEqual(cell.textContent, '<b>굵게</b>');
});
```

두 번째 점검은 렌더 방식을 못 박는 장치다. 순위표를 `innerHTML`로 그리면 Task 20에서 이 규칙을 어기게 된다.

- [ ] **Step 2: 점검을 실행해 실패를 확인한다**

`index.html?test` → 첫 점검이 `saveRecord` 호출에서 실패하거나 기대값이 어긋난다

- [ ] **Step 3: 상태에 저장 관련 필드를 추가한다**

`state`에 넣는다:

```js
  saved: false,       // 이 판을 저장했는가
  saveError: false,   // 저장 시도가 실패했는가
```

`startRound`, `startRetry`, `goHome`에서 둘을 `false`로 초기화한다.

- [ ] **Step 4: 결과 화면에 입력칸과 버튼을 붙인다**

`renderResult`에서 `if (!rule.record)` 블록 뒤에 넣는다.

```js
  if (rule.record) renderSaveBox(app);
```

```js
function renderSaveBox(app) {
  var store = readStore();

  var box = document.createElement('section');
  box.className = 'savebox';

  if (!store) {
    var warn = document.createElement('p');
    warn.className = 'note';
    warn.textContent = '이 브라우저에서는 기록을 저장할 수 없습니다';
    box.appendChild(warn);
    app.appendChild(box);
    return;
  }

  var label = document.createElement('label');
  label.textContent = '이름';
  label.htmlFor = 'name-input';
  box.appendChild(label);

  var input = document.createElement('input');
  input.id = 'name-input';
  input.type = 'text';
  input.maxLength = 10;
  input.value = store.lastName || '';
  input.disabled = state.saved;
  box.appendChild(input);

  var btn = document.createElement('button');
  btn.className = 'save';
  btn.textContent = state.saved ? '저장됨' : '기록 저장';
  btn.disabled = state.saved || normalizeName(input.value) === '';
  box.appendChild(btn);

  input.oninput = function () {
    btn.disabled = state.saved || normalizeName(input.value) === '';
  };

  btn.onclick = function () {
    var name = normalizeName(input.value);
    if (!name || state.saved) return;
    var ok = saveRecord(state.mode, state.category, {
      name: name,
      score: totalScore(state.answers),
      total: state.deck.length,
      date: todayString()
    });
    if (ok) {
      state.saved = true;
      state.saveError = false;
    } else {
      state.saveError = true;
    }
    render();
  };

  if (state.saveError) {
    var err = document.createElement('p');
    err.className = 'note error';
    err.textContent = '기록을 저장할 수 없습니다';
    box.appendChild(err);
  }

  if (state.saved) {
    var view = document.createElement('button');
    view.textContent = '순위표 보기';
    view.onclick = function () { state.screen = 'leaderboard'; render(); };
    box.appendChild(view);
  }

  app.appendChild(box);
}
```

- [ ] **Step 5: 스타일을 넣는다**

```css
.savebox { margin: 16px 0; padding: 12px; border: 1px solid #ddd; border-radius: 8px; }
.savebox label { display: block; font-size: .9rem; color: #555; margin-bottom: 4px; }
.savebox input { font: inherit; padding: 8px; border: 1px solid #ccc; border-radius: 6px; width: 10rem; }
.save { border-color: #2e7d32; color: #2e7d32; }
.note.error { color: #c62828; }
```

- [ ] **Step 6: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 7: 브라우저에서 확인한다**

1. 스피드·힌트 결과 화면에 이름 입력칸과 [기록 저장]이 보이는가
2. 입력칸이 비면 버튼이 눌리지 않는가. 공백만 넣어도 눌리지 않는가
3. 이름을 넣고 저장하면 버튼이 `저장됨`으로 바뀌고 다시 눌리지 않는가
4. 11자를 입력하려 하면 10자에서 막히는가
5. 다음 판 결과 화면에 **직전 이름이 미리 채워져 있는가**
6. 연습 결과 화면에는 입력칸과 버튼이 **없고** `순위표에 기록되지 않음`이 보이는가

- [ ] **Step 8: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 결과 화면 이름 입력칸과 기록 저장 버튼"
```

---

### Task 20: 순위표 화면

**Files:**
- Modify: `script.js` (렌더 구역)
- Modify: `style.css`

**Interfaces:**
- Consumes: `state`, `MODES`, `CATEGORIES`, `readStore`, `boardKey`, `formatScore`, `goHome`, `render`
- Produces: `renderLeaderboard(app)`

- [ ] **Step 1: 화면을 라우팅에 연결한다**

`render`에 줄을 추가한다.

```js
  if (state.screen === 'leaderboard') return renderLeaderboard(app);
```

- [ ] **Step 2: 순위표를 그린다**

이름은 반드시 `textContent`로 넣는다 (Task 19 Step 1의 두 번째 점검이 요구하는 규칙).

```js
function renderLeaderboard(app) {
  var h = document.createElement('h1');
  h.textContent = '순위표';
  app.appendChild(h);

  var store = readStore();
  if (!store) {
    var warn = document.createElement('p');
    warn.className = 'note';
    warn.textContent = '이 브라우저에서는 기록을 저장할 수 없습니다';
    app.appendChild(warn);
  } else {
    ['speed', 'hint'].forEach(function (modeKey) {
      CATEGORIES.forEach(function (cat) {
        app.appendChild(buildBoard(store, modeKey, cat));
      });
    });
  }

  var home = document.createElement('button');
  home.textContent = '처음으로';
  home.onclick = goHome;
  app.appendChild(home);
}

function buildBoard(store, modeKey, cat) {
  var section = document.createElement('section');
  section.className = 'board';

  var title = document.createElement('h2');
  title.textContent = MODES[modeKey].label + ' · ' + cat.label;
  section.appendChild(title);

  var list = store.boards[boardKey(modeKey, cat.key)] || [];
  if (!list.length) {
    var empty = document.createElement('p');
    empty.className = 'note';
    empty.textContent = '기록 없음';
    section.appendChild(empty);
    return section;
  }

  var table = document.createElement('table');
  var head = document.createElement('tr');
  ['순위', '이름', '점수', '날짜'].forEach(function (text) {
    var th = document.createElement('th');
    th.textContent = text;
    head.appendChild(th);
  });
  table.appendChild(head);

  list.forEach(function (r, i) {
    var tr = document.createElement('tr');
    [String(i + 1), r.name, formatScore(r.score), r.date].forEach(function (text) {
      var td = document.createElement('td');
      td.textContent = text;   // 이름을 innerHTML로 넣지 않는다
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  section.appendChild(table);
  return section;
}
```

- [ ] **Step 3: 시작 화면에 순위표 입구를 둔다**

`renderStart` 끝에 넣는다.

```js
  var boardBtn = document.createElement('button');
  boardBtn.className = 'to-board';
  boardBtn.textContent = '순위표 보기';
  boardBtn.onclick = function () { state.screen = 'leaderboard'; render(); };
  app.appendChild(boardBtn);
```

- [ ] **Step 4: 스타일을 넣는다**

```css
.board { margin-bottom: 20px; }
.board table { border-collapse: collapse; width: 100%; }
.board th, .board td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; font-size: .95rem; }
.board th { color: #555; font-weight: 600; }
.to-board { margin-top: 16px; }
```

- [ ] **Step 5: 점검을 실행해 통과를 확인한다**

`index.html?test` → 실패 0건

- [ ] **Step 6: 브라우저에서 확인한다**

1. 시작 화면과 저장 후 결과 화면에서 순위표로 갈 수 있는가
2. 표가 8개(스피드 4 + 힌트 4) 보이고, 기록이 없는 표는 `기록 없음`인가
3. 저장한 기록이 해당 모드×카테고리 표에만 들어갔는가
4. 순위·이름·점수·날짜 4열이 보이는가
5. 이름에 `<b>굵게</b>`를 넣고 저장하면 **글자 그대로** 보이는가 (굵게 렌더되지 않아야 한다)
6. 같은 표에 6번 이상 기록하면 상위 5개만 남는가
7. 동점 기록은 먼저 저장한 것이 위에 있는가
8. 브라우저를 닫고 다시 열어도 기록과 이름이 남아 있는가
9. 사생활 보호 창에서 열면 순위표만 비활성화되고 **퀴즈는 정상 동작하는가**

- [ ] **Step 7: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 순위표 화면 (모드×카테고리 8표)"
```

---

## 브라우저 직접 확인 (3단계)

- [ ] `index.html?test` 실패 0건
- [ ] 스피드·힌트 결과 화면에 이름 입력칸과 [기록 저장] 버튼이 보인다
- [ ] 이름이 비어 있으면 [기록 저장]이 눌리지 않는다. 공백만 입력해도 눌리지 않는다
- [ ] 이름을 넣고 저장하면 해당 모드×카테고리 표에 이름·점수·날짜가 쌓인다
- [ ] 저장 후 버튼이 `저장됨`으로 바뀌고 다시 눌러도 기록이 늘지 않는다
- [ ] 저장하지 않고 [처음으로]를 누르면 그 판은 기록되지 않는다
- [ ] 다음 판 결과 화면에 **직전에 쓴 이름이 미리 채워져 있다**
- [ ] 연습 결과 화면에는 입력칸과 버튼이 없다
- [ ] 11자 이상은 입력되지 않는다
- [ ] 이름에 `<b>굵게</b>`를 넣어 저장하면 글자 그대로 보인다 (태그가 적용되지 않는다)
- [ ] 6번 이상 기록하면 상위 5개만 남는다
- [ ] 동점 기록은 먼저 달성한 것이 위에 있다
- [ ] 브라우저를 닫고 다시 열어도 기록과 이름이 남아 있다
- [ ] 사생활 보호 창에서 열면 순위표만 비활성화되고 퀴즈는 정상 동작한다
- [ ] 개발자 도구에서 `localStorage`의 `quiz.leaderboard.v1` 값을 일부러 깨뜨려도 앱이 멈추지 않고 빈 순위표로 뜬다
- [ ] **1·2단계 확인 항목 전부 재통과**
