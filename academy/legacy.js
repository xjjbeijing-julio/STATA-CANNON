
// ============================================================
// StatCannon v3.1 — 核心逻辑
// v3.1 优化：音效系统重构、计分升级、动画流畅度、本局战报
// 打炮模式：题目显示在画布上方，A/B/C/D 候选项为目标
// 炮口跟随鼠标转向，点击发射炮弹命中选项
// ============================================================

// ---- 状态 ----
let state = {
  records: {},
  history: [],
  gameActive: false,
  gameQueue: [],
  gameIndex: 0,
  gameScore: 0,
  gameCombo: 0,
  gameMaxCombo: 0,
  gameTotal: 0,
  gameCorrect: 0,
  // 本局明细战报（v3.1）
  gameDetail: [],
  gameByModule: {},
  gameMilestones: 0,
  // 计时相关
  questionTiming: false,     // 当前题是否在计时
  questionStartTime: 0,      // 当前题开始回答的时间戳
  pauseStartTime: 0,         // 暂停开始时间
  totalPausedMs: 0,          // 累计暂停毫秒
  qAnswered: false,
  autoTestActive: false,
  autoTestQueue: [],
  autoTestIndex: 0,
  autoTestScore: 0,
  autoTestCorrect: 0,
  settings: { name: '', major: 'non-medical', daily: 20, phone: '', smsKey: '', smsSecret: '', smsSign: '卫生统计学习', smsTemplate: '', sfxOn: true, sfxVolume: 60, lastCannon: { module: 'all', topic: 'all', difficulty: 'all' } },
  // 百斩引擎字段
  version: 3,
  mastery: {},
  learning: null,
  reviewDoneToday: 0,
  reviewQueue: null,
  reviewIdx: 0,
  reviewResults: []
};

// ---- 加载/保存 ----
function loadState() {
  try {
    const s = localStorage.getItem('statcannon_state');
    if (s) { const p = JSON.parse(s); Object.assign(state, p); }
    const ss = localStorage.getItem('statcannon_settings');
    if (ss) { const p = JSON.parse(ss); Object.assign(state.settings, p); }
  } catch(e) {}
}
function saveState() {
  try {
    localStorage.setItem('statcannon_state', JSON.stringify({
      records: state.records, history: state.history,
      gameScore: state.gameScore, gameMaxCombo: state.gameMaxCombo,
      gameTotal: state.gameTotal, gameCorrect: state.gameCorrect,
      version: state.version,
      mastery: state.mastery, learning: state.learning,
      reviewDoneToday: state.reviewDoneToday
    }));
  } catch(e) {}
}
function saveSettings() {
  state.settings.name = document.getElementById('set-name').value;
  state.settings.major = document.getElementById('set-major').value;
  state.settings.daily = parseInt(document.getElementById('set-daily').value) || 20;
  state.settings.phone = document.getElementById('set-phone').value;
  state.settings.smsKey = document.getElementById('set-sms-key').value;
  state.settings.smsSecret = document.getElementById('set-sms-secret').value;
  state.settings.smsSign = document.getElementById('set-sms-sign').value;
  state.settings.smsTemplate = document.getElementById('set-sms-template').value;
  const modSel = document.getElementById('cannon-module-select');
  const topicSel = document.getElementById('cannon-topic-select');
  const diffSel = document.getElementById('cannon-difficulty');
  if (modSel && topicSel && diffSel) {
    state.settings.lastCannon = { module: modSel.value, topic: topicSel.value, difficulty: diffSel.value };
  }
  try { localStorage.setItem('statcannon_settings', JSON.stringify(state.settings)); } catch(e) {}
}

// ---- 工具 ----
function shuffle(arr) { const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a }
function pick(arr) { return arr[Math.floor(Math.random()*arr.length)] }

function getTopicMastery(topicId) {
  const r = state.records[topicId];
  if (!r || (r.correct + r.wrong) === 0) return null;
  return Math.round(r.correct / (r.correct + r.wrong) * 100);
}
function getTopicSpeedScore(topicId) {
  // 速度评分：基于平均答题速度（秒）判断薄弱程度
  // 定义：<15秒=优秀(100分), 15-30秒=良好(80分), 30-60秒=及格(60分), >60秒=薄弱(30分)
  const r = state.records[topicId];
  if (!r || !r.count || r.count < 2) return null;
  const avgMs = r.totalMs / r.count;
  const avgSec = avgMs / 1000;
  if (avgSec < 15) return 100;
  if (avgSec < 30) return 80;
  if (avgSec < 60) return 60;
  return 30;
}
function getTopicCombinedScore(topicId) {
  return getTopicMastery(topicId);
}
function getAllQuestions() {
  const qs = [];
  KNOWLEDGE_TREE.forEach(m => m.topics.forEach(t => {
    t.questions.forEach((q,i) => qs.push({...q, qid: qidOf(t,i), module: m, topic: t, moduleId: m.id, topicId: t.id}));
  }));
  return qs;
}
function getWeakQuestions(threshold=60) {
  // 薄弱点 = 正确率不足 OR 答题速度慢（综合<60分）
  return getAllQuestions().filter(q => {
    const m = getTopicCombinedScore(q.topicId);
    return m !== null && m < threshold;
  });
}

// ---- 页面切换 ----
function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pages = {learn:'page-learn',cannon:'page-cannon',weakness:'page-weakness',plan:'page-plan',rank:'page-rank',settings:'page-settings',resources:'page-resources',study:'page-study',progress:'page-progress'};
  if (pages[name]) document.getElementById(pages[name]).classList.add('active');
  document.querySelectorAll('#top-nav button').forEach(b => b.classList.remove('active'));
  const btns = document.querySelectorAll('#top-nav button');
  const idx = {learn:0,cannon:1,weakness:2,plan:3,rank:4,settings:5,resources:6,progress:7}[name] || 0;
  if (btns[idx]) btns[idx].classList.add('active');
  if (name === 'weakness') renderWeakness();
  if (name === 'plan') generateFullPlan();
  if (name === 'rank') renderRank();
  if (name === 'resources') renderResources();
  if (name === 'progress') {
    if (state.gameActive && state.questionTiming && !state.gamePaused) togglePause();
    window.STATCANNON_TRENDS?.render();
  }
}

// ============================================================
// 1. 学习模块
// ============================================================
function initLearn() {
  document.getElementById('total-modules').textContent = KNOWLEDGE_TREE.length;
  let tCount = 0, qCount = 0;
  KNOWLEDGE_TREE.forEach(m => { tCount += m.topics.length; m.topics.forEach(t => qCount += t.questions.length); });
  document.getElementById('total-topics').textContent = tCount;
  document.getElementById('total-questions').textContent = qCount;
  document.getElementById('question-bank-summary').textContent = '343道基础与情境题 + 490道计算变式（35类），覆盖43个知识点。';

  const container = document.getElementById('module-container');
  container.innerHTML = '';
  KNOWLEDGE_TREE.forEach((m, mi) => {
    const card = document.createElement('div');
    card.className = 'module-card';
    card.onclick = () => toggleModule(mi);
    let mastered = 0, total = 0;
    m.topics.forEach(t => { total++; const m2 = getTopicMastery(t.id); if (m2 !== null && m2 >= 85) mastered++; });
    const pct = total > 0 ? Math.round(mastered/total*100) : 0;
    card.innerHTML = `
      <div class="icon">${m.icon}</div>
      <p class="scope-chip" style="--mc:${MODULE_COLORS[m.id] || 'var(--accent)'}">${m.icon} ${m.name}</p>
      <h3>${String(mi + 1).padStart(2, '0')} · ${m.name}</h3>
      <p class="learning-category">${m.category}</p>
      <p>${m.desc}</p>
      <p class="learning-prerequisite">前置学习：${m.prerequisites}</p>
      ${m.id === 'm5' ? '<p class="learning-prerequisite">GEE / GLMM：先理解重复测量与患者内相关性，再学习模型。</p>' : ''}
      ${m.id !== 'm6' && m.id !== 'm12' ? '<button class="btn btn-dim btn-sm" onclick="event.stopPropagation();openSoftwarePractice()">软件同步练习</button>' : ''}
      <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div style="margin-top:16px" id="module-topics-${mi}"></div>
    `;
    container.appendChild(card);

    const topicContainer = document.getElementById('module-topics-'+mi);
    topicContainer.style.display = 'none';
    topicContainer.dataset.open = 'false';
    m.topics.forEach((t, ti) => {
      const tc = document.createElement('div');
      tc.className = 'topic-card';
      const m2 = getTopicMastery(t.id);
      const ml = getTopicLevel(t.id);
      const status = m2 === null ? '未测试' : (m2 >= 85 ? '已掌握' : m2 >= 60 ? '待巩固' : '薄弱点');
      const statusClass = m2 === null ? 'mastery-new' : (m2 >= 85 ? 'mastery-mastered' : 'mastery-learning');
      const cardTypeTag = (t.cardType || 'A');
      const cardTypeName = {'A':'概念','B':'方法','C':'陷阱','D':'操作','E':'读结果'}[cardTypeTag] || '学习';
      tc.innerHTML = `
        <div class="topic-header" onclick="toggleTopic(${mi},${ti})">
          <span class="topic-name">${t.name} <span class="scope-chip" style="--mc:${MODULE_COLORS[m.id] || 'var(--accent)'}">${t.scope || m.name}</span> <span style="font-size:11px;color:var(--accent);font-weight:400">[${cardTypeName}卡]</span></span>
          <span class="flex gap-4" style="gap:4px">
            <span class="topic-status ${statusClass}">${status}${m2 !== null ? ' ('+m2+'%)' : ''}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#e7eef9;color:var(--accent);font-weight:700">L${ml}</span>
          </span>
        </div>
        <div class="topic-summary">${t.summary}</div>
        <div class="topic-body" id="topic-body-${mi}-${ti}">
          <ul class="point-list">${t.points.map(p => `<li>${p}</li>`).join('')}</ul>
          <div class="keyword-tags">${t.keywords.map(k => `<span>#${k}</span>`).join('')}</div>
          <div class="flex gap-4" style="margin-top:8px"">
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();startFiveStepLearning('${t.id}')">🗡️ 开始学习</button>
            <button class="btn btn-success btn-sm" onclick="event.stopPropagation();startTopicTest(${mi},${ti})">🎯 测试</button>
            <button class="btn btn-dim btn-sm" onclick="event.stopPropagation();switchPage('cannon');startCannonGame('${t.id}')">🔫 统计闯关测试</button>
          </div>
        </div>
      `;
      topicContainer.appendChild(tc);
    });
  });
  updateOverallProgress();
}

// Open the exact theory card without starting a new game or changing its score.
function reviewCannonTopic(topicId) {
  const mi = KNOWLEDGE_TREE.findIndex(m => m.topics.some(t => t.id === topicId));
  if (mi < 0) return;
  const ti = KNOWLEDGE_TREE[mi].topics.findIndex(t => t.id === topicId);
  switchPage('learn');
  const container = document.getElementById('module-topics-' + mi);
  container.style.display = 'block';
  container.dataset.open = 'true';
  const body = document.getElementById(`topic-body-${mi}-${ti}`);
  body.classList.add('open');
  document.getElementById('cannon-review-return')?.remove();
  const back = document.createElement('button');
  back.id = 'cannon-review-return';
  back.className = 'btn btn-primary';
  back.textContent = '返回本题，继续练习';
  back.style.marginBottom = '12px';
  back.onclick = event => {
    event.stopPropagation();
    switchPage('cannon');
    document.getElementById('cannon-result').scrollIntoView({block:'center'});
    back.remove();
  };
  body.prepend(back);
  requestAnimationFrame(() => body.closest('.topic-card').scrollIntoView({block:'start'}));
}

function toggleModule(mi) {
  const tc = document.getElementById('module-topics-'+mi);
  if (!tc) return;
  const isOpen = tc.dataset.open === 'true';
  tc.style.display = isOpen ? 'none' : 'block';
  tc.dataset.open = isOpen ? 'false' : 'true';
}
function toggleTopic(mi, ti) {
  const body = document.getElementById('topic-body-'+mi+'-'+ti);
  if (!body) return;
  body.classList.toggle('open');
}
function expandAllTopics() {
  KNOWLEDGE_TREE.forEach((m, mi) => {
    const tc = document.getElementById('module-topics-'+mi);
    if (tc) { tc.style.display = 'block'; tc.dataset.open = 'true'; }
    m.topics.forEach((t, ti) => {
      const body = document.getElementById('topic-body-'+mi+'-'+ti);
      if (body) body.classList.add('open');
    });
  });
}
function collapseAllTopics() {
  KNOWLEDGE_TREE.forEach((m, mi) => {
    const tc = document.getElementById('module-topics-'+mi);
    if (tc) { tc.style.display = 'none'; tc.dataset.open = 'false'; }
    m.topics.forEach((t, ti) => {
      const body = document.getElementById('topic-body-'+mi+'-'+ti);
      if (body) body.classList.remove('open');
    });
  });
}
function updateOverallProgress() {
  let total = 0, mastered = 0;
  KNOWLEDGE_TREE.forEach(m => m.topics.forEach(t => {
    total++; const m2 = getTopicMastery(t.id);
    if (m2 !== null && m2 >= 85) mastered++;
  }));
  document.getElementById('overall-progress').textContent = `总进度: ${mastered}/${total} 知识点已掌握 (${total>0?Math.round(mastered/total*100):0}%)`;
}

// ---- 知识点测试（弹窗，百词斩风格） ----
let qSequenceState = null;
function startTopicTest(mi, ti) {
  if (state.gameActive) endCannonGame();
  const m = KNOWLEDGE_TREE[mi], t = m.topics[ti];
  const qs = choosePracticeQuestions(t.questions.map((q,i) => ({...q, qid: qidOf(t,i), module: m, topic: t, moduleId: m.id, topicId: t.id})));
  window.STATCANNON_TRENDS?.begin('topic', qs, t.name);
  openQuestionSequence(qs, 0, `📖 ${m.name} → ${t.name}`);
}
function openQuestionSequence(qs, idx, label) {
  if (idx >= qs.length) { showToast('🎉 全部完成！'); closeQuestion(); return; }
  qSequenceState = { qs, idx, label };
  openQuestion(qs[idx], () => {
    qSequenceState.idx++;
    openQuestionSequence(qSequenceState.qs, qSequenceState.idx, qSequenceState.label);
  });
}
function openQuestion(q, onNext) {
  const overlay = document.getElementById('question-overlay');
  overlay.classList.add('show');
  document.getElementById('q-module-label').innerHTML = q.module
    ? `<span class="module-dot" style="--mc:${MODULE_COLORS[q.module.id] || 'var(--accent)'}"></span>${q.module.icon} ${q.module.name} → ${q.topic.name}${q.topic.scope ? ` <span class="scope-chip" style="--mc:${MODULE_COLORS[q.module.id] || 'var(--accent)'}">${q.topic.scope}</span>` : ''}`
    : '测试';
  document.getElementById('q-progress').textContent = qSequenceState ? `${qSequenceState.idx+1}/${qSequenceState.qs.length}` : '';
  document.getElementById('q-text').textContent = q.q;
  const letters = ['A','B','C','D'];
  const optsDiv = document.getElementById('q-options');
  optsDiv.innerHTML = '';
  q.options.forEach((o, i) => {
    const div = document.createElement('div');
    div.className = 'q-option';
    div.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${o}</span>`;
    div.onclick = () => answerQuestion(q, i, letters, div, onNext);
    optsDiv.appendChild(div);
  });
  document.getElementById('q-explain').className = 'q-explain';
  document.getElementById('q-explain').innerHTML = '';
  document.getElementById('q-next-btn').style.display = 'none';
  state.qAnswered = false;
}
function answerQuestion(q, selectedIdx, letters, clickedDiv, onNext) {
  if (state.qAnswered) return;
  state.qAnswered = true;
  const correct = selectedIdx === q.answer;
  const opts = document.querySelectorAll('#question-box .q-option');
  opts.forEach((div, i) => {
    div.style.cursor = 'default';
    if (i === q.answer) div.classList.add('correct');
    if (i === selectedIdx && !correct) div.classList.add('wrong');
  });
  q.selectedOption = q.options[selectedIdx];
  recordAnswer(q, correct);
  window.STATCANNON_TRENDS?.record(q, correct, 0);
  const explainDiv = document.getElementById('q-explain');
  explainDiv.className = 'q-explain show';
  explainDiv.innerHTML = `
    <div style="margin-bottom:8px;font-weight:800;font-size:18px">
      ${correct ? '✅ 回答正确！' : '❌ 回答错误'}
    </div>
    ${window.STATCANNON_FEEDBACK.render(q, selectedIdx)}
  `;
  const nextBtn = document.getElementById('q-next-btn');
  nextBtn.style.display = 'inline-flex';
  nextBtn.onclick = () => { if (onNext) onNext(); else closeQuestion(); };
}
function closeQuestion() {
  window.STATCANNON_TRENDS?.finish();
  document.getElementById('question-overlay').classList.remove('show');
  qSequenceState = null;
}
function recordAnswer(q, correct, speedMs, moduleId, topicId) {
  const tid = q.topicId || topicId;
  if (!state.records[tid]) state.records[tid] = { correct: 0, wrong: 0, answered: [], totalMs: 0, count: 0 };
  state.records[tid].correct += correct ? 1 : 0;
  state.records[tid].wrong += correct ? 0 : 1;
  state.records[tid].answered.push(q.qid);
  if (speedMs !== undefined) {
    state.records[tid].totalMs = (state.records[tid].totalMs || 0) + speedMs;
    state.records[tid].count = (state.records[tid].count || 0) + 1;
  }
  state.history.push({ qid: q.qid, correct, ts: Date.now(), module: q.moduleId || moduleId, topic: q.topicId || topicId, speedMs: speedMs });
  state.gameTotal++;
  state.gameCorrect += correct ? 1 : 0;
  // 同步更新百斩掌握度（打炮/知识点测试也触发SM-2）
  applyAnswerEffect(tid, correct);
  saveState();
  updateOverallProgress();
}

// ============================================================
// 2. 打炮游戏（炮口跟随鼠标，点击发射）
// ============================================================
let cannonMouse = { x: 0, y: 0 };
let cannonAiming = false;

function choosePracticeQuestions(qs) {
  const selected = window.STATCANNON_PRACTICE.select(qs, {
    history: state.history,
    recent: state.settings.cannonRecent || []
  });
  state.settings.cannonRecent = [...(state.settings.cannonRecent || []), ...selected.map(q=>q.qid)].slice(-2000);
  try { localStorage.setItem('statcannon_settings', JSON.stringify(state.settings)); } catch(e) {}
  return selected;
}

function startCannonGame(topicId) {
  // 选题
  let qs = getAllQuestions();
  let selectedModule = 'all';
  let selectedTopic = 'all';
  let selectedDifficulty = 'all';
  if (topicId && topicId !== 'all') {
    const info = getTopicInfo(topicId);
    selectedTopic = topicId;
    selectedModule = info ? info.module.id : 'all';
    const modSel = document.getElementById('cannon-module-select');
    if (modSel) modSel.value = selectedModule;
    updateTopicSelector(selectedTopic);
    const topSel = document.getElementById('cannon-topic-select');
    if (topSel) topSel.value = selectedTopic;
    qs = qs.filter(q => q.topicId === topicId);
  } else {
    const modSel = document.getElementById('cannon-module-select');
    const topSel = document.getElementById('cannon-topic-select');
    const diffSel = document.getElementById('cannon-difficulty');
    selectedModule = modSel ? modSel.value : 'all';
    selectedTopic = topSel ? topSel.value : 'all';
    selectedDifficulty = diffSel ? diffSel.value : 'all';
    if (selectedModule !== 'all') qs = qs.filter(q => q.moduleId === selectedModule);
    if (selectedTopic !== 'all') qs = qs.filter(q => q.topicId === selectedTopic);
    if (selectedDifficulty === 'weak') qs = getWeakQuestions(getAllQuestions().length).filter(q => selectedModule === 'all' || q.moduleId === selectedModule).filter(q => selectedTopic === 'all' || q.topicId === selectedTopic);
  }
  state.settings.lastCannon = { module: selectedModule, topic: selectedTopic, difficulty: selectedDifficulty };
  try { localStorage.setItem('statcannon_settings', JSON.stringify(state.settings)); } catch(e) {}
  if (qs.length < 4 && selectedTopic !== 'all') {
    const info = getTopicInfo(selectedTopic);
    if (info) {
      qs = getAllQuestions().filter(q => q.moduleId === info.module.id);
      showToast(`ℹ️「${info.topic.name}」题量不足4题，已扩展为${info.module.name}题池`);
    }
  }
  if (qs.length < 4) { showToast('⚠️ 当前范围题目太少，请选择更多知识点'); return; }

  qs = choosePracticeQuestions(qs);
  state.gameActive = true;
  state.gameQueue = qs;
  window.STATCANNON_TRENDS?.begin('cannon', qs, selectedTopic !== 'all' ? getTopicInfo(selectedTopic).topic.name : (KNOWLEDGE_TREE.find(m=>m.id===selectedModule)?.name || '综合练习'));
  document.getElementById('live-accuracy').textContent = '正确率 — · 0/0';
  state.gameIndex = 0;
  state.gameScore = 0;
  state.gameCombo = 0;
  state.gameMaxCombo = 0;
  state.gameMilestones = 0;
  state.gameTotal = 0;
  state.gameCorrect = 0;
  state.gameByModule = {};
  state.gameDetail = [];

  // 关闭战报
  document.getElementById('game-summary')?.classList.remove('show');

  document.getElementById('score-display').textContent = '0';
  document.getElementById('combo-display').textContent = '🔥 x1';
  document.getElementById('hud-status').textContent = '瞄准开炮！';
  document.getElementById('game-remaining').textContent = `共 ${qs.length} 题`;
  document.getElementById('cannon-result').classList.remove('show');

  switchPageFlag = false;
  // 开始音效
  playStartSound();
  spawnCannonQuestion();
}

// 出题：显示题目 + 4个候选项作为目标
function spawnCannonQuestion() {
  if (state.gameIndex >= state.gameQueue.length) { endCannonGame(); return; }
  const q = state.gameQueue[state.gameIndex];

  // 题目显示区
  const qBox = document.getElementById('cannon-question');
  qBox.style.display = 'block';
  document.getElementById('cq-tag').innerHTML = `<span class="module-dot" style="--mc:${MODULE_COLORS[q.module.id] || 'var(--accent)'}"></span>${q.module.icon} ${q.module.name} → ${q.topic.name}${q.topic.scope ? ` <span class="scope-chip" style="--mc:${MODULE_COLORS[q.module.id] || 'var(--accent)'}">${q.topic.scope}</span>` : ''}`;
  document.getElementById('cq-text').textContent = q.q;
  document.getElementById('cq-progress').textContent = `第 ${state.gameIndex+1} / ${state.gameQueue.length} 题`;
  document.getElementById('hud-current').textContent = `${state.gameIndex+1}/${state.gameQueue.length}`;
  document.getElementById('hud-status').textContent = '🎯 瞄准选项开炮';
  document.getElementById('game-remaining').textContent = `剩余 ${state.gameQueue.length - state.gameIndex} 题`;

  // 生成 4 个候选项（分布于画布四处）
  const letters = ['A','B','C','D'];
  const optsWrap = document.getElementById('cannon-options');
  optsWrap.innerHTML = '';

  // 屏幕适配的坐标（百分比）
  const positions = [
    { x: 8,  y: 16 },   // 左上
    { x: 52, y: 10 },   // 右上
    { x: 8,  y: 48 },   // 左下
    { x: 52, y: 44 }    // 右下
  ];
  q.options.forEach((o, i) => {
    const el = document.createElement('div');
    el.className = 'cannon-option';
    el.dataset.index = i;
    el.style.left = positions[i].x + '%';
    el.style.top = positions[i].y + '%';
    el.innerHTML = `<span class="co-letter">${letters[i]}</span><span class="co-text">${o}</span>`;
    el.onclick = (e) => { e.stopPropagation(); fireAtOption(el, q, i); };
    optsWrap.appendChild(el);
  });

  document.getElementById('cannon-result').classList.remove('show');
  // 重置炮口朝向
  cannonAiming = true;
  if (window.matchMedia("(max-width: 768px)").matches) {
    requestAnimationFrame(() => qBox.scrollIntoView({block: "start", behavior: "instant"}));
  }

  // 开始本题计时（若处于暂停状态则不启动）
  state.pauseStartTime = 0;
  state.totalPausedMs = 0;
  if (!state.gamePaused) {
    state.questionTiming = true;
    state.questionStartTime = Date.now();
    updateQTimerDisplay();
  }
}

// 暂停/继续计时
function togglePause() {
  const wasPaused = state.gamePaused;
  state.gamePaused = !state.gamePaused;
  if (state.gamePaused) {
    // 暂停：停止计时
    if (state.questionTiming) {
      state.questionTiming = false;
      state.pauseStartTime = Date.now();
    }
    document.getElementById('hud-status').textContent = '⏸ 已暂停（不计时）';
    document.getElementById('pause-btn').textContent = '▶ 继续答题';
    document.getElementById('pause-btn').style.background = 'var(--success)';
  } else {
    // 恢复：继续计时
    if (state.pauseStartTime > 0) {
      state.totalPausedMs += Date.now() - state.pauseStartTime;
      state.pauseStartTime = 0;
    }
    if (state.gameActive && !state.qAnswered) {
      state.questionTiming = true;
      state.questionStartTime = Date.now() - (state.questionStartTime ? (Date.now() - state.questionStartTime - state.totalPausedMs) : 0);
      // 更准确：重新设定起点，减去已计入的暂停时间
      const elapsed = state.questionStartTime ? (Date.now() - state.questionStartTime) : 0;
      state.questionStartTime = Date.now() - Math.max(0, elapsed - state.totalPausedMs);
      state.totalPausedMs = 0;
      updateQTimerDisplay();
    }
    document.getElementById('hud-status').textContent = '🎯 瞄准选项开炮';
    document.getElementById('pause-btn').textContent = '⏸ 暂停';
    document.getElementById('pause-btn').style.background = 'rgba(255,255,255,0.1)';
  }
}

// 显示当前题所用时间
function updateQTimerDisplay() {
  const timerEl = document.getElementById('qtimer');
  if (!timerEl) return;
  if (!state.questionTiming || !state.questionStartTime) {
    timerEl.textContent = state.gamePaused ? '⏸' : '--';
    return;
  }
  const elapsed = Math.max(0, Date.now() - state.questionStartTime - state.totalPausedMs);
  const secs = Math.floor(elapsed / 1000);
  timerEl.textContent = (Math.floor(secs/60)) + ':' + String(secs%60).padStart(2,'0');
}

// 每秒刷新计时显示
setInterval(() => { if (state.gameActive && state.questionTiming && !state.gamePaused) updateQTimerDisplay(); }, 1000);

// 炮口跟随鼠标转向（v3.1 增加瞄准辅助线显隐）
function initCannonAim() {
  const scene = document.getElementById('cannon-scene');
  scene.addEventListener('mousemove', (e) => {
    const rect = scene.getBoundingClientRect();
    cannonMouse.x = e.clientX - rect.left;
    cannonMouse.y = e.clientY - rect.top;
    updateCannonAngle();
    updateAimedOption(e);
  });
  scene.addEventListener('mouseenter', () => { if (state.gameActive) scene.classList.add('aiming'); });
  scene.addEventListener('mouseleave', () => scene.classList.remove('aiming'));
  scene.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const rect = scene.getBoundingClientRect();
      cannonMouse.x = e.touches[0].clientX - rect.left;
      cannonMouse.y = e.touches[0].clientY - rect.top;
      updateCannonAngle();
    }
  }, {passive:true});

  // 点击发射：命中检测
  scene.addEventListener('click', (e) => {
    // Use the original event target: controls may hide or replace content on click.
    if (e.target.closest('#cannon-result, #game-summary, #game-hud, button, a, input, select, textarea')) return;
    if (!state.gameActive) return;
    const rect = scene.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    // 命中检测：找最近的候选项
    const opts = document.querySelectorAll('.cannon-option');
    let hitEl = null, minDist = 9999;
    opts.forEach(el => {
      const r = el.getBoundingClientRect();
      const cx = r.left - rect.left + r.width/2;
      const cy = r.top - rect.top + r.height/2;
      const d = Math.hypot(cx - mx, cy - my);
      if (d < minDist) { minDist = d; hitEl = el; }
    });
    // 命中判定：点击位置需在选项扩展区域内
    const hitOpt = document.elementFromPoint(e.clientX, e.clientY);
    let targetOpt = null;
    if (hitOpt && hitOpt.closest('.cannon-option')) {
      targetOpt = hitOpt.closest('.cannon-option');
    } else if (hitEl && minDist < 150) {
      targetOpt = hitEl;
    }
    if (targetOpt) {
      const idx = parseInt(targetOpt.dataset.index);
      fireAtOption(targetOpt, state.gameQueue[state.gameIndex], idx);
    }
  });
}

// 选项高亮（瞄准哪个选项）
function updateAimedOption(e) {
  if (!state.gameActive) return;
  const opts = document.querySelectorAll('.cannon-option');
  const hitOpt = document.elementFromPoint(e.clientX, e.clientY);
  opts.forEach(el => el.classList.remove('aimed'));
  if (hitOpt && hitOpt.closest('.cannon-option')) {
    hitOpt.closest('.cannon-option').classList.add('aimed');
  }
}

// 更新炮口角度（含瞄准辅助线 v3.1）
function updateCannonAngle() {
  const wrapper = document.getElementById('cannon-wrapper');
  const scene = document.getElementById('cannon-scene');
  const sRect = scene.getBoundingClientRect();
  const wRect = wrapper.getBoundingClientRect();
  const cx = wRect.left - sRect.left + 60;  // 炮管尾部转动中心
  const cy = wRect.top - sRect.top + 70;
  let angle = Math.atan2(cannonMouse.y - cy, cannonMouse.x - cx) * 180 / Math.PI;
  // 限制角度范围（避免炮管翻转到地面以下）
  angle = Math.max(-30, Math.min(70, angle));
  wrapper.style.transform = `rotate(${angle}deg)`;

  // 瞄准辅助线：在鼠标位置画点
  const aimLine = document.getElementById('cannon-aim-line');
  if (aimLine) {
    const dot = aimLine.querySelector('.aim-dot') || (() => { const d = document.createElement('div'); d.className = 'aim-dot'; aimLine.appendChild(d); return d; })();
    dot.style.left = cannonMouse.x + 'px';
    dot.style.top = cannonMouse.y + 'px';
  }
}

// 发射炮弹到指定选项
function fireAtOption(optEl, q, optIdx) {
  if (!state.gameActive || state.gamePaused || state.cannonFiring) return;
  state.cannonFiring = true;
  if (!state.gameByModule) state.gameByModule = {};
  const scene = document.getElementById('cannon-scene');
  const sRect = scene.getBoundingClientRect();
  const oRect = optEl.getBoundingClientRect();
  const tx = oRect.left - sRect.left + oRect.width/2;
  const ty = oRect.top - sRect.top + oRect.height/2;

  // 炮口位置（相对场景）
  const wrapper = document.getElementById('cannon-wrapper');
  const wRect = wrapper.getBoundingClientRect();
  const startX = wRect.left - sRect.left + 95;  // 炮口位置
  const startY = wRect.top - sRect.top + 30;

  // 炮口闪光
  const flash = document.getElementById('cannon-muzzle-flash');
  flash.classList.add('fire');
  setTimeout(() => flash.classList.remove('fire'), 100);

  // 炮管后坐力（v3.1）
  const recoil = document.getElementById('cannon-barrel');
  if (recoil) {
    recoil.style.transition = 'none';
    recoil.style.transform = 'translateX(-8px)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      recoil.style.transition = 'transform .18s ease-out';
      recoil.style.transform = 'translateX(0)';
    }));
  }
  playRecoilSound();

  // 炮弹（带拖尾，v3.1）
  const ball = document.createElement('div');
  ball.className = 'cannonball';
  ball.style.left = startX + 'px';
  ball.style.top = startY + 'px';
  scene.appendChild(ball);

  // 发射音效（短促）
  playFireSound();

  // 飞行动画（帧率无关：按实际时间推进 v3.1）
  const durMs = 550;
  const flyStart = performance.now();
  const trailEls = [];
  function animateBall(now) {
    const elapsed = now - flyStart;
    const progress = Math.min(1, elapsed / durMs);
    const px = startX + (tx - startX) * progress;
    const py = startY + (ty - startY) * progress - 60 * Math.sin(progress * Math.PI);
    ball.style.left = px + 'px';
    ball.style.top = py + 'px';
    // 拖尾残影
    const tr = document.createElement('div');
    tr.className = 'cannonball-trail';
    tr.style.left = px + 'px';
    tr.style.top = py + 'px';
    scene.appendChild(tr);
    trailEls.push(tr);
    if (progress >= 1) {
      ball.remove();
      trailEls.forEach(el => el.remove());
      createExplosion(tx, ty, scene);
      // 判定结果：由判题分支播放唯一的正确或错误音效。
      judgeCannonAnswer(q, optIdx, optEl);
      state.cannonFiring = false;
      return;
    }
    requestAnimationFrame(animateBall);
  }
  requestAnimationFrame(animateBall);
}

// 判定打炮结果（计分升级 v3.1）
function judgeCannonAnswer(q, optIdx, optEl) {
  const correct = optIdx === q.answer;
  if (!state.gameByModule) state.gameByModule = {};
  const moduleKey = q.moduleId || 'unknown';
  if (!state.gameByModule[moduleKey]) state.gameByModule[moduleKey] = { name: q.module ? q.module.name : moduleKey, icon: q.module ? q.module.icon : '📚', correct: 0, total: 0 };
  state.gameByModule[moduleKey].total++;
  if (correct) state.gameByModule[moduleKey].correct++;
  // 计算本题耗时（扣除暂停时间）
  let speedMs = 0;
  if (state.questionTiming || state.questionStartTime) {
    state.questionTiming = false;
    speedMs = Math.max(0, Date.now() - state.questionStartTime - state.totalPausedMs);
  }
  q.selectedOption = q.options[optIdx];
  recordAnswer(q, correct, speedMs, q.moduleId, q.topicId);

  // 选项状态
  const opts = document.querySelectorAll('.cannon-option');
  const scene = document.getElementById('cannon-scene');
  const sRect = scene.getBoundingClientRect();
  const oRect = optEl.getBoundingClientRect();
  const popX = oRect.left - sRect.left + oRect.width / 2;
  const popY = oRect.top - sRect.top;

  opts.forEach((el, i) => {
    el.style.pointerEvents = 'none';
    if (i === q.answer) el.classList.add('c-ok');
    if (i === optIdx && !correct) el.classList.add('c-bad');
  });

  // 计分 v3.1：基础分 + 连击加成 + 精准命中奖励（速度）
  let gain = 0;
  let isMilestone = false;
  if (correct) {
    state.gameCombo++;
    const combo = Math.min(state.gameCombo, 10);
    gain = 10 + combo * 2;                    // 基础+连击
    const secsMs = speedMs;
    let speedBonus = 0;
    if (secsMs > 0) {
      if (secsMs < 5000) speedBonus = 10;     // 精准命中 <5s
      else if (secsMs < 8000) speedBonus = 5; // 快速 <8s
      else if (secsMs < 15000) speedBonus = 2; // 较快 <15s
    }
    playHitSound();
    gain += speedBonus;
    state.gameScore += gain;
    if (state.gameCombo > state.gameMaxCombo) state.gameMaxCombo = state.gameCombo;
    // 连击里程碑
    const milestones = [5, 10, 15, 20, 30, 50];
    if (milestones.indexOf(state.gameCombo) !== -1) {
      isMilestone = true;
      state.gameMilestones++;
      playMilestoneSound();
      showToast(`🔥 连击里程碑！${state.gameCombo} 连击！`);
      // 全场金闪
      const gold = document.createElement('div');
      gold.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle,rgba(250,204,21,0.25),transparent 70%);z-index:59;pointer-events:none;animation:flashFade .6s forwards';
      document.body.appendChild(gold);
      setTimeout(() => gold.remove(), 650);
    }
    showScorePop(popX, popY - 24, `+${gain}`, 'good', true);
    if (speedMs > 0 && speedMs < 8000) {
      showScorePop(popX, popY + 26, speedMs < 5000 ? '⚡ 精准' : '🚀 快速', 'combo');
    }
    // 命中时炮管后坐力方向修正：向上微小抬升（视觉反馈）
    scene.classList.remove('shake');
    void scene.offsetWidth;
    scene.classList.add('shake');
  } else {
    state.gameCombo = 0;
    showScorePop(popX, popY - 24, '脱靶', 'bad');
    playMissSound();
    // 脱靶震动更轻
    scene.classList.remove('shake');
    void scene.offsetWidth;
    scene.classList.add('shake');
  }
  window.STATCANNON_TRENDS?.record(q, correct, gain);
  document.getElementById('score-display').textContent = state.gameScore;
  document.getElementById('combo-display').textContent = `🔥 x${state.gameCombo}`;

  // 结果显示（修复正确选项模板字符串 bug v3.1）
  const result = document.getElementById('cannon-result');
  result.classList.add('show');
  document.getElementById('cr-head').innerHTML = correct ? '💥 命中目标！太棒了！' : '💔 脱靶了...';
  document.getElementById('cr-head').style.color = correct ? 'var(--success)' : 'var(--danger)';
  const secs = Math.floor(speedMs / 1000);
  const comboNow = state.gameCombo;
  const comboBonus = Math.min(comboNow, 10) * 2;
  let speedBonusText = '';
  if (correct && speedMs > 0) {
    speedBonusText = speedMs < 5000 ? '（精准命中 +10）' : (speedMs < 8000 ? '（快速命中 +5）' : (speedMs < 15000 ? '（速度奖励 +2）' : ''));
  }
  document.getElementById('cr-pts').textContent = correct
    ? `+${gain} 分 ｜ 连击 x${comboNow}（+${comboBonus}）${speedBonusText}｜ 用时 ${secs} 秒`
    : `用时 ${secs} 秒 ｜ 正确选项是 ${['A','B','C','D'][q.answer]}`;
  document.getElementById('cr-explain').innerHTML = window.STATCANNON_FEEDBACK.render(q, optIdx);
  const learnLink = document.getElementById('cr-learn-link');
  const topicId = q.topicId || q.topic?.id;
  const topic = KNOWLEDGE_TREE.flatMap(m => m.topics).find(t => t.id === topicId);
  learnLink.hidden = correct || !topic;
  learnLink.style.display = learnLink.hidden ? 'none' : 'inline-flex';
  learnLink.textContent = '知识树';
  learnLink.onclick = event => {
    event.preventDefault();
    event.stopPropagation();
    reviewCannonTopic(topicId);
  };


  const nextBtn = document.getElementById('cr-next-btn');
  nextBtn.style.display = 'inline-flex';
  nextBtn.onclick = (e) => {
    e.stopPropagation();
    result.classList.remove('show');
    state.gameIndex++;
    if (state.gameIndex >= state.gameQueue.length) { endCannonGame(); }
    else spawnCannonQuestion();
  };
}

// 得分飘字 v3.1
function showScorePop(x, y, text, cls, big) {
  const scene = document.getElementById('cannon-scene');
  if (!scene) return;
  const pop = document.createElement('div');
  pop.className = 'score-pop ' + (cls || 'good') + (big ? ' score-pop-big' : '');
  pop.style.left = x + 'px';
  pop.style.top = y + 'px';
  pop.textContent = text;
  scene.appendChild(pop);
  setTimeout(() => pop.remove(), 950);
}

// 爆炸效果（百词斩风：烟团+碎屑+闪光）
function createExplosion(x, y, scene) {
  // 闪光
  const flash = document.createElement('div');
  flash.className = 'flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 400);

  // 主爆炸火球
  const boom = document.createElement('div');
  boom.className = 'explosion';
  boom.style.left = x + 'px';
  boom.style.top = y + 'px';
  scene.appendChild(boom);
  let size = 0;
  function grow() {
    size += 12;
    boom.style.width = size + 'px';
    boom.style.height = size + 'px';
    boom.style.background = `radial-gradient(circle, rgba(255,220,80,0.9), rgba(255,120,30,0.6), rgba(200,60,10,0.3), transparent 80%)`;
    boom.style.marginLeft = -size/2 + 'px';
    boom.style.marginTop = -size/2 + 'px';
    if (size < 180) requestAnimationFrame(grow);
    else boom.remove();
  }
  grow();

  // 烟团（百词斩风：灰白色烟雾）
  for (let i = 0; i < 5; i++) {
    const smoke = document.createElement('div');
    smoke.className = 'explosion-smoke';
    const angle = Math.random() * 2 * Math.PI;
    const dist = 10 + Math.random() * 30;
    smoke.style.left = (x + Math.cos(angle) * dist) + 'px';
    smoke.style.top = (y + Math.sin(angle) * dist) + 'px';
    smoke.style.width = smoke.style.height = (20 + Math.random() * 40) + 'px';
    smoke.style.background = `radial-gradient(circle, rgba(${180+Math.random()*40},${170+Math.random()*30},${150+Math.random()*30},${0.3+Math.random()*0.2}), transparent 70%)`;
    scene.appendChild(smoke);
    let s = 0;
    (function puff() {
      s += 0.03;
      if (s >= 1) { smoke.remove(); return; }
      smoke.style.transform = `scale(${1 + s * 0.8})`;
      smoke.style.opacity = 1 - s * 0.7;
      smoke.style.marginLeft = -(parseFloat(smoke.style.width)/2) * s * 0.8 + 'px';
      smoke.style.marginTop = -(parseFloat(smoke.style.height)/2) * s * 0.8 + 'px';
      requestAnimationFrame(puff);
    })();
  }

  // 碎屑粒子（百词斩风：碎片飞溅）
  const colors = ['#f59e0b','#ef4444','#22c55e','#3b82f6','#fff','#fbbf24','#8b5cf6','#a78bfa'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = Math.random() * 2 * Math.PI;
    const dist = 40 + Math.random() * 160;
    p.style.background = pick(colors);
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    const psize = 2 + Math.random() * 6;
    p.style.width = p.style.height = psize + 'px';
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    scene.appendChild(p);
    let pg = 0;
    (function fly() {
      pg += 0.035 + Math.random() * 0.015;
      if (pg >= 1) { p.remove(); return; }
      p.style.left = (x + Math.cos(angle) * dist * pg) + 'px';
      p.style.top = (y + Math.sin(angle) * dist * pg - 80 * Math.sin(pg * Math.PI) - 20 * pg * pg) + 'px';
      p.style.opacity = 1 - pg * 0.8;
      p.style.transform = `rotate(${pg * 360 * Math.random()}deg) scale(${1 - pg * 0.5})`;
      requestAnimationFrame(fly);
    })();
  }
}

// ============================================================
// ---- 音效系统 v3.1（单例 AudioContext + 统一 sfx 合成器） ----
// ============================================================
let _sfxCtx = null;
let _sfxInitTime = 0;
function _getSfxCtx() {
  if (!_sfxCtx || _sfxCtx.state === 'closed') {
    _sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
    _sfxInitTime = 0;
  }
  if (_sfxCtx.state === 'suspended') _sfxCtx.resume();
  return _sfxCtx;
}
function _sfxGain(vol) {
  const ctx = _getSfxCtx();
  const g = ctx.createGain();
  g.gain.value = vol * (state.settings.sfxVolume ?? 60) / 100;
  g.connect(ctx.destination);
  return g;
}
function _sfxOsc(type, freq, dur, vol, dest) {
  const ctx = _getSfxCtx();
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  o.connect(dest || ctx.destination);
  o.start();
  o.stop(ctx.currentTime + dur);
  return o;
}
function _sfxNoise(dur, vol) {
  const ctx = _getSfxCtx();
  const bufSize = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = _sfxGain(vol);
  src.connect(g);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.start();
  return src;
}
function _sfxRampFreq(type, from, to, dur, vol) {
  const ctx = _getSfxCtx();
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur);
  const g = _sfxGain(vol);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g);
  o.start(); o.stop(ctx.currentTime + dur);
  return o;
}

function sfxEnabled() { return state.settings.sfxOn !== false; }

// 发射音
function playFireSound() {
  if (!sfxEnabled()) return;
  try {
    _sfxRampFreq('square', 300, 80, 0.12, 0.25);
  } catch(e){}
}
// Original synthesized answer cues; no third-party audio samples.
function _answerTone(type, from, to, delay, duration, volume) {
  const ctx = _getSfxCtx(), start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator(), gain = _sfxGain(0);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
  const level = volume * Math.max(0, Math.min(100, state.settings.sfxVolume ?? 60)) / 100;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(level, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.00001, start + duration);
  oscillator.connect(gain);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(start); oscillator.stop(start + duration);
}
// Correct: full impact followed by a bright rising major triad.
function playHitSound() {
  if (!sfxEnabled()) return;
  try {
    _answerTone('triangle', 180, 55, 0, 0.30, 0.40);
    _sfxNoise(0.12, 0.16);
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => {
      _answerTone('sine', frequency, frequency, 0.08 + i * 0.075, 0.30, 0.24);
    });
  } catch(e){}
}
// Wrong: two short dissonant, descending buzzes, without a success chime.
function playMissSound() {
  if (!sfxEnabled()) return;
  try {
    [0, 0.18].forEach(delay => {
      _answerTone('sawtooth', 185, 95, delay, 0.16, 0.16);
      _answerTone('triangle', 196, 101, delay, 0.16, 0.12);
    });
  } catch(e){}
}
// 连击里程碑
function playMilestoneSound() {
  if (!sfxEnabled()) return;
  try {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      setTimeout(() => { try { _sfxRampFreq('sine', freq, freq * 1.05, 0.12, 0.15); } catch(e){} }, i * 80);
    });
  } catch(e){}
}
// 得分（小加分）
function playScoreSound() {
  if (!sfxEnabled()) return;
  try {
    _sfxRampFreq('sine', 660, 880, 0.10, 0.12);
  } catch(e){}
}
// 游戏开始
function playStartSound() {
  if (!sfxEnabled()) return;
  try {
    const notes = [392, 523, 659, 784]; // G4 C5 E5 G5
    notes.forEach((freq, i) => {
      setTimeout(() => { try { _sfxRampFreq('sine', freq, freq * 1.03, 0.14, 0.15); } catch(e){} }, i * 120);
    });
  } catch(e){}
}
// 游戏结束
function playEndSound() {
  if (!sfxEnabled()) return;
  try {
    _sfxRampFreq('sine', 523, 262, 0.60, 0.20);
    setTimeout(() => { try { _sfxRampFreq('sine', 440, 220, 0.50, 0.15); } catch(e){} }, 300);
  } catch(e){}
}
// 炮管后坐力音（短促低频）
function playRecoilSound() {
  if (!sfxEnabled()) return;
  try {
    _sfxRampFreq('sawtooth', 60, 20, 0.08, 0.30);
  } catch(e){}
}
// 音效开关
function toggleSfxSetting() {
  state.settings.sfxOn = !state.settings.sfxOn;
  saveSettings();
  const btn = document.getElementById('set-sfx-toggle');
  if (btn) btn.textContent = state.settings.sfxOn ? '🔊 音效：开' : '🔇 音效：关';
  loadSfxSettingsUI();
}
function onSfxVolumeInput(val) {
  state.settings.sfxVolume = parseInt(val) || 60;
  saveSettings();
  loadSfxSettingsUI();
}
function loadSfxSettingsUI() {
  const btn = document.getElementById('set-sfx-toggle');
  if (btn) btn.textContent = state.settings.sfxOn !== false ? '🔊 音效：开' : '🔇 音效：关';
  const vol = document.getElementById('set-sfx-volume');
  if (vol) vol.value = state.settings.sfxVolume || 60;
}

function endCannonGame() {
  window.STATCANNON_TRENDS?.finish();
  state.gameActive = false;
  state.cannonFiring = false;
  state.questionTiming = false;
  state.gamePaused = false;
  document.getElementById('hud-status').textContent = '已结束';
  document.getElementById('hud-current').textContent = '-';
  document.getElementById('game-remaining').textContent = '已结束';
  const optsWrap = document.getElementById('cannon-options');
  optsWrap.innerHTML = '';
  document.getElementById('pause-btn').textContent = '⏸ 暂停';
  const total = state.gameTotal || 0;
  const correct = state.gameCorrect || 0;
  const pct = total > 0 ? Math.round(correct/total*100) : 0;
  // 游戏结束音效
  playEndSound();
  // 显示本局战报（v3.1）
  showGameSummary();
  saveState();
}

// 本局战报 v3.1
function showGameSummary() {
  const total = state.gameTotal || 0;
  const correct = state.gameCorrect || 0;
  const pct = total > 0 ? Math.round(correct/total * 100) : 0;
  const score = state.gameScore;
  const maxCombo = state.gameMaxCombo;
  const milestones = state.gameMilestones || 0;
  const wrong = total - correct;
  // 勋章
  const badges = [];
  if (pct >= 90) badges.push('🏅 学霸');
  else if (pct >= 70) badges.push('🥈 优秀');
  else if (pct >= 50) badges.push('🥉 加油');
  if (maxCombo >= 10) badges.push('🔥 连击大师');
  else if (maxCombo >= 5) badges.push('🔥 连击高手');
  if (milestones >= 3) badges.push('🎯 里程碑收割者');
  if (total >= 20) badges.push('📚 刷题狂魔');
  const summaryEl = document.getElementById('game-summary');
  if (!summaryEl) return;
  document.getElementById('gs-title').textContent = '🎮 本局战报';
  document.getElementById('gs-stats').innerHTML = `
    <div class="gs-stat"><div class="num">${score}</div><div class="lbl">总得分</div></div>
    <div class="gs-stat"><div class="num" style="color:${pct>=70?'var(--success)':(pct>=50?'var(--warn)':'var(--danger)')}">${pct}%</div><div class="lbl">正确率</div></div>
    <div class="gs-stat"><div class="num">${correct}/${total}</div><div class="lbl">答对/总题</div></div>
    <div class="gs-stat"><div class="num" style="color:var(--accent)">${maxCombo}x</div><div class="lbl">最高连击</div></div>
    <div class="gs-stat"><div class="num" style="color:#a78bfa">${milestones}</div><div class="lbl">里程碑</div></div>
    <div class="gs-stat"><div class="num" style="color:#f87171">${wrong}</div><div class="lbl">答错</div></div>`;
  document.getElementById('gs-badges').innerHTML = badges.length > 0
    ? badges.map(b => `<span class="gs-badge">${b}</span>`).join('')
    : '<span style="font-size:13px;color:var(--dim)">多做练习获得勋章</span>';
  const moduleRows = Object.entries(state.gameByModule || {}).map(([id, item]) => {
    const rate = item.total ? Math.round(item.correct / item.total * 100) : 0;
    const color = MODULE_COLORS[id] || 'var(--accent)';
    return `<div class="gs-module-row"><div><span class="module-dot" style="--mc:${color}"></span>${item.icon} ${item.name}</div><div class="gs-module-track"><span style="width:${rate}%;background:${color}"></span></div><strong style="color:${color}">${rate}%</strong><small>${item.correct}/${item.total}</small></div>`;
  }).join('');
  const range = document.createElement('div');
  range.className = 'gs-module-breakdown';
  range.innerHTML = `<div class="gs-breakdown-title">📚 按一级主题反馈</div>${moduleRows || '<div style="color:var(--dim);font-size:12px">暂无分模块数据</div>'}`;
  const badgesEl = document.getElementById('gs-badges');
  if (badgesEl.nextElementSibling?.classList.contains('gs-module-breakdown')) badgesEl.nextElementSibling.remove();
  badgesEl.after(range);
  summaryEl.classList.add('show');
}
function closeGameSummary() {
  document.getElementById('game-summary').classList.remove('show');
}

// ============================================================
// 3. 薄弱点分析
// ============================================================
function renderWeakness() {
  const chart = document.getElementById('weakness-chart');
  chart.innerHTML = '';
  let hasData = false;
  KNOWLEDGE_TREE.forEach(m => m.topics.forEach(t => { if (getTopicMastery(t.id) !== null) hasData = true; }));
  if (!hasData) {
    chart.innerHTML = '<div class="text-center" style="padding:40px;color:var(--dim)">还没有学习记录，先去学习吧！</div>';
    document.getElementById('plan-output').style.display = 'none';
    return;
  }
  // 图例说明
  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex;gap:20px;font-size:12px;margin-bottom:12px;flex-wrap:wrap';
  legend.innerHTML = `
    <span><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:var(--accent);vertical-align:middle;margin-right:4px"></span> 正确率</span>
    <span><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#2453a1;vertical-align:middle;margin-right:4px"></span> 速度得分</span>
    <span style="color:var(--dim)">速度评分：<15秒=优秀 | 15-30秒=良好 | 30-60秒=及格 | >60秒=薄弱</span>`;
  chart.appendChild(legend);

  KNOWLEDGE_TREE.forEach(m => {
    const header = document.createElement('div');
    header.style.cssText = 'font-size:16px;font-weight:700;margin:16px 0 8px;display:flex;align-items:center;gap:8px';
    header.innerHTML = `${m.icon} ${m.name}`;
    chart.appendChild(header);
    m.topics.forEach(t => {
      const acc = getTopicMastery(t.id);
      const speed = getTopicSpeedScore(t.id);
      const combined = getTopicCombinedScore(t.id);
      const hasD = acc !== null;
      const accPct = acc !== null ? acc : 0;
      const speedPct = speed !== null ? speed : 0;
      const color = !hasD ? 'var(--dim)' : (combined >= 80 ? 'var(--success)' : (combined >= 50 ? 'var(--warn)' : 'var(--danger)'));
      const bar = document.createElement('div');
      bar.className = 'weakness-bar';
      bar.innerHTML = `
        <div class="label">${t.name}</div>
        <div class="bar-track" style="height:38px">
          <div class="bar-fill" style="width:${hasD ? accPct : 0}%;background:var(--accent);height:16px;margin-bottom:2px;font-size:10px">${hasD ? accPct+'%' : '—'}</div>
          <div class="bar-fill" style="width:${hasD && speed !== null ? speedPct : 0}%;background:#2453a1;height:16px;font-size:10px">${hasD && speed !== null ? speedPct+'分' : ''}</div>
        </div>
        <div class="score" style="color:${color};font-size:13px">${hasD ? combined+'分' : '—'}</div>`;
      chart.appendChild(bar);
    });
  });
}

function generateWeaknessPlan() {
  const output = document.getElementById('plan-output');
  output.style.display = 'block';
  const weak = [];  // 正确率不足
  const slow = [];  // 速度慢（时间维度不足）
  KNOWLEDGE_TREE.forEach(m => m.topics.forEach(t => {
    const m2 = getTopicMastery(t.id);
    const sp = getTopicSpeedScore(t.id);
    const comb = getTopicCombinedScore(t.id);
    if (m2 === null || m2 < 60) weak.push({ module: m, topic: t, mastery: m2, speed: sp, combined: comb });
    else if (sp !== null && sp < 60) slow.push({ module: m, topic: t, mastery: m2, speed: sp, combined: comb });
  }));
  if (weak.length === 0 && slow.length === 0) {
    output.innerHTML = `<h4>🎉 太棒了！</h4><p>你没有明显的薄弱知识点，建议进入进阶学习（Cox回归、机器学习、GEE、GLMM）。</p>`;
    return;
  }
  weak.sort((a, b) => (a.combined || 0) - (b.combined || 0));

  let html = '';
  // ① 正确率不足的知识点
  if (weak.length > 0) {
    html += `<h4>⚠️ 知识点掌握不足（${weak.length} 个）</h4><ul>`;
    weak.forEach(w => {
      html += `<li><strong>${w.module.icon} ${w.topic.name}</strong>— 综合掌握度 <strong style="color:${w.combined < 50 ? 'var(--danger)' : 'var(--warn)'}">${w.combined}分</strong>（正确率 ${w.mastery}%${w.speed !== null ? '，速度得分 ' + w.speed + '分' : ''}）<br><span style="font-size:12px;color:var(--dim)">${w.topic.summary}</span></li>`;
    });
    html += `</ul>`;
  }
  // ② 速度慢的知识点
  if (slow.length > 0) {
    html += `<h4>⏱ 知识掌握尚可但答题偏慢（${slow.length} 个）</h4><ul>`;
    slow.forEach(w => {
      html += `<li><strong>${w.module.icon} ${w.topic.name}</strong>— 正确率 ${w.mastery}%，但速度得分 ${w.speed}分（<60分属速度薄弱）<br><span style="font-size:12px;color:var(--dim)">建议通过反复练习提升熟练度，目标：8秒内完成</span></li>`;
    });
    html += `</ul>`;
  }

  html += `<h4>🎯 学习建议</h4><ul>`;
  const priority = weak.concat(slow);
  priority.slice(0, 3).forEach(w => {
    if (w.speed !== null && w.speed < 60 && w.mastery >= 60) {
      html += `<li><strong>${w.topic.name}</strong>需要提升做题速度：多练习该知识点题目，提升熟练度（追目标<15秒/题）。</li>`;
    } else {
      html += `<li>优先复习 <strong>${w.topic.name}</strong>：${w.topic.summary}。推荐做 ${w.topic.questions.length} 道练习题巩固。</li>`;
    }
  });
  html += `<li>每天建议学习 <strong>${state.settings.daily || 20} 分钟</strong>，每2天复习一次薄弱点。</li>`;
  html += `<li>完成薄弱点复习后，进入"统计闯关测试"选择"仅薄弱点"模式验证（注意答题速度）。</li></ul>`;
  const days = Math.ceil((weak.length + slow.length) / 2);
  html += `<h4>📅 推荐学习计划（${days} 天）</h4><ul>`;
  for (let d = 0; d < days; d++) {
    const idx1 = d * 2, idx2 = d * 2 + 1;
    let dayPlan = `<li><strong>第 ${d+1} 天</strong>：`;
    const all = weak.concat(slow);
    if (idx1 < all.length) dayPlan += `${all[idx1].module.icon} ${all[idx1].topic.name}`;
    if (idx2 < all.length) dayPlan += ` + ${all[idx2].module.icon} ${all[idx2].topic.name}`;
    dayPlan += `（约 ${state.settings.daily || 20} 分钟）</li>`;
    html += dayPlan;
  }
  html += `</ul>`;
  output.innerHTML = html;
}

function clearHistory() {
  if (!confirm('确定清空所有学习记录？')) return;
  state.records = {}; state.history = [];
  state.gameScore = 0; state.gameMaxCombo = 0; state.gameTotal = 0; state.gameCorrect = 0;
  saveState(); renderWeakness();
  showToast('🗑 已清空学习记录');
}

// ============================================================
// 4. 个性化学习方案 + 自动测试
// ============================================================
function generateFullPlan() {
  const output = document.getElementById('plan-output-full');
  const name = state.settings.name || '同学';
  let totalQ = 0, correctQ = 0;
  KNOWLEDGE_TREE.forEach(m => m.topics.forEach(t => {
    const r = state.records[t.id];
    if (r) { totalQ += r.correct + r.wrong; correctQ += r.correct; }
  }));
  const pct = totalQ > 0 ? Math.round(correctQ/totalQ*100) : 0;
  const weak = [];
  KNOWLEDGE_TREE.forEach(m => m.topics.forEach(t => {
    const m2 = getTopicMastery(t.id);
    if (m2 === null || m2 < 60) weak.push({ module: m, topic: t, mastery: m2 });
  }));
  const dailyMin = state.settings.daily || 20;
  const weakCount = weak.length;
  const suggestionDays = Math.max(3, Math.ceil(weakCount / 2));
  const testFrequency = weakCount > 3 ? '每2天' : '每3天';
  let html = `
    <div style="background:rgba(245,158,11,0.08);border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="font-size:20px;font-weight:800;margin-bottom:8px">👋 ${name} 的个性化学习方案</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:16px">
        <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--accent)">${totalQ}</div><div style="font-size:12px;color:var(--dim)">已答题数</div></div>
        <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:${pct>=80?'var(--success)':(pct>=50?'var(--warn)':'var(--danger)')}">${pct}%</div><div style="font-size:12px;color:var(--dim)">正确率</div></div>
        <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--accent)">${weakCount}</div><div style="font-size:12px;color:var(--dim)">薄弱知识点</div></div>
        <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--success)">${dailyMin}分钟</div><div style="font-size:12px;color:var(--dim)">每日建议学习</div></div>
      </div>
    </div>
    <h4>📚 学习大纲（按优先级排序）</h4><ol style="margin:8px 0 16px 20px;line-height:1.8">`;
  const ordered = [];
  weak.sort((a,b) => (a.mastery||0) - (b.mastery||0));
  weak.forEach(w => ordered.push(w));
  KNOWLEDGE_TREE.forEach(m => m.topics.forEach(t => {
    if (!ordered.find(o => o.topic.id === t.id)) {
      const m2 = getTopicMastery(t.id);
      if (m2 === null) ordered.push({ module: m, topic: t, mastery: null });
    }
  }));
  ordered.forEach((w, i) => {
    html += `<li><strong>${w.module.icon} ${w.topic.name}</strong>${w.mastery !== null ? `（当前 ${w.mastery}%）` : '（未学习）'} — ${w.topic.summary}</li>`;
  });
  html += `</ol>
    <h4>⏱ 学习速度与时间建议</h4>
    <ul style="margin:8px 0 16px 20px;line-height:1.8">
      <li>每日学习 <strong>${dailyMin} 分钟</strong>，建议安排在固定时间段（如晚间）</li>
      <li>学习频率：建议 <strong>${testFrequency}</strong> 进行一次测试验证</li>
      <li>总预计完成：<strong>${suggestionDays} 天</strong>可覆盖所有薄弱知识点的强化</li>
      <li>复习策略：<strong>间隔重复</strong>（学习后1天→3天→7天→14天各复习一次）</li>
      <li>测试策略：完成薄弱点复习后，立即进入"统计闯关测试"选择"仅薄弱点"模式验证</li>
    </ul>
    <h4>🎯 自动测试计划</h4>
    <p style="font-size:14px;color:var(--dim);margin:4px 0 12px">点击下方"开始自动测试"按钮，系统将按优先级从薄弱点出题，自动判定并计分。</p>`;
  output.innerHTML = html;
}

function startAutoTest() {
  let qs = getWeakQuestions(60);
  if (qs.length < 5) qs = getAllQuestions();
  qs = shuffle(qs).slice(0, 20);
  state.autoTestActive = true;
  state.autoTestQueue = qs;
  state.autoTestIndex = 0;
  state.autoTestScore = 0;
  state.autoTestCorrect = 0;
  showToast(`🎯 自动测试开始！共 ${qs.length} 题`);
  runAutoTestQuestion();
}
function runAutoTestQuestion() {
  if (state.autoTestIndex >= state.autoTestQueue.length) {
    const total = state.autoTestQueue.length;
    const correct = state.autoTestCorrect;
    const pct = Math.round(correct/total*100);
    showToast(`✅ 测试完成！得分: ${correct}/${total} (${pct}%)`);
    document.getElementById('plan-output-full').innerHTML += `
      <div style="margin-top:16px;padding:20px;background:rgba(34,197,94,0.1);border-radius:12px;border:1px solid var(--success)">
        <h4 style="color:var(--success)">✅ 自动测试结果</h4>
        <p style="font-size:18px;font-weight:700;margin:8px 0">${correct}/${total} 正确 (${pct}%)</p>
        <p style="font-size:14px;color:var(--dim)">薄弱点待巩固：${total - correct} 题，建议在"薄弱点"页面查看详情并生成学习方案。</p>
      </div>`;
    state.autoTestActive = false;
    saveState();
    return;
  }
  const q = state.autoTestQueue[state.autoTestIndex];
  openQuestion(q, () => {
    state.autoTestIndex++;
    // 统计本局正确数：从最近的答题记录比对
    const last = state.history[state.history.length - 1];
    if (last && last.qid === q.qid && last.correct) state.autoTestCorrect++;
    runAutoTestQuestion();
  });
}

// ============================================================
// 5. 排名
// ============================================================
function renderRank() {
  const content = document.getElementById('rank-content');
  const name = state.settings.name || '我';
  const total = state.gameTotal || 0;
  const correct = state.gameCorrect || 0;
  const pct = total > 0 ? Math.round(correct/total*100) : 0;
  const rankings = [
    { name: '🏆 ' + name, score: state.gameScore, correct: correct, total: total, pct: pct, combo: state.gameMaxCombo, isMe: true }
  ];
  try {
    const others = JSON.parse(localStorage.getItem('statcannon_others') || '[]');
    others.forEach(o => {
      if (!rankings.find(r => r.name === o.name)) {
        rankings.push({ name: o.name, score: o.score, correct: o.correct, total: o.total, pct: o.total>0?Math.round(o.correct/o.total*100):0, combo: o.combo, isMe: false });
      }
    });
  } catch(e) {}
  rankings.sort((a,b) => b.score - a.score);
  let html = `<table id="rank-table"><thead><tr><th>排名</th><th>姓名</th><th>得分</th><th>正确率</th><th>最高连击</th><th>答题数</th></tr></thead><tbody>`;
  rankings.forEach((r, i) => {
    const rankClass = i === 0 ? 'rank-1' : (i === 1 ? 'rank-2' : (i === 2 ? 'rank-3' : ''));
    const rowClass = r.isMe ? 'my-row' : '';
    html += `<tr class="${rowClass}"><td class="${rankClass}">${i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : '#'+(i+1)))}</td><td>${r.name}</td><td style="font-weight:700;color:var(--accent)">${r.score}</td><td>${r.pct}%</td><td>🔥 x${r.combo}</td><td>${r.total}</td></tr>`;
  });
  html += '</tbody></table>';
  if (rankings.length <= 1) {
    html += `<div style="margin-top:16px;padding:16px;background:rgba(245,158,11,0.05);border-radius:8px;text-align:center">
      <p style="color:var(--dim)">💡 排名数据来自本地学习记录。多做练习，得分会自动累积！</p>
      <button class="btn btn-primary btn-sm mt-8" onclick="shareRank()">📤 分享我的成绩</button>
    </div>`;
  }
  content.innerHTML = html;
}
function shareRank() {
  const name = state.settings.name || '我';
  const total = state.gameTotal || 0;
  const correct = state.gameCorrect || 0;
  const pct = total > 0 ? Math.round(correct/total*100) : 0;
  const text = `🎯 StatCannon 统计大炮学习报告\n\n👤 ${name}\n📊 答题: ${total} 题 | 正确: ${correct} (${pct}%)\n🏆 得分: ${state.gameScore}\n🔥 最高连击: ${state.gameMaxCombo}x\n\n快来和我一起学习卫生统计学！`;
  if (navigator.share) navigator.share({ title: 'StatCannon 学习报告', text });
  else navigator.clipboard.writeText(text).then(() => showToast('📋 已复制到剪贴板')).catch(() => {});
}

// ============================================================
// 6. 短信接口（阿里云预留）
// ============================================================
function sendSMSReminder() {
  const phone = state.settings.phone;
  if (!phone || phone.length < 11) { showToast('⚠️ 请先在设置页面填写手机号'); return; }
  const weak = [];
  KNOWLEDGE_TREE.forEach(m => m.topics.forEach(t => {
    const m2 = getTopicMastery(t.id);
    if (m2 === null || m2 < 60) weak.push({ topic: t, mastery: m2 });
  }));
  if (state.settings.smsKey) {
    showToast(`📱 已配置阿里云短信，将发送到 ${phone}。安全起见，请在服务端实现API调用。`);
  } else {
    showToast(`📱 [演示模式] 已发送提醒到 ${phone}：您有 ${weak.length} 个薄弱知识点待复习，请登录StatCannon查看。`);
  }
  const log = document.getElementById('plan-output-full');
  if (log) {
    const now = new Date();
    const logEntry = document.createElement('div');
    logEntry.style.cssText = 'margin-top:8px;padding:8px;background:rgba(245,158,11,0.05);border-radius:8px;font-size:12px;color:var(--dim)';
    logEntry.innerHTML = `📱 [${now.toLocaleString()}] 发送学习提醒至 ${phone}：您有 ${weak.length} 个薄弱知识点（${weak.slice(0,3).map(w => w.topic.name).join('、')}${weak.length>3?'等':''}）`;
    log.appendChild(logEntry);
  }
}

// ============================================================
// 8. 配套学习资源页面
// ============================================================
function renderResources() {
  const container = document.getElementById('resources-container');
  if (!container) return;
  if (typeof VISUAL_RESOURCES === 'undefined') {
    container.innerHTML = '<div class="card">资源数据未加载</div>';
    return;
  }
  let html = '';
  // 生成资源平台卡片
  const platforms = [
    { key: 'seeing_theory', icon: '🔬', color: '#4f9cf9' },
    { key: 'prob_viz',      icon: '📊', color: '#f59e0b' },
    { key: 'mengte',        icon: '🏥', color: '#22c55e' }
  ];
  platforms.forEach(p => {
    const res = VISUAL_RESOURCES[p.key];
    if (!res) return;
    html += `
      <div class="card" style="border-left:4px solid ${p.color}">
        <div class="flex" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <h2 style="font-size:18px">${p.icon} ${res.name}</h2>
          <a href="${res.url}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">🔗 打开网站</a>
        </div>
        <p style="color:var(--dim);font-size:13px;margin:6px 0 12px">${res.desc}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">
    `;
    res.chapters.forEach(ch => {
      html += `
        <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px;border:1px solid rgba(255,255,255,0.08)">
          <div class="flex" style="justify-content:space-between;margin-bottom:8px">
            <strong style="font-size:14px">${ch.name}</strong>
            <a href="${ch.url}" target="_blank" rel="noopener" style="font-size:12px;color:${p.color}">前往 →</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${ch.tools.map(t => `
              <div style="font-size:12px;color:var(--dim);background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:6px">
                <span style="color:var(--text);font-weight:600">▸ ${t.name}</span><br>
                <span style="font-size:11px">${t.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>`;
    });
    html += '</div></div>';
  });
  // 学习建议
  html += `
    <div class="card" style="background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(34,197,94,0.08));border:1px solid rgba(245,158,11,0.2)">
      <h2>💡 使用建议</h2>
      <ul style="margin:8px 0 0 20px;line-height:1.9;font-size:14px">
        <li><strong>概念看不懂？</strong> → 打开 Seeing Theory 对应章节玩可视化实验（拖动参数直观感受）</li>
        <li><strong>要系统学理论？</strong> → 打开梦特医数通对应方法的理论介绍文章</li>
        <li><strong>中心极限定理/分布难理解？</strong> → 看"看见概率论"的动画演示</li>
        <li><strong>写论文/拆论文？</strong> → 对照梦特医数通的研究设计与报告规范（CONSORT/STROBE等）</li>
        <li><strong>实操不会选方法？</strong> → 回到本软件"学习"页查知识树 + 统计闯关测试巩固</li>
      </ul>
    </div>`;
  container.innerHTML = html;
}
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--card);color:var(--text);padding:14px 28px;border-radius:12px;font-size:14px;font-weight:600;z-index:999;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);animation:slideUp .3s;max-width:90%';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .5s'; setTimeout(() => t.remove(), 500); }, 3000);
}
function populateSelectors() {
  const modSel = document.getElementById('cannon-module-select');
  const topSel = document.getElementById('cannon-topic-select');
  if (!modSel || !topSel) return;
  modSel.innerHTML = '<option value="all">全部模块随机</option>';
  KNOWLEDGE_TREE.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id; opt.textContent = `${m.icon} ${m.name}`;
    modSel.appendChild(opt);
  });
  const last = state.settings.lastCannon || {};
  modSel.value = last.module || 'all';
  updateTopicSelector(last.topic || 'all');
  const diffSel = document.getElementById('cannon-difficulty');
  if (diffSel && last.difficulty) diffSel.value = last.difficulty;
  modSel.addEventListener('change', () => {
    updateTopicSelector('all');
    persistCannonSelection();
  });
  topSel.addEventListener('change', () => {
    const info = getTopicInfo(topSel.value);
    if (info && modSel.value !== info.module.id) {
      modSel.value = info.module.id;
      updateTopicSelector(topSel.value);
    }
    persistCannonSelection();
  });
  if (diffSel) diffSel.addEventListener('change', persistCannonSelection);
}
function updateTopicSelector(preferredTopic) {
  const modSel = document.getElementById('cannon-module-select');
  const topSel = document.getElementById('cannon-topic-select');
  if (!modSel || !topSel) return;
  const selectedMod = modSel.value;
  topSel.innerHTML = '<option value="all">全部知识点</option>';
  const modules = selectedMod === 'all' ? KNOWLEDGE_TREE : KNOWLEDGE_TREE.filter(m => m.id === selectedMod);
  modules.forEach(m => {
    const group = document.createElement('optgroup');
    group.label = `${m.icon} ${m.name}`;
    m.topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name}${t.scope ? ` · ${t.scope}` : ''}`;
      opt.dataset.module = m.id;
      group.appendChild(opt);
    });
    topSel.appendChild(group);
  });
  const candidate = preferredTopic || 'all';
  if ([...topSel.options].some(option => option.value === candidate)) topSel.value = candidate;
}
function persistCannonSelection() {
  const modSel = document.getElementById('cannon-module-select');
  const topSel = document.getElementById('cannon-topic-select');
  const diffSel = document.getElementById('cannon-difficulty');
  if (!modSel || !topSel || !diffSel) return;
  state.settings.lastCannon = { module: modSel.value, topic: topSel.value, difficulty: diffSel.value };
  try { localStorage.setItem('statcannon_settings', JSON.stringify(state.settings)); } catch(e) {}
}
function loadSettingsUI() {
  document.getElementById('set-name').value = state.settings.name || '';
  document.getElementById('set-major').value = state.settings.major || 'non-medical';
  document.getElementById('set-daily').value = state.settings.daily || 20;
  document.getElementById('set-phone').value = state.settings.phone || '';
  document.getElementById('set-sms-key').value = state.settings.smsKey || '';
  document.getElementById('set-sms-secret').value = state.settings.smsSecret || '';
  document.getElementById('set-sms-sign').value = state.settings.smsSign || '卫生统计学习';
  document.getElementById('set-sms-template').value = state.settings.smsTemplate || '';
  loadSfxSettingsUI();
}

document.addEventListener('keydown', (e) => {
  if (!state.gameActive || state.gamePaused || state.cannonFiring) return;
  const key = e.key.toLowerCase();
  if (['a','b','c','d','1','2','3','4'].includes(key)) {
    const index = /[1-4]/.test(key) ? Number(key) - 1 : 'abcd'.indexOf(key);
    const option = document.querySelector(`.cannon-option[data-index="${index}"]`);
    if (option) { e.preventDefault(); fireAtOption(option, state.gameQueue[state.gameIndex], index); }
  }
});

// ---- 启动 ----
loadState();
loadSettingsUI();
populateSelectors();
enrichKnowledgeTree(KNOWLEDGE_TREE);
runSanityChecks();
initBaizhan();
initLearn();
renderWeakness();
initCannonAim();

console.log('🎯 StatCannon 统计大炮 v3.1 + 统计百斩已加载');
console.log(`📚 ${KNOWLEDGE_TREE.length} 大模块, ${getAllQuestions().length} 道练习题`);

// 注册 Service Worker（PWA 离线+手机安装支持）
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch(() => {});
}

function openSoftwarePractice() {
  const mi = KNOWLEDGE_TREE.findIndex(m => m.id === 'm6');
  const panel = document.getElementById('module-topics-' + mi);
  if (panel.dataset.open !== 'true') toggleModule(mi);
  panel.closest('.module-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
