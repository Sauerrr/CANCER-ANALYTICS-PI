// ════════════════════════════════════════════════════════════
//  CANCER ANALYTICS — app.js
// ════════════════════════════════════════════════════════════

// ─── MOCK DATA ───────────────────────────────────────────────

const USERS = {
  'admin@ca.ai': {
    password: 'demo1234',
    name:     'Dr. Rodrigues',
    initials: 'DR',
    role:     'Hematologista'
  }
};

const PATIENTS = [
  {
    id: 'P-001', name: 'Ana Beatriz Souza', age: 34, sex: 'F',
    blood_type: 'A+', diagnosis_history: 'Anemia ferropriva (2021)',
    last_exam: '2025-05-12', status: 'danger',
    exams: [
      { id: 'E-012', date: '2025-05-12', result: 'POSITIVO',  confidence: 96.4, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v2.1' },
      { id: 'E-009', date: '2025-04-03', result: 'NEGATIVO',  confidence: 88.7, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v2.0' },
      { id: 'E-005', date: '2025-02-17', result: 'NEGATIVO',  confidence: 91.2, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v1.9' }
    ]
  },
  {
    id: 'P-002', name: 'Carlos Eduardo Lima', age: 57, sex: 'M',
    blood_type: 'O-', diagnosis_history: 'Hipertensão arterial, Diabetes tipo 2',
    last_exam: '2025-05-08', status: 'success',
    exams: [
      { id: 'E-011', date: '2025-05-08', result: 'NEGATIVO', confidence: 92.1, acc: 94.2, recall: 93.0, f1: 93.6, file: '🔬', model: 'ResNet-50 v2.1' },
      { id: 'E-007', date: '2025-03-20', result: 'NEGATIVO', confidence: 89.3, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v2.0' }
    ]
  },
  {
    id: 'P-003', name: 'Fernanda Oliveira', age: 22, sex: 'F',
    blood_type: 'B+', diagnosis_history: 'Sem histórico relevante',
    last_exam: '2025-05-01', status: 'danger',
    exams: [
      { id: 'E-010', date: '2025-05-01', result: 'POSITIVO', confidence: 98.8, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v2.1' }
    ]
  },
  {
    id: 'P-004', name: 'Marcos Henrique Dias', age: 45, sex: 'M',
    blood_type: 'AB+', diagnosis_history: 'Leucemia mieloide (remissão 2022)',
    last_exam: '2025-04-22', status: 'warning',
    exams: [
      { id: 'E-008', date: '2025-04-22', result: 'INCONCLUSIVO', confidence: 61.3, acc: 92.8, recall: 88.4, f1: 90.5, file: '🔬', model: 'ResNet-50 v2.0' },
      { id: 'E-004', date: '2025-01-10', result: 'POSITIVO',     confidence: 94.7, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v1.9' },
      { id: 'E-001', date: '2024-11-05', result: 'POSITIVO',     confidence: 97.1, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v1.8' }
    ]
  },
  {
    id: 'P-005', name: 'Juliana Santos Freitas', age: 61, sex: 'F',
    blood_type: 'A-', diagnosis_history: 'Hipotireoidismo, artrite reumatoide',
    last_exam: '2025-03-14', status: 'success',
    exams: [
      { id: 'E-006', date: '2025-03-14', result: 'NEGATIVO', confidence: 95.6, acc: 94.2, recall: 93.0, f1: 93.6, file: '🔬', model: 'ResNet-50 v2.0' },
      { id: 'E-002', date: '2024-12-02', result: 'NEGATIVO', confidence: 90.4, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v1.8' }
    ]
  }
];

// ─── STATE ───────────────────────────────────────────────────

let currentUser     = null;
let uploadedFile    = null;
let selectedPatient = null;
let lastResult      = null;
let gradcamMode     = 'overlay';
let gradcamData     = null;

// ─── HELPERS ─────────────────────────────────────────────────

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatDate(d) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function statusBadge(status, result) {
  if (result === 'INCONCLUSIVO') return `<span class="badge warning"><span class="badge-dot"></span>Inconclusivo</span>`;
  if (status === 'danger')       return `<span class="badge danger"><span class="badge-dot"></span>Positivo</span>`;
  if (status === 'success')      return `<span class="badge success"><span class="badge-dot"></span>Negativo</span>`;
  return `<span class="badge neutral"><span class="badge-dot"></span>—</span>`;
}

function resultBadge(result) {
  if (result === 'POSITIVO') return `<span class="badge danger"><span class="badge-dot"></span>Positivo</span>`;
  if (result === 'NEGATIVO') return `<span class="badge success"><span class="badge-dot"></span>Negativo</span>`;
  return `<span class="badge warning"><span class="badge-dot"></span>Inconclusivo</span>`;
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

// ─── AUTH ─────────────────────────────────────────────────────

function doLogin() {
  const email = document.getElementById('input-email').value.trim();
  const pass  = document.getElementById('input-password').value;
  const err   = document.getElementById('login-error');
  const user  = USERS[email];

  if (user && user.password === pass) {
    currentUser = { ...user, email };
    err.style.display = 'none';
    document.getElementById('sidebar-name').textContent   = user.name;
    document.getElementById('sidebar-avatar').textContent = user.initials;
    initApp();
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-app').classList.add('active');
  } else {
    err.style.display = 'block';
  }
}

function doLogout() {
  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('input-email').value    = '';
  document.getElementById('input-password').value = '';
  currentUser = null;
}

// ─── INIT ─────────────────────────────────────────────────────

function initApp() {
  renderDashboard();
  renderPatientsTable();
  populatePatientSelect();
  switchView('dashboard', document.querySelector('[data-view=dashboard]'));
}

// ─── NAVEGAÇÃO ────────────────────────────────────────────────

function switchView(id, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const view = document.getElementById('view-' + id);
  if (view) {
    view.classList.add('active');
    void view.offsetWidth;
    view.classList.add('fade-in');
  }
  if (btn) btn.classList.add('active');
}

// ─── DASHBOARD ────────────────────────────────────────────────

function renderDashboard() {
  const tbody  = document.getElementById('dashboard-recent');
  const recent = PATIENTS
    .flatMap(p => p.exams.map(e => ({ ...e, patient: p })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  tbody.innerHTML = recent.map(e => `
    <tr onclick="openPatient('${e.patient.id}')">
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:30px;height:30px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--accent)">
            ${initials(e.patient.name)}
          </div>
          <span>${e.patient.name}</span>
        </div>
      </td>
      <td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">${formatDate(e.date)}</td>
      <td>${resultBadge(e.result)}</td>
      <td style="font-family:var(--mono);font-size:12px">${e.confidence.toFixed(1)}%</td>
      <td><button class="btn-row">Ver &rarr;</button></td>
    </tr>
  `).join('');
}

// ─── TABELA DE PACIENTES ──────────────────────────────────────

function renderPatientsTable() {
  const tbody = document.getElementById('patients-table-body');

  tbody.innerHTML = PATIENTS.map(p => `
    <tr onclick="openPatient('${p.id}')">
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:9px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--accent)">
            ${initials(p.name)}
          </div>
          <span>${p.name}</span>
        </div>
      </td>
      <td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">${p.id}</td>
      <td style="font-size:13px;color:var(--text-muted)">${p.age} anos &middot; ${p.sex === 'F' ? 'Feminino' : 'Masculino'}</td>
      <td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">${formatDate(p.last_exam)}</td>
      <td>${statusBadge(p.status, p.exams[0] ? p.exams[0].result : '')}</td>
      <td style="font-family:var(--mono);font-size:12px">${p.exams.length}</td>
      <td><button class="btn-row">Hist&oacute;rico &rarr;</button></td>
    </tr>
  `).join('');
}

// ─── DETALHE DO PACIENTE ──────────────────────────────────────

function openPatient(id) {
  selectedPatient = PATIENTS.find(p => p.id === id);
  if (!selectedPatient) return;

  const p      = selectedPatient;
  const latest = p.exams[0];

  document.getElementById('detail-header').innerHTML = `
    <div class="patient-avatar">${initials(p.name)}</div>
    <div class="patient-info-main">
      <div class="patient-name">${p.name}</div>
      <div class="patient-meta">
        <span>ID: ${p.id}</span>
        <span>${p.age} anos</span>
        <span>${p.sex === 'F' ? 'Feminino' : 'Masculino'}</span>
        <span>Tipo ${p.blood_type}</span>
      </div>
    </div>
    <div>${statusBadge(p.status, latest ? latest.result : '')}</div>
  `;

  document.getElementById('detail-clinical').innerHTML = `
    <div class="info-row"><span class="info-key">Tipo sanguíneo</span><span class="info-val">${p.blood_type}</span></div>
    <div class="info-row"><span class="info-key">Histórico</span><span class="info-val" style="font-size:11px;text-align:right;max-width:180px">${p.diagnosis_history}</span></div>
    <div class="info-row"><span class="info-key">Total de exames</span><span class="info-val">${p.exams.length}</span></div>
    <div class="info-row"><span class="info-key">Último exame</span><span class="info-val">${formatDate(p.last_exam)}</span></div>
  `;

  if (latest) {
    const isPos = latest.result === 'POSITIVO';
    const color = latest.result === 'INCONCLUSIVO' ? 'var(--warning)' : isPos ? 'var(--danger)' : 'var(--success)';
    document.getElementById('detail-last-result').innerHTML = `
      <div class="info-row"><span class="info-key">Resultado</span>${resultBadge(latest.result)}</div>
      <div class="info-row"><span class="info-key">Confiança</span><span class="info-val" style="color:${color}">${latest.confidence.toFixed(1)}%</span></div>
      <div class="info-row"><span class="info-key">Acurácia</span><span class="info-val">${latest.acc}%</span></div>
      <div class="info-row"><span class="info-key">Recall</span><span class="info-val">${latest.recall}%</span></div>
      <div class="info-row"><span class="info-key">F1-score</span><span class="info-val">${latest.f1}%</span></div>
      <div class="info-row"><span class="info-key">Modelo</span><span class="info-val" style="font-size:11px">${latest.model}</span></div>
    `;
  }

  document.getElementById('detail-exams').innerHTML = p.exams.map(e => {
    const isPos      = e.result === 'POSITIVO';
    const colorClass = e.result === 'INCONCLUSIVO' ? 'warning' : isPos ? 'danger' : 'success';
    return `
      <div class="exam-card">
        <div class="exam-thumb">${e.file}</div>
        <div class="exam-info">
          <div class="exam-date">${formatDate(e.date)} &middot; ${e.id}</div>
          <div class="exam-label">Esfregaço de sangue periférico</div>
          <div class="exam-model">${e.model}</div>
        </div>
        <div class="exam-result">
          <span class="badge ${colorClass}"><span class="badge-dot"></span>${e.result}</span>
          <div class="exam-confidence">Conf. ${e.confidence.toFixed(1)}%</div>
        </div>
      </div>
    `;
  }).join('');

  switchView('patient-detail', null);
}

// ─── UPLOAD ───────────────────────────────────────────────────

function populatePatientSelect() {
  const sel = document.getElementById('patient-select');
  while (sel.options.length > 1) sel.remove(1);
  PATIENTS.forEach(p => {
    const opt       = document.createElement('option');
    opt.value       = p.id;
    opt.textContent = p.name + ' (' + p.id + ')';
    sel.appendChild(opt);
  });
}

function handleFile(file) {
  uploadedFile = file;
  document.getElementById('upload-preview').classList.add('show');
  document.getElementById('preview-name').textContent = file.name;
  document.getElementById('preview-size').textContent = (file.size / 1024).toFixed(1) + ' KB';

  const reader  = new FileReader();
  reader.onload = function(e) {
    document.getElementById('preview-img-wrap').innerHTML = '<img src="' + e.target.result + '" alt="preview">';
  };
  reader.readAsDataURL(file);

  document.getElementById('btn-analyze').disabled         = false;
  document.getElementById('result-panel').classList.remove('show');
  document.getElementById('btn-export-pdf').style.display = 'none';
  gradcamData = null;
}

function clearUpload() {
  uploadedFile = null;
  lastResult   = null;
  gradcamData  = null;

  document.getElementById('upload-file').value            = '';
  document.getElementById('upload-preview').classList.remove('show');
  document.getElementById('preview-img-wrap').innerHTML   = '🔬';
  document.getElementById('btn-analyze').disabled         = true;
  document.getElementById('result-panel').classList.remove('show');
  document.getElementById('btn-export-pdf').style.display = 'none';
}

// ─── GRADCAM SIMULADO ─────────────────────────────────────────

function generateGradCAM(imageSrc, isPositive, isInconclusive) {
  const loading = document.getElementById('gradcam-loading');
  loading.classList.add('show');

  const img  = new Image();
  img.onload = function() {
    var SIZE = 480;

    var heatCanvas    = document.createElement('canvas');
    heatCanvas.width  = SIZE;
    heatCanvas.height = SIZE;
    var heatCtx       = heatCanvas.getContext('2d');

    heatCtx.fillStyle = '#000';
    heatCtx.fillRect(0, 0, SIZE, SIZE);

    var blobCount = isPositive ? 6 : isInconclusive ? 3 : 2;
    var maxRadius = isPositive ? 120 : isInconclusive ? 90 : 70;

    for (var i = 0; i < blobCount; i++) {
      var cx    = SIZE * (0.25 + Math.random() * 0.5);
      var cy    = SIZE * (0.25 + Math.random() * 0.5);
      var r     = maxRadius * (0.5 + Math.random() * 0.5);
      var alpha = isPositive ? 0.55 + Math.random() * 0.35 : 0.3 + Math.random() * 0.3;
      drawHotBlob(heatCtx, cx, cy, r, alpha, isPositive);
    }

    for (var j = 0; j < 4; j++) {
      var leftSide = Math.random() < 0.5;
      var cx2 = leftSide ? Math.random() * SIZE * 0.2 : SIZE * 0.8 + Math.random() * SIZE * 0.2;
      var cy2 = SIZE * (0.1 + Math.random() * 0.8);
      var r2  = 60 + Math.random() * 60;
      drawCoolBlob(heatCtx, cx2, cy2, r2, 0.4 + Math.random() * 0.3);
    }

    var blurred    = document.createElement('canvas');
    blurred.width  = SIZE;
    blurred.height = SIZE;
    var blurCtx    = blurred.getContext('2d');
    blurCtx.filter = 'blur(20px)';
    blurCtx.drawImage(heatCanvas, 0, 0);

    gradcamData = { originalImg: img, heatmapCanvas: blurred, size: SIZE };

    loading.classList.remove('show');
    setGradcamMode('overlay');
  };
  img.src = imageSrc;
}

function drawHotBlob(ctx, cx, cy, r, alpha, isPositive) {
  var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  if (isPositive) {
    grad.addColorStop(0,   'rgba(255, 30,  30,  ' + alpha + ')');
    grad.addColorStop(0.3, 'rgba(255, 100, 0,   ' + (alpha * 0.8) + ')');
    grad.addColorStop(0.6, 'rgba(255, 220, 0,   ' + (alpha * 0.5) + ')');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
  } else {
    grad.addColorStop(0,   'rgba(255, 180, 0,  ' + alpha + ')');
    grad.addColorStop(0.4, 'rgba(255, 220, 50, ' + (alpha * 0.7) + ')');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawCoolBlob(ctx, cx, cy, r, alpha) {
  var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0,   'rgba(0, 120, 255, ' + alpha + ')');
  grad.addColorStop(0.5, 'rgba(0, 200, 255, ' + (alpha * 0.6) + ')');
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function setGradcamMode(mode) {
  if (!gradcamData) return;
  gradcamMode = mode;

  ['original', 'heatmap', 'overlay'].forEach(function(m) {
    document.getElementById('btn-' + m).classList.toggle('active', m === mode);
  });

  var canvas = document.getElementById('gradcam-canvas');
  var ctx    = canvas.getContext('2d');
  var size   = gradcamData.size;

  canvas.width  = size;
  canvas.height = size;

  if (mode === 'original') {
    ctx.drawImage(gradcamData.originalImg, 0, 0, size, size);

  } else if (mode === 'heatmap') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(gradcamData.heatmapCanvas, 0, 0, size, size);

  } else {
    ctx.drawImage(gradcamData.originalImg, 0, 0, size, size);
    var imgData = ctx.getImageData(0, 0, size, size);
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
      var gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);
    ctx.globalAlpha              = 0.7;
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(gradcamData.heatmapCanvas, 0, 0, size, size);
    ctx.globalAlpha              = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ─── ANÁLISE ─────────────────────────────────────────────────

var STEPS = [
  ['Pré-processando imagem...',  'Normalizando pixels'],
  ['Segmentando células...',     'Detectando bordas e núcleos'],
  ['Extraindo features...',      'Camadas convolucionais ativas'],
  ['Classificando...',           'Forward pass — ResNet-50 v2.1'],
  ['Gerando probabilidades...',  'Softmax layer']
];

function runAnalysis() {
  if (!uploadedFile) return;

  document.getElementById('btn-analyze').disabled         = true;
  document.getElementById('result-panel').classList.remove('show');
  document.getElementById('btn-export-pdf').style.display = 'none';
  gradcamData = null;

  var overlay = document.getElementById('analyzing-overlay');
  overlay.classList.add('show');

  var step     = 0;
  var interval = setInterval(function() {
    if (step < STEPS.length) {
      document.getElementById('analyzing-text').textContent = STEPS[step][0];
      document.getElementById('analyzing-step').textContent = STEPS[step][1];
      step++;
    } else {
      clearInterval(interval);
      overlay.classList.remove('show');
      showResult();
      document.getElementById('btn-analyze').disabled = false;
    }
  }, 600);
}

function showResult() {
  var pid  = document.getElementById('patient-select').value;
  var rand = Math.random();

  var isPositive     = rand > 0.45;
  var isInconclusive = !isPositive && rand > 0.35;

  var confidence = (
    isPositive     ? 85 + Math.random() * 13 :
    isInconclusive ? 55 + Math.random() * 15 :
                     86 + Math.random() * 12
  ).toFixed(1);

  var leukPct = (isPositive || isInconclusive)
    ? parseFloat(confidence)
    : 100 - parseFloat(confidence);
  var normPct = 100 - leukPct;

  var acc    = (92 + Math.random() * 3).toFixed(1);
  var recall = (90 + Math.random() * 7).toFixed(1);
  var f1     = ((parseFloat(acc) + parseFloat(recall)) / 2).toFixed(1);

  document.getElementById('result-panel').classList.add('show');
  document.getElementById('result-icon').textContent =
    isPositive ? '⚠️' : isInconclusive ? '🔍' : '✅';

  var verdict       = document.getElementById('result-verdict');
  verdict.textContent = isPositive ? 'Indícios de Leucemia Detectados'
                      : isInconclusive ? 'Resultado Inconclusivo'
                      : 'Células Normais';
  verdict.className   = 'result-verdict ' + (isPositive ? 'danger' : isInconclusive ? '' : 'success');
  verdict.style.color = isInconclusive ? 'var(--warning)' : '';

  document.getElementById('result-sub').textContent =
    'Análise concluída · ResNet-50 v2.1 · Confiança ' + confidence + '%';

  document.getElementById('result-metrics').innerHTML =
    '<div class="metric-box"><div class="metric-name">Acurácia</div><div class="metric-val accent">' + acc + '%</div></div>' +
    '<div class="metric-box"><div class="metric-name">Recall</div><div class="metric-val accent">' + recall + '%</div></div>' +
    '<div class="metric-box"><div class="metric-name">F1-score</div><div class="metric-val accent">' + f1 + '%</div></div>';

  setTimeout(function() {
    document.getElementById('bar-leukemia').style.width     = leukPct.toFixed(1) + '%';
    document.getElementById('bar-leukemia-pct').textContent = leukPct.toFixed(1) + '%';
    document.getElementById('bar-normal').style.width       = normPct.toFixed(1) + '%';
    document.getElementById('bar-normal-pct').textContent   = normPct.toFixed(1) + '%';
  }, 50);

  // GradCAM
  var previewImg = document.querySelector('#preview-img-wrap img');
  if (previewImg) {
    generateGradCAM(previewImg.src, isPositive, isInconclusive);
  }

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
    model:      'ResNet-50 v2.1',
    date:       new Date().toLocaleString('pt-BR'),
    analyst:    currentUser ? currentUser.name : '—'
  };

  document.getElementById('btn-export-pdf').style.display = 'inline-flex';

  // Atualiza paciente mockado
  if (pid && patient) {
    var today  = new Date().toISOString().slice(0, 10);
    var result = isPositive ? 'POSITIVO' : isInconclusive ? 'INCONCLUSIVO' : 'NEGATIVO';

    patient.exams.unshift({
      id: 'E-NEW', date: today, result: result,
      confidence: parseFloat(confidence),
      acc: parseFloat(acc), recall: parseFloat(recall), f1: parseFloat(f1),
      file: '🔬', model: 'ResNet-50 v2.1'
    });

    patient.last_exam = today;
    patient.status    = isPositive ? 'danger' : isInconclusive ? 'warning' : 'success';
    renderDashboard();
    renderPatientsTable();
  }
}

// ─── GERAÇÃO DE PDF ──────────────────────────────────────────

function generatePDF() {
  if (!lastResult) return;
  if (typeof window.jspdf === 'undefined') {
    var script  = document.createElement('script');
    script.src  = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = buildPDF;
    document.head.appendChild(script);
  } else {
    buildPDF();
  }
}

function buildPDF() {
  var jsPDF = window.jspdf.jsPDF;
  var doc   = new jsPDF({ unit: 'mm', format: 'a4' });
  var W     = 210;
  var r     = lastResult;
  var p     = r.patient;

  var C = {
    bg:      [10,  13,  20],
    surface: [17,  21,  32],
    accent:  [76, 180, 255],
    danger:  [255,  91, 107],
    success: [77,  255, 195],
    warning: [255, 184,  77],
    muted:   [107, 116, 150],
    border:  [40,   46,  68],
    white:   [255, 255, 255]
  };

  var resultColor = r.result === 'POSITIVO' ? C.danger
                  : r.result === 'NEGATIVO'  ? C.success : C.warning;

  function sf(c) { doc.setFillColor(c[0], c[1], c[2]); }
  function st(c) { doc.setTextColor(c[0], c[1], c[2]); }

  var y = 0;

  // Cabeçalho
  sf(C.surface); doc.rect(0, 0, W, 36, 'F');
  sf(C.accent);  doc.rect(0, 0, 4, 36, 'F');
  st(C.accent);  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text('Cancer', 12, 13);
  st(C.white);   doc.text('Analytics', 35, 13);
  st(C.muted);   doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text('Plataforma de Triagem por IA — Uso Academico', 12, 19);
  doc.text('Emitido em: ' + r.date, W - 12, 13, { align: 'right' });
  doc.text('Analista: '  + r.analyst, W - 12, 19, { align: 'right' });
  sf(C.border); doc.rect(0, 36, W, 0.3, 'F');
  y = 44;

  // Badge resultado
  var bW = 80;
  sf(resultColor); doc.roundedRect(W / 2 - bW / 2, y, bW, 11, 2, 2, 'F');
  st(C.bg); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  var label = r.result === 'POSITIVO' ? 'INDICIOS DE LEUCEMIA DETECTADOS'
            : r.result === 'NEGATIVO'  ? 'CELULAS NORMAIS' : 'RESULTADO INCONCLUSIVO';
  doc.text(label, W / 2, y + 7.5, { align: 'center' });
  y += 16;

  // Confiança
  st(resultColor); doc.setFontSize(26); doc.setFont('helvetica', 'bold');
  doc.text(r.confidence.toFixed(1) + '%', W / 2, y + 9, { align: 'center' });
  st(C.muted); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('confianca do modelo', W / 2, y + 16, { align: 'center' });
  y += 24;

  // Metricas
  var mW = 52, mGap = 5;
  var mX = (W - (mW * 3 + mGap * 2)) / 2;
  var metrics = [['Acuracia', r.acc + '%'], ['Recall', r.recall + '%'], ['F1-Score', r.f1 + '%']];
  for (var mi = 0; mi < metrics.length; mi++) {
    var mx = mX + mi * (mW + mGap);
    sf(C.surface); doc.roundedRect(mx, y, mW, 18, 2, 2, 'F');
    st(C.accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text(metrics[mi][1], mx + mW / 2, y + 11, { align: 'center' });
    st(C.muted);  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(metrics[mi][0].toUpperCase(), mx + mW / 2, y + 16, { align: 'center' });
  }
  y += 26;

  // Barras
  var barX = 14, barW = W - 28;
  st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text('Leucemia', barX, y + 4);
  doc.text(r.leukPct + '%', barX + barW, y + 4, { align: 'right' });
  sf(C.border); doc.roundedRect(barX, y + 6, barW, 4, 1, 1, 'F');
  sf(C.danger); doc.roundedRect(barX, y + 6, barW * parseFloat(r.leukPct) / 100, 4, 1, 1, 'F');
  y += 13;
  doc.text('Normal', barX, y + 4);
  doc.text(r.normPct + '%', barX + barW, y + 4, { align: 'right' });
  sf(C.border); doc.roundedRect(barX, y + 6, barW, 4, 1, 1, 'F');
  sf(C.success); doc.roundedRect(barX, y + 6, barW * parseFloat(r.normPct) / 100, 4, 1, 1, 'F');
  y += 16;

  // GradCAM
  sf(C.border); doc.rect(14, y, W - 28, 0.3, 'F'); y += 6;
  st(C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Mapa de Ativacao - GradCAM', 14, y);
  st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text('Regioes com maior peso na decisao da rede neural', 14, y + 5);
  y += 10;

  if (gradcamData) {
    var imgW = 84, imgH = 84, gap = 8;
    var iX   = (W - imgW * 2 - gap) / 2;

    var origC = document.createElement('canvas');
    origC.width = origC.height = gradcamData.size;
    origC.getContext('2d').drawImage(gradcamData.originalImg, 0, 0, gradcamData.size, gradcamData.size);
    doc.addImage(origC.toDataURL('image/jpeg', 0.85), 'JPEG', iX, y, imgW, imgH);

    var ovC   = document.createElement('canvas');
    ovC.width = ovC.height = gradcamData.size;
    var ovCtx = ovC.getContext('2d');
    ovCtx.drawImage(gradcamData.originalImg, 0, 0, gradcamData.size, gradcamData.size);
    var id = ovCtx.getImageData(0, 0, gradcamData.size, gradcamData.size);
    for (var pi = 0; pi < id.data.length; pi += 4) {
      var g = 0.299 * id.data[pi] + 0.587 * id.data[pi + 1] + 0.114 * id.data[pi + 2];
      id.data[pi] = id.data[pi + 1] = id.data[pi + 2] = g;
    }
    ovCtx.putImageData(id, 0, 0);
    ovCtx.globalAlpha = 0.7;
    ovCtx.globalCompositeOperation = 'screen';
    ovCtx.drawImage(gradcamData.heatmapCanvas, 0, 0, gradcamData.size, gradcamData.size);
    doc.addImage(ovC.toDataURL('image/jpeg', 0.85), 'JPEG', iX + imgW + gap, y, imgW, imgH);

    st(C.muted); doc.setFontSize(7.5);
    doc.text('Original', iX + imgW / 2, y + imgH + 5, { align: 'center' });
    doc.text('GradCAM Sobreposicao', iX + imgW + gap + imgW / 2, y + imgH + 5, { align: 'center' });

    var lgX = iX, lgY = y + imgH + 9, lgW = imgW * 2 + gap;
    var gradColors = ['#0000ff','#0088ff','#00ffaa','#aaff00','#ffaa00','#ff0000'];
    for (var gi = 0; gi < gradColors.length; gi++) {
      var rgb = hexToRgb(gradColors[gi]);
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(lgX + gi * (lgW / 6), lgY, lgW / 6, 3, 'F');
    }
    st(C.muted); doc.setFontSize(6.5);
    doc.text('Baixa ativacao', lgX, lgY + 7);
    doc.text('Alta ativacao', lgX + lgW, lgY + 7, { align: 'right' });
    y += imgH + 20;
  } else {
    st(C.muted); doc.setFontSize(9);
    doc.text('GradCAM nao disponivel', W / 2, y + 8, { align: 'center' });
    y += 14;
  }

  // Dados do paciente
  sf(C.border); doc.rect(14, y, W - 28, 0.3, 'F'); y += 6;
  st(C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Dados do Paciente', 14, y); y += 7;

  var fields = p ? [
    ['Nome',           p.name],
    ['ID',             p.id],
    ['Idade / Sexo',   p.age + ' anos - ' + (p.sex === 'F' ? 'Feminino' : 'Masculino')],
    ['Tipo Sanguineo', p.blood_type],
    ['Historico',      p.diagnosis_history],
    ['Arquivo',        r.fileName],
    ['Modelo IA',      r.model]
  ] : [
    ['Paciente', 'Nao vinculado'],
    ['Arquivo',  r.fileName],
    ['Modelo',   r.model]
  ];

  for (var fi = 0; fi < fields.length; fi++) {
    sf(C.surface); doc.rect(14, y, W - 28, 7, 'F');
    st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(fields[fi][0], 18, y + 5);
    st(C.white); doc.setFont('helvetica', 'bold');
    doc.text(String(fields[fi][1]), W - 16, y + 5, { align: 'right' });
    sf(C.border); doc.rect(14, y + 7, W - 28, 0.2, 'F');
    y += 7;
  }
  y += 6;

  // Disclaimer
  if (y > 262) { doc.addPage(); y = 16; }
  doc.setFillColor(40, 33, 10);
  doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F');
  st(C.warning); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
  doc.text('AVISO', 18, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Resultado experimental com fins academicos. Nao substitui diagnostico medico especializado.', 18, y + 10);

  // Rodapé
  sf(C.border); doc.rect(14, 287, W - 28, 0.3, 'F');
  st(C.muted); doc.setFontSize(7);
  doc.text('Cancer Analytics - Plataforma Academica de Triagem por IA', 14, 292);
  doc.text('Pagina 1', W - 14, 292, { align: 'right' });

  var pid = p ? p.id : 'sem-paciente';
  doc.save('relatorio-' + pid + '-' + Date.now() + '.pdf');
}

// ─── EVENT LISTENERS ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('input-password').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });

  document.getElementById('upload-file').addEventListener('change', function() {
    if (this.files[0]) handleFile(this.files[0]);
  });

  var uploadArea = document.getElementById('upload-area');
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', function() {
    uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
});