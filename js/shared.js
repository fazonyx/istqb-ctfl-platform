'use strict';

// ============================================================
// STATE
// ============================================================
let loTotalsGlobal = {};
let currentMode = null;
let questions = [];
let currentIdx = 0;
let answers = {}; // {idx: [selectedIndices]}
let timerInterval = null;
let timeLeft = 0;
let startTime = 0;
let quizFinished = false;

// ============================================================
// FISHER-YATES SHUFFLE
// ============================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateTimer() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const el = document.getElementById('timer');
  el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  el.classList.toggle('warning', timeLeft <= 300 && timeLeft > 0);
}

function switchHomeTab(tabId, btn) {
  document.getElementById('homeTab-quizzes').style.display = tabId === 'quizzes' ? 'block' : 'none';
  document.getElementById('homeTab-progression').style.display = tabId === 'progression' ? 'block' : 'none';
  document.getElementById('homeTab-apprentissage').style.display = tabId === 'apprentissage' ? 'block' : 'none';
  document.querySelectorAll('.home-screen .tabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (tabId === 'progression') renderProgression();
  if (tabId === 'apprentissage' && !window._fcInitialized) { initFlashcards(); window._fcInitialized = true; }
}

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  btn.classList.add('active');
}

function backToMenu() {
  if (!quizFinished) {
    if (!confirm('Voulez-vous vraiment quitter ? Votre progression sera sauvegardee.')) return;
    clearInterval(timerInterval);
    saveState();
  }
  renderHome();
}

function isCorrect(idx) {
  const q = questions[idx];
  const sel = (answers[idx] || []).sort().join(',');
  const cor = q.correct.sort().join(',');
  return sel === cor;
}
