// ============================================================
//  pdf.js - Geracao do relatorio PDF
//  Utiliza a biblioteca jsPDF (carregada via CDN sob demanda).
//  Layout redesenhado: documento medico profissional,
//  fundo branco, tipografia hierarquica, secoes bem definidas.
//  Depende de: config.js (lastResult, gradcamData, currentUser)
// ============================================================

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

function buildPDF() {
    var jsPDF = window.jspdf.jsPDF;
    var doc   = new jsPDF({ unit: 'mm', format: 'a4' });
    var W = 210, H = 297;
    var r = lastResult, p = r.patient;

    // ----------------------------------------------------------
    // Paleta: documento medico profissional (fundo branco)
    // ----------------------------------------------------------
    var C = {
        headerBg   : [15,  40,  80],    // azul escuro institucional
        headerText : [255, 255, 255],
        accent     : [30,  100, 200],   // azul medio para destaques
        accentLight: [220, 232, 252],   // azul muito claro para fundos
        danger     : [192,  30,  46],   // vermelho medico
        dangerLight: [255, 235, 237],
        success    : [22,  130,  80],   // verde medico
        successLight:[225, 247, 237],
        warning    : [180, 110,   0],   // amarelo escuro legivel
        warningLight:[255, 248, 220],
        text       : [30,   30,  30],   // texto principal
        muted      : [110, 110, 120],   // texto secundario
        border     : [210, 215, 225],   // bordas suaves
        rowEven    : [247, 249, 252],   // linhas alternadas tabela
        white      : [255, 255, 255],
        pageNum    : [160, 160, 175]
    };

    var resultColor = r.result === 'POSITIVO' ? C.danger
                    : r.result === 'NEGATIVO'  ? C.success
                    : C.warning;
    var resultBg    = r.result === 'POSITIVO' ? C.dangerLight
                    : r.result === 'NEGATIVO'  ? C.successLight
                    : C.warningLight;
    var resultLabel = r.result === 'POSITIVO' ? 'INDICIOS DE LEUCEMIA DETECTADOS'
                    : r.result === 'NEGATIVO'  ? 'CELULAS HEMATOLOGICAS NORMAIS'
                    : 'RESULTADO INCONCLUSIVO';

    // Atalhos
    function sf(c) { doc.setFillColor(c[0], c[1], c[2]); }
    function st(c) { doc.setTextColor(c[0], c[1], c[2]); }
    function sd(c) { doc.setDrawColor(c[0], c[1], c[2]); }
    function line(x1, y1, x2, y2, color) {
        sd(color || C.border); doc.setLineWidth(0.3); doc.line(x1, y1, x2, y2);
    }
    function sectionTitle(txt, yPos) {
        st(C.accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text(txt.toUpperCase(), 14, yPos);
        line(14, yPos + 1.5, W - 14, yPos + 1.5, C.accent);
        return yPos + 7;
    }

    var y = 0;

    // ==========================================================
    // CABECALHO
    // ==========================================================
    sf(C.headerBg); doc.rect(0, 0, W, 28, 'F');

    // Barra lateral colorida de resultado
    var barColor = r.result === 'POSITIVO' ? C.danger
                 : r.result === 'NEGATIVO'  ? [22, 160, 100]
                 : [220, 160, 0];
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.rect(0, 0, 5, 28, 'F');

    // Logo / titulo
    st(C.headerText); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('Cancer', 13, 11);
    doc.setFontSize(16); doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 195, 255);
    doc.text('Analytics', 13 + doc.getTextWidth('Cancer') + 1.5, 11);

    st([180, 210, 255]); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('Plataforma de Triagem Hematologica por IA', 13, 17);
    doc.text('Uso exclusivamente academico e experimental', 13, 22);

    // Metadados direita
    st([180, 210, 255]); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    var rid = p ? p.id : 'N/A';
    doc.text('Emitido em: ' + r.date,       W - 12, 11, { align: 'right' });
    doc.text('Responsavel: ' + r.analyst,   W - 12, 16, { align: 'right' });
    doc.text('ID Paciente: ' + rid,         W - 12, 21, { align: 'right' });

    y = 35;

    // ==========================================================
    // BADGE DE RESULTADO PRINCIPAL
    // ==========================================================
    sf(resultBg); sd(resultColor);
    doc.setLineWidth(0.6);
    doc.roundedRect(14, y, W - 28, 22, 3, 3, 'FD');

    // Icone visual (quadrado colorido substituindo icone real)
    doc.setFillColor(resultColor[0], resultColor[1], resultColor[2]);
    doc.roundedRect(20, y + 5.5, 11, 11, 1.5, 1.5, 'F');
    st(C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    var icon = r.result === 'POSITIVO' ? '!' : r.result === 'NEGATIVO' ? 'N' : '?';
    doc.text(icon, 25.5, y + 13, { align: 'center' });

    st(resultColor);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(resultLabel, 36, y + 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    st(C.muted);
    var subtext = r.result === 'POSITIVO'
        ? 'Imagem analisada apresenta caracteristicas associadas a leucemia linfoide aguda (ALL).'
        : r.result === 'NEGATIVO'
        ? 'Nenhuma caracteristica patologica relevante identificada na amostra analisada.'
        : 'Nivel de confianca insuficiente para determinacao conclusiva. Repetir exame.';
    doc.text(subtext, 36, y + 17);

    y += 29;

    // ==========================================================
    // METRICAS EM CARDS (3 colunas)
    // ==========================================================
    y = sectionTitle('Indicadores de Desempenho do Modelo', y);

    var cardW = 55, cardGap = 6;
    var cardX = (W - (cardW * 3 + cardGap * 2)) / 2;
    var metrics = [
        { label: 'Confianca da Analise', value: r.confidence.toFixed(1) + '%', sub: 'score da predicao atual', color: resultColor },
        { label: 'Acuracia do Modelo',   value: r.acc + '%',                   sub: 'conjunto de validacao',   color: C.accent    },
        { label: 'F1-Score',             value: r.f1  + '%',                   sub: 'media harmonica P/R',     color: C.accent    }
    ];

    for (var mi = 0; mi < metrics.length; mi++) {
        var mx = cardX + mi * (cardW + cardGap);
        var m  = metrics[mi];
        // Sombra simulada
        sf([225, 230, 240]); doc.roundedRect(mx + 0.8, y + 0.8, cardW, 20, 2, 2, 'F');
        // Card
        sf(C.white); sd(C.border); doc.setLineWidth(0.3);
        doc.roundedRect(mx, y, cardW, 20, 2, 2, 'FD');
        // Barra de cor no topo do card
        doc.setFillColor(m.color[0], m.color[1], m.color[2]);
        doc.roundedRect(mx, y, cardW, 3, 2, 2, 'F');
        doc.rect(mx, y + 1.5, cardW, 1.5, 'F'); // cobre cantos inferiores da barra
        // Valor
        st(m.color); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
        doc.text(m.value, mx + cardW / 2, y + 13, { align: 'center' });
        // Label
        st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
        doc.text(m.label.toUpperCase(), mx + cardW / 2, y + 17.5, { align: 'center' });
    }
    y += 27;

    // ==========================================================
    // PROBABILIDADES (barras horizontais)
    // ==========================================================
    y = sectionTitle('Probabilidades por Classe', y);

    var barMargin = 14, barW2 = W - barMargin * 2 - 32;
    var labelCol  = barMargin, valueCol = barMargin + 28, barCol = valueCol + 4, barRight = W - barMargin;

    // Linha ALL
    sf(C.rowEven); doc.rect(14, y - 3, W - 28, 10, 'F');
    st(C.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('ALL', labelCol, y + 3.5);
    st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('Leucemia', labelCol, y + 7);

    // Barra fundo
    var bx = barCol + 12, bw = barRight - bx - 18;
    sf(C.border); doc.roundedRect(bx, y + 0.5, bw, 5, 1, 1, 'F');
    // Barra preenchida
    doc.setFillColor(C.danger[0], C.danger[1], C.danger[2]);
    var wAll = bw * parseFloat(r.leukPct) / 100;
    if (wAll > 2) doc.roundedRect(bx, y + 0.5, wAll, 5, 1, 1, 'F');
    // Percentual
    st(C.danger); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(r.leukPct + '%', barRight - 1, y + 5, { align: 'right' });
    y += 12;

    // Linha HEM
    st(C.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('HEM', labelCol, y + 3.5);
    st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('Normal', labelCol, y + 7);

    sf(C.border); doc.roundedRect(bx, y + 0.5, bw, 5, 1, 1, 'F');
    doc.setFillColor(C.success[0], C.success[1], C.success[2]);
    var wHem = bw * parseFloat(r.normPct) / 100;
    if (wHem > 2) doc.roundedRect(bx, y + 0.5, wHem, 5, 1, 1, 'F');
    st(C.success); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(r.normPct + '%', barRight - 1, y + 5, { align: 'right' });
    y += 12;

    // Votos da junta
    if (r.votes) {
        sf(C.accentLight); doc.roundedRect(14, y, W - 28, 8, 1.5, 1.5, 'F');
        st(C.accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
        doc.text('Junta de Modelos (5 redes neurais):', 19, y + 5.5);
        st(C.text); doc.setFont('helvetica', 'normal');
        doc.text(
            'Votos ALL: ' + (r.votes.ALL || 0) + '   |   Votos HEM: ' + (r.votes.HEM || 0),
            19 + doc.getTextWidth('Junta de Modelos (5 redes neurais):') + 3, y + 5.5
        );
        y += 13;
    }

    // ==========================================================
    // GRADCAM
    // ==========================================================
    y = sectionTitle('Mapa de Ativacao XAI (GradCAM)', y);

    var gradcanvas = document.getElementById('gradcam-canvas');

    if (gradcamData && gradcanvas && gradcanvas.width > 0) {
        var imgSize = 76;
        var totalImgW = imgSize * 2 + 8;
        var imgStartX = (W - totalImgW) / 2;
        var imgY = y;

        // Moldura original
        sf(C.white); sd(C.border); doc.setLineWidth(0.4);
        doc.rect(imgStartX - 1, imgY - 1, imgSize + 2, imgSize + 2, 'FD');

        var previewImg = document.querySelector('#preview-img-wrap img');
        if (previewImg) {
            var origC = document.createElement('canvas');
            origC.width = origC.height = 480;
            origC.getContext('2d').drawImage(previewImg, 0, 0, 480, 480);
            doc.addImage(origC.toDataURL('image/jpeg', 0.9), 'JPEG', imgStartX, imgY, imgSize, imgSize);
        }

        // Moldura overlay
        sf(C.white); sd(resultColor); doc.setLineWidth(0.6);
        doc.rect(imgStartX + imgSize + 6, imgY - 1, imgSize + 2, imgSize + 2, 'FD');
        doc.addImage(gradcanvas.toDataURL('image/jpeg', 0.9), 'JPEG',
            imgStartX + imgSize + 7, imgY, imgSize, imgSize);

        // Labels
        st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.text('Imagem Original',          imgStartX + imgSize / 2,       imgY + imgSize + 5, { align: 'center' });
        doc.text('GradCAM Overlay (DALI XAI)', imgStartX + imgSize + 7 + imgSize / 2, imgY + imgSize + 5, { align: 'center' });

        // Legenda de cores (gradiente)
        var lgY = imgY + imgSize + 9, lgX = imgStartX, lgW2 = totalImgW;
        var stops = ['#0033cc','#0099ff','#00ffcc','#aaff00','#ffcc00','#ff3300'];
        var segW  = lgW2 / stops.length;
        for (var gi = 0; gi < stops.length; gi++) {
            var rgb = hexToRgb(stops[gi]);
            doc.setFillColor(rgb[0], rgb[1], rgb[2]);
            doc.rect(lgX + gi * segW, lgY, segW, 3, 'F');
        }
        st(C.muted); doc.setFontSize(6.5);
        doc.text('Baixa ativacao', lgX,          lgY + 7);
        doc.text('Alta ativacao',  lgX + lgW2,   lgY + 7, { align: 'right' });

        y += imgSize + 18;
    } else {
        sf(C.rowEven); doc.roundedRect(14, y, W - 28, 10, 1.5, 1.5, 'F');
        st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text('Mapa de ativacao XAI nao disponivel para este resultado.', W / 2, y + 6.5, { align: 'center' });
        y += 16;
    }

    // ==========================================================
    // DADOS DO PACIENTE (tabela alternada)
    // ==========================================================
    y = sectionTitle('Dados do Paciente', y);

    var fields = p ? [
        ['Nome Completo',   p.name],
        ['ID do Paciente',  p.id],
        ['Idade',           p.age + ' anos'],
        ['Sexo',            p.sex === 'F' ? 'Feminino' : 'Masculino'],
        ['Tipo Sanguineo',  p.blood_type],
        ['Historico Clinico', p.diagnosis_history],
        ['Arquivo Analisado', r.fileName],
        ['Modelo de IA',    r.model]
    ] : [
        ['Paciente',         'Nao vinculado ao exame'],
        ['Arquivo Analisado', r.fileName],
        ['Modelo de IA',     r.model]
    ];

    var rowH = 7.5;
    // Cabecalho da tabela
    sf(C.accent); doc.rect(14, y, W - 28, rowH, 'F');
    st(C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text('Campo', 19, y + 5);
    doc.text('Valor', W - 19, y + 5, { align: 'right' });
    y += rowH;

    for (var fi = 0; fi < fields.length; fi++) {
        var rowBg = fi % 2 === 0 ? C.white : C.rowEven;
        sf(rowBg); doc.rect(14, y, W - 28, rowH, 'F');
        sd(C.border); doc.setLineWidth(0.2);
        doc.rect(14, y, W - 28, rowH, 'S');

        st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        doc.text(fields[fi][0], 19, y + 5);

        st(C.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
        var val = String(fields[fi][1]);
        // Trunca valores muito longos
        if (doc.getTextWidth(val) > 90) val = val.substring(0, 55) + '...';
        doc.text(val, W - 19, y + 5, { align: 'right' });
        y += rowH;
    }
    y += 7;

    // ==========================================================
    // AVISO LEGAL
    // ==========================================================
    if (y > 255) { doc.addPage(); y = 16; }

    sd(C.warning); doc.setLineWidth(0.5);
    doc.setFillColor(C.warningLight[0], C.warningLight[1], C.warningLight[2]);
    doc.roundedRect(14, y, W - 28, 16, 2, 2, 'FD');

    st(C.warning); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text('AVISO IMPORTANTE', 19, y + 6);
    st([100, 70, 0]); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(
        'Este relatorio e gerado por inteligencia artificial com fins exclusivamente academicos e experimentais.',
        19, y + 11
    );
    doc.text(
        'Nao substitui avaliacao, diagnostico ou prescricao de profissional de saude habilitado.',
        19, y + 15
    );
    y += 22;

    // ==========================================================
    // RODAPE
    // ==========================================================
    sf(C.headerBg); doc.rect(0, H - 12, W, 12, 'F');
    st([150, 185, 240]); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.text('Cancer Analytics — Plataforma Academica de Triagem Hematologica por IA', 14, H - 5.5);
    doc.text('Pagina 1 de 1', W - 14, H - 5.5, { align: 'right' });

    // Linha divisoria acima do rodape
    sf([50, 100, 200]); doc.rect(0, H - 13, W, 1, 'F');

    // ==========================================================
    // SALVA
    // ==========================================================
    var patientId = p ? p.id : 'sem-paciente';
    doc.save('relatorio-' + patientId + '-' + Date.now() + '.pdf');
}

function hexToRgb(hex) {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ];
}