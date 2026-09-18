// ============================================================
// baizhan_engine.js — 统计百斩核心引擎（第1阶段）
// L0-L4 掌握度 + SM-2 间隔复习 + 数据迁移 + 5环节学习辅助
// 依赖：knowledge.js（KNOWLEDGE_TREE）、index.html 中的 state
// ============================================================

// ---- 常量 ----
const LEVEL_NAMES = ['L0 听过概念', 'L1 能复述定义', 'L2 能选择方法', 'L3 能独立操作', 'L4 能解读结果并发现陷阱'];
const LEVEL_COLORS = ['#52647b', '#2453a1', '#22c55e', '#f59e0b', '#c084fc']; // 灰蓝绿橙紫
const SM2_INTERVALS = [0, 1, 2, 4, 7, 15, 30];  // 按等级0~4取下次复习间隔（天）
const DAY = 86400000;

// ---- 掌握度读写 ----
function getMastery(topicId) {
  if (!state.mastery) state.mastery = {};
  return state.mastery[topicId] || { level: 0, nextReview: 0, interval: 0 };
}

// 兼容旧接口：返回等级数字 0-4（替代 getTopicMastery 角色）
function getTopicLevel(topicId) {
  return getMastery(topicId).level;
}

// SM-2 核心：答对 L+1 间隔按等级取；答错 L-2 次日复习
function applyAnswerEffect(topicId, correct) {
  const m = getMastery(topicId);
  if (correct) {
    m.level = Math.min(4, m.level + 1);
    m.interval = SM2_INTERVALS[m.level] || 30;
  } else {
    m.level = Math.max(0, m.level - 2);
    m.interval = 1;
  }
  m.nextReview = Date.now() + m.interval * DAY;
  state.mastery[topicId] = m;
  saveState();
  return m;
}

// ---- 待复习队列 ----
function getDueTopics() {
  if (!state.mastery) return [];
  const now = Date.now();
  return Object.keys(state.mastery)
    .filter(id => state.mastery[id].nextReview > 0 && state.mastery[id].nextReview <= now)
    .map(id => {
      const t = findTopicById(id);
      return { id, level: state.mastery[id].level, name: t ? t.name : id };
    });
}

// ---- 复习统计 ----
function getReviewStats() {
  const due = getDueTopics();
  const done = state.reviewDoneToday || 0;
  return { due, done };
}

// ---- 旧数据迁移（幂等：检测 state.version）----
function migrateLegacyRecords() {
  if (state.version && state.version >= 3) return;  // 已迁移
  // 旧版本曾让 m6 与 m7 共用 t21/t22；旧记录无法无损拆分，保留给仍使用这些 ID 的 m7 知识点。
  if (state.records && typeof state.records === 'object') {
    if (!state.mastery) state.mastery = {};
    Object.keys(state.records).forEach(tid => {
      const r = state.records[tid];
      if (!r || (r.correct + r.wrong) === 0) return;
      const pct = r.correct / (r.correct + r.wrong);
      let level = 0;
      if (pct >= 0.8) level = 3;
      else if (pct >= 0.5) level = 2;
      else if (pct >= 0.2) level = 1;
      state.mastery[tid] = { level, nextReview: Date.now(), interval: 1 };
    });
  }
  state.version = 3;
  saveState();
}

// ---- 工具：按 topicId 找知识点 ----
function findTopicById(topicId) {
  const info = typeof getTopicInfo === 'function' ? getTopicInfo(topicId) : null;
  if (info) return info.topic;
  for (const m of KNOWLEDGE_TREE) {
    for (const t of m.topics) {
      if (t.id === topicId) return t;
    }
  }
  return null;
}

function runSanityChecks() {
  const topicIds = new Map();
  const qids = new Set();
  const errors = [];
  let questionCount = 0;
  KNOWLEDGE_TREE.forEach(module => module.topics.forEach(topic => {
    if (topicIds.has(topic.id)) errors.push(`重复知识点 ID: ${topic.id}（${topicIds.get(topic.id)} / ${module.id}）`);
    topicIds.set(topic.id, module.id);
    (topic.questions || []).forEach((question, index) => {
      questionCount++;
      const qid = qidOf(topic, index);
      if (qids.has(qid)) errors.push(`重复题目 ID: ${qid}`);
      qids.add(qid);
      if (!Array.isArray(question.options) || question.answer < 0 || question.answer >= question.options.length) {
        errors.push(`答案索引无效: ${qid}`);
      }
    });
  }));
  const cardKeys = typeof BAIZHAN_DATA === 'object' ? Object.keys(BAIZHAN_DATA) : [];
  cardKeys.forEach(id => { if (!topicIds.has(id)) errors.push(`卡片找不到知识点: ${id}`); });
  const report = { modules: KNOWLEDGE_TREE.length, topics: topicIds.size, questions: questionCount, cards: cardKeys.length, errors };
  if (errors.length) console.warn('⚠️ StatCannon 数据自检发现问题', report);
  else console.info('✅ StatCannon 数据自检通过', report);
  return report;
}

// ---- 5环节学习会话 ----
function startFiveStepLearning(topicId) {
  const t = findTopicById(topicId);
  if (!t) return;
  state.learning = { topicId, step: 1, answers: [] };
  saveState();
  switchPage('study');
  renderStudyStep();
}

function renderStudyStep() {
  const s = state.learning;
  if (!s) return;
  const t = findTopicById(s.topicId);
  if (!t) return;
  const el = document.getElementById('study-content');
  const steps = ['场景引入', '概念讲解', '即时测试', '实操演练', '我的理解'];
  // 步骤指示条
  let stepsHtml = '<div style="display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap">';
  steps.forEach((name, i) => {
    const done = i < s.step - 1 ? '✓' : (i + 1 === s.step ? '▶' : '');
    stepsHtml += `<div style="flex:1;min-width:90px;text-align:center;padding:8px 6px;border-radius:10px;font-size:12px;font-weight:700;background:${i+1===s.step?'rgba(245,158,11,0.25)':(i<s.step-1?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.06)')};color:${i+1===s.step?'var(--accent)':(i<s.step-1?'var(--success)':'var(--dim)')}">${done}${name}</div>`;
  });
  stepsHtml += '</div>';

  let content = '';
  const cardTypeTag = `<span style="background:#e7eef9;color:var(--accent);padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;border:1px solid rgba(245,158,11,0.3)">${getCardTypeName(t)}</span>`;

  if (s.step === 1) {
    // ① 场景引入
    content = `
      <div style="font-size:13px;color:var(--accent);font-weight:700;margin-bottom:12px">📖 ${t.name} ${cardTypeTag}</div>
      <div style="background:#ffffff;border:1px solid rgba(245,158,11,0.25);border-radius:14px;padding:24px;margin-bottom:16px">
        <div style="font-size:14px;color:#52647b;margin-bottom:8px">🎬 医学场景</div>
        <div style="font-size:18px;font-weight:700;line-height:1.8;color:#243b56">${t.scene || t.summary}</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:20px">
        <button class="btn btn-dim" onclick="closeStudy()">✕ 退出学习</button>
        <button class="btn btn-primary" onclick="studyNextStep()">进入讲解 →</button>
      </div>`;
  } else if (s.step === 2) {
    // ② 概念讲解（类比 + 要点）
    content = `
      <div style="font-size:13px;color:var(--accent);font-weight:700;margin-bottom:12px">💡 ${t.name} — 概念讲解</div>
      ${t.analogy ? `<div style="background:#ffffff;border:1px solid rgba(96,165,250,0.3);border-left:5px solid #2453a1;border-radius:12px;padding:18px 20px;margin-bottom:16px">
        <div style="font-size:13px;color:#2453a1;margin-bottom:8px;font-weight:700">🧠 类比记忆</div>
        <div style="font-size:16px;line-height:1.8;color:#243b56">${t.analogy}</div>
      </div>` : ''}
      <div style="background:#ffffff;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px">
        <div style="font-size:13px;color:var(--accent);margin-bottom:8px;font-weight:700">📌 核心要点</div>
        <ul class="point-list">${(t.points||[]).map(p=>`<li>${p}</li>`).join('')}</ul>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:20px">
        <button class="btn btn-dim" onclick="studyPrevStep()">← 返回场景</button>
        <button class="btn btn-primary" onclick="studyNextStep()">进入测试 →</button>
      </div>`;
  } else if (s.step === 3) {
    // ③ 即时测试（3道梯度题）
    content = `<div style="font-size:13px;color:var(--accent);font-weight:700;margin-bottom:12px">✏️ ${t.name} — 即时测试</div>`;
    const graded = (t.questions || []).slice(0, 3);
    content += `<div id="study-test-area">${graded.map((q, i) => `
      <div class="study-q" data-qi="${i}" style="background:#ffffff;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 18px;margin-bottom:12px">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;line-height:1.6">${i+1}. ${q.q}</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${q.options.map((o, oi) => `<div class="study-opt" data-oi="${oi}" onclick="studyAnswer(${i},${oi})" style="padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);cursor:pointer;font-size:15px;transition:all .2s">${o}</div>`).join('')}
        </div>
        <div class="study-explain" style="display:none;margin-top:10px;padding:10px 14px;border-radius:8px;border-left:4px solid var(--accent);background:#f1f5fa;font-size:14px;line-height:1.7;color:#243b56"></div>
      </div>`).join('')}
      <div style="display:flex;justify-content:space-between;margin-top:16px">
        <button class="btn btn-dim" onclick="studyPrevStep()">← 返回讲解</button>
        <button class="btn btn-success" onclick="studyNextStep()" style="display:none" id="study-test-next">进入实操 →</button>
      </div></div>`;
  } else if (s.step === 4) {
    // ④ 实操演练
    content = `
      <div style="font-size:13px;color:var(--accent);font-weight:700;margin-bottom:12px">🛠 ${t.name} — 实操演练</div>
      <div style="background:#ffffff;border:1px solid rgba(34,197,94,0.3);border-left:5px solid var(--success);border-radius:12px;padding:18px 20px;margin-bottom:16px">
        <div style="font-size:13px;color:var(--success);margin-bottom:10px;font-weight:700">💻 软件操作步骤（SPSS / R / STATA）</div>
        <ol style="margin:0 0 0 20px;line-height:2;font-size:15px;color:#243b56">${(t.operationSteps||[]).map(s=>`<li>${s}</li>`).join('')}</ol>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:20px">
        <button class="btn btn-dim" onclick="studyPrevStep()">← 返回测试</button>
        <button class="btn btn-success" onclick="studyNextStep()">我已理解步骤 →</button>
      </div>`;
  } else if (s.step === 5) {
    // ⑤ 我的理解
    content = `
      <div style="font-size:13px;color:var(--accent);font-weight:700;margin-bottom:12px">✍️ ${t.name} — 我的理解</div>
      <div style="background:#ffffff;border-radius:12px;padding:18px 20px">
        <p style="font-size:15px;color:#243b56;margin-bottom:8px">用你自己的话总结：<strong>什么时候用这个方法？</strong></p>
        <p style="font-size:13px;color:#52647b;margin-bottom:12px">深度加工记忆，写下来比读十遍更有效。</p>
        <textarea id="study-understanding" rows="4" style="width:100%;background:#ffffff;color:#243b56;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:12px;font-size:15px;line-height:1.6;resize:vertical">${t.summary?('什么时候用'+t.name+'：'+t.summary.slice(0,40)+'…'):''}</textarea>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:20px">
        <button class="btn btn-dim" onclick="studyPrevStep()">← 返回实操</button>
        <button class="btn btn-success" onclick="completeLearning()">✓ 保存并完成学习</button>
      </div>`;
  }

  el.innerHTML = stepsHtml + content;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function studyNextStep() {
  if (!state.learning) return;
  state.learning.step = Math.min(5, state.learning.step + 1);
  saveState();
  renderStudyStep();
}
function studyPrevStep() {
  if (!state.learning) return;
  state.learning.step = Math.max(1, state.learning.step - 1);
  saveState();
  renderStudyStep();
}
function closeStudy() {
  state.learning = null;
  saveState();
  switchPage('learn');
}

// 即时测试作答
function studyAnswer(qi, oi) {
  const s = state.learning;
  if (!s) return;
  const t = findTopicById(s.topicId);
  const q = (t.questions || [])[qi];
  if (!q) return;
  const qBox = document.querySelectorAll('.study-q')[qi];
  if (!qBox || qBox.dataset.done) return;
  qBox.dataset.done = '1';
  const correct = oi === q.answer;
  s.answers.push(correct);
  qBox.querySelectorAll('.study-opt').forEach((el, i) => {
    el.style.pointerEvents = 'none';
    if (i === q.answer) { el.style.borderColor = 'var(--success)'; el.style.background = 'rgba(34,197,94,0.2)'; }
    if (i === oi && !correct) { el.style.borderColor = 'var(--danger)'; el.style.background = 'rgba(239,68,68,0.2)'; }
  });
  const exp = qBox.querySelector('.study-explain');
  exp.style.display = 'block';
  exp.innerHTML = `<span style="font-weight:800;color:${correct?'var(--success)':'var(--danger)'}">${correct?'✅ 正确':'❌ 错误'}</span> ${window.STATCANNON_FEEDBACK.render({...q,topicId:t.id},oi)}`;
  saveState();
  // 全部答完显示下一题按钮
  const doneCount = (t.questions || []).slice(0,3).filter((_, i) => document.querySelectorAll('.study-q')[i]?.dataset.done).length;
  const nextBtn = document.getElementById('study-test-next');
  if (nextBtn && doneCount >= Math.min(3, (t.questions||[]).length)) nextBtn.style.display = 'inline-flex';
}

// 完成学习：按测试正确率更新掌握度
function completeLearning() {
  const s = state.learning;
  if (!s) return;
  const t = findTopicById(s.topicId);
  const ta = document.getElementById('study-understanding');
  const understanding = ta ? ta.value : '';
  if (understanding && t) t.understanding = understanding;  // 会话内记录
  const ans = s.answers || [];
  const correctCount = ans.filter(Boolean).length;
  const correct = ans.length === 0 ? true : (correctCount / ans.length >= 0.6); // 60%正确率视为通过
  applyAnswerEffect(s.topicId, correct);
  state.learning = null;
  state.reviewDoneToday = (state.reviewDoneToday || 0);
  saveState();
  showToast(`🎉 完成「${t ? t.name : ''}」学习！掌握度 ${correct ? '上升' : '下降（答错较多，明日复习）'}`);
  switchPage('learn');
  initLearn();
  updateReviewBadge();
}

// 卡牌类型名称
function getCardTypeName(t) {
  const map = { A: 'A概念卡', B: 'B方法卡', C: 'C陷阱卡', D: 'D操作卡', E: 'E读结果卡' };
  return map[t.cardType] || '学习卡';
}

// 更新顶部"待复习"徽标
function updateReviewBadge() {
  const badge = document.getElementById('review-badge');
  if (!badge) return;
  const n = getDueTopics().length;
  if (n > 0) {
    badge.style.display = 'inline-flex';
    badge.textContent = `📚 ${n}`;
  } else {
    badge.style.display = 'none';
  }
}

// 复习模式：列出到期知识点，逐个快速复习
function startReviewMode() {
  const due = getDueTopics();
  if (due.length === 0) { showToast('🎉 当前没有待复习的知识点！'); return; }
  state.reviewQueue = due;
  state.reviewIdx = 0;
  switchPage('study');
  renderReviewQuestion();
}

function renderReviewQuestion() {
  const q = state.reviewQueue[state.reviewIdx];
  if (!q) { state.reviewQueue = null; updateReviewBadge(); showToast('✅ 复习完成！'); switchPage('learn'); return; }
  const t = findTopicById(q.id);
  const el = document.getElementById('study-content');
  if (!t) { state.reviewIdx++; renderReviewQuestion(); return; }
  const qs = (t.questions || []).slice(0, 2);  // 复习每题取2道
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:16px;font-weight:800">🔁 复习模式 <span style="font-size:12px;color:var(--dim)">${state.reviewIdx+1}/${state.reviewQueue.length}</span></div>
      <span style="font-size:12px;padding:4px 12px;border-radius:12px;background:#e7eef9;color:var(--accent)">${t.name} · ${LEVEL_NAMES[q.level]}</span>
    </div>
    <div style="margin-bottom:14px;font-size:15px;color:#b0bed5;line-height:1.7">${t.scene || t.summary}</div>`;
  qs.forEach((qq, i) => {
    html += `<div class="review-q" data-qi="${i}" style="background:#ffffff;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 18px;margin-bottom:12px">
      <div style="font-size:14px;font-weight:700;margin-bottom:10px">${qq.q}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${qq.options.map((o, oi) => `<div class="review-opt" data-oi="${oi}" onclick="reviewAnswer(${i},${oi})" style="padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);cursor:pointer;font-size:15px">${o}</div>`).join('')}
      </div>
      <div class="review-explain" style="display:none;margin-top:10px;padding:10px 14px;border-radius:8px;border-left:4px solid var(--accent);background:#f1f5fa;font-size:14px;color:#243b56"></div>
    </div>`;
  });
  html += `<div style="display:flex;justify-content:space-between;margin-top:16px">
    <button class="btn btn-dim" onclick="closeStudy()">退出复习</button>
    <button class="btn btn-primary" onclick="nextReview()">下一个知识点 →</button>
  </div>`;
  el.innerHTML = html;
}

function reviewAnswer(qi, oi) {
  const q = state.reviewQueue[state.reviewIdx];
  const t = findTopicById(q.id);
  const qq = (t.questions || [])[qi];
  if (!qq) return;
  const qBox = document.querySelectorAll('.review-q')[qi];
  if (!qBox || qBox.dataset.done) return;
  qBox.dataset.done = '1';
  const correct = oi === qq.answer;
  qBox.querySelectorAll('.review-opt').forEach((el, i) => {
    el.style.pointerEvents = 'none';
    if (i === qq.answer) { el.style.borderColor = 'var(--success)'; el.style.background = 'rgba(34,197,94,0.2)'; }
    if (i === oi && !correct) { el.style.borderColor = 'var(--danger)'; el.style.background = 'rgba(239,68,68,0.2)'; }
  });
  const exp = qBox.querySelector('.review-explain');
  exp.style.display = 'block';
  exp.innerHTML = `<span style="font-weight:800;color:${correct?'var(--success)':'var(--danger)'}">${correct?'✅ 正确':'❌ 错误'}</span> ${window.STATCANNON_FEEDBACK.render({...qq,topicId:t.id},oi)}`;
  // 累计复习答对
  if (!state.reviewResults) state.reviewResults = [];
  state.reviewResults.push(correct);
}

function nextReview() {
  const q = state.reviewQueue[state.reviewIdx];
  const results = state.reviewResults || [];
  const t = findTopicById(q.id);
  const ok = results.length === 0 ? true : (results.filter(Boolean).length / results.length >= 0.5);
  applyAnswerEffect(q.id, ok);  // 复习答对率≥50% 记上升
  state.reviewResults = [];
  state.reviewIdx++;
  state.reviewDoneToday = (state.reviewDoneToday || 0) + 1;
  saveState();
  renderReviewQuestion();
}

// 初始化百斩引擎
function initBaizhan() {
  migrateLegacyRecords();
  updateReviewBadge();
}