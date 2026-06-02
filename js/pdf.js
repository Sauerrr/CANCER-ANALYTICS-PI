// ============================================================
//  pdf.js - Geracao do relatorio PDF
//  Utiliza a biblioteca jsPDF (carregada via CDN sob demanda)
//  para compor e exportar o relatorio completo da analise,
//  incluindo resultado, metricas, GradCAM e dados do paciente.
//  Depende de: config.js (lastResult, gradcamData, currentUser)
// ============================================================

/**
 * Ponto de entrada para a geracao do PDF.
 * Carrega a biblioteca jsPDF via CDN caso ainda nao esteja
 * disponivel no escopo global, evitando carregamento desnecessario
 * em sessoes sem exportacao.
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
 * Constroi o documento PDF e aciona o download no navegador.
 * Estrutura do relatorio:
 *   1. Cabecalho com identidade visual e metadados da analise
 *   2. Badge do resultado e percentual de confianca
 *   3. Cards de metricas (acuracia, recall, F1-score)
 *   4. Barras de probabilidade ALL vs HEM
 *   5. Painel GradCAM com imagem original e overlay
 *   6. Tabela de dados do paciente vinculado
 *   7. Aviso de uso academico e rodape
 */
function buildPDF() {
    var jsPDF = window.jspdf.jsPDF;
    var doc   = new jsPDF({ unit: 'mm', format: 'a4' });
    var W     = 210; // largura A4 em mm
    var r     = lastResult;
    var p     = r.patient;

    // Paleta de cores alinhada ao design da interface
    var C = {
        bg     : [10,  13,  20],
        surface: [17,  21,  32],
        accent : [76, 180, 255],
        danger : [255,  91, 107],
        success: [77,  255, 195],
        warning: [255, 184,  77],
        muted  : [107, 116, 150],
        border : [40,   46,  68],
        white  : [255, 255, 255]
    };

    var resultColor = r.result === 'POSITIVO' ? C.danger
                    : r.result === 'NEGATIVO'  ? C.success
                    : C.warning;

    // Atalhos locais para reducao de verbosidade
    function sf(c) { doc.setFillColor(c[0], c[1], c[2]); }
    function st(c) { doc.setTextColor(c[0], c[1], c[2]); }

    var y = 0;

    // ----------------------------------------------------------
    // 1. Cabecalho
    // ----------------------------------------------------------
    sf(C.surface); doc.rect(0, 0, W, 36, 'F');
    sf(C.accent);  doc.rect(0, 0, 4, 36, 'F');

    st(C.accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text('Cancer', 12, 13);
    st(C.white);  doc.text('Analytics', 35, 13);

    st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('Plataforma de Triagem por IA - Uso Academico', 12, 19);
    doc.text('Emitido em: ' + r.date,    W - 12, 13, { align: 'right' });
    doc.text('Analista: '  + r.analyst,  W - 12, 19, { align: 'right' });

    sf(C.border); doc.rect(0, 36, W, 0.3, 'F');
    y = 44;

    // ----------------------------------------------------------
    // 2. Badge de resultado e confianca
    // ----------------------------------------------------------
    var bW = 80;
    sf(resultColor);
    doc.roundedRect(W / 2 - bW / 2, y, bW, 11, 2, 2, 'F');

    st(C.bg); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    var badgeLabel = r.result === 'POSITIVO' ? 'INDICIOS DE LEUCEMIA DETECTADOS'
                   : r.result === 'NEGATIVO'  ? 'CELULAS NORMAIS'
                   : 'RESULTADO INCONCLUSIVO';
    doc.text(badgeLabel, W / 2, y + 7.5, { align: 'center' });
    y += 16;

    st(resultColor); doc.setFontSize(26); doc.setFont('helvetica', 'bold');
    doc.text(r.confidence.toFixed(1) + '%', W / 2, y + 9, { align: 'center' });

    st(C.muted); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('confianca do modelo', W / 2, y + 16, { align: 'center' });
    y += 24;

    // ----------------------------------------------------------
    // 3. Cards de metricas
    // ----------------------------------------------------------
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

    // ----------------------------------------------------------
    // 4. Barras de probabilidade ALL vs HEM
    // ----------------------------------------------------------
    var barX = 14, barW = W - 28;

    st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('Leucemia (ALL)', barX, y + 4);
    doc.text(r.leukPct + '%', barX + barW, y + 4, { align: 'right' });
    sf(C.border); doc.roundedRect(barX, y + 6, barW, 4, 1, 1, 'F');
    sf(C.danger); doc.roundedRect(barX, y + 6, barW * parseFloat(r.leukPct) / 100, 4, 1, 1, 'F');
    y += 13;

    doc.text('Normal (HEM)', barX, y + 4);
    doc.text(r.normPct + '%', barX + barW, y + 4, { align: 'right' });
    sf(C.border);  doc.roundedRect(barX, y + 6, barW, 4, 1, 1, 'F');
    sf(C.success); doc.roundedRect(barX, y + 6, barW * parseFloat(r.normPct) / 100, 4, 1, 1, 'F');
    y += 16;

    // Votos da junta de modelos
    if (r.votes) {
        st(C.muted); doc.setFontSize(7.5);
        doc.text(
            'Votos da junta - ALL: ' + (r.votes.ALL || 0) + '  |  HEM: ' + (r.votes.HEM || 0),
            W / 2, y + 4, { align: 'center' }
        );
        y += 10;
    }

    // ----------------------------------------------------------
    // 5. Painel GradCAM
    // ----------------------------------------------------------
    sf(C.border); doc.rect(14, y, W - 28, 0.3, 'F'); y += 6;

    st(C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Mapa de Ativacao - GradCAM (DALI XAI)', 14, y);

    st(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('Regioes com maior peso na decisao do consenso de modelos', 14, y + 5);
    y += 10;

    // Exporta o canvas atual do GradCAM (modo ativo na interface)
    var gradcanvas = document.getElementById('gradcam-canvas');

    if (gradcamData && gradcanvas && gradcanvas.width > 0) {
        var imgW = 84, imgH = 84, gap = 8;
        var iX   = (W - imgW * 2 - gap) / 2;

        // Imagem original a partir do preview do upload
        var previewImg = document.querySelector('#preview-img-wrap img');
        if (previewImg) {
            var origC = document.createElement('canvas');
            origC.width = origC.height = 480;
            origC.getContext('2d').drawImage(previewImg, 0, 0, 480, 480);
            doc.addImage(origC.toDataURL('image/jpeg', 0.85), 'JPEG', iX, y, imgW, imgH);
        }

        // Overlay GradCAM do canvas ativo na interface
        doc.addImage(
            gradcanvas.toDataURL('image/jpeg', 0.85),
            'JPEG',
            iX + imgW + gap, y, imgW, imgH
        );

        st(C.muted); doc.setFontSize(7.5);
        doc.text('Original',         iX + imgW / 2,            y + imgH + 5, { align: 'center' });
        doc.text('GradCAM (overlay)', iX + imgW + gap + imgW / 2, y + imgH + 5, { align: 'center' });

        // Legenda de cores do mapa de ativacao
        var lgX = iX, lgY = y + imgH + 9, lgW = imgW * 2 + gap;
        var gradColors = ['#0000ff', '#0088ff', '#00ffaa', '#aaff00', '#ffaa00', '#ff0000'];
        for (var gi = 0; gi < gradColors.length; gi++) {
            var rgb = hexToRgb(gradColors[gi]);
            doc.setFillColor(rgb[0], rgb[1], rgb[2]);
            doc.rect(lgX + gi * (lgW / 6), lgY, lgW / 6, 3, 'F');
        }
        st(C.muted); doc.setFontSize(6.5);
        doc.text('Baixa ativacao', lgX,        lgY + 7);
        doc.text('Alta ativacao',  lgX + lgW,  lgY + 7, { align: 'right' });
        y += imgH + 20;

    } else {
        st(C.muted); doc.setFontSize(9);
        doc.text('GradCAM nao disponivel para este resultado.', W / 2, y + 8, { align: 'center' });
        y += 14;
    }

    // ----------------------------------------------------------
    // 6. Dados do paciente
    // ----------------------------------------------------------
    sf(C.border); doc.rect(14, y, W - 28, 0.3, 'F'); y += 6;

    st(C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Dados do Paciente', 14, y);
    y += 7;

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

    // ----------------------------------------------------------
    // 7. Aviso de uso academico e rodape
    // ----------------------------------------------------------
    if (y > 262) { doc.addPage(); y = 16; }

    doc.setFillColor(40, 33, 10);
    doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F');
    st(C.warning); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text('AVISO', 18, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(
        'Resultado experimental com fins academicos. Nao substitui diagnostico medico especializado.',
        18, y + 10
    );

    sf(C.border); doc.rect(14, 287, W - 28, 0.3, 'F');
    st(C.muted); doc.setFontSize(7);
    doc.text('Cancer Analytics - Plataforma Academica de Triagem por IA', 14, 292);
    doc.text('Pagina 1', W - 14, 292, { align: 'right' });

    // Nome do arquivo de saida com ID do paciente e timestamp
    var patientId = p ? p.id : 'sem-paciente';
    doc.save('relatorio-' + patientId + '-' + Date.now() + '.pdf');
}

/**
 * Converte uma cor hexadecimal para um array RGB.
 *
 * @param {string} hex - cor no formato "#rrggbb"
 * @returns {number[]} array [r, g, b] com valores de 0 a 255
 */
function hexToRgb(hex) {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ];
}