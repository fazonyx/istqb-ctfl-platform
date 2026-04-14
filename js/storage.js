'use strict';

// ============================================================
// HISTORY
// ============================================================
function getHistory() {
  try { return JSON.parse(localStorage.getItem('istqb_history') || '{}'); } catch { return {}; }
}
function saveHistory(modeId, score, total) {
  const h = getHistory();
  h[modeId] = { score, total, pct: Math.round(score/total*100), date: new Date().toISOString() };
  localStorage.setItem('istqb_history', JSON.stringify(h));

  // Also save to full history (all attempts)
  const all = getAllHistory();
  // Compute per-chapter scores for this attempt
  const chScores = {};
  // Compute per-LO scores for this attempt
  const loScores = {};
  questions.forEach((q, i) => {
    if (!chScores[q.chapter]) chScores[q.chapter] = {t:0,c:0};
    chScores[q.chapter].t++;
    if (isCorrect(i)) chScores[q.chapter].c++;
    // LO tracking
    if (q.lo) {
      if (!loScores[q.lo]) loScores[q.lo] = {t:0,c:0};
      loScores[q.lo].t++;
      if (isCorrect(i)) loScores[q.lo].c++;
    }
  });
  // Classify errors
  let errInattention = 0, errLacune = 0, errNonRepondu = 0;
  questions.forEach((q, i) => {
    if (isCorrect(i)) return;
    const sel = answers[i] || [];
    if (sel.length === 0) {
      errNonRepondu++;
    } else if (q.kl === 'K1' || (q.multi && sel.some(s => q.correct.includes(s)))) {
      errInattention++;
    } else {
      errLacune++;
    }
  });

  // Build question-by-question report detail
  const reportDetail = questions.map((q, i) => ({
    id: q.id,
    lo: q.lo,
    kl: q.kl,
    chapter: q.chapter,
    correct: isCorrect(i),
    selected: answers[i] || [],
    correctAnswer: q.correct
  }));

  all.push({
    mode: modeId,
    label: currentMode ? currentMode.label : modeId,
    score, total,
    pct: Math.round(score/total*100),
    date: new Date().toISOString(),
    chapters: chScores,
    loScores: loScores,
    errors: { inattention: errInattention, lacune: errLacune, nonRepondu: errNonRepondu },
    report: reportDetail
  });
  localStorage.setItem('istqb_history_all', JSON.stringify(all));

  // Track wrong questions globally
  updateWrongQuestions();
}

function getAllHistory() {
  try { return JSON.parse(localStorage.getItem('istqb_history_all') || '[]'); } catch { return []; }
}

// PERSISTENCE
// ============================================================
function saveState() {
  if (!currentMode) return;
  const data = {
    answers, currentIdx, timeLeft, startTime,
    questionIds: questions.map(q => q.id),
    finished: quizFinished
  };
  localStorage.setItem(`istqb_${currentMode.id}`, JSON.stringify(data));
}

function loadState(modeId) {
  try { return JSON.parse(localStorage.getItem(`istqb_${modeId}`)); } catch { return null; }
}


// ============================================================
// FEATURE 1: WRONG QUESTIONS TRACKING
// ============================================================
function getWrongQuestions() {
  try { return JSON.parse(localStorage.getItem('istqb_wrong_questions') || '{}'); } catch { return {}; }
}

function updateWrongQuestions() {
  const wq = getWrongQuestions();
  questions.forEach((q, i) => {
    const correct = isCorrect(i);
    if (!correct) {
      if (!wq[q.id]) wq[q.id] = { wrong: 0, right: 0, consecutiveRight: 0, lastWrong: null };
      wq[q.id].wrong++;
      wq[q.id].consecutiveRight = 0;
      wq[q.id].lastWrong = new Date().toISOString();
    } else {
      if (wq[q.id]) {
        wq[q.id].right++;
        wq[q.id].consecutiveRight = (wq[q.id].consecutiveRight || 0) + 1;
        // Mastered: 3 consecutive correct answers -> remove
        if (wq[q.id].consecutiveRight >= 3) {
          delete wq[q.id];
        }
      }
    }
  });
  localStorage.setItem('istqb_wrong_questions', JSON.stringify(wq));
}

function getWrongQuestionsCount() {
  return Object.keys(getWrongQuestions()).length;
}

function renderWrongQuestionsCard() {
  const wq = getWrongQuestions();
  const count = Object.keys(wq).length;
  const disabled = count === 0;
  const desc = disabled
    ? 'Aucune question ratee - lancez un quiz d\'abord !'
    : `${count} question(s) a retravailler - triees par frequence d'erreur`;

  return `<div class="mode-card wrong-questions-card ${disabled ? 'disabled' : ''}" onclick="${disabled ? '' : 'startWrongQuestionsQuiz()'}">
    <div class="badge-score ${disabled ? 'badge-none' : ''}" style="${disabled ? '' : 'background:#dc2626;'}">${disabled ? '--' : count}</div>
    <div class="card-title">Questions ratees</div>
    <div class="card-meta">
      <span>${count} questions</span>
      <span>${disabled ? '--' : Math.ceil(count * 1.5)} min</span>
    </div>
    <span class="difficulty-tag diff-critical">Critique</span>
    <div style="font-size:0.75rem;color:#64748b;margin-top:6px">${desc}</div>
  </div>`;
}


function loadTutoState(tutoId) {
  try {
    return JSON.parse(localStorage.getItem('istqb_tuto_' + tutoId) || '{}');
  } catch { return {}; }
}

function saveTutoState(tutoId, state) {
  localStorage.setItem('istqb_tuto_' + tutoId, JSON.stringify(state));
}

// ============================================================
// EXPORT / IMPORT DATA
// ============================================================
function exportData() {
  const data = {
    _export: 'ISTQB_Platform_Data',
    _version: 1,
    _date: new Date().toISOString(),
    history: getHistory(),
    history_all: getAllHistory(),
    wrong_questions: getWrongQuestions(),
    flashcards: (() => { try { return JSON.parse(localStorage.getItem('istqb_flashcards') || 'null'); } catch { return null; } })(),
    tutos: {}
  };
  TUTORIALS.forEach(t => {
    const s = loadTutoState(t.id);
    if (Object.keys(s).length > 0) data.tutos[t.id] = s;
  });
  data.quiz_states = {};
  QUIZ_MODES.forEach(m => {
    try {
      const s = JSON.parse(localStorage.getItem('istqb_' + m.id));
      if (s) data.quiz_states[m.id] = s;
    } catch {}
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'istqb_data_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById('importStatus').innerHTML = '<span style="color:#16a34a;">Donnees exportees avec succes.</span>';
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data._export !== 'ISTQB_Platform_Data') {
        document.getElementById('importStatus').innerHTML = '<span style="color:#dc2626;">Fichier invalide.</span>';
        return;
      }
      if (data.history) localStorage.setItem('istqb_history', JSON.stringify(data.history));
      if (data.history_all) {
        const existing = getAllHistory();
        const existingDates = new Set(existing.map(e => e.date));
        const newEntries = data.history_all.filter(e => !existingDates.has(e.date));
        const merged = [...existing, ...newEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        localStorage.setItem('istqb_history_all', JSON.stringify(merged));
      }
      if (data.wrong_questions) localStorage.setItem('istqb_wrong_questions', JSON.stringify(data.wrong_questions));
      if (data.flashcards) localStorage.setItem('istqb_flashcards', JSON.stringify(data.flashcards));
      if (data.tutos) {
        Object.entries(data.tutos).forEach(([id, state]) => {
          localStorage.setItem('istqb_tuto_' + id, JSON.stringify(state));
        });
      }
      if (data.quiz_states) {
        Object.entries(data.quiz_states).forEach(([id, state]) => {
          localStorage.setItem('istqb_' + id, JSON.stringify(state));
        });
      }
      const count = data.history_all ? data.history_all.length : 0;
      document.getElementById('importStatus').innerHTML = '<span style="color:#16a34a;">Import reussi ! ' + count + ' tentatives restaurees.</span>';
      renderHome();
      switchHomeTab('progression', document.querySelectorAll('.home-screen .tabs .tab-btn')[1]);
    } catch (err) {
      document.getElementById('importStatus').innerHTML = '<span style="color:#dc2626;">Erreur : ' + err.message + '</span>';
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

