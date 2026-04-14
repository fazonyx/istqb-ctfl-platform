'use strict';

// ============================================================
// HOME SCREEN
// ============================================================
function renderHome() {
  document.getElementById('homeScreen').classList.remove('hidden');
  document.getElementById('quizScreen').classList.remove('active');
  document.getElementById('resultsScreen').classList.remove('active');
  document.getElementById('timer').style.display = 'none';
  document.getElementById('btnBackMenu').style.display = 'none';
  document.getElementById('headerTitle').textContent = 'ISTQB CTFL - Plateforme d\'entrainement';

  const history = getHistory();
  const diffLabels = {easy:'Facile',medium:'Moyen',hard:'Difficile',critical:'Critique'};
  const diffClass = {easy:'diff-easy',medium:'diff-medium',hard:'diff-hard',critical:'diff-critical'};

  function makeCard(m) {
    const h = history[m.id];
    let badge = '';
    if (h) {
      const cls = h.pct >= 65 ? 'badge-pass' : 'badge-fail';
      badge = `<div class="badge-score ${cls}">${h.pct}%</div>`;
    } else {
      badge = `<div class="badge-score badge-none">--</div>`;
    }
    const extraClass = m.realistic ? 'realistic-card' : '';
    const warningIcon = m.realistic ? '<div style="font-size:1.5rem;margin-bottom:4px;">&#9888;</div>' : '';
    return `<div class="mode-card ${extraClass}" onclick="startQuiz('${m.id}')">
      ${badge}
      ${warningIcon}
      <div class="card-title">${m.label}</div>
      <div class="card-meta">
        <span>${m.count} questions</span>
        <span>${m.time} min</span>
      </div>
      <span class="difficulty-tag ${diffClass[m.diff]}">${diffLabels[m.diff]}</span>
      ${h ? `<div style="font-size:0.75rem;color:${m.realistic ? '#94a3b8' : '#94a3b8'};margin-top:6px">Dernier: ${h.pct}% (${new Date(h.date).toLocaleDateString('fr-FR')})</div>` : ''}
    </div>`;
  }

  document.getElementById('examCards').innerHTML = QUIZ_MODES.filter(m=>m.group==='exam').map(makeCard).join('');
  // Training cards: wrong questions card first, then the rest
  const trainingHtml = renderWrongQuestionsCard() + QUIZ_MODES.filter(m=>m.group==='training').map(makeCard).join('');
  document.getElementById('trainingCards').innerHTML = trainingHtml;
  document.getElementById('chapterCards').innerHTML = QUIZ_MODES.filter(m=>m.group==='chapter').map(makeCard).join('');
}

// ============================================================
// START QUIZ
// ============================================================
function startQuiz(modeId) {
  const mode = QUIZ_MODES.find(m => m.id === modeId);
  if (!mode) return;
  currentMode = mode;
  quizFinished = false;

  // Load questions
  if (mode.random) {
    questions = shuffle(ALL_QUESTIONS).slice(0, mode.random);
  } else if (mode.filter) {
    const filtered = ALL_QUESTIONS.filter(mode.filter);
    if (mode.group === 'exam') {
      questions = [...filtered]; // Keep exam order
    } else {
      questions = shuffle(filtered);
    }
  }

  currentIdx = 0;
  answers = {};
  startTime = Date.now();

  // Try to restore from localStorage
  const saved = loadState(modeId);
  if (saved && !saved.finished) {
    answers = saved.answers || {};
    currentIdx = saved.currentIdx || 0;
    startTime = saved.startTime || Date.now();
    if (saved.questionIds) {
      const idMap = {};
      ALL_QUESTIONS.forEach(q => idMap[q.id] = q);
      const restored = saved.questionIds.map(id => idMap[id]).filter(Boolean);
      if (restored.length === questions.length || restored.length > 0) {
        questions = restored;
      }
    }
  }

  // UI
  document.getElementById('homeScreen').classList.add('hidden');
  document.getElementById('quizScreen').classList.add('active');
  document.getElementById('resultsScreen').classList.remove('active');
  document.getElementById('timer').style.display = 'block';
  document.getElementById('btnBackMenu').style.display = 'block';
  document.getElementById('headerTitle').textContent = mode.label;

  // Timer
  timeLeft = mode.time * 60;
  if (saved && saved.timeLeft) timeLeft = saved.timeLeft;
  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishQuiz(true);
    }
    // Save state periodically
    if (timeLeft % 10 === 0) saveState();
  }, 1000);

  renderQuestion();
  renderNav();
}

// ============================================================
// RENDER QUESTION
// ============================================================
function renderQuestion() {
  const q = questions[currentIdx];
  if (!q) return;
  const selected = answers[currentIdx] || [];
  const inputType = q.multi ? 'checkbox' : 'radio';
  const instruction = q.multi ? 'Selectionnez DEUX options.' : 'Selectionnez UNE option.';

  let html = `<div class="question-card">
    <div class="q-header">
      <span class="q-number">Question ${currentIdx + 1}/${questions.length} (${q.id})</span>
      <span class="q-lo">${q.lo} | ${q.kl} | ${q.pts} pt</span>
    </div>`;

  if (q.scenario) {
    html += `<div class="q-scenario">${q.scenario}</div>`;
  }

  html += `<div class="q-text">${q.q}</div>
    <div class="q-instruction">${instruction}</div>`;

  q.options.forEach((opt, i) => {
    const letter = String.fromCharCode(97 + i);
    const checked = selected.includes(i) ? 'checked' : '';
    const selClass = selected.includes(i) ? 'selected' : '';
    html += `<div class="option ${selClass}" onclick="selectOption(${i}, '${inputType}')">
      <input type="${inputType}" name="q${currentIdx}" value="${i}" ${checked} id="opt_${i}">
      <label for="opt_${i}">${letter}) ${opt}</label>
    </div>`;
  });

  html += `</div>`;
  document.getElementById('questionArea').innerHTML = html;

  // Update buttons
  document.getElementById('btnPrev').disabled = currentIdx === 0;
  document.getElementById('btnNext').disabled = currentIdx === questions.length - 1;
}

function selectOption(idx, type) {
  let selected = answers[currentIdx] || [];
  if (type === 'radio') {
    selected = [idx];
  } else {
    if (selected.includes(idx)) {
      selected = selected.filter(i => i !== idx);
    } else {
      selected.push(idx);
    }
  }
  answers[currentIdx] = selected;
  renderQuestion();
  renderNav();
  saveState();
}

// ============================================================
// NAVIGATION
// ============================================================
function renderNav() {
  let html = '';
  questions.forEach((q, i) => {
    const answered = answers[i] && answers[i].length > 0;
    const current = i === currentIdx;
    let cls = '';
    if (quizFinished) {
      const correct = isCorrect(i);
      cls = correct ? 'correct' : 'incorrect';
    } else {
      if (answered) cls = 'answered';
      if (current) cls += ' current';
    }
    html += `<button class="nav-btn ${cls}" onclick="goTo(${i})">${i + 1}</button>`;
  });
  document.getElementById('navGrid').innerHTML = html;
}

function goTo(idx) {
  currentIdx = idx;
  renderQuestion();
  renderNav();
  saveState();
}

function navigate(dir) {
  const next = currentIdx + dir;
  if (next >= 0 && next < questions.length) {
    goTo(next);
  }
}


document.addEventListener('keydown', e => {
  if (!document.getElementById('quizScreen').classList.contains('active')) return;
  if (quizFinished) return;
  if (e.key === 'ArrowLeft') navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
  if (e.key >= '1' && e.key <= '5') {
    const idx = parseInt(e.key) - 1;
    const q = questions[currentIdx];
    if (q && idx < q.options.length) {
      selectOption(idx, q.multi ? 'checkbox' : 'radio');
    }
  }
});

// ============================================================
// FINISH QUIZ
// ============================================================
function finishQuiz(timeUp) {
  const unanswered = questions.filter((_, i) => !answers[i] || answers[i].length === 0).length;
  if (!timeUp && unanswered > 0) {
    if (!confirm(`Il reste ${unanswered} question(s) sans reponse. Voulez-vous vraiment terminer ?`)) return;
  }
  clearInterval(timerInterval);
  quizFinished = true;
  saveState();

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const score = questions.reduce((s, _, i) => s + (isCorrect(i) ? 1 : 0), 0);
  const total = questions.length;
  const pct = Math.round(score / total * 100);

  saveHistory(currentMode.id, score, total);

  // Clear saved quiz state so next time starts fresh
  localStorage.removeItem(`istqb_${currentMode.id}`);

  showResults(score, total, pct, elapsed);
}

// ============================================================
// RESULTS
// ============================================================
function showResults(score, total, pct, elapsed) {
  document.getElementById('quizScreen').classList.remove('active');
  document.getElementById('resultsScreen').classList.add('active');
  document.getElementById('timer').style.display = 'none';

  const pass = pct >= 65;
  const elMin = Math.floor(elapsed / 60);
  const elSec = elapsed % 60;

  // Chapter breakdown
  const chapters = {};
  questions.forEach((q, i) => {
    if (!chapters[q.chapter]) chapters[q.chapter] = {total: 0, correct: 0};
    chapters[q.chapter].total++;
    if (isCorrect(i)) chapters[q.chapter].correct++;
  });

  // K-level breakdown
  const klevels = {};
  questions.forEach((q, i) => {
    if (!klevels[q.kl]) klevels[q.kl] = {total: 0, correct: 0};
    klevels[q.kl].total++;
    if (isCorrect(i)) klevels[q.kl].correct++;
  });

  // Error diagnosis
  const errors = {inattention: [], lacune: [], nonRepondu: []};
  questions.forEach((q, i) => {
    if (isCorrect(i)) return;
    const sel = answers[i] || [];
    if (sel.length === 0) {
      errors.nonRepondu.push(i);
    } else if (q.kl === 'K1' || (q.multi && sel.some(s => q.correct.includes(s)))) {
      errors.inattention.push(i);
    } else {
      errors.lacune.push(i);
    }
  });

  let html = '';

  // Score card
  html += `<div class="score-card">
    <div class="score ${pass ? 'pass' : 'fail'}">${pct}%</div>
    <div class="verdict">${pass ? 'REUSSI' : 'ECHEC'} - ${score}/${total} bonnes reponses</div>
    <div class="details">Seuil de reussite : 65% | Temps : ${elMin}m ${elSec}s | ${pass ? 'Felicitations !' : `Il vous manque ${Math.ceil(total * 0.65) - score} point(s)`}</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${pass?'#16a34a':'#dc2626'}"></div></div>
  </div>`;

  // Tabs
  html += `<div class="tabs">
    <button class="tab-btn active" onclick="switchTab('analyse',this)">Analyse</button>
    <button class="tab-btn" onclick="switchTab('revision',this)">Plan de revision</button>
    <button class="tab-btn" onclick="switchTab('detail',this)">Detail</button>
  </div>`;

  // TAB: Analyse
  html += `<div class="tab-content active" id="tab-analyse">`;
  html += `<div class="analysis-section"><h2>Resultats par chapitre</h2>`;
  Object.keys(chapters).sort().forEach(ch => {
    const c = chapters[ch];
    const cpct = Math.round(c.correct / c.total * 100);
    const cls = cpct >= 65 ? 'good' : cpct >= 50 ? 'medium' : 'bad';
    const color = cpct >= 65 ? '#16a34a' : cpct >= 50 ? '#f59e0b' : '#dc2626';
    html += `<div class="chapter-row">
      <div class="chapter-name">${CHAPTER_NAMES[ch] || 'Ch.' + ch}</div>
      <div class="chapter-bar"><div class="chapter-bar-fill" style="width:${cpct}%;background:${color}"></div></div>
      <div class="chapter-score ${cls}">${c.correct}/${c.total} (${cpct}%)</div>
    </div>`;
  });
  html += `</div>`;

  // K-levels
  html += `<div class="analysis-section"><h2>Resultats par niveau K</h2>`;
  ['K1','K2','K3'].forEach(kl => {
    if (!klevels[kl]) return;
    const c = klevels[kl];
    const cpct = Math.round(c.correct / c.total * 100);
    const cls = cpct >= 65 ? 'good' : cpct >= 50 ? 'medium' : 'bad';
    const color = cpct >= 65 ? '#16a34a' : cpct >= 50 ? '#f59e0b' : '#dc2626';
    const klName = {K1:'K1 - Se souvenir',K2:'K2 - Comprendre',K3:'K3 - Appliquer'}[kl];
    html += `<div class="chapter-row">
      <div class="chapter-name">${klName}</div>
      <div class="chapter-bar"><div class="chapter-bar-fill" style="width:${cpct}%;background:${color}"></div></div>
      <div class="chapter-score ${cls}">${c.correct}/${c.total} (${cpct}%)</div>
    </div>`;
  });
  html += `</div>`;

  // Error diagnosis
  html += `<div class="analysis-section"><h2>Diagnostic des erreurs</h2>`;
  if (errors.inattention.length > 0) {
    html += `<h3>Inattention probable (${errors.inattention.length})</h3>`;
    errors.inattention.forEach(i => {
      html += `<div class="error-item error-inattention">Q${i+1} (${questions[i].id}) - ${questions[i].kl} - ${CHAPTER_NAMES[questions[i].chapter]}</div>`;
    });
  }
  if (errors.lacune.length > 0) {
    html += `<h3>Lacune de connaissances (${errors.lacune.length})</h3>`;
    errors.lacune.forEach(i => {
      html += `<div class="error-item error-lacune">Q${i+1} (${questions[i].id}) - ${questions[i].kl} - ${CHAPTER_NAMES[questions[i].chapter]}</div>`;
    });
  }
  if (errors.nonRepondu.length > 0) {
    html += `<h3>Non repondu (${errors.nonRepondu.length})</h3>`;
    errors.nonRepondu.forEach(i => {
      html += `<div class="error-item error-nonrepondu">Q${i+1} (${questions[i].id}) - ${CHAPTER_NAMES[questions[i].chapter]}</div>`;
    });
  }
  html += `</div>`;
  html += `</div>`; // end tab-analyse

  // TAB: Revision
  html += `<div class="tab-content" id="tab-revision">`;
  html += `<div class="analysis-section"><h2>Plan de revision</h2>`;

  const sortedChapters = Object.entries(chapters).sort((a, b) => {
    const pa = a[1].correct / a[1].total;
    const pb = b[1].correct / b[1].total;
    return pa - pb;
  });

  const revisionAdvice = {
    1: "Revoir les 7 principes de test, la difference entre erreur/defaut/defaillance, les objectifs et activites de test, les roles et competences du testeur.",
    2: "Revoir les modeles de SDLC (sequentiel, iteratif, incremental), TDD/ATDD/BDD, shift-left, DevOps, les niveaux de test et les retrospectives.",
    3: "Revoir les differences test statique vs dynamique, les types de revue (informelle, walkthrough, technique, inspection), les roles dans les revues, les facteurs de succes.",
    4: "PRIORITE CRITIQUE: Revoir EP, BVA (2 et 3 valeurs), tables de decision, diagrammes de transitions d'etats, test des instructions et branches, error guessing, exploratoire, checklist-based, user stories et criteres d'acceptation.",
    5: "Revoir la planification de test, l'estimation (3 points, ratios, planning poker), la priorisation des cas de test, la pyramide de test, les quadrants, l'analyse de risque, les metriques, la gestion de configuration et les rapports de defauts.",
    6: "Revoir les categories d'outils de test et les avantages/risques de l'automatisation."
  };

  sortedChapters.forEach(([ch, c]) => {
    const cpct = Math.round(c.correct / c.total * 100);
    const cls = cpct < 50 ? 'critical' : cpct < 65 ? 'warning' : 'ok';
    const status = cpct < 50 ? 'CRITIQUE' : cpct < 65 ? 'A RENFORCER' : 'BON';
    html += `<div class="revision-card ${cls}">
      <h4>${CHAPTER_NAMES[ch]} - ${c.correct}/${c.total} (${cpct}%) - ${status}</h4>
      <p style="font-size:0.9rem;color:#475569">${revisionAdvice[ch] || ''}</p>
    </div>`;
  });

  // Global verdict
  const gap = Math.ceil(total * 0.65) - score;
  html += `<div class="revision-card ${pass ? 'ok' : 'critical'}">
    <h4>Verdict global : ${pass ? 'Vous etes pret(e) pour l\'examen !' : `Il vous manque ${gap} point(s) pour atteindre 65%`}</h4>
    <p style="font-size:0.9rem;color:#475569">${!pass ? 'Concentrez-vous sur les chapitres marques CRITIQUE et A RENFORCER ci-dessus. Refaites les exercices du chapitre 4 en priorite.' : 'Continuez a vous entrainer pour consolider vos acquis.'}</p>
  </div>`;
  html += `</div></div>`; // end tab-revision

  // TAB: Detail
  html += `<div class="tab-content" id="tab-detail">`;

  // Nav grid for results
  html += `<div class="nav-grid" style="margin-bottom:20px">`;
  questions.forEach((q, i) => {
    const correct = isCorrect(i);
    html += `<button class="nav-btn ${correct ? 'correct' : 'incorrect'}" onclick="document.getElementById('detail-q-${i}').scrollIntoView({behavior:'smooth'})">${i + 1}</button>`;
  });
  html += `</div>`;

  questions.forEach((q, i) => {
    const correct = isCorrect(i);
    const sel = answers[i] || [];
    html += `<div class="detail-question ${correct ? 'correct' : 'incorrect'}" id="detail-q-${i}">
      <div class="q-header">
        <span class="q-number">Q${i+1} (${q.id}) - ${q.lo} - ${q.kl}</span>
        <span class="tag ${correct ? 'tag-green' : 'tag-red'}">${correct ? 'Correct' : 'Incorrect'}</span>
      </div>
      <div class="q-text" style="font-size:0.95rem;margin-bottom:12px">${q.q}</div>`;

    q.options.forEach((opt, j) => {
      const letter = String.fromCharCode(97 + j);
      let cls = '';
      if (q.correct.includes(j)) cls = 'correct-answer';
      else if (sel.includes(j)) cls = 'wrong-answer';
      html += `<div class="option ${cls}" style="cursor:default">
        <label>${letter}) ${opt}</label>
      </div>`;
    });

    if (q.justification) {
      html += `<div class="justification ${correct ? '' : 'wrong'}" style="display:block">
        <strong>${correct ? 'Bonne reponse' : 'Explication :'}</strong>
        ${q.justification}
      </div>`;
    }
    html += `</div>`;
  });
  html += `</div>`; // end tab-detail

  // Buttons
  html += `<div style="text-align:center;padding:20px">`;
  if (currentMode && currentMode._returnToLearning) {
    html += `<button class="btn-retry" onclick="startChapterMiniQuiz(${questions[0] ? questions[0].chapter : 1})">Recommencer</button>`;
    html += `<button class="btn-home" onclick="renderHome();switchHomeTab('apprentissage',document.querySelectorAll('.home-screen .tab-btn')[2]);">Retour aux fiches</button>`;
  } else if (currentMode && currentMode.id === 'wrong_questions') {
    html += `<button class="btn-retry" onclick="startWrongQuestionsQuiz()">Recommencer</button>`;
    html += `<button class="btn-home" onclick="renderHome()">Retour au menu</button>`;
  } else {
    html += `<button class="btn-retry" onclick="startQuiz('${currentMode.id}')">Recommencer</button>`;
    html += `<button class="btn-home" onclick="renderHome()">Retour au menu</button>`;
  }
  html += `</div>`;

  document.getElementById('resultsContent').innerHTML = html;
  renderNav();
}

function startWrongQuestionsQuiz() {
  const wq = getWrongQuestions();
  const ids = Object.keys(wq);
  if (ids.length === 0) return;

  // Sort by most frequently wrong first
  ids.sort((a, b) => (wq[b].wrong || 0) - (wq[a].wrong || 0));

  const idMap = {};
  ALL_QUESTIONS.forEach(q => idMap[q.id] = q);
  const filteredQs = ids.map(id => idMap[id]).filter(Boolean);

  if (filteredQs.length === 0) return;

  // Create a temporary mode
  const tempMode = {
    id: 'wrong_questions',
    label: 'Questions ratees',
    desc: 'Questions que vous avez ratees precedemment',
    count: filteredQs.length,
    time: Math.ceil(filteredQs.length * 1.5),
    diff: 'critical',
    group: 'training'
  };

  currentMode = tempMode;
  quizFinished = false;
  questions = filteredQs;
  currentIdx = 0;
  answers = {};
  startTime = Date.now();

  // UI
  document.getElementById('homeScreen').classList.add('hidden');
  document.getElementById('quizScreen').classList.add('active');
  document.getElementById('resultsScreen').classList.remove('active');
  document.getElementById('timer').style.display = 'block';
  document.getElementById('btnBackMenu').style.display = 'block';
  document.getElementById('headerTitle').textContent = tempMode.label;

  // Timer
  timeLeft = tempMode.time * 60;
  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishQuiz(true);
    }
    if (timeLeft % 10 === 0) saveState();
  }, 1000);

  renderQuestion();
  renderNav();
}


// ============================================================
// FEATURE 2: MINI-QUIZ AFTER FICHES
// ============================================================
function startChapterMiniQuiz(chapter) {
  const chapterQs = ALL_QUESTIONS.filter(q => q.chapter === chapter);
  const shuffled = shuffle(chapterQs);
  const selected = shuffled.slice(0, Math.min(10, shuffled.length));

  if (selected.length === 0) {
    alert('Aucune question disponible pour ce chapitre.');
    return;
  }

  const tempMode = {
    id: 'mini_ch' + chapter,
    label: 'Mini-quiz Ch.' + chapter,
    desc: 'Mini-quiz du chapitre ' + chapter,
    count: selected.length,
    time: 15,
    diff: 'medium',
    group: 'chapter',
    _returnToLearning: true
  };

  currentMode = tempMode;
  quizFinished = false;
  questions = selected;
  currentIdx = 0;
  answers = {};
  startTime = Date.now();

  // UI
  document.getElementById('homeScreen').classList.add('hidden');
  document.getElementById('quizScreen').classList.add('active');
  document.getElementById('resultsScreen').classList.remove('active');
  document.getElementById('timer').style.display = 'block';
  document.getElementById('btnBackMenu').style.display = 'block';
  document.getElementById('headerTitle').textContent = tempMode.label;

  // Timer
  timeLeft = tempMode.time * 60;
  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishQuiz(true);
    }
    if (timeLeft % 10 === 0) saveState();
  }, 1000);

  renderQuestion();
  renderNav();
}


function startLOQuiz(lo) {
  const loQs = ALL_QUESTIONS.filter(q => q.lo === lo);
  if (loQs.length === 0) { alert('Aucune question pour cet objectif.'); return; }
  const shuffled = shuffle(loQs);
  const tempMode = {
    id: 'lo_' + lo.replace(/[^a-zA-Z0-9]/g, '_'),
    label: 'Entrainement ' + lo,
    count: shuffled.length,
    time: Math.max(5, Math.ceil(shuffled.length * 1.5)),
    diff: 'medium',
    group: 'training'
  };
  currentMode = tempMode;
  quizFinished = false;
  questions = shuffled;
  currentIdx = 0;
  answers = {};
  startTime = Date.now();

  document.getElementById('homeScreen').classList.add('hidden');
  document.getElementById('quizScreen').classList.add('active');
  document.getElementById('resultsScreen').classList.remove('active');
  document.getElementById('timer').style.display = 'block';
  document.getElementById('btnBackMenu').style.display = 'block';
  document.getElementById('headerTitle').textContent = tempMode.label;

  timeLeft = tempMode.time * 60;
  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) { clearInterval(timerInterval); finishQuiz(true); }
    if (timeLeft % 10 === 0) saveState();
  }, 1000);

  renderQuestion();
  renderNav();
}


// ============================================================
// FEATURE 3: REALISTIC EXAM - Override navigation behavior
// ============================================================
const _originalGoTo = goTo;
goTo = function(idx) {
  if (currentMode && currentMode.realistic && !quizFinished) {
    // In realistic mode, cannot go back
    if (idx < currentIdx) return;
    if (idx > currentIdx) return; // can only use Suivante
  }
  _originalGoTo(idx);
};

const _originalNavigate = navigate;
navigate = function(dir) {
  if (currentMode && currentMode.realistic && !quizFinished) {
    if (dir === -1) return; // Previous disabled
    if (dir === 1) {
      // Confirm before moving forward
      if (!confirm('Attention : vous ne pourrez pas revenir a cette question. Continuer ?')) return;
    }
  }
  const next = currentIdx + dir;
  if (next >= 0 && next < questions.length) {
    currentIdx = next;
    renderQuestion();
    renderNav();
    saveState();
  }
};

// Override renderNav to handle realistic mode locked buttons
const _originalRenderNav = renderNav;
renderNav = function() {
  let html = '';
  questions.forEach((q, i) => {
    const answered = answers[i] && answers[i].length > 0;
    const current = i === currentIdx;
    let cls = '';
    if (quizFinished) {
      const correct = isCorrect(i);
      cls = correct ? 'correct' : 'incorrect';
    } else if (currentMode && currentMode.realistic) {
      if (i < currentIdx) cls = 'locked' + (answered ? ' answered' : '');
      else if (answered) cls = 'answered';
      if (current) cls += ' current';
    } else {
      if (answered) cls = 'answered';
      if (current) cls += ' current';
    }
    html += `<button class="nav-btn ${cls}" onclick="${(currentMode && currentMode.realistic && !quizFinished && i < currentIdx) ? '' : 'goTo('+i+')'}">${i + 1}</button>`;
  });
  document.getElementById('navGrid').innerHTML = html;
};

// Override renderQuestion to disable Previous in realistic mode
const _originalRenderQuestion = renderQuestion;
renderQuestion = function() {
  _originalRenderQuestion();
  if (currentMode && currentMode.realistic && !quizFinished) {
    document.getElementById('btnPrev').disabled = true;
    // Add realistic timer styling
    document.getElementById('timer').classList.add('realistic-timer');
  } else {
    document.getElementById('timer').classList.remove('realistic-timer');
  }
};

// Override startQuiz to show realistic warning
const _originalStartQuiz = startQuiz;
startQuiz = function(modeId) {
  _originalStartQuiz(modeId);
  if (currentMode && currentMode.realistic) {
    setTimeout(() => {
      alert('Mode examen realiste : vous ne pourrez pas revenir en arriere une fois une question passee. Bonne chance !');
    }, 100);
  }
};

// Override keyboard handler for realistic mode
document.removeEventListener('keydown', null); // can't remove anonymous, so we override in new listener
document.addEventListener('keydown', function(e) {
  if (!document.getElementById('quizScreen').classList.contains('active')) return;
  if (quizFinished) return;
  // Block ArrowLeft in realistic mode
  if (currentMode && currentMode.realistic && e.key === 'ArrowLeft') {
    e.stopImmediatePropagation();
    return;
  }
}, true); // use capture phase to intercept before original

// ============================================================
// INIT
// ============================================================
renderHome();

// Handle hash-based navigation (e.g., #apprentissage from chapter pages or browser back)
function handleHashNavigation() {
  if (window.location.hash === '#apprentissage') {
    const btn = document.querySelectorAll('.home-screen .tabs .tab-btn')[2];
    if (btn) switchHomeTab('apprentissage', btn);
  } else if (window.location.hash === '#progression') {
    const btn = document.querySelectorAll('.home-screen .tabs .tab-btn')[1];
    if (btn) switchHomeTab('progression', btn);
  } else if (window.location.hash === '#quiz' || window.location.hash === '') {
    const btn = document.querySelectorAll('.home-screen .tabs .tab-btn')[0];
    if (btn) switchHomeTab('quizzes', btn);
  }
}
handleHashNavigation();
window.addEventListener('hashchange', handleHashNavigation);
window.addEventListener('popstate', handleHashNavigation);
