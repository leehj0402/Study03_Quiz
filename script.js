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

function categoryLabel(key) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].key === key) return CATEGORIES[i].label;
  }
  return '';
}

function modeSummary(rule) {
  var parts = [];
  parts.push(rule.timeLimit ? '문항당 ' + rule.timeLimit + '초' : '제한시간 없음');
  if (rule.hint) parts.push('오답 2개 걸러내기(' + rule.scoreWithHint + '점)');
  parts.push(rule.record ? '순위표에 기록됨' : '순위표에 기록되지 않음');
  return parts.join(' · ');
}

function removeTwoWrong(choices) {
  var wrong = choices.filter(function (c) { return !c.correct; });
  var drop = shuffle(wrong).slice(0, 2);
  return choices.filter(function (c) { return drop.indexOf(c) === -1; });
}

function collectWrong(answers) {
  return answers.filter(function (a) { return !a.correct; })
                .map(function (a) { return a.id; });
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
  removed: [],
  timeLeft: null,
  timerId: null,
  isRetry: false,
  baseResult: null
};

function currentQuestion() {
  return state.deck[state.index] || null;
}

function chooseCategory(categoryKey) {
  state.category = categoryKey;
  state.screen = 'mode';
  render();
}

function backToCategories() {
  stopTimer();
  state.category = null;
  state.mode = null;
  state.screen = 'start';
  render();
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
  state.removed = [];
  state.isRetry = false;
  state.baseResult = null;
  startTimer();
  render();
}

function answer(choice) {
  if (state.revealed) return;
  if (state.removed.indexOf(choice) !== -1) return;
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
  stopTimer();
  state.revealed = true;
  render();
}

function next() {
  stopTimer();
  state.revealed = false;
  state.hintUsed = false;
  state.removed = [];
  state.index++;
  if (state.index >= state.deck.length) {
    state.screen = 'result';
  } else {
    startTimer();
  }
  render();
}

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

/* ===== 5. 렌더 ===== */
function render() {
  var app = document.getElementById('app');
  app.innerHTML = '';
  if (state.screen === 'start')  return renderStart(app);
  if (state.screen === 'mode')   return renderMode(app);
  if (state.screen === 'quiz')   return renderQuiz(app);
  if (state.screen === 'result') return renderResult(app);
}

function renderStart(app) {
  var owner = document.createElement('p');
  owner.className = 'owner';
  owner.textContent = '2601970 이현지';
  app.appendChild(owner);

  var h = document.createElement('h1');
  h.textContent = '상식 퀴즈';
  app.appendChild(h);

  var catBox = document.createElement('section');
  catBox.className = 'categories';
  var catTitle = document.createElement('h2');
  catTitle.textContent = '카테고리를 고르세요';
  catBox.appendChild(catTitle);

  CATEGORIES.forEach(function (cat) {
    var btn = document.createElement('button');
    btn.className = 'category';
    btn.textContent = cat.label;
    btn.onclick = function () { chooseCategory(cat.key); };
    catBox.appendChild(btn);
  });
  app.appendChild(catBox);
}

function renderMode(app) {
  var h = document.createElement('h1');
  h.textContent = categoryLabel(state.category);
  app.appendChild(h);

  var modeBox = document.createElement('section');
  modeBox.className = 'modes';
  var modeTitle = document.createElement('h2');
  modeTitle.textContent = '모드를 고르세요';
  modeBox.appendChild(modeTitle);

  Object.keys(MODES).forEach(function (key) {
    var rule = MODES[key];
    var item = document.createElement('div');
    item.className = 'mode-item';

    var btn = document.createElement('button');
    btn.className = 'mode';
    btn.textContent = rule.label;
    btn.onclick = function () { startRound(key, state.category); };
    item.appendChild(btn);

    var desc = document.createElement('p');
    desc.className = 'mode-desc';
    desc.textContent = modeSummary(rule);
    item.appendChild(desc);

    modeBox.appendChild(item);
  });
  app.appendChild(modeBox);

  var back = document.createElement('button');
  back.className = 'back';
  back.textContent = '카테고리 다시 고르기';
  back.onclick = backToCategories;
  app.appendChild(back);
}

function renderQuiz(app) {
  var q = currentQuestion();
  if (!q) return;

  var prog = document.createElement('p');
  prog.className = 'progress';
  prog.textContent = (state.index + 1) + ' / ' + state.deck.length;
  app.appendChild(prog);

  if (state.timeLeft !== null) {
    var timer = document.createElement('p');
    timer.className = 'timer' + (state.timeLeft <= 5 ? ' urgent' : '');
    timer.textContent = '남은 시간 ' + state.timeLeft + '초';
    app.appendChild(timer);
  }

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
    } else if (state.removed.indexOf(c) !== -1) {
      btn.className += ' eliminated';
      btn.disabled = true;
    } else {
      btn.onclick = function () { answer(c); };
    }
    list.appendChild(btn);
  });
  app.appendChild(list);

  var rule = MODES[state.mode];
  if (rule.hint && !state.revealed) {
    var hintBtn = document.createElement('button');
    hintBtn.className = 'hint';
    hintBtn.textContent = state.hintUsed ? '힌트 사용함' : '힌트 (오답 2개 걸러내기 · 0.5점)';
    hintBtn.disabled = state.hintUsed;
    hintBtn.onclick = function () { useHint(); };
    app.appendChild(hintBtn);
  }

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

function renderResult(app) {
  var rule = MODES[state.mode];

  var h = document.createElement('h1');
  h.textContent = '결과';
  app.appendChild(h);

  var score = document.createElement('p');
  score.className = 'score';
  if (state.isRetry && state.baseResult) {
    score.textContent = formatScore(state.baseResult.score);
    app.appendChild(score);
    var retryNote = document.createElement('p');
    retryNote.className = 'retry-note';
    var hit = state.answers.filter(function (a) { return a.correct; }).length;
    retryNote.textContent = '다시 푼 ' + state.answers.length + '문항 중 ' + hit + '문항 정답';
    app.appendChild(retryNote);
  } else {
    score.textContent = formatScore(totalScore(state.answers));
    app.appendChild(score);
  }

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

  if (rule.retryWrong && collectWrong(state.answers).length > 0) {
    var retry = document.createElement('button');
    retry.className = 'retry';
    retry.textContent = '틀린 문제 다시 풀기 (' + collectWrong(state.answers).length + '문항)';
    retry.onclick = startRetry;
    app.appendChild(retry);
  }

  var again = document.createElement('button');
  again.className = 'again';
  again.textContent = '같은 카테고리 다시 풀기';
  again.onclick = restartRound;
  app.appendChild(again);

  var home = document.createElement('button');
  home.textContent = '처음으로';
  home.onclick = goHome;
  app.appendChild(home);
}

function restartRound() {
  stopTimer();
  startRound(state.mode, state.category);
}

function goHome() {
  stopTimer();
  state.screen = 'start';
  state.mode = null;
  state.category = null;
  state.deck = [];
  state.index = 0;
  state.answers = [];
  state.revealed = false;
  state.hintUsed = false;
  state.removed = [];
  state.isRetry = false;
  state.baseResult = null;
  render();
}

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

test('타이머 누수: goHome·restartRound 가 interval 을 정리한다', function () {
  startRound('speed', 'science');
  assertTrue(state.timerId !== null, 'startRound 가 타이머를 걸지 않았다');
  goHome();
  assertTrue(state.timerId === null, 'goHome 이 타이머를 남겼다');
  startRound('speed', 'science');
  restartRound();
  assertTrue(state.timerId !== null, 'restartRound 뒤 새 타이머가 없다');
  stopTimer();
  assertTrue(state.timerId === null, 'stopTimer 뒤에도 타이머가 남았다');
});

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

test('modeSummary: 규칙에서 모드 설명을 만든다', function () {
  assertEqual(modeSummary(MODES.practice), '제한시간 없음 · 순위표에 기록되지 않음');
  assertEqual(modeSummary(MODES.speed), '문항당 15초 · 순위표에 기록됨');
  assertEqual(modeSummary(MODES.hint), '제한시간 없음 · 오답 2개 걸러내기(0.5점) · 순위표에 기록됨');
});

test('chooseCategory: 카테고리를 정하고 모드 화면으로 간다', function () {
  state.screen = 'start';
  state.category = null;
  chooseCategory('science');
  assertEqual(state.category, 'science');
  assertEqual(state.screen, 'mode');
});

test('backToCategories: 카테고리 화면으로 돌아가고 고른 것을 지운다', function () {
  chooseCategory('science');
  backToCategories();
  assertEqual(state.screen, 'start');
  assertEqual(state.category, null);
  assertEqual(state.mode, null);
});

test('goHome: 판 도중에도 카테고리 화면으로 돌아간다', function () {
  startRound('practice', 'science');
  goHome();
  assertEqual(state.screen, 'start');
  assertEqual(state.category, null);
  assertEqual(state.mode, null);
});

test('힌트: 걸러낸 뒤에도 보기 4개가 그대로 남는다', function () {
  startRound('hint', 'science');
  useHint();
  assertEqual(currentQuestion().choices.length, 4, '보기가 목록에서 빠졌다');
  assertEqual(state.removed.length, 2, '걸러낸 보기 수');
  assertEqual(visibleChoices().length, 2, '고를 수 있는 보기 수');
});

test('answer: 걸러낸 보기를 눌러도 채점되지 않는다', function () {
  startRound('hint', 'science');
  useHint();
  answer(state.removed[0]);
  assertEqual(state.answers.length, 0, '걸러낸 보기가 채점되었다');
  assertEqual(state.revealed, false, '걸러낸 보기로 해설이 열렸다');
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
  var errors = validateQuestions(QUESTIONS);
  if (errors.length) {
    console.warn('문항 검증 경고 ' + errors.length + '건');
    errors.forEach(function (e) { console.warn(e); });
  }
  render();
}
