// ════════════════════════════════════════════════════════════
//  patients.js — Detalhe e seleção de paciente
//  Depende de: config.js, data.js, ui.js (helpers de badge/date)
// ════════════════════════════════════════════════════════════

/**
 * Abre a view de detalhe de um paciente pelo ID.
 * @param {string} id
 */
function openPatient(id) {
  selectedPatient = PATIENTS.find(function(p) { return p.id === id; });
  if (!selectedPatient) return;

  var p      = selectedPatient;
  var latest = p.exams[0];

  // Header
  document.getElementById('detail-header').innerHTML =
    '<div class="patient-avatar">' + initials(p.name) + '</div>' +
    '<div class="patient-info-main">' +
      '<div class="patient-name">' + p.name + '</div>' +
      '<div class="patient-meta">' +
        '<span>ID: ' + p.id + '</span>' +
        '<span>' + p.age + ' anos</span>' +
        '<span>' + (p.sex === 'F' ? 'Feminino' : 'Masculino') + '</span>' +
        '<span>Tipo ' + p.blood_type + '</span>' +
      '</div>' +
    '</div>' +
    '<div>' + statusBadge(p.status, latest ? latest.result : '') + '</div>';

  // Dados clínicos
  document.getElementById('detail-clinical').innerHTML =
    '<div class="info-row"><span class="info-key">Tipo sanguíneo</span><span class="info-val">' + p.blood_type + '</span></div>' +
    '<div class="info-row"><span class="info-key">Histórico</span><span class="info-val" style="font-size:11px;text-align:right;max-width:180px">' + p.diagnosis_history + '</span></div>' +
    '<div class="info-row"><span class="info-key">Total de exames</span><span class="info-val">' + p.exams.length + '</span></div>' +
    '<div class="info-row"><span class="info-key">Último exame</span><span class="info-val">' + formatDate(p.last_exam) + '</span></div>';

  // Último resultado IA
  if (latest) {
    var isPos  = latest.result === 'POSITIVO';
    var color  = latest.result === 'INCONCLUSIVO' ? 'var(--warning)' : isPos ? 'var(--danger)' : 'var(--success)';
    document.getElementById('detail-last-result').innerHTML =
      '<div class="info-row"><span class="info-key">Resultado</span>' + resultBadge(latest.result) + '</div>' +
      '<div class="info-row"><span class="info-key">Confiança</span><span class="info-val" style="color:' + color + '">' + latest.confidence.toFixed(1) + '%</span></div>' +
      '<div class="info-row"><span class="info-key">Acurácia</span><span class="info-val">' + latest.acc + '%</span></div>' +
      '<div class="info-row"><span class="info-key">Recall</span><span class="info-val">' + latest.recall + '%</span></div>' +
      '<div class="info-row"><span class="info-key">F1-score</span><span class="info-val">' + latest.f1 + '%</span></div>' +
      '<div class="info-row"><span class="info-key">Modelo</span><span class="info-val" style="font-size:11px">' + latest.model + '</span></div>';
  }

  // Histórico de exames
  document.getElementById('detail-exams').innerHTML = p.exams.map(function(e) {
    var isPos      = e.result === 'POSITIVO';
    var colorClass = e.result === 'INCONCLUSIVO' ? 'warning' : isPos ? 'danger' : 'success';
    return '<div class="exam-card">' +
      '<div class="exam-thumb">' + e.file + '</div>' +
      '<div class="exam-info">' +
        '<div class="exam-date">' + formatDate(e.date) + ' &middot; ' + e.id + '</div>' +
        '<div class="exam-label">Esfregaço de sangue periférico</div>' +
        '<div class="exam-model">' + e.model + '</div>' +
      '</div>' +
      '<div class="exam-result">' +
        '<span class="badge ' + colorClass + '"><span class="badge-dot"></span>' + e.result + '</span>' +
        '<div class="exam-confidence">Conf. ' + e.confidence.toFixed(1) + '%</div>' +
      '</div>' +
    '</div>';
  }).join('');

  switchView('patient-detail', null);
}

/**
 * Popula o <select> de pacientes na tela de upload.
 */
function populatePatientSelect() {
  var sel = document.getElementById('patient-select');
  while (sel.options.length > 1) sel.remove(1);

  PATIENTS.forEach(function(p) {
    var opt       = document.createElement('option');
    opt.value     = p.id;
    opt.textContent = p.name + ' (' + p.id + ')';
    sel.appendChild(opt);
  });
}