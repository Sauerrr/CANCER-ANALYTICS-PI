// ─── MOCK DATA ───────────────────────────────────────────────

const USERS = {
  'admin@ca.ai': {
    password: 'demo1234',
    name: 'Dr. Rodrigues',
    initials: 'DR',
    role: 'Hematologista'
  }
};

const PATIENTS = [
  {
    id: 'P-001',
    name: 'Ana Beatriz Souza',
    age: 34,
    sex: 'F',
    blood_type: 'A+',
    diagnosis_history: 'Anemia ferropriva (2021)',
    last_exam: '2025-05-12',
    status: 'danger',
    exams: [
      { id: 'E-012', date: '2025-05-12', result: 'POSITIVO',    confidence: 96.4, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v2.1' },
      { id: 'E-009', date: '2025-04-03', result: 'NEGATIVO',    confidence: 88.7, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v2.0' },
      { id: 'E-005', date: '2025-02-17', result: 'NEGATIVO',    confidence: 91.2, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v1.9' }
    ]
  },
  {
    id: 'P-002',
    name: 'Carlos Eduardo Lima',
    age: 57,
    sex: 'M',
    blood_type: 'O-',
    diagnosis_history: 'Hipertensão arterial, Diabetes tipo 2',
    last_exam: '2025-05-08',
    status: 'success',
    exams: [
      { id: 'E-011', date: '2025-05-08', result: 'NEGATIVO', confidence: 92.1, acc: 94.2, recall: 93.0, f1: 93.6, file: '🔬', model: 'ResNet-50 v2.1' },
      { id: 'E-007', date: '2025-03-20', result: 'NEGATIVO', confidence: 89.3, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v2.0' }
    ]
  },
  {
    id: 'P-003',
    name: 'Fernanda Oliveira',
    age: 22,
    sex: 'F',
    blood_type: 'B+',
    diagnosis_history: 'Sem histórico relevante',
    last_exam: '2025-05-01',
    status: 'danger',
    exams: [
      { id: 'E-010', date: '2025-05-01', result: 'POSITIVO', confidence: 98.8, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v2.1' }
    ]
  },
  {
    id: 'P-004',
    name: 'Marcos Henrique Dias',
    age: 45,
    sex: 'M',
    blood_type: 'AB+',
    diagnosis_history: 'Leucemia mieloide (remissão 2022)',
    last_exam: '2025-04-22',
    status: 'warning',
    exams: [
      { id: 'E-008', date: '2025-04-22', result: 'INCONCLUSIVO', confidence: 61.3, acc: 92.8, recall: 88.4, f1: 90.5, file: '🔬', model: 'ResNet-50 v2.0' },
      { id: 'E-004', date: '2025-01-10', result: 'POSITIVO',     confidence: 94.7, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v1.9' },
      { id: 'E-001', date: '2024-11-05', result: 'POSITIVO',     confidence: 97.1, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v1.8' }
    ]
  },
  {
    id: 'P-005',
    name: 'Juliana Santos Freitas',
    age: 61,
    sex: 'F',
    blood_type: 'A-',
    diagnosis_history: 'Hipotireoidismo, artrite reumatoide',
    last_exam: '2025-03-14',
    status: 'success',
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
let lastResult      = null; // guarda o resultado da última análise para o PDF

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
  if (result === 'POSITIVO')     return `<span class="badge danger"><span class="badge-dot"></span>Positivo</span>`;
  if (result === 'NEGATIVO')     return `<span class="badge success"><span class="badge-dot"></span>Negativo</span>`;
  return `<span class="badge warning"><span class="badge-dot"></span>Inconclusivo</span>`;
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
  lastResult  = null;
}

document.getElementById('input-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

// ─── INIT ─────────────────────────────────────────────────────

function initApp() {
  renderDashboard();
  renderPatientsTable();
  populatePatientSelect();
  switchView('dashboard', document.querySelector('[data-view=dashboard]'));
}

// ─── NAVIGATION ───────────────────────────────────────────────

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
      <td><button class="btn-row">Ver →</button></td>
    </tr>
  `).join('');
}

// ─── PATIENTS TABLE ───────────────────────────────────────────

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
      <td style="font-size:13px;color:var(--text-muted)">${p.age} anos · ${p.sex === 'F' ? 'Feminino' : 'Masculino'}</td>
      <td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">${formatDate(p.last_exam)}</td>
      <td>${statusBadge(p.status, p.exams[0]?.result)}</td>
      <td style="font-family:var(--mono);font-size:12px">${p.exams.length}</td>
      <td><button class="btn-row">Histórico →</button></td>
    </tr>
  `).join('');
}

// ─── PATIENT DETAIL ───────────────────────────────────────────

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
        <span>🪪 ${p.id}</span>
        <span>🎂 ${p.age} anos</span>
        <span>⚧ ${p.sex === 'F' ? 'Feminino' : 'Masculino'}</span>
        <span>🩸 Tipo ${p.blood_type}</span>
      </div>
    </div>
    <div>${statusBadge(p.status, latest?.result)}</div>
  `;

  document.getElementById('detail-clinical').innerHTML = `
    <div class="info-row"><span class="info-key">Tipo sanguíneo</span><span class="info-val">${p.blood_type}</span></div>
    <div class="info-row"><span class="info-key">Histórico</span><span class="info-val" style="font-size:11px;text-align:right;max-width:180px">${p.diagnosis_history}</span></div>
    <div class="info-row"><span class="info-key">Total de exames</span><span class="info-val">${p.exams.length}</span></div>
    <div class="info-row"><span class="info-key">Último exame</span><span class="info-val">${formatDate(p.last_exam)}</span></div>
  `;

  if (latest) {
    const isPos  = latest.result === 'POSITIVO';
    const color  = latest.result === 'INCONCLUSIVO' ? 'var(--warning)' : isPos ? 'var(--danger)' : 'var(--success)';

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
          <div class="exam-date">${formatDate(e.date)} · ${e.id}</div>
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
    const opt = document.createElement('option');
    opt.value       = p.id;
    opt.textContent = `${p.name} (${p.id})`;
    sel.appendChild(opt);
  });
}

document.getElementById('upload-file').addEventListener('change', function () {
  if (this.files[0]) handleFile(this.files[0]);
});

const uploadArea = document.getElementById('upload-area');
uploadArea.addEventListener('dragover',  e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
uploadArea.addEventListener('dragleave', ()  => uploadArea.classList.remove('drag-over'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  uploadedFile = file;
  document.getElementById('upload-preview').classList.add('show');
  document.getElementById('preview-name').textContent = file.name;
  document.getElementById('preview-size').textContent = (file.size / 1024).toFixed(1) + ' KB';

  const reader  = new FileReader();
  reader.onload = e => {
    document.getElementById('preview-img-wrap').innerHTML = `<img src="${e.target.result}" alt="preview">`;
  };
  reader.readAsDataURL(file);

  document.getElementById('btn-analyze').disabled = false;
  document.getElementById('result-panel').classList.remove('show');
  document.getElementById('analyzing-overlay').classList.remove('show');
  lastResult = null;
}

function clearUpload() {
  uploadedFile = null;
  lastResult   = null;
  document.getElementById('upload-file').value               = '';
  document.getElementById('upload-preview').classList.remove('show');
  document.getElementById('preview-img-wrap').innerHTML      = '🔬';
  document.getElementById('btn-analyze').disabled            = true;
  document.getElementById('result-panel').classList.remove('show');
}

// ─── ANÁLISE ─────────────────────────────────────────────────

const STEPS = [
  ['Pré-processando imagem...',    'Normalizando pixels'],
  ['Segmentando células...',       'Detectando bordas e núcleos'],
  ['Extraindo features...',        'Camadas convolucionais ativas'],
  ['Classificando...',             'Forward pass — ResNet-50 v2.1'],
  ['Gerando probabilidades...',    'Softmax layer']
];

function runAnalysis() {
  if (!uploadedFile) return;

  document.getElementById('btn-analyze').disabled = true;
  document.getElementById('result-panel').classList.remove('show');

  const overlay = document.getElementById('analyzing-overlay');
  overlay.classList.add('show');

  let step = 0;
  const interval = setInterval(() => {
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
  const pid  = document.getElementById('patient-select').value;
  const rand = Math.random();

  const isPositive     = rand > 0.45;
  const isInconclusive = !isPositive && rand > 0.35;

  const confidence = isPositive
    ? (85 + Math.random() * 13).toFixed(1)
    : isInconclusive
      ? (55 + Math.random() * 15).toFixed(1)
      : (86 + Math.random() * 12).toFixed(1);

  const leukPct = isPositive || isInconclusive
    ? parseFloat(confidence)
    : 100 - parseFloat(confidence);
  const normPct = 100 - leukPct;

  const panel = document.getElementById('result-panel');
  panel.classList.add('show');

  document.getElementById('result-icon').textContent = isPositive ? '⚠️' : isInconclusive ? '🔍' : '✅';

  const verdict = document.getElementById('result-verdict');
  verdict.textContent = isPositive
    ? 'Indícios de Leucemia Detectados'
    : isInconclusive
      ? 'Resultado Inconclusivo'
      : 'Células Normais';
  verdict.className   = 'result-verdict ' + (isPositive ? 'danger' : isInconclusive ? '' : 'success');
  verdict.style.color = isInconclusive ? 'var(--warning)' : '';

  document.getElementById('result-sub').textContent =
    `Análise concluída · Modelo ResNet-50 v2.1 · Confiança ${confidence}%`;

  const acc    = (92 + Math.random() * 3).toFixed(1);
  const recall = (90 + Math.random() * 7).toFixed(1);
  const f1     = ((parseFloat(acc) + parseFloat(recall)) / 2).toFixed(1);

  document.getElementById('result-metrics').innerHTML = `
    <div class="metric-box">
      <div class="metric-name">Acurácia</div>
      <div class="metric-val accent">${acc}%</div>
    </div>
    <div class="metric-box">
      <div class="metric-name">Recall</div>
      <div class="metric-val accent">${recall}%</div>
    </div>
    <div class="metric-box">
      <div class="metric-name">F1-score</div>
      <div class="metric-val accent">${f1}%</div>
    </div>
  `;

  setTimeout(() => {
    document.getElementById('bar-leukemia').style.width     = leukPct.toFixed(1) + '%';
    document.getElementById('bar-leukemia-pct').textContent = leukPct.toFixed(1) + '%';
    document.getElementById('bar-normal').style.width       = normPct.toFixed(1) + '%';
    document.getElementById('bar-normal-pct').textContent   = normPct.toFixed(1) + '%';
  }, 50);

  // Guarda o resultado para uso no PDF
  const resultLabel = isPositive ? 'POSITIVO' : isInconclusive ? 'INCONCLUSIVO' : 'NEGATIVO';
  lastResult = {
    result:     resultLabel,
    confidence: parseFloat(confidence),
    leukPct:    leukPct.toFixed(1),
    normPct:    normPct.toFixed(1),
    acc:        parseFloat(acc),
    recall:     parseFloat(recall),
    f1:         parseFloat(f1),
    model:      'ResNet-50 v2.1',
    fileName:   uploadedFile?.name || 'N/A',
    date:       new Date().toISOString().slice(0, 10),
    patientId:  pid || null,
    analyst:    currentUser?.name || 'N/A'
  };

  // Adiciona exame ao paciente selecionado
  if (pid) {
    const patient = PATIENTS.find(p => p.id === pid);
    if (patient) {
      patient.exams.unshift({
        id:         'E-NEW',
        date:       lastResult.date,
        result:     resultLabel,
        confidence: lastResult.confidence,
        acc:        lastResult.acc,
        recall:     lastResult.recall,
        f1:         lastResult.f1,
        file:       '🔬',
        model:      'ResNet-50 v2.1'
      });
      patient.last_exam = lastResult.date;
      patient.status    = isPositive ? 'danger' : isInconclusive ? 'warning' : 'success';

      renderDashboard();
      renderPatientsTable();
    }
  }
}

// ─── GERAÇÃO DE PDF ──────────────────────────────────────────

function generatePDFReport() {
  if (!lastResult) return;

  const btn = document.getElementById('btn-pdf');
  btn.classList.add('loading');
  btn.textContent = 'Gerando...';

  // Pequeno delay para dar feedback visual
  setTimeout(() => {
    try {
      buildPDF();
    } finally {
      btn.classList.remove('loading');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        Gerar Relatório PDF`;
    }
  }, 100);
}

function buildPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const r      = lastResult;
  const pid    = r.patientId;
  const patient = pid ? PATIENTS.find(p => p.id === pid) : null;

  // ── Paleta de cores (RGB) ──────────────────────────
  const C = {
    dark:        [10,  13,  20],
    surface:     [17,  21,  32],
    accent:      [76,  180, 255],
    danger:      [255, 91,  107],
    success:     [77,  255, 195],
    warning:     [255, 184, 77],
    inconclusive:[167, 139, 250],
    text:        [232, 234, 242],
    muted:       [107, 116, 150],
    dim:         [61,  68,  96],
    white:       [255, 255, 255],
    border:      [30,  36,  56]
  };

  const W  = 210; // largura A4
  const H  = 297; // altura A4
  let   y  = 0;   // cursor vertical

  // ── Cor de resultado ──────────────────────────────
  const resultColor = r.result === 'POSITIVO'
    ? C.danger
    : r.result === 'INCONCLUSIVO'
      ? C.inconclusive
      : C.success;

  const resultLabel = r.result === 'POSITIVO'
    ? 'POSITIVO — Indicios de Leucemia'
    : r.result === 'INCONCLUSIVO'
      ? 'INCONCLUSIVO'
      : 'NEGATIVO — Celulas Normais';

  // ════════════════════════════════════════════
  // CABEÇALHO
  // ════════════════════════════════════════════
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, W, 42, 'F');

  // Barra de acento no topo
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, W, 3, 'F');

  // Logo (ícone simulado com círculo + texto)
  doc.setFillColor(...C.accent);
  doc.roundedRect(14, 10, 14, 14, 3, 3, 'F');
  doc.setTextColor(...C.dark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CA', 21, 19, { align: 'center' });

  // Nome do sistema
  doc.setTextColor(...C.white);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('CancerAnalytics', 32, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  doc.text('Plataforma de Triagem por IA — Uso Academico', 32, 23);

  // Título do relatório (direita)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.accent);
  doc.text('RELATORIO DE ANALISE', W - 14, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  doc.setFontSize(7.5);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, W - 14, 20, { align: 'right' });
  doc.text(`Analista: ${r.analyst}`, W - 14, 26, { align: 'right' });

  y = 48;

  // ════════════════════════════════════════════
  // RESULTADO PRINCIPAL — DESTAQUE
  // ════════════════════════════════════════════
  doc.setFillColor(...C.surface);
  doc.roundedRect(14, y, W - 28, 32, 4, 4, 'F');

  // Borda lateral colorida
  doc.setFillColor(...resultColor);
  doc.roundedRect(14, y, 4, 32, 2, 2, 'F');

  // Texto resultado
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  doc.text('CLASSIFICACAO DA IA', 24, y + 9);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...resultColor);
  doc.text(resultLabel, 24, y + 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  doc.text(`Confianca: ${r.confidence.toFixed(1)}%   |   Modelo: ${r.model}   |   Arquivo: ${r.fileName}`, 24, y + 28);

  y += 40;

  // ════════════════════════════════════════════
  // DADOS DO PACIENTE
  // ════════════════════════════════════════════
  // Título de seção
  const sectionTitle = (label, yPos) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.accent);
    doc.text(label.toUpperCase(), 14, yPos);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(14, yPos + 2, W - 14, yPos + 2);
  };

  sectionTitle('Dados do Paciente', y);
  y += 8;

  if (patient) {
    const infoGrid = [
      ['Nome',           patient.name],
      ['ID do Paciente', patient.id],
      ['Idade',          `${patient.age} anos`],
      ['Sexo',           patient.sex === 'F' ? 'Feminino' : 'Masculino'],
      ['Tipo Sanguineo', patient.blood_type],
      ['Historico',      patient.diagnosis_history],
    ];

    // Grade de 2 colunas
    const colW = (W - 28) / 2;
    infoGrid.forEach(([key, val], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xBase = 14 + col * colW;
      const yRow  = y + row * 12;

      doc.setFillColor(...C.surface);
      doc.roundedRect(xBase, yRow, colW - 3, 10, 2, 2, 'F');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.muted);
      doc.text(key, xBase + 4, yRow + 4.5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.text);
      // Truncar texto longo
      const maxW = colW - 10;
      doc.text(val, xBase + 4, yRow + 8.5, { maxWidth: maxW });
    });

    y += Math.ceil(infoGrid.length / 2) * 12 + 8;
  } else {
    doc.setFillColor(...C.surface);
    doc.roundedRect(14, y, W - 28, 10, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...C.muted);
    doc.text('Nenhum paciente vinculado a esta analise.', 18, y + 7);
    y += 18;
  }

  // ════════════════════════════════════════════
  // MÉTRICAS DO MODELO
  // ════════════════════════════════════════════
  sectionTitle('Metricas do Modelo', y);
  y += 8;

  const metrics = [
    { label: 'Acuracia',   val: `${r.acc}%`,    sub: 'Taxa geral de acerto' },
    { label: 'Recall',     val: `${r.recall}%`, sub: 'Sensibilidade ao positivo' },
    { label: 'F1-Score',   val: `${r.f1}%`,     sub: 'Media harmonica P/R' },
    { label: 'Confianca',  val: `${r.confidence.toFixed(1)}%`, sub: 'Score desta predicao' },
  ];

  const mW = (W - 28 - 9) / 4;
  metrics.forEach((m, i) => {
    const xM = 14 + i * (mW + 3);

    doc.setFillColor(...C.surface);
    doc.roundedRect(xM, y, mW, 22, 3, 3, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.muted);
    doc.text(m.label.toUpperCase(), xM + mW / 2, y + 6, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.accent);
    doc.text(m.val, xM + mW / 2, y + 14.5, { align: 'center' });

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.dim);
    doc.text(m.sub, xM + mW / 2, y + 19.5, { align: 'center' });
  });

  y += 30;

  // ════════════════════════════════════════════
  // PROBABILIDADES (barras)
  // ════════════════════════════════════════════
  sectionTitle('Probabilidades por Classe', y);
  y += 8;

  const drawBar = (label, pct, color, yPos) => {
    const barW = W - 28 - 40;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.text);
    doc.text(label, 14, yPos + 4);

    // Fundo da barra
    doc.setFillColor(...C.border);
    doc.roundedRect(54, yPos, barW, 6, 2, 2, 'F');

    // Preenchimento
    const fill = Math.max((pct / 100) * barW, 2);
    doc.setFillColor(...color);
    doc.roundedRect(54, yPos, fill, 6, 2, 2, 'F');

    // Percentual
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(`${pct}%`, 54 + barW + 4, yPos + 5);
  };

  drawBar('Leucemia', parseFloat(r.leukPct), C.danger,  y);
  y += 12;
  drawBar('Normal',   parseFloat(r.normPct), C.success, y);
  y += 18;

  // ════════════════════════════════════════════
  // HISTÓRICO RESUMIDO (se houver paciente)
  // ════════════════════════════════════════════
  if (patient && patient.exams.length > 1) {
    sectionTitle('Historico de Exames', y);
    y += 8;

    // Cabeçalho da mini-tabela
    const cols = [14, 42, 90, 130, 165];
    const headers = ['ID', 'Data', 'Resultado', 'Confianca', 'Modelo'];

    doc.setFillColor(...C.surface);
    doc.roundedRect(14, y, W - 28, 8, 2, 2, 'F');

    headers.forEach((h, i) => {
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.muted);
      doc.text(h, cols[i], y + 5.5);
    });
    y += 10;

    const examsToShow = patient.exams.slice(0, 5);
    examsToShow.forEach((e, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(20, 25, 40);
        doc.rect(14, y - 1, W - 28, 8, 'F');
      }

      const rc = e.result === 'POSITIVO' ? C.danger : e.result === 'INCONCLUSIVO' ? C.warning : C.success;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.muted);
      doc.text(e.id, cols[0], y + 5);

      doc.setTextColor(...C.text);
      doc.text(formatDate(e.date), cols[1], y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...rc);
      doc.text(e.result, cols[2], y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.text);
      doc.text(`${e.confidence.toFixed(1)}%`, cols[3], y + 5);

      doc.setTextColor(...C.muted);
      doc.text(e.model, cols[4], y + 5);

      y += 8;
    });

    if (patient.exams.length > 5) {
      doc.setFontSize(7);
      doc.setTextColor(...C.dim);
      doc.text(`+ ${patient.exams.length - 5} exames anteriores nao exibidos.`, 14, y + 5);
      y += 10;
    }

    y += 6;
  }

  // ════════════════════════════════════════════
  // AVISO / DISCLAIMER
  // ════════════════════════════════════════════
  // Garante que o disclaimer não ultrapasse a página
  const disclaimerH = 22;
  if (y + disclaimerH > H - 20) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(40, 30, 10);
  doc.roundedRect(14, y, W - 28, disclaimerH, 3, 3, 'F');
  doc.setDrawColor(...C.warning);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, W - 28, disclaimerH, 3, 3, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.warning);
  doc.text('AVISO IMPORTANTE', 18, y + 7);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 180, 100);
  const disclaimerText =
    'Este relatorio e gerado automaticamente por um modelo de inteligencia artificial com fins academicos e de pesquisa. ' +
    'Os resultados NAO substituem o diagnostico clinico realizado por um profissional de saude habilitado. ' +
    'Qualquer decisao medica deve ser tomada com base em avaliacao especializada completa.';
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, W - 36);
  doc.text(splitDisclaimer, 18, y + 13);

  y += disclaimerH + 6;

  // ════════════════════════════════════════════
  // RODAPÉ
  // ════════════════════════════════════════════
  doc.setFillColor(...C.dark);
  doc.rect(0, H - 14, W, 14, 'F');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.dim);
  doc.text('CancerAnalytics — Plataforma de Triagem por IA', 14, H - 5);
  doc.text(`Pagina 1 de 1  |  Versao do modelo: ${r.model}`, W - 14, H - 5, { align: 'right' });

  // ── Salva o arquivo ──────────────────────────
  const dateStr   = r.date.replace(/-/g, '');
  const patName   = patient ? patient.name.split(' ').slice(0, 2).join('_') : 'SemPaciente';
  const fileName  = `Relatorio_CA_${patName}_${dateStr}.pdf`;
  doc.save(fileName);
}