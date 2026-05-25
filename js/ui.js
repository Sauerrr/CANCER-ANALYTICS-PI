// ════════════════════════════════════════════════════════════
//  ui.js — Renderização de componentes e resultados
//  Depende de: config.js, data.js, api.js, gradcam.js
// ════════════════════════════════════════════════════════════

// ─── HELPERS ─────────────────────────────────────────────────

function initials(name) {
  return name.split(' ').slice(0, 2).map(function(w) { return w[0]; }).join('').toUpperCase();
}

function formatDate(d) {
  var parts = d.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function statusBadge(status, result) {
  if (result === 'INCONCLUSIVO') return '<span class="badge warning"><span class="badge-dot"></span>Inconclusivo</span>';
  if (status === 'danger')       return '<span class="badge danger"><span class="badge-dot"></span>Positivo</span>';
  if (status === 'success')      return '<span class="badge success"><span class="badge-dot"></span>Negativo</span>';
  return '<span class="badge neutral"><span class="badge-dot"></span>—</span>';
}

function resultBadge(result) {
  if (result === 'POSITIVO') return '<span class="badge danger"><span class="badge-dot"></span>Positivo</span>';
  if (result === 'NEGATIVO') return '<span class="badge success"><span class="badge-dot"></span>Negativo</span>';
  return '<span class="badge warning"><span class="badge-dot"></span>Inconclusivo</span>';
}

// ─── DASHBOARD ────────────────────────────────────────────────

function renderDashboard() {
  var tbody  = document.getElementById('dashboard-recent');
  var recent = PATIENTS
    .flatMap(function(p) { return p.exams.map(function(e) { return Object.assign({}, e, { patient: p }); }); })
    .sort(function(a, b) { return b.date.localeCompare(a.date); })
    .slice(0, 6);

  tbody.innerHTML = recent.map(function(e) {
    return '<tr onclick="openPatient(\'' + e.patient.id + '\')">' +
      '<td><div style="display:flex;align-items:center;gap:10px">' +
        '<div style="width:30px;height:30px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--accent)">' +
          initials(e.patient.name) +
        '</div><span>' + e.patient.name + '</span></div></td>' +
      '<td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">' + formatDate(e.date) + '</td>' +
      '<td>' + resultBadge(e.result) + '</td>' +
      '<td style="font-family:var(--mono);font-size:12px">' + e.confidence.toFixed(1) + '%</td>' +
      '<td><button class="btn-row">Ver &rarr;</button></td>' +
    '</tr>';
  }).join('');
}

// ─── TABELA DE PACIENTES ──────────────────────────────────────

function renderPatientsTable() {
  var tbody = document.getElementById('patients-table-body');

  tbody.innerHTML = PATIENTS.map(function(p) {
    return '<tr onclick="openPatient(\'' + p.id + '\')">' +
      '<td><div style="display:flex;align-items:center;gap:10px">' +
        '<div style="width:32px;height:32px;border-radius:9px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--accent)">' +
          initials(p.name) +
        '</div><span>' + p.name + '</span></div></td>' +
      '<td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">' + p.id + '</td>' +
      '<td style="font-size:13px;color:var(--text-muted)">' + p.age + ' anos &middot; ' + (p.sex === 'F' ? 'Feminino' : 'Masculino') + '</td>' +
      '<td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">' + formatDate(p.last_exam) + '</td>' +
      '<td>' + statusBadge(p.status, p.exams[0] ? p.exams[0].result : '') + '</td>' +
      '<td style="font-family:var(--mono);font-size:12px">' + p.exams.length + '</td>' +
      '<td><button class="btn-row">Hist&oacute;rico &rarr;</button></td>' +
    '</tr>';
  }).join('');
}

// ─── RESULTADO DA ANÁLISE ─────────────────────────────────────

var STEPS = [
  ['Enviando imagem para o modelo...', 'Conectando à Inference API'],
  ['Pré-processando imagem...',        'Normalizando pixels'],
  ['Extraindo features...',            'Camadas convolucionais ativas'],
  ['Classificando células...',         'Forward pass — ' + HF_CONFIG.MODEL_DISPLAY_NAME],
  ['Gerando probabilidades...',        'Softmax layer']
];

/**
 * Orquestra a chamada à API e atualiza a UI com o resultado.
 */
function runAnalysis() {
  if (!uploadedFile) return;

  document.getElementById('btn-analyze').disabled         = true;
  document.getElementById('result-panel').classList.remove('show');
  document.getElementById('btn-export-pdf').style.display = 'none';
  gradcamData = null;

  var overlay = document.getElementById('analyzing-overlay');
  overlay.classList.add('show');

  var step         = 0;
  var stepInterval = setInterval(function() {
    if (step < STEPS.length) {
      document.getElementById('analyzing-text').textContent = STEPS[step][0];
      document.getElementById('analyzing-step').textContent = STEPS[step][1];
      step++;
    }
  }, 700);

  var apiCall = HF_CONFIG.USE_REAL_API
    ? callHuggingFaceAPI(uploadedFile)
    : mockAPIResponse().then(function(r) { return parseHFResponse(r); });

  apiCall
    .then(function(parsed) {
      clearInterval(stepInterval);
      overlay.classList.remove('show');
      document.getElementById('btn-analyze').disabled = false;
      renderResult(parsed);
    })
    .catch(function(err) {
      clearInterval(stepInterval);
      overlay.classList.remove('show');
      document.getElementById('btn-analyze').disabled = false;
      showAPIError(err);
    });
}

/**
 * Exibe erro amigável na UI quando a API falha.
 */
function showAPIError(err) {
  console.error('[HF] Erro na API:', err);
  document.getElementById('result-panel').classList.add('show');
  document.getElementById('result-icon').textContent      = '❌';
  document.getElementById('result-verdict').textContent   = 'Erro ao conectar ao modelo';
  document.getElementById('result-verdict').className     = 'result-verdict';
  document.getElementById('result-verdict').style.color   = 'var(--danger)';
  document.getElementById('result-sub').textContent       = 'Verifique MODEL_ID e API_KEY em js/config.js';
  document.getElementById('result-metrics').innerHTML     = '';
  document.getElementById('bar-leukemia').style.width     = '0%';
  document.getElementById('bar-leukemia-pct').textContent = '—';
  document.getElementById('bar-normal').style.width       = '0%';
  document.getElementById('bar-normal-pct').textContent   = '—';
}

/**
 * Recebe o resultado normalizado e atualiza toda a UI.
 * Não sabe se veio da API real ou do mock.
 */
function renderResult(parsed) {
  var pid            = document.getElementById('patient-select').value;
  var isPositive     = parsed.isPositive;
  var isInconclusive = parsed.isInconclusive;
  var confidence     = parsed.confidence;
  var leukPct        = parseFloat(parsed.leukPct);
  var normPct        = parseFloat(parsed.normPct);

  // Métricas offline do modelo treinado
  // TODO: substitua pelos valores reais após avaliação do modelo
  var acc    = '94.2';
  var recall = '96.8';
  var f1     = '95.5';

  document.getElementById('result-panel').classList.add('show');
  document.getElementById('result-icon').textContent =
    isPositive ? '⚠️' : isInconclusive ? '🔍' : '✅';

  var verdict       = document.getElementById('result-verdict');
  verdict.textContent = isPositive     ? 'Indícios de Leucemia Detectados'
                      : isInconclusive ? 'Resultado Inconclusivo'
                      : 'Células Normais';
  verdict.className   = 'result-verdict ' + (isPositive ? 'danger' : isInconclusive ? '' : 'success');
  verdict.style.color = isInconclusive ? 'var(--warning)' : '';

  document.getElementById('result-sub').textContent =
    'Análise concluída · ' + HF_CONFIG.MODEL_DISPLAY_NAME + ' · Confiança ' + confidence + '%';

  document.getElementById('result-metrics').innerHTML =
    '<div class="metric-box"><div class="metric-name">Acurácia</div><div class="metric-val accent">'  + acc    + '%</div></div>' +
    '<div class="metric-box"><div class="metric-name">Recall</div><div class="metric-val accent">'    + recall + '%</div></div>' +
    '<div class="metric-box"><div class="metric-name">F1-score</div><div class="metric-val accent">'  + f1     + '%</div></div>';

  setTimeout(function() {
    document.getElementById('bar-leukemia').style.width     = leukPct.toFixed(1) + '%';
    document.getElementById('bar-leukemia-pct').textContent = leukPct.toFixed(1) + '%';
    document.getElementById('bar-normal').style.width       = normPct.toFixed(1) + '%';
    document.getElementById('bar-normal-pct').textContent   = normPct.toFixed(1) + '%';
  }, 50);

  // GradCAM
  var previewImg = document.querySelector('#preview-img-wrap img');
  if (previewImg) generateGradCAM(previewImg.src, isPositive, isInconclusive);

  // Salva estado para PDF
  var patient = null;
  for (var i = 0; i < PATIENTS.length; i++) {
    if (PATIENTS[i].id === pid) { patient = PATIENTS[i]; break; }
  }

  lastResult = {
    patient:    patient,
    fileName:   uploadedFile ? uploadedFile.name : '—',
    result:     isPositive ? 'POSITIVO' : isInconclusive ? 'INCONCLUSIVO' : 'NEGATIVO',
    confidence: parseFloat(confidence),
    leukPct:    leukPct.toFixed(1),
    normPct:    normPct.toFixed(1),
    acc:        parseFloat(acc),
    recall:     parseFloat(recall),
    f1:         parseFloat(f1),
    model:      HF_CONFIG.MODEL_DISPLAY_NAME,
    date:       new Date().toLocaleString('pt-BR'),
    analyst:    currentUser ? currentUser.name : '—'
  };

  document.getElementById('btn-export-pdf').style.display = 'inline-flex';

  // Atualiza paciente no mock
  if (pid && patient) {
    var today  = new Date().toISOString().slice(0, 10);
    var result = isPositive ? 'POSITIVO' : isInconclusive ? 'INCONCLUSIVO' : 'NEGATIVO';
    patient.exams.unshift({
      id: 'E-NEW', date: today, result: result,
      confidence: parseFloat(confidence),
      acc: parseFloat(acc), recall: parseFloat(recall), f1: parseFloat(f1),
      file: '🔬', model: HF_CONFIG.MODEL_DISPLAY_NAME
    });
    patient.last_exam = today;
    patient.status    = isPositive ? 'danger' : isInconclusive ? 'warning' : 'success';
    renderDashboard();
    renderPatientsTable();
  }
}