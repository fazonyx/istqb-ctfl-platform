'use strict';

function toggleProgSection(header) {
  const body = header.nextElementSibling;
  const arrow = header.querySelector('.prog-arrow');
  body.classList.toggle('collapsed');
  arrow.classList.toggle('open');
}


function toggleGraphExpand(btn) {
  const card = btn.closest('.graph-card');
  card.classList.toggle('expanded');
  btn.textContent = card.classList.contains('expanded') ? 'Reduire' : 'Agrandir';
}


function toggleChapterExpand(btn) {
  const card = btn.closest('.chapter-detail-card');
  card.classList.toggle('ch-expanded');
  btn.textContent = card.classList.contains('ch-expanded') ? 'Reduire' : 'Agrandir';
}


function showHeatmapPopup(lo, event) {
  const popup = document.getElementById('heatmapPopup');
  const desc = LO_DESCRIPTIONS[lo] || lo;
  const data = loTotalsGlobal[lo];
  const pct = data ? Math.round(data.c / data.t * 100) : -1;
  const tested = data ? data.t : 0;
  const correct = data ? data.c : 0;

  let html = '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">';
  html += '<div>';
  html += '<strong>' + lo + '</strong> - ' + desc + '<br>';
  html += '<span style="font-size:0.85rem;color:#64748b;">' + (tested > 0 ? pct + '% (' + correct + '/' + tested + ' correct)' : 'Jamais teste') + '</span>';
  if (tested > 0) {
    html += '<div style="margin-top:6px;width:120px;height:10px;background:#e2e8f0;border-radius:5px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + (pct >= 65 ? '#16a34a' : pct >= 50 ? '#eab308' : '#dc2626') + ';border-radius:5px;"></div></div>';
  }
  html += '</div>';
  html += '<div style="margin-left:auto;display:flex;gap:8px;">';
  html += '<button class="btn-practice" onclick="openFicheForLO(\'' + lo + '\')">Revoir la fiche</button>';
  html += '<button class="btn-practice" style="background:#2563eb;" onclick="startLOQuiz(\'' + lo + '\')">S\'entrainer</button>';
  html += '<button class="btn-practice" style="background:#94a3b8;" onclick="document.getElementById(\'heatmapPopup\').style.display=\'none\'">Fermer</button>';
  html += '</div></div>';

  popup.innerHTML = html;
  popup.style.display = 'block';
}


function toggleReport(idx) {
  const el = document.getElementById('report-detail-' + idx);
  if (el.style.display === 'none') {
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

function renderProgression() {
  const all = getAllHistory();
  const container = document.getElementById('progressDashboard');
  const hasData = all.length > 0;

  // ===== HELPERS =====
  function heatColor(pct) {
    if (pct < 0) return '#e2e8f0';
    if (pct <= 50) {
      const r = 220, g = Math.round(38 + (179-38) * pct/50), b = Math.round(38 + (8-38) * pct/50);
      return `rgb(${r},${g},${b})`;
    } else {
      const r = Math.round(234 + (22-234) * (pct-50)/50), g = Math.round(179 + (163-179) * (pct-50)/50), b = Math.round(8 + (74-8) * (pct-50)/50);
      return `rgb(${r},${g},${b})`;
    }
  }
  function scoreBadgeColor(pct) {
    if (pct >= 65) return '#16a34a';
    if (pct >= 50) return '#eab308';
    return '#dc2626';
  }
  function scoreClass(pct) {
    if (pct >= 65) return 'good';
    if (pct >= 50) return 'medium';
    return 'bad';
  }
  function emptyOverlay(text) {
    return `<div class="dash-empty-label">${text}</div>`;
  }

  // ===== DATA COMPUTATION =====
  const totalAttempts = hasData ? all.length : 0;
  const totalQuestions = hasData ? all.reduce((s, a) => s + a.total, 0) : 0;
  const totalCorrect = hasData ? all.reduce((s, a) => s + a.score, 0) : 0;
  const avgPct = hasData ? Math.round(totalCorrect / totalQuestions * 100) : 0;
  const passCount = hasData ? all.filter(a => a.pct >= 65).length : 0;
  const bestPct = hasData ? Math.max(...all.map(a => a.pct)) : 0;

  const chTotals = {};
  const chTrends = {};
  all.forEach(a => {
    if (!a.chapters) return;
    Object.entries(a.chapters).forEach(([ch, s]) => {
      if (!chTotals[ch]) chTotals[ch] = {t:0, c:0};
      chTotals[ch].t += s.t;
      chTotals[ch].c += s.c;
      if (!chTrends[ch]) chTrends[ch] = [];
      if (s.t > 0) chTrends[ch].push({date: a.date, pct: Math.round(s.c / s.t * 100)});
    });
  });

  const loTotals = {};
  all.forEach(a => {
    if (!a.loScores) return;
    Object.entries(a.loScores).forEach(([lo, s]) => {
      if (!loTotals[lo]) loTotals[lo] = {t:0, c:0};
      loTotals[lo].t += s.t;
      loTotals[lo].c += s.c;
    });
  });
  loTotalsGlobal = loTotals;

  const LO_MAP = {
    1: ['FL-1.1.1','FL-1.2.1','FL-1.2.2','FL-1.2.3','FL-1.3.1','FL-1.4.1','FL-1.4.2','FL-1.4.3','FL-1.4.4','FL-1.4.5','FL-1.5.1','FL-1.5.2','FL-1.5.3'],
    2: ['FL-2.1.1','FL-2.1.2','FL-2.1.3','FL-2.1.4','FL-2.1.5','FL-2.1.6','FL-2.2.1','FL-2.2.2','FL-2.2.3','FL-2.3.1'],
    3: ['FL-3.1.1','FL-3.1.2','FL-3.1.3','FL-3.2.1','FL-3.2.2','FL-3.2.3','FL-3.2.4','FL-3.2.5'],
    4: ['FL-4.1.1','FL-4.2.1','FL-4.2.2','FL-4.2.3','FL-4.2.4','FL-4.3.1','FL-4.3.2','FL-4.3.3','FL-4.4.1','FL-4.4.2','FL-4.4.3','FL-4.5.1','FL-4.5.2','FL-4.5.3'],
    5: ['FL-5.1.1','FL-5.1.2','FL-5.1.3','FL-5.1.4','FL-5.1.5','FL-5.1.6','FL-5.1.7','FL-5.2.1','FL-5.2.2','FL-5.2.3','FL-5.2.4','FL-5.3.1','FL-5.3.2','FL-5.3.3','FL-5.4.1','FL-5.5.1'],
    6: ['FL-6.1.1','FL-6.2.1']
  };

  const CH_COLORS = {1:'#60a5fa',2:'#f472b6',3:'#fb923c',4:'#facc15',5:'#34d399',6:'#a78bfa'};

  // Trend indicator: compare last 3 vs first 3 attempts avg score
  let trendLabel = 'Stable';
  let trendColor = '#64748b';
  let trendArrow = '&#8596;';
  if (all.length >= 6) {
    const first3avg = all.slice(0, 3).reduce((s, a) => s + a.pct, 0) / 3;
    const last3avg = all.slice(-3).reduce((s, a) => s + a.pct, 0) / 3;
    if (last3avg > first3avg + 3) { trendLabel = 'En progression'; trendColor = '#16a34a'; trendArrow = '&#8599;'; }
    else if (last3avg < first3avg - 3) { trendLabel = 'En baisse'; trendColor = '#dc2626'; trendArrow = '&#8600;'; }
  }

  let html = '';
  const overlayCls = hasData ? '' : 'dash-empty-overlay';

  // ========== SECTION 1: SCORE BANNER ==========
  html += `<div class="score-banner ${overlayCls}" style="position:relative;">`;
  html += `<div class="score-banner-main">
    <div class="sb-pct" style="color:${hasData ? scoreBadgeColor(avgPct) : '#cbd5e1'}">${hasData ? avgPct + '%' : '--%'}</div>
    <div class="sb-label">Score Moyen</div>
  </div>`;
  html += '<div class="score-banner-stats">';
  html += `<div class="score-banner-stat"><div class="sbs-num" style="color:${hasData ? '#1e3a5f' : '#cbd5e1'}">${totalAttempts}</div><div class="sbs-label">Quiz passes</div></div>`;
  html += `<div class="score-banner-stat"><div class="sbs-num" style="color:${hasData ? '#1e3a5f' : '#cbd5e1'}">${totalQuestions}</div><div class="sbs-label">Questions repondues</div></div>`;
  html += `<div class="score-banner-stat"><div class="sbs-num" style="color:${hasData ? '#16a34a' : '#cbd5e1'}">${passCount}</div><div class="sbs-label">Reussis (>=65%)</div></div>`;
  html += `<div class="score-banner-stat"><div class="sbs-num" style="color:${hasData ? '#2563eb' : '#cbd5e1'}">${hasData ? bestPct + '%' : '--%'}</div><div class="sbs-label">Meilleur</div></div>`;
  html += '</div>';
  if (hasData && all.length >= 6) {
    html += `<div class="score-banner-trend" style="color:${trendColor}"><span>${trendArrow}</span> ${trendLabel}</div>`;
  }
  if (!hasData) html += emptyOverlay('Passez un quiz pour debloquer');
  html += '</div>';

  // ========== SECTION 2: EVOLUTION GLOBALE (all 3 graphs merged) ==========
  html += '<div class="prog-section">';
  html += `<div class="prog-section-header" onclick="toggleProgSection(this)">
    <div style="display:flex;align-items:center;"><h3>Evolution globale</h3><span class="prog-subtitle">Scores par chapitre, tendances et analyse des erreurs dans le temps</span></div>
    <span class="prog-arrow open">&#9654;</span>
  </div>`;
  html += `<div class="prog-section-body">`;

  // 2 graphs side by side
  html += '<div class="graph-row" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">';

  // Graph 1: Score Moyen par Chapitre (bar chart)
  html += `<div class="graph-card ${overlayCls}" style="position:relative;">`;
  html += '<button class="graph-expand-btn" onclick="toggleGraphExpand(this)">Agrandir</button>';
  html += '<h4>Score Moyen par Chapitre</h4>';
  html += '<div class="graph-legend-text">Moyenne cumulee de vos scores par chapitre. La ligne rouge pointillee indique le seuil de reussite (65%).</div>';
  {
    const W = 500, H = 280, PAD_L = 40, PAD_B = 35, PAD_T = 15, PAD_R = 15;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;
    const barW = chartW / 6 * 0.55;
    const gap = chartW / 6;
    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">`;
    for (let p = 0; p <= 100; p += 25) {
      const y = PAD_T + chartH * (1 - p / 100);
      svg += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/>`;
      svg += `<text x="${PAD_L-4}" y="${y+3}" text-anchor="end" fill="#94a3b8" font-size="9">${p}%</text>`;
    }
    const y65 = PAD_T + chartH * (1 - 65/100);
    svg += `<line x1="${PAD_L}" y1="${y65}" x2="${W-PAD_R}" y2="${y65}" stroke="#dc2626" stroke-width="1" stroke-dasharray="4,3"/>`;
    for (let i = 1; i <= 6; i++) {
      const x = PAD_L + (i - 0.5) * gap - barW / 2;
      const data = chTotals[String(i)];
      const pct = data ? Math.round(data.c / data.t * 100) : 0;
      const barH = hasData ? chartH * pct / 100 : chartH * 0.15;
      const barColor = hasData ? CH_COLORS[i] : '#e2e8f0';
      svg += `<rect x="${x}" y="${PAD_T + chartH - barH}" width="${barW}" height="${barH}" rx="4" fill="${barColor}"/>`;
      if (hasData) svg += `<text x="${x + barW/2}" y="${PAD_T + chartH - barH - 4}" text-anchor="middle" fill="#1e293b" font-size="9" font-weight="700">${pct}%</text>`;
      svg += `<text x="${PAD_L + (i - 0.5) * gap}" y="${H - PAD_B + 14}" text-anchor="middle" fill="#64748b" font-size="9">CH-${i}</text>`;
    }
    svg += '</svg>';
    html += svg;
  }
  if (!hasData) html += emptyOverlay('Passez un quiz pour debloquer');
  html += '</div>';

  // Graph 2: Tendance de Performance par Chapitre (multi-line chart)
  html += `<div class="graph-card ${overlayCls}" style="position:relative;">`;
  html += '<button class="graph-expand-btn" onclick="toggleGraphExpand(this)">Agrandir</button>';
  html += '<h4>Tendance de Performance par Chapitre</h4>';
  html += '<div class="graph-legend-text">Evolution de vos scores par chapitre au fil du temps. Chaque ligne represente un chapitre.</div>';
  {
    const W = 500, H = 250, PAD_L = 40, PAD_B = 45, PAD_T = 15, PAD_R = 15;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;
    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">`;
    for (let p = 0; p <= 100; p += 25) {
      const y = PAD_T + chartH * (1 - p / 100);
      svg += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/>`;
      svg += `<text x="${PAD_L-4}" y="${y+3}" text-anchor="end" fill="#94a3b8" font-size="8">${p}%</text>`;
    }
    const y65 = PAD_T + chartH * (1 - 65/100);
    svg += `<line x1="${PAD_L}" y1="${y65}" x2="${W-PAD_R}" y2="${y65}" stroke="#dc2626" stroke-width="1" stroke-dasharray="4,3"/>`;

    let allDates = [];
    for (let ch = 1; ch <= 6; ch++) {
      if (chTrends[String(ch)]) chTrends[String(ch)].forEach(d => { if (!allDates.includes(d.date)) allDates.push(d.date); });
    }
    allDates.sort();

    if (hasData && allDates.length >= 2) {
      const showEvery = Math.max(1, Math.floor(allDates.length / 6));
      allDates.forEach((dt, i) => {
        if (i % showEvery === 0 || i === allDates.length - 1) {
          const d = new Date(dt);
          const x = PAD_L + (i / (allDates.length - 1)) * chartW;
          svg += `<text x="${x}" y="${H - PAD_B + 14}" text-anchor="middle" fill="#94a3b8" font-size="7.5">${d.getDate()}/${d.getMonth()+1}</text>`;
        }
      });
      for (let ch = 1; ch <= 6; ch++) {
        const data = chTrends[String(ch)];
        if (!data || data.length < 2) continue;
        const color = CH_COLORS[ch];
        const points = data.map(d => {
          const xi = allDates.indexOf(d.date);
          return { x: PAD_L + (xi / (allDates.length - 1)) * chartW, y: PAD_T + chartH * (1 - d.pct / 100) };
        });
        const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`).join(' ');
        svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="2" opacity="0.9"/>`;
        points.forEach(p => { svg += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}" stroke="white" stroke-width="1"/>`; });
      }
    } else {
      svg += `<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="#94a3b8" font-size="10">Completez un quiz pour voir votre evolution</text>`;
    }
    svg += '</svg>';
    html += svg;

    // Legend below graph
    html += '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;justify-content:center;">';
    for (let ch = 1; ch <= 6; ch++) {
      html += `<span style="display:flex;align-items:center;gap:4px;font-size:0.75rem;color:#475569;">
        <span style="width:10px;height:10px;border-radius:50%;background:${CH_COLORS[ch]};display:inline-block;"></span>Ch.${ch}
      </span>`;
    }
    html += '</div>';
  }
  if (!hasData) html += emptyOverlay('Passez un quiz pour debloquer');
  html += '</div>';

  html += '</div>'; // end graph-row (2 graphs side by side)

  // Graph 3: Multi-score evolution (full width)
  {
    const evoOverlay = !hasData || all.length < 2 ? 'dash-empty-overlay' : '';
    html += `<div class="graph-card ${evoOverlay}" style="position:relative;margin-top:8px;">`;
    html += '<button class="graph-expand-btn" onclick="toggleGraphExpand(this)">Agrandir</button>';
    html += '<h4>Evolution multi-scores</h4>';
    html += '<div class="graph-legend-text">Score global, examens, entrainements, inattention et lacunes dans le temps</div>';
    const W = 800, H = 280, PAD_L = 45, PAD_B = 35, PAD_T = 15, PAD_R = 15;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;
    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">`;
    for (let p = 0; p <= 100; p += 25) {
      const y = PAD_T + chartH * (1 - p / 100);
      svg += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/>`;
      svg += `<text x="${PAD_L-6}" y="${y+4}" text-anchor="end" fill="#94a3b8" font-size="9">${p}%</text>`;
    }
    const y65 = PAD_T + chartH * (1 - 65/100);
    svg += `<line x1="${PAD_L}" y1="${y65}" x2="${W-PAD_R}" y2="${y65}" stroke="#dc2626" stroke-width="1" stroke-dasharray="5,4"/>`;
    svg += `<text x="${W-PAD_R+2}" y="${y65+4}" fill="#dc2626" font-size="7">65%</text>`;

    if (hasData && all.length >= 2) {
      const n = all.length;
      const scoreGlobal = all.map(a => a.pct);
      const examScores = all.map(a => a.mode && a.mode.startsWith('exam') ? a.pct : null);
      const trainScores = all.map(a => {
        const trainModes = ['random','chapter','weakpoints','wrong','realistic','mini'];
        return (a.mode && trainModes.some(m => a.mode.startsWith(m) || a.mode.startsWith('ch') || a.mode === 'random_20' || a.mode === 'random_40')) ? a.pct : null;
      });
      const inattRates = all.map(a => a.errors ? (a.errors.inattention / a.total * 100) : null);
      const lacuneRates = all.map(a => a.errors ? (a.errors.lacune / a.total * 100) : null);

      const showEvery = Math.max(1, Math.floor(n / 10));
      all.forEach((a, i) => {
        if (i % showEvery === 0 || i === n - 1) {
          const d = new Date(a.date);
          const x = PAD_L + (i / (n - 1)) * chartW;
          svg += `<text x="${x}" y="${H - PAD_B + 14}" text-anchor="middle" fill="#94a3b8" font-size="7.5">${d.getDate()}/${d.getMonth()+1}</text>`;
        }
      });

      function plotLine(data, color, width, dashed) {
        const pts = [];
        data.forEach((v, i) => {
          if (v !== null) pts.push({ x: PAD_L + (i / (n - 1)) * chartW, y: PAD_T + chartH * (1 - v / 100) });
        });
        if (pts.length < 2) return;
        const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}"${dashed ? ' stroke-dasharray="6,4"' : ''}/>`;
        pts.forEach(p => { svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="${color}" stroke="white" stroke-width="0.8"/>`; });
      }

      plotLine(scoreGlobal, '#2563eb', 2.5, false);
      plotLine(examScores, '#1e3a5f', 1.8, true);
      plotLine(trainScores, '#0d9488', 1.8, true);
      plotLine(inattRates, '#f59e0b', 1.5, false);
      plotLine(lacuneRates, '#dc2626', 1.5, false);
    } else {
      svg += `<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="#94a3b8" font-size="11">Completez au moins 2 quiz pour voir l'evolution</text>`;
    }
    svg += '</svg>';
    html += svg;

    html += '<div class="evo-legend">';
    const legendItems = [
      {color:'#2563eb', label:'Score global'},
      {color:'#1e3a5f', label:'Examens blancs', dashed:true},
      {color:'#0d9488', label:'Entrainements', dashed:true},
      {color:'#f59e0b', label:"Taux d'inattention"},
      {color:'#dc2626', label:'Taux de lacunes'}
    ];
    legendItems.forEach(it => {
      const style = it.dashed ? `background:repeating-linear-gradient(90deg,${it.color} 0,${it.color} 4px,transparent 4px,transparent 7px);` : `background:${it.color};`;
      html += `<span class="evo-legend-item"><span class="evo-legend-dot" style="${style}"></span>${it.label}</span>`;
    });
    html += '</div>';
    if (!hasData || all.length < 2) html += emptyOverlay('Completez au moins 2 quiz pour debloquer');
    html += '</div>'; // end graph-card (multi-score)
  }

  html += '</div>'; // end prog-section-body
  html += '</div>'; // end prog-section

  // ========== SECTION 3: HEATMAP (collapsible) ==========
  html += '<div class="prog-section">';
  html += `<div class="prog-section-header" onclick="toggleProgSection(this)">
    <div style="display:flex;align-items:center;"><h3>Carte thermique de performance</h3><span class="prog-subtitle">Performance par objectif d'apprentissage</span></div>
    <span class="prog-arrow open">&#9654;</span>
  </div>`;
  html += `<div class="prog-section-body">`;
  html += `<div class="${overlayCls}" style="position:relative;">`;

  for (let ch = 1; ch <= 6; ch++) {
    const chData = chTotals[String(ch)];
    const chPct = chData ? Math.round(chData.c / chData.t * 100) : -1;
    const badgeCol = chPct >= 0 ? scoreBadgeColor(chPct) : '#94a3b8';

    html += '<div class="heatmap-row">';
    html += `<div class="heatmap-chapter">${CHAPTER_NAMES[ch]}</div>`;
    html += `<div class="heatmap-avg" style="background:${badgeCol}">${chPct >= 0 ? chPct + '%' : '--'}</div>`;
    html += '<div class="heatmap-squares">';

    const los = LO_MAP[ch] || [];
    los.forEach(loKey => {
      const shortNum = loKey.replace('FL-','');
      const data = loTotals[loKey];
      const desc = LO_DESCRIPTIONS[loKey] || loKey;
      if (!data) {
        html += `<div class="heatmap-sq" style="background:#e2e8f0;color:#94a3b8;cursor:pointer;" title="${desc} - Non teste" onclick="showHeatmapPopup('${loKey}', event)">${shortNum}</div>`;
      } else {
        const pct = Math.round(data.c / data.t * 100);
        html += `<div class="heatmap-sq" style="background:${heatColor(pct)};cursor:pointer;" title="${desc} - ${pct}%" onclick="showHeatmapPopup('${loKey}', event)">${shortNum}</div>`;
      }
    });

    html += '</div></div>';
  }

  html += '<div class="heatmap-scale"><span style="font-size:0.75rem;color:#64748b;">0%</span><div class="heatmap-scale-bar"></div><span style="font-size:0.75rem;color:#64748b;">100%</span></div>';
  html += '<div id="heatmapPopup" class="heatmap-popup" style="display:none;"></div>';
  if (!hasData) html += emptyOverlay('Passez un quiz pour debloquer');
  html += '</div>'; // end overlayCls wrapper
  html += '</div>'; // end prog-section-body
  html += '</div>'; // end prog-section

  // ========== SECTION 4: DETAIL PAR CHAPITRE (collapsible) ==========
  html += '<div class="prog-section">';
  html += `<div class="prog-section-header" onclick="toggleProgSection(this)">
    <div style="display:flex;align-items:center;"><h3>Detail par chapitre</h3><span class="prog-subtitle">Scores, tendances et objectifs pour chaque chapitre</span></div>
    <span class="prog-arrow open">&#9654;</span>
  </div>`;
  html += `<div class="prog-section-body">`;
  html += '<div class="chapter-cards-grid">';

  for (let ch = 1; ch <= 6; ch++) {
    const chData = chTotals[String(ch)];
    const chPct = chData ? Math.round(chData.c / chData.t * 100) : 0;
    const trend = chTrends[String(ch)] || [];

    html += `<div class="chapter-detail-card ${overlayCls}" style="position:relative;">`;
    html += `<div class="chapter-detail-header">
      <h3>${CHAPTER_NAMES[ch]}</h3>
      <div style="display:flex;gap:8px;">
        <button class="btn-practice" onclick="startQuiz('ch${ch}')">Pratiquer ce Chapitre</button>
        <button class="btn-practice" style="background:#64748b;" onclick="toggleChapterExpand(this)">Agrandir</button>
      </div>
    </div>`;
    html += `<div style="font-size:0.82rem;color:#64748b;margin-bottom:4px;">Score Moyen</div>`;
    html += `<div style="font-size:2.2rem;font-weight:800;color:${hasData ? scoreBadgeColor(chPct) : '#cbd5e1'};margin-bottom:12px;">${hasData ? chPct + '%' : '0%'}</div>`;

    html += '<div class="chapter-detail-cols">';

    // Left: Trend mini chart
    html += '<div>';
    html += '<div class="mini-chart-title">Tendance de Performance au Fil du Temps</div>';
    {
      const W = 180, H = 90, P = 20;
      let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">`;
      for (let p = 0; p <= 100; p += 50) {
        const y = P + (H - P*2) * (1 - p/100);
        svg += `<line x1="${P}" y1="${y}" x2="${W-P}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/>`;
        svg += `<text x="${P-3}" y="${y+3}" text-anchor="end" fill="#94a3b8" font-size="6">${p}</text>`;
      }
      const y65 = P + (H - P*2) * (1 - 65/100);
      svg += `<line x1="${P}" y1="${y65}" x2="${W-P}" y2="${y65}" stroke="#dc2626" stroke-width="0.7" stroke-dasharray="3,2"/>`;
      if (trend.length >= 2) {
        const cW = W - P*2, cH = H - P*2;
        const pts = trend.map((d, i) => ({ x: P + (i / (trend.length - 1)) * cW, y: P + cH * (1 - d.pct / 100) }));
        const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`).join(' ');
        svg += `<path d="${path}" fill="none" stroke="${CH_COLORS[ch]}" stroke-width="1.8"/>`;
        pts.forEach(p => { svg += `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="${CH_COLORS[ch]}" stroke="white" stroke-width="1"/>`; });
      } else {
        svg += `<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="#94a3b8" font-size="7">Pas assez de donnees</text>`;
      }
      svg += '</svg>';
      html += svg;
    }
    html += '</div>';

    // Right: LO horizontal bars
    html += '<div>';
    html += '<div class="mini-chart-title">Performance par Objectif d\'Apprentissage</div>';
    const los = LO_MAP[ch] || [];
    los.forEach(loKey => {
      const shortNum = loKey.replace('FL-','');
      const data = loTotals[loKey];
      const pct = data ? Math.round(data.c / data.t * 100) : 0;
      const col = data ? heatColor(pct) : '#e2e8f0';
      const pctLabel = data ? `${pct}%` : '--';
      const textCol = data ? (pct >= 65 ? '#16a34a' : pct >= 50 ? '#eab308' : '#dc2626') : '#94a3b8';
      html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
        <div style="font-size:0.7rem;font-weight:600;color:#475569;min-width:38px;text-align:right;">${shortNum}</div>
        <div style="flex:1;height:12px;background:#e2e8f0;border-radius:6px;overflow:hidden;"><div style="height:100%;border-radius:6px;width:${data ? pct : 0}%;background:${col}"></div></div>
        <div style="font-size:0.7rem;font-weight:700;min-width:30px;color:${textCol}">${pctLabel}</div>
      </div>`;
    });
    html += '<div style="display:flex;align-items:center;gap:6px;margin-top:8px;"><span style="font-size:0.65rem;color:#94a3b8;">0%</span><div style="flex:1;height:6px;border-radius:3px;background:linear-gradient(90deg,#dc2626,#eab308,#16a34a);"></div><span style="font-size:0.65rem;color:#94a3b8;">100%</span></div>';
    html += '</div>'; // end right col

    html += '</div>'; // end chapter-detail-cols
    if (!hasData) html += emptyOverlay('Passez un quiz pour debloquer');
    html += '</div>'; // end chapter-detail-card
  }
  html += '</div>'; // end chapter-cards-grid
  html += '</div>'; // end prog-section-body
  html += '</div>'; // end prog-section

  // ========== SECTION 5: ERROR ANALYSIS (collapsible) ==========
  html += '<div class="prog-section">';
  html += `<div class="prog-section-header" onclick="toggleProgSection(this)">
    <div style="display:flex;align-items:center;"><h3>Analyse des erreurs</h3><span class="prog-subtitle">Inattention, lacunes et questions problematiques</span></div>
    <span class="prog-arrow open">&#9654;</span>
  </div>`;
  html += `<div class="prog-section-body">`;

  // Compute error totals from history entries that have errors field
  let totalInattention = 0, totalLacune = 0, totalNonRepondu = 0;
  let entriesWithErrors = 0;
  all.forEach(a => {
    if (a.errors) {
      totalInattention += a.errors.inattention || 0;
      totalLacune += a.errors.lacune || 0;
      totalNonRepondu += a.errors.nonRepondu || 0;
      entriesWithErrors++;
    }
  });
  const avgInattention = entriesWithErrors > 0 ? (totalInattention / all.filter(a=>a.errors).reduce((s,a)=>s+a.total,0) * 100) : 0;
  const avgLacune = entriesWithErrors > 0 ? (totalLacune / all.filter(a=>a.errors).reduce((s,a)=>s+a.total,0) * 100) : 0;

  // Evolution: compare last 3 vs first 3
  let evolutionLabel = 'Stable';
  let evolutionColor = '#64748b';
  let evolutionArrow = '&#8596;';
  const errEntries = all.filter(a => a.errors);
  if (errEntries.length >= 6) {
    const first3 = errEntries.slice(0, 3);
    const last3 = errEntries.slice(-3);
    const first3rate = first3.reduce((s,a) => s + (a.errors.inattention + a.errors.lacune), 0) / first3.reduce((s,a) => s + a.total, 0);
    const last3rate = last3.reduce((s,a) => s + (a.errors.inattention + a.errors.lacune), 0) / last3.reduce((s,a) => s + a.total, 0);
    if (last3rate < first3rate - 0.05) { evolutionLabel = 'En baisse'; evolutionColor = '#16a34a'; evolutionArrow = '&#8600;'; }
    else if (last3rate > first3rate + 0.05) { evolutionLabel = 'En hausse'; evolutionColor = '#dc2626'; evolutionArrow = '&#8599;'; }
  }

  const emptyStatStyle = !hasData ? 'color:#cbd5e1' : '';
  html += '<div class="error-stat-grid">';
  html += `<div class="error-stat" style="background:#fef3c7;"><div class="es-num" style="${emptyStatStyle || 'color:#f59e0b'}">${hasData ? totalInattention : '0'}</div><div class="es-label">Erreurs d'inattention</div></div>`;
  html += `<div class="error-stat" style="background:#fee2e2;"><div class="es-num" style="${emptyStatStyle || 'color:#dc2626'}">${hasData ? totalLacune : '0'}</div><div class="es-label">Lacunes</div></div>`;
  html += `<div class="error-stat" style="background:#f1f5f9;"><div class="es-num" style="${emptyStatStyle || 'color:#64748b'}">${hasData ? totalNonRepondu : '0'}</div><div class="es-label">Non repondues</div></div>`;
  html += `<div class="error-stat" style="background:#fef3c7;"><div class="es-num" style="${emptyStatStyle || 'color:#f59e0b'}">${hasData ? avgInattention.toFixed(1) + '%' : '0%'}</div><div class="es-label">Taux d'inattention moyen</div></div>`;
  html += `<div class="error-stat" style="background:#fee2e2;"><div class="es-num" style="${emptyStatStyle || 'color:#dc2626'}">${hasData ? avgLacune.toFixed(1) + '%' : '0%'}</div><div class="es-label">Taux de lacune moyen</div></div>`;
  html += `<div class="error-stat" style="background:#f0fdf4;"><div class="es-num" style="color:${evolutionColor}">${evolutionArrow}</div><div class="es-label">${evolutionLabel}</div></div>`;
  html += '</div>';

  // Top 10 des questions les plus ratees
  html += '<h3 style="font-size:1rem;font-weight:700;color:#1e3a5f;margin:20px 0 12px;">Top 10 des questions les plus ratees</h3>';
  const wq = getWrongQuestions();
  const wqEntries = Object.entries(wq).sort((a, b) => b[1].wrong - a[1].wrong).slice(0, 10);
  if (wqEntries.length > 0) {
    wqEntries.forEach(([qId, data], idx) => {
      const qObj = ALL_QUESTIONS.find(q => q.id === qId);
      const lo = qObj ? qObj.lo || '' : '';
      const ch = qObj ? qObj.chapter : '';
      const chName = ch ? (CHAPTER_NAMES[ch] || 'Ch.' + ch) : '';
      html += `<div class="worst-question">
        <span class="wq-rank">#${idx + 1}</span>
        <span class="wq-id">${qId}</span>
        ${lo ? `<span class="wq-lo">${lo}</span>` : ''}
        <span style="font-size:0.8rem;color:#475569;">${chName}</span>
        <span class="wq-stats">Ratee ${data.wrong} fois, reussie ${data.right || 0} fois</span>
        ${lo ? `<span class="wq-link" onclick="openFicheForLO('${lo}')">Revoir la fiche</span>` : ''}
      </div>`;
    });
  } else {
    html += '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:0.9rem;">Aucune question ratee pour le moment</div>';
  }

  // Objectifs a travailler
  html += '<h3 style="font-size:1rem;font-weight:700;color:#1e3a5f;margin:24px 0 12px;">Objectifs a travailler</h3>';
  const problematicLOs = Object.entries(loTotals)
    .filter(([lo, d]) => d.t >= 2 && Math.round(d.c / d.t * 100) < 50)
    .map(([lo, d]) => ({ lo, pct: Math.round(d.c / d.t * 100), t: d.t, c: d.c }))
    .sort((a, b) => a.pct - b.pct);

  if (problematicLOs.length > 0) {
    problematicLOs.forEach(item => {
      const desc = LO_DESCRIPTIONS[item.lo] || item.lo;
      const barCol = item.pct < 30 ? '#dc2626' : '#f59e0b';
      html += `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:10px 14px;background:#f8fafc;border-radius:10px;border-left:4px solid ${barCol};">
        <span style="font-weight:700;color:#1e293b;min-width:80px;">${item.lo}</span>
        <span style="flex:1;font-size:0.82rem;color:#475569;">${desc}</span>
        <div style="width:80px;height:10px;background:#e2e8f0;border-radius:5px;overflow:hidden;"><div style="height:100%;width:${item.pct}%;background:${barCol};border-radius:5px;"></div></div>
        <span style="font-size:0.82rem;font-weight:700;color:${barCol};min-width:40px;">${item.pct}%</span>
        <span class="wq-link" onclick="openFicheForLO('${item.lo}')">Revoir la fiche</span>
      </div>`;
    });
  } else {
    html += '<div style="text-align:center;padding:20px;color:#16a34a;font-size:0.9rem;font-weight:600;">Aucun objectif problematique - continuez comme ca !</div>';
  }

  html += '</div>'; // end prog-section-body
  html += '</div>'; // end prog-section

  // ========== SECTION 6: HISTORY (collapsible) ==========
  html += '<div class="prog-section">';
  html += `<div class="prog-section-header" onclick="toggleProgSection(this)">
    <div style="display:flex;align-items:center;"><h3>Historique des soumissions</h3><span class="prog-subtitle">Toutes vos tentatives</span></div>
    <span class="prog-arrow open">&#9654;</span>
  </div>`;
  html += `<div class="prog-section-body">`;

  if (hasData) {
    const reversed = [...all].reverse();
    reversed.forEach((a, idx) => {
      const d = new Date(a.date);
      const dateStr = String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear() + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
      const scCol = a.pct >= 65 ? '#16a34a' : '#dc2626';
      const hasReport = !!(a.report && a.report.length > 0);
      html += `<div class="submission-row" style="flex-wrap:wrap;">
        <div>
          <div class="submission-label">${a.label}</div>
          <div class="submission-date">Soumis le : ${dateStr}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="submission-score" style="color:${scCol}">${a.pct}%</div>
          ${hasReport ? `<button class="btn-practice" style="font-size:0.78rem;padding:5px 12px;" onclick="toggleReport(${idx})">Voir le rapport</button>` : ''}
        </div>
      </div>`;
      if (hasReport) {
        const rep = a.report;
        const repCorrect = rep.filter(r => r.correct).length;
        const repTotal = rep.length;
        const repPct = Math.round(repCorrect / repTotal * 100);
        // Per-chapter breakdown
        const repCh = {};
        rep.forEach(r => {
          if (!repCh[r.chapter]) repCh[r.chapter] = {t:0, c:0};
          repCh[r.chapter].t++;
          if (r.correct) repCh[r.chapter].c++;
        });
        // Errors
        const repWrong = rep.filter(r => !r.correct);
        let repInatt = 0, repLac = 0, repNR = 0;
        repWrong.forEach(r => {
          if (!r.selected || r.selected.length === 0) repNR++;
          else if (r.kl === 'K1' || r.selected.some(s => r.correctAnswer && r.correctAnswer.includes(s))) repInatt++;
          else repLac++;
        });

        html += `<div id="report-detail-${idx}" class="report-detail" style="display:none;">`;
        html += `<div style="margin-bottom:10px;"><strong>Score : ${repCorrect}/${repTotal} (${repPct}%)</strong></div>`;
        html += '<div style="margin-bottom:10px;">';
        Object.entries(repCh).sort((a,b) => Number(a[0]) - Number(b[0])).forEach(([ch, s]) => {
          const chPct = Math.round(s.c / s.t * 100);
          const chCol = chPct >= 65 ? '#16a34a' : chPct >= 50 ? '#eab308' : '#dc2626';
          html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:0.82rem;font-weight:600;min-width:60px;">Ch.${ch}</span>
            <div style="flex:1;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;"><div class="rd-chapter-bar" style="width:${chPct}%;background:${chCol};height:8px;"></div></div>
            <span style="font-size:0.82rem;font-weight:700;color:${chCol};min-width:50px;">${chPct}% (${s.c}/${s.t})</span>
          </div>`;
        });
        html += '</div>';
        html += `<div style="margin-bottom:10px;font-size:0.82rem;color:#64748b;">Erreurs : <span style="color:#f59e0b;font-weight:600;">${repInatt} inattention</span>, <span style="color:#dc2626;font-weight:600;">${repLac} lacunes</span>, <span style="color:#94a3b8;font-weight:600;">${repNR} non repondues</span></div>`;
        if (repWrong.length > 0) {
          html += '<div style="font-weight:600;margin-bottom:6px;">Questions incorrectes :</div>';
          repWrong.forEach(r => {
            const qObj = ALL_QUESTIONS.find(q => q.id === r.id);
            const qText = qObj ? (qObj.text || '').substring(0, 80) + (qObj.text && qObj.text.length > 80 ? '...' : '') : '';
            const correctLetters = r.correctAnswer ? r.correctAnswer.map(c => String.fromCharCode(65 + c)).join(', ') : '';
            html += `<div class="rd-wrong">
              <strong>${r.id}</strong> ${r.lo ? '(' + r.lo + ')' : ''} - Reponse correcte : ${correctLetters}
              ${qText ? '<br><span style="color:#64748b;">' + qText + '</span>' : ''}
            </div>`;
          });
        }
        html += '</div>';
      }
    });
  } else {
    html += '<div style="text-align:center;padding:30px;color:#94a3b8;font-size:0.9rem;">Aucune soumission pour le moment</div>';
  }

  html += '</div>'; // end prog-section-body
  html += '</div>'; // end prog-section

  container.innerHTML = html;
}

