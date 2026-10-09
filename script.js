/* ===== 1. 상수 ===== */
var CATEGORIES = [
  { key: 'korean_history',  label: '한국사' },
  { key: 'world_geography', label: '세계지리' },
  { key: 'science',         label: '과학' },
  { key: 'arts_culture',    label: '예술과 문화' }
];

var MODES = {
  practice: {
    key: 'practice', label: '연습',
    timeLimit: null, hint: false,
    scoreOnCorrect: 1, scoreWithHint: null,
    record: false, retryWrong: true
  }
};

/* ===== 2. 순수 함수 ===== */
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

test('러너가 동작한다', function () {
  assertTrue(true);
  assertEqual([1, 2], [1, 2]);
});

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
  /* 문자열 매칭으로 정답을 찾으면 여기서 깨진다 */
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

test('questions.js 문항이 규칙을 지킨다', function () {
  assertEqual(validateQuestions(QUESTIONS), []);
});

/* 점검용 보조 */
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

/* ===== 7. 부팅 ===== */
if (wantsTest()) {
  runSelfTest();
} else {
  document.getElementById('app').textContent = '준비 중';
}
