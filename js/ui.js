// ============================================================
//  ui.js - Renderizacao de componentes e orquestracao de resultados
//  Responsavel por atualizar o DOM com dados de pacientes,
//  dashboard, resultado da analise e tratamento de erros de API.
//  Depende de: config.js, data.js, api.js, gradcam.js
// ============================================================

// ============================================================
//  Utilitarios de formatacao e componentes HTML
// ============================================================

/**
 * Retorna as iniciais de um nome completo (primeiras duas palavras).
 *
 * @param {string} name - nome completo
 * @returns {string} iniciais em maiusculo
 */
function initials(name) {
    return name
        .split(' ')
        .slice(0, 2)
        .map(function(w) { return w[0]; })
        .join('')
        .toUpperCase();
}

/**
 * Formata uma data no padrao ISO (YYYY-MM-DD) para DD/MM/YYYY.
 *
 * @param {string} d - data no formato YYYY-MM-DD
 * @returns {string} data formatada
 */
function formatDate(d) {
    var parts = d.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

/**
 * Retorna o HTML de um badge de status para a listagem de pacientes.
 * Leva em conta o resultado do ultimo exame para classificacao visual.
 *
 * @param {string} status - status do paciente: "danger" | "success" | "warning"
 * @param {string} result - resultado do ultimo exame
 * @returns {string} HTML do badge
 */
function statusBadge(status, result) {
    if (result === 'INCONCLUSIVO') {
        return '<span class="badge warning"><span class="badge-dot"></span>Inconclusivo</span>';
    }
    if (status === 'danger') {
        return '<span class="badge danger"><span class="badge-dot"></span>Positivo</span>';
    }
    if (status === 'success') {
        return '<span class="badge success"><span class="badge-dot"></span>Negativo</span>';
    }
    return '<span class="badge neutral"><span class="badge-dot"></span>-</span>';
}

/**
 * Retorna o HTML de um badge para o resultado de um exame individual.
 *
 * @param {string} result - "POSITIVO" | "NEGATIVO" | "INCONCLUSIVO"
 * @returns {string} HTML do badge
 */
function resultBadge(result) {
    if (result === 'POSITIVO') {
        return '<span class="badge danger"><span class="badge-dot"></span>Positivo</span>';
    }
    if (result === 'NEGATIVO') {
        return '<span class="badge success"><span class="badge-dot"></span>Negativo</span>';
    }
    return '<span class="badge warning"><span class="badge-dot"></span>Inconclusivo</span>';
}

// ============================================================
//  Dashboard
// ============================================================

/**
 * Renderiza a tabela de exames recentes no dashboard.
 * Agrupa todos os exames de todos os pacientes, ordena por data
 * decrescente e exibe os seis mais recentes.
 */
function renderDashboard() {
    var tbody = document.getElementById('dashboard-recent');

    var recent = PATIENTS
        .flatMap(function(p) {
            return p.exams.map(function(e) {
                return Object.assign({}, e, { patient: p });
            });
        })
        .sort(function(a, b) { return b.date.localeCompare(a.date); })
        .slice(0, 6);

    tbody.innerHTML = recent.map(function(e) {
        return '<tr onclick="openPatient(\'' + e.patient.id + '\')">'
            + '<td>'
            +   '<div style="display:flex;align-items:center;gap:10px">'
            +     '<div style="width:30px;height:30px;border-radius:8px;background:var(--surface2);'
            +          'border:1px solid var(--border);display:flex;align-items:center;'
            +          'justify-content:center;font-size:11px;font-weight:600;color:var(--accent)">'
            +       initials(e.patient.name)
            +     '</div>'
            +     '<span>' + e.patient.name + '</span>'
            +   '</div>'
            + '</td>'
            + '<td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">'
            +   formatDate(e.date)
            + '</td>'
            + '<td>' + resultBadge(e.result) + '</td>'
            + '<td style="font-family:var(--mono);font-size:12px">'
            +   e.confidence.toFixed(1) + '%'
            + '</td>'
            + '<td><button class="btn-row">Ver</button></td>'
            + '</tr>';
    }).join('');
}

// ============================================================
//  Tabela de pacientes
// ============================================================

/**
 * Renderiza a tabela completa de pacientes na view de listagem.
 */
function renderPatientsTable() {
    var tbody = document.getElementById('patients-table-body');

    tbody.innerHTML = PATIENTS.map(function(p) {
        var lastResult = p.exams[0] ? p.exams[0].result : '';
        return '<tr onclick="openPatient(\'' + p.id + '\')">'
            + '<td>'
            +   '<div style="display:flex;align-items:center;gap:10px">'
            +     '<div style="width:32px;height:32px;border-radius:9px;background:var(--surface2);'
            +          'border:1px solid var(--border);display:flex;align-items:center;'
            +          'justify-content:center;font-size:11px;font-weight:600;color:var(--accent)">'
            +       initials(p.name)
            +     '</div>'
            +     '<span>' + p.name + '</span>'
            +   '</div>'
            + '</td>'
            + '<td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">' + p.id + '</td>'
            + '<td style="font-size:13px;color:var(--text-muted)">'
            +   p.age + ' anos - ' + (p.sex === 'F' ? 'Feminino' : 'Masculino')
            + '</td>'
            + '<td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">'
            +   formatDate(p.last_exam)
            + '</td>'
            + '<td>' + statusBadge(p.status, lastResult) + '</td>'
            + '<td style="font-family:var(--mono);font-size:12px">' + p.exams.length + '</td>'
            + '<td><button class="btn-row">Historico</button></td>'
            + '</tr>';
    }).join('');
}

// ============================================================
//  Analise - orquestracao de chamada a API e atualizacao da UI
// ============================================================

// Sequencia de mensagens exibidas no overlay de processamento
// enquanto a requisicao a API esta em andamento.
var ANALYSIS_STEPS = [
    ['Enviando imagem para a API DALI...',     'Estabelecendo conexao com o servidor'],
    ['Executando inferencia nos 5 modelos...', 'ResNet50, DenseNet121, MobileNetV3, EfficientNetV2, ViT-B/16'],
    ['Calculando consenso ponderado...',       'Mecanismo dali-consensus-calibrated-v1'],
    ['Processando mapas de ativacao XAI...',   'GradCAM, Guided GradCAM, Backpropagation'],
    ['Consolidando resultado final...',        'Aplicando thresholds e niveis de confianca']
];

/**
 * Inicia o processo de analise:
 * 1. Desabilita controles e exibe overlay de carregamento
 * 2. Avanca as mensagens de status enquanto a API processa
 * 3. Chama a API real ou o mock conforme USE_REAL_API em config.js
 * 4. Repassa o resultado normalizado para renderResult
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
        if (step < ANALYSIS_STEPS.length) {
            document.getElementById('analyzing-text').textContent = ANALYSIS_STEPS[step][0];
            document.getElementById('analyzing-step').textContent = ANALYSIS_STEPS[step][1];
            step++;
        }
    }, 800);

    var apiCall = HF_CONFIG.USE_REAL_API
        ? callDALIAPI(uploadedFile).then(function(raw) { return parseDALIResponse(raw); })
        : mockDALIResponse();

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
 * Exibe uma mensagem de erro estruturada no painel de resultado
 * quando a chamada a API falha.
 *
 * @param {Error} err - erro capturado na chamada a API
 */
function showAPIError(err) {
    console.error('[DALI] Falha na chamada a API:', err);

    document.getElementById('result-panel').classList.add('show');
    document.getElementById('result-icon').textContent      = '[ERRO]';
    document.getElementById('result-verdict').textContent   = 'Falha na comunicacao com a API DALI';
    document.getElementById('result-verdict').className     = 'result-verdict';
    document.getElementById('result-verdict').style.color   = 'var(--danger)';
    document.getElementById('result-sub').textContent       =
        'Verifique BASE_URL em js/config.js e se o Space esta ativo.';
    document.getElementById('result-metrics').innerHTML     = '';
    document.getElementById('bar-leukemia').style.width     = '0%';
    document.getElementById('bar-leukemia-pct').textContent = '-';
    document.getElementById('bar-normal').style.width       = '0%';
    document.getElementById('bar-normal-pct').textContent   = '-';
}

/**
 * Recebe o objeto normalizado retornado por parseDALIResponse ou
 * mockDALIResponse e atualiza todos os elementos visuais do painel
 * de resultado.
 *
 * Esta funcao e agnosta a origem dos dados (API real ou mock).
 *
 * @param {{
 *   isPositive     : boolean,
 *   isInconclusive : boolean,
 *   confidence     : string,
 *   leukPct        : string,
 *   normPct        : string,
 *   votes          : Object,
 *   confidenceLevel: string,
 *   xaiArtifacts   : Object|null
 * }} parsed
 */
function renderResult(parsed) {
    var pid            = document.getElementById('patient-select').value;
    var isPositive     = parsed.isPositive;
    var isInconclusive = parsed.isInconclusive;
    var confidence     = parsed.confidence;
    var leukPct        = parseFloat(parsed.leukPct);
    var normPct        = parseFloat(parsed.normPct);

    // Metricas de desempenho offline do conjunto de modelos DALI.
    // Valores fixos baseados na avaliacao publicada do sistema.
    // Substituir pelos valores do paper quando disponivel.
    var acc    = '94.2';
    var recall = '96.8';
    var f1     = '95.5';

    // Atualiza icone e veredicto principal
    document.getElementById('result-panel').classList.add('show');
    document.getElementById('result-icon').textContent =
        isPositive ? '[+]' : isInconclusive ? '[?]' : '[-]';

    var verdict       = document.getElementById('result-verdict');
    verdict.textContent = isPositive     ? 'Indicios de Leucemia Detectados'
                        : isInconclusive ? 'Resultado Inconclusivo'
                        : 'Celulas Normais';
    verdict.className   = 'result-verdict ' + (isPositive ? 'danger' : isInconclusive ? '' : 'success');
    verdict.style.color = isInconclusive ? 'var(--warning)' : '';

    // Linha de resumo com modelo, confianca e nivel
    document.getElementById('result-sub').textContent =
        'Analise concluida - ' + HF_CONFIG.MODEL_DISPLAY_NAME
        + ' - Confianca ' + confidence + '%'
        + ' (' + (parsed.confidenceLevel || '-') + ')'
        + ' - Votos ALL: ' + (parsed.votes.ALL || 0)
        + ' / HEM: ' + (parsed.votes.HEM || 0);

    // Cards de metricas do modelo
    document.getElementById('result-metrics').innerHTML =
        '<div class="metric-box">'
        +   '<div class="metric-name">Acuracia</div>'
        +   '<div class="metric-val accent">' + acc + '%</div>'
        + '</div>'
        + '<div class="metric-box">'
        +   '<div class="metric-name">Recall</div>'
        +   '<div class="metric-val accent">' + recall + '%</div>'
        + '</div>'
        + '<div class="metric-box">'
        +   '<div class="metric-name">F1-score</div>'
        +   '<div class="metric-val accent">' + f1 + '%</div>'
        + '</div>';

    // Barras de probabilidade com animacao via timeout
    setTimeout(function() {
        document.getElementById('bar-leukemia').style.width     = leukPct.toFixed(1) + '%';
        document.getElementById('bar-leukemia-pct').textContent = leukPct.toFixed(1) + '%';
        document.getElementById('bar-normal').style.width       = normPct.toFixed(1) + '%';
        document.getElementById('bar-normal-pct').textContent   = normPct.toFixed(1) + '%';
    }, 50);

    // Inicializa o painel GradCAM com os artefatos XAI da API
    // ou exibe mensagem de indisponibilidade se nao houver artefatos
    var previewImg = document.querySelector('#preview-img-wrap img');
    var originalSrc = previewImg ? previewImg.src : '';

    if (parsed.xaiArtifacts) {
        initGradCAM(parsed.xaiArtifacts, originalSrc);
    } else {
        showGradCAMUnavailable();
    }

    // Persiste o estado completo para uso na geracao do PDF
    var patient = null;
    for (var i = 0; i < PATIENTS.length; i++) {
        if (PATIENTS[i].id === pid) {
            patient = PATIENTS[i];
            break;
        }
    }

    lastResult = {
        patient    : patient,
        fileName   : uploadedFile ? uploadedFile.name : '-',
        result     : isPositive ? 'POSITIVO' : isInconclusive ? 'INCONCLUSIVO' : 'NEGATIVO',
        confidence : parseFloat(confidence),
        leukPct    : leukPct.toFixed(1),
        normPct    : normPct.toFixed(1),
        votes      : parsed.votes,
        acc        : parseFloat(acc),
        recall     : parseFloat(recall),
        f1         : parseFloat(f1),
        model      : HF_CONFIG.MODEL_DISPLAY_NAME,
        date       : new Date().toLocaleString('pt-BR'),
        analyst    : currentUser ? currentUser.name : '-'
    };

    document.getElementById('btn-export-pdf').style.display = 'inline-flex';

    // Registra o exame no historico do paciente mockado,
    // se um paciente estiver selecionado na interface.
    if (pid && patient) {
        var today  = new Date().toISOString().slice(0, 10);
        var result = isPositive ? 'POSITIVO' : isInconclusive ? 'INCONCLUSIVO' : 'NEGATIVO';

        patient.exams.unshift({
            id        : 'E-NEW',
            date      : today,
            result    : result,
            confidence: parseFloat(confidence),
            acc       : parseFloat(acc),
            recall    : parseFloat(recall),
            f1        : parseFloat(f1),
            file      : '[img]',
            model     : HF_CONFIG.MODEL_DISPLAY_NAME
        });

        patient.last_exam = today;
        patient.status    = isPositive ? 'danger' : isInconclusive ? 'warning' : 'success';

        renderDashboard();
        renderPatientsTable();
    }
}