'use strict';

// ============================================================
// APPRENTISSAGE: Sub-tabs, Fiches, Flashcards
// ============================================================

function switchApprentissageSubtab(id, btn) {
  document.getElementById('subtab-fiches').style.display = id === 'fiches' ? 'block' : 'none';
  document.getElementById('subtab-flashcards').style.display = id === 'flashcards' ? 'block' : 'none';
  document.getElementById('subtab-aide').style.display = id === 'aide' ? 'block' : 'none';
  document.getElementById('subtab-tutos').style.display = id === 'tutos' ? 'block' : 'none';
  document.querySelectorAll('.apprentissage-subtabs .subtab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (id === 'flashcards' && !window._fcInitialized) { initFlashcards(); window._fcInitialized = true; }
  if (id === 'tutos' && !window._tutosInitialized) { renderTutos(); window._tutosInitialized = true; }
}


function toggleFiche(header) {
  header.classList.toggle('open');
  header.nextElementSibling.classList.toggle('open');
}


// ============================================================
// FLASHCARDS ENGINE
// ============================================================
let fcDeck = [];
let fcKnown = new Set();
let fcCurrentIdx = 0;
let fcFilter = 'all';

function initFlashcards() {
  const saved = localStorage.getItem('istqb_flashcards');
  if (saved) {
    try { fcKnown = new Set(JSON.parse(saved)); } catch(e) { fcKnown = new Set(); }
  }
  buildFcFilters();
  fcShuffle();
}

function buildFcFilters() {
  const chapters = [...new Set(FLASHCARDS.map(c => c.chapter))].sort();
  let html = '<button class="fc-chip active" onclick="setFcFilter(\'all\',this)">Toutes</button>';
  chapters.forEach(ch => {
    html += `<button class="fc-chip" onclick="setFcFilter(${ch},this)">Ch.${ch}</button>`;
  });
  document.getElementById('fcFilters').innerHTML = html;
}

function setFcFilter(f, btn) {
  fcFilter = f;
  document.querySelectorAll('.fc-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  fcShuffle();
}

function getFilteredCards() {
  return FLASHCARDS.filter(c => {
    if (fcFilter !== 'all' && c.chapter !== fcFilter) return false;
    return true;
  });
}

function fcShuffle() {
  const filtered = getFilteredCards();
  const unknown = filtered.filter((c,i) => !fcKnown.has(fcCardId(c)));
  // Shuffle Fisher-Yates
  for (let i = unknown.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unknown[i], unknown[j]] = [unknown[j], unknown[i]];
  }
  fcDeck = unknown;
  fcCurrentIdx = 0;
  renderFcCard();
}

function fcCardId(card) {
  return FLASHCARDS.indexOf(card);
}

function renderFcCard() {
  const filtered = getFilteredCards();
  const knownCount = filtered.filter(c => fcKnown.has(fcCardId(c))).length;
  const total = filtered.length;
  const pct = total > 0 ? Math.round(knownCount / total * 100) : 0;
  document.getElementById('fcProgressFill').style.width = pct + '%';
  document.getElementById('fcProgressText').textContent = knownCount + ' / ' + total + ' maitrisees (' + pct + '%)';

  if (fcDeck.length === 0 || fcCurrentIdx >= fcDeck.length) {
    document.getElementById('fcCardContainer').style.display = 'none';
    document.getElementById('fcActions').style.display = 'none';
    document.getElementById('fcEmpty').style.display = 'block';
    return;
  }
  document.getElementById('fcCardContainer').style.display = 'block';
  document.getElementById('fcActions').style.display = 'flex';
  document.getElementById('fcEmpty').style.display = 'none';

  const card = fcDeck[fcCurrentIdx];
  document.getElementById('fcCard').classList.remove('flipped');
  document.getElementById('fcChapterTag').textContent = 'Chapitre ' + card.chapter;
  document.getElementById('fcChapterTagBack').textContent = 'Chapitre ' + card.chapter;
  document.getElementById('fcQuestion').textContent = card.front;
  document.getElementById('fcAnswer').textContent = card.back;
}

function flipCard() {
  document.getElementById('fcCard').classList.toggle('flipped');
}

function fcKnow() {
  if (fcDeck.length === 0) return;
  const card = fcDeck[fcCurrentIdx];
  fcKnown.add(fcCardId(card));
  localStorage.setItem('istqb_flashcards', JSON.stringify([...fcKnown]));
  fcDeck.splice(fcCurrentIdx, 1);
  if (fcCurrentIdx >= fcDeck.length) fcCurrentIdx = 0;
  renderFcCard();
}

function fcReview() {
  if (fcDeck.length === 0) return;
  const card = fcDeck.splice(fcCurrentIdx, 1)[0];
  // Insert 3 cards ahead (simple spaced repetition)
  const insertAt = Math.min(fcCurrentIdx + 3, fcDeck.length);
  fcDeck.splice(insertAt, 0, card);
  if (fcCurrentIdx >= fcDeck.length) fcCurrentIdx = 0;
  renderFcCard();
}


function openFicheForLO(lo) {
  const ch = lo.split('.')[0].replace('FL-','');
  switchHomeTab('apprentissage', document.querySelectorAll('.home-screen .tabs .tab-btn')[2]);
  setTimeout(() => {
    const fiche = document.querySelector('.fiche-ch' + ch);
    if (fiche) {
      const body = fiche.querySelector('.fiche-body');
      if (body && body.style.display !== 'block') fiche.querySelector('.fiche-header').click();
      setTimeout(() => fiche.scrollIntoView({behavior:'smooth'}), 200);
    }
  }, 100);
}


function renderTutos() {
  const container = document.getElementById('subtab-tutos');
  let html = '<h2 style="color:#1e3a5f;margin-bottom:20px;">Exercices guides pas a pas</h2>';
  html += '<p style="color:#64748b;margin-bottom:24px;">Chaque exercice vous guide etape par etape. Repondez a chaque question pour debloquer la suivante.</p>';

  TUTORIALS.forEach(tuto => {
    html += `<div class="tuto-card" id="tuto-${tuto.id}">
      <h3>${tuto.title}</h3>
      <div class="tuto-desc">Chapitre ${tuto.chapter} | ${tuto.steps.length} etapes | ${tuto.desc}</div>
      <div class="tuto-scenario">${tuto.scenario.replace(/\n/g, '<br>')}</div>
      <div class="tuto-progress" id="tuto-progress-${tuto.id}"></div>
      <div id="tuto-steps-${tuto.id}"></div>
      <div id="tuto-congrats-${tuto.id}"></div>
      <button class="tuto-reset" onclick="resetTuto('${tuto.id}')">Recommencer cet exercice</button>
    </div>`;
  });

  container.innerHTML = html;

  TUTORIALS.forEach(tuto => {
    const state = loadTutoState(tuto.id);
    renderTutoSteps(tuto, state);
  });
}


function resetTuto(tutoId) {
  localStorage.removeItem('istqb_tuto_' + tutoId);
  const tuto = TUTORIALS.find(t => t.id === tutoId);
  renderTutoSteps(tuto, {});
}

function renderTutoSteps(tuto, state) {
  const completedSteps = state.completed || [];
  const currentStep = completedSteps.length;
  const allDone = currentStep >= tuto.steps.length;

  let progHtml = '';
  tuto.steps.forEach((_, i) => {
    let cls = 'tuto-progress-dot';
    if (i < currentStep) cls += ' done';
    else if (i === currentStep) cls += ' current';
    progHtml += `<div class="${cls}"></div>`;
  });
  document.getElementById('tuto-progress-' + tuto.id).innerHTML = progHtml;

  let stepsHtml = '';
  tuto.steps.forEach((step, i) => {
    let stepCls = 'tuto-step';
    if (i < currentStep) stepCls += ' correct';
    else if (i === currentStep) stepCls += ' active';
    else stepCls += ' locked';

    stepsHtml += `<div class="${stepCls}" id="tuto-step-${tuto.id}-${i}">
      <div class="tuto-step-header">
        <div class="tuto-step-num">${i < currentStep ? '&#10003;' : i + 1}</div>
        <div class="tuto-step-title">${step.q}</div>
      </div>`;

    if (i <= currentStep) {
      if (step.type === 'input') {
        const prevAnswer = i < currentStep ? (state.answers && state.answers[i]) || '' : '';
        stepsHtml += `<div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
          <input class="tuto-input" id="tuto-input-${tuto.id}-${i}" value="${prevAnswer}"
            ${i < currentStep ? 'disabled' : ''} placeholder="Votre reponse"
            onkeydown="if(event.key==='Enter')checkTutoStep('${tuto.id}',${i})">
          ${i === currentStep ? `<button class="tuto-btn-check" onclick="checkTutoStep('${tuto.id}',${i})">Verifier</button>` : ''}
          ${step.hint && i === currentStep ? `<div style="font-size:0.8rem;color:#94a3b8;margin-top:4px;width:100%;"><em>Indice : ${step.hint}</em></div>` : ''}
        </div>`;
      } else if (step.type === 'options') {
        stepsHtml += '<div class="tuto-options">';
        step.options.forEach(opt => {
          let optCls = 'tuto-opt';
          if (i < currentStep) {
            if (opt === step.answer) optCls += ' correct-opt';
            else if (state.answers && state.answers[i] === opt && opt !== step.answer) optCls += ' wrong-opt';
          }
          const disabled = i < currentStep ? 'style="pointer-events:none;"' : '';
          stepsHtml += `<div class="${optCls}" ${disabled} onclick="selectTutoOpt('${tuto.id}',${i},this,'${opt.replace(/'/g, "\\'")}')">${opt}</div>`;
        });
        stepsHtml += '</div>';
        if (i === currentStep) {
          stepsHtml += `<button class="tuto-btn-check" onclick="checkTutoStep('${tuto.id}',${i})" style="margin-top:8px;">Verifier</button>`;
        }
      } else if (step.type === 'multi') {
        stepsHtml += '<div class="tuto-options" id="tuto-multi-' + tuto.id + '-' + i + '">';
        step.options.forEach(opt => {
          let optCls = 'tuto-opt';
          if (i < currentStep) {
            if (step.answer.includes(opt)) optCls += ' correct-opt';
            else if (state.answers && state.answers[i] && state.answers[i].includes(opt)) optCls += ' wrong-opt';
          }
          const disabled = i < currentStep ? 'style="pointer-events:none;"' : '';
          stepsHtml += `<div class="${optCls}" ${disabled} onclick="toggleTutoMulti(this)">${opt}</div>`;
        });
        stepsHtml += '</div>';
        if (i === currentStep) {
          stepsHtml += `<div style="font-size:0.8rem;color:#94a3b8;margin-top:4px;"><em>Selectionnez 2 reponses puis cliquez Verifier.</em></div>`;
          stepsHtml += `<button class="tuto-btn-check" onclick="checkTutoStep('${tuto.id}',${i})" style="margin-top:8px;">Verifier</button>`;
        }
      }

      if (i < currentStep) {
        const wasCorrectFirst = state.firstTry && state.firstTry[i];
        const fb = wasCorrectFirst ? step.feedback_ok : step.feedback_ko;
        stepsHtml += `<div class="tuto-feedback show ok">${fb}</div>`;
      } else {
        stepsHtml += `<div class="tuto-feedback" id="tuto-fb-${tuto.id}-${i}"></div>`;
      }
    }

    stepsHtml += '</div>';
  });

  document.getElementById('tuto-steps-' + tuto.id).innerHTML = stepsHtml;

  if (allDone) {
    const firstTryCount = state.firstTry ? Object.values(state.firstTry).filter(v => v).length : 0;
    document.getElementById('tuto-congrats-' + tuto.id).innerHTML = `
      <div class="tuto-congrats">
        <h4>Exercice termine !</h4>
        <p>${firstTryCount}/${tuto.steps.length} reponses correctes du premier coup.</p>
        ${firstTryCount === tuto.steps.length ? '<p style="color:#16a34a;font-weight:700;">Parfait ! Vous maitrisez cette technique.</p>' : '<p style="color:#f59e0b;">Recommencez pour viser le sans-faute !</p>'}
      </div>`;
  } else {
    document.getElementById('tuto-congrats-' + tuto.id).innerHTML = '';
  }
}

function selectTutoOpt(tutoId, stepIdx, el, value) {
  el.parentNode.querySelectorAll('.tuto-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  el.dataset.value = value;
}

function toggleTutoMulti(el) {
  el.classList.toggle('selected');
}

function checkTutoStep(tutoId, stepIdx) {
  const tuto = TUTORIALS.find(t => t.id === tutoId);
  const step = tuto.steps[stepIdx];
  const state = loadTutoState(tutoId);
  if (!state.completed) state.completed = [];
  if (!state.answers) state.answers = {};
  if (!state.firstTry) state.firstTry = {};

  let userAnswer;
  let isCorrect = false;

  if (step.type === 'input') {
    const input = document.getElementById('tuto-input-' + tutoId + '-' + stepIdx);
    userAnswer = input.value.trim();
    isCorrect = userAnswer === step.answer;
  } else if (step.type === 'options') {
    const selected = document.querySelector('#tuto-step-' + tutoId + '-' + stepIdx + ' .tuto-opt.selected');
    userAnswer = selected ? selected.textContent.trim() : '';
    isCorrect = userAnswer === step.answer;
  } else if (step.type === 'multi') {
    const selectedEls = document.querySelectorAll('#tuto-multi-' + tutoId + '-' + stepIdx + ' .tuto-opt.selected');
    userAnswer = Array.from(selectedEls).map(el => el.textContent.trim());
    isCorrect = userAnswer.length === step.answer.length && step.answer.every(a => userAnswer.includes(a));
  }

  const fb = document.getElementById('tuto-fb-' + tutoId + '-' + stepIdx);

  if (isCorrect) {
    state.answers[stepIdx] = userAnswer;
    if (state.firstTry[stepIdx] === undefined) state.firstTry[stepIdx] = true;
    state.completed.push(stepIdx);
    saveTutoState(tutoId, state);
    renderTutoSteps(tuto, state);
    const nextStep = document.getElementById('tuto-step-' + tutoId + '-' + (stepIdx + 1));
    if (nextStep) setTimeout(() => nextStep.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
  } else {
    if (state.firstTry[stepIdx] === undefined) state.firstTry[stepIdx] = false;
    saveTutoState(tutoId, state);
    fb.className = 'tuto-feedback show ko';
    fb.innerHTML = step.feedback_ko;
    if (step.type === 'options') {
      const opts = document.querySelectorAll('#tuto-step-' + tutoId + '-' + stepIdx + ' .tuto-opt');
      opts.forEach(o => {
        if (o.textContent.trim() === step.answer) o.classList.add('correct-opt');
        else if (o.classList.contains('selected')) o.classList.add('wrong-opt');
      });
    }
  }
}

