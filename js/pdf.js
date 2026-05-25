// ════════════════════════════════════════════════════════════
//  pdf.js — Geração do relatório PDF
//  Depende de: config.js (lastResult, gradcamData, currentUser)
// ════════════════════════════════════════════════════════════

/**
 * Ponto de entrada — carrega jsPDF via CDN se necessário.
 */
function generatePDF() {
  if (!lastResult) return;
  if (typeof window.jspdf === 'undefined') {
    var script    = document.createElement('script');
    script.src    = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = buildPDF;
    document.head.appendChild(script);
  } else {
    buildPDF();
  }
}

/**
 * Constrói e faz download do PDF com resultado, GradCAM e dados do paciente.
 */
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

  // ── Cabeçalho ──
  sf(C.surface); doc.rect(0, 0, W, 36, 'F');
  sf(C.accent);  doc.rect(0, 0, 4, 36, 'F');
  st(C.accent);  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text('Cancer', 12, 13);
  st(C.white);   doc.text('Analytics', 35, 13);
  st(C.muted);   doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text('Plataforma de Triagem por IA — Uso Academico', 12, 19);
  doc.text('Emitido em: ' + r.date, W - 12, 13, { align: 'right' });
  doc.text('Analista: '   + r.analyst, W - 12, 19, { align: 'right' });
  sf(C.border); doc.rect(0, 36, W, 0.3, 'F');
  y = 44;

  // ── Badge resultado ──
  var bW = 80;
  sf(resultColor); doc.roundedRect(W / 2 - bW / 2, y, bW, 11, 2, 2, 'F');
  st(C.bg); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  var label = r.result === 'POSITIVO' ? 'INDICIOS DE LEUCEMIA DETECTADOS'
            : r.result === 'NEGATIVO'  ? 'CELULAS NORMAIS' : 'RESULTADO INCONCLUSIVO';
  doc.text(label, W / 2, y + 7.5, { align: 'center' });
  y += 16;

  // ── Confiança ──
  st(resultColor); doc.setFontSize(26); doc.setFont('helvetica', 'bold');
  doc.text(r.confidence.toFixed(1) + '%', W / 2, y + 9, { align: 'center' });
  st(C.muted); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('confianca do modelo', W / 2, y + 16, { align: 'center' });
  y += 24;

  // ── Métricas ──
  var mW = 52, mGap = 5;
  var mX = (W - (mW * 3 + mGap * 2)) / 2;
  var metrics = [
    ['Acuracia', r.acc + '%'],
    ['Recall',   r.recall + '%'],
    ['F1-Score', r.f1 + '%']
  ];
  for (var mi = 0; mi < metrics.length; mi++) {
    var mx = mX + mi * (mW + mGap);
    sf(C.surface); doc.roundedRect(mx, y, mW, 18, 2, 2, 'F');
    st(C.accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text(metrics[mi][1], mx + mW / 2, y + 11, { align: 'center' });
    st(C.muted);  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(metrics[mi][0].toUpperCase(), mx + mW / 2, y + 16, { align: 'center' });
  }
  y += 26;

  // ── Barras de probabilidade ──
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

  // ── GradCAM ──
  sf(C.border); doc.rect(14, y, W - 28, 0.3, 'F'); y += 6;
  st(C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Mapa de Ativacao - GradCAM', 14, y);
  st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text('Regioes com maior peso na decisao da rede neural', 14, y + 5);
  y += 10;

  if (gradcamData) {
    var imgW = 84, imgH = 84, gap = 8;
    var iX   = (W - imgW * 2 - gap) / 2;

    // Original
    var origC = document.createElement('canvas');
    origC.width = origC.height = gradcamData.size;
    origC.getContext('2d').drawImage(gradcamData.originalImg, 0, 0, gradcamData.size, gradcamData.size);
    doc.addImage(origC.toDataURL('image/jpeg', 0.85), 'JPEG', iX, y, imgW, imgH);

    // Overlay
    var ovC    = document.createElement('canvas');
    ovC.width  = ovC.height = gradcamData.size;
    var ovCtx  = ovC.getContext('2d');
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

    // Labels e legenda
    st(C.muted); doc.setFontSize(7.5);
    doc.text('Original', iX + imgW / 2, y + imgH + 5, { align: 'center' });
    doc.text('GradCAM Sobreposicao', iX + imgW + gap + imgW / 2, y + imgH + 5, { align: 'center' });

    var lgX = iX, lgY = y + imgH + 9, lgW = imgW * 2 + gap;
    var gradColors = ['#0000ff', '#0088ff', '#00ffaa', '#aaff00', '#ffaa00', '#ff0000'];
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

  // ── Dados do paciente ──
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

  // ── Disclaimer ──
  if (y > 262) { doc.addPage(); y = 16; }
  doc.setFillColor(40, 33, 10);
  doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F');
  st(C.warning); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
  doc.text('AVISO', 18, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Resultado experimental com fins academicos. Nao substitui diagnostico medico especializado.', 18, y + 10);

  // ── Rodapé ──
  sf(C.border); doc.rect(14, 287, W - 28, 0.3, 'F');
  st(C.muted); doc.setFontSize(7);
  doc.text('Cancer Analytics - Plataforma Academica de Triagem por IA', 14, 292);
  doc.text('Pagina 1', W - 14, 292, { align: 'right' });

  var pid = p ? p.id : 'sem-paciente';
  doc.save('relatorio-' + pid + '-' + Date.now() + '.pdf');
}

/**
 * Converte hex color para array RGB.
 * @param {string} hex
 * @returns {number[]}
 */
function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}