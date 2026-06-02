// ============================================================
//  api.js - Adapter DALI API
//  Responsavel por toda comunicacao com a API DALI hospedada
//  no HuggingFace Space (wandraski/dali-space).
//  Unico arquivo que deve ser alterado em mudancas de contrato.
//  Depende de: config.js
// ============================================================

/**
 * Envia a imagem para o endpoint /predict-consensus da API DALI
 * e retorna a resposta bruta em JSON.
 *
 * Contrato de envio (multipart/form-data):
 *   - file             : binario da imagem
 *   - target_class_name: classe alvo para calculo do XAI ("ALL")
 *
 * @param {File} imageFile - arquivo selecionado pelo usuario
 * @returns {Promise<Object>} resposta bruta da API DALI
 */
async function callDALIAPI(imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('target_class_name', 'ALL');

    const response = await fetch(HF_CONFIG.BASE_URL + '/predict-consensus', {
        method: 'POST',
        body  : formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error('DALI API erro ' + response.status + ': ' + errorText);
    }

    const raw = await response.json();
    return raw;
}

/**
 * Interpreta a resposta da API DALI e normaliza para o formato
 * interno utilizado pelo restante do front-end.
 *
 * Contrato confirmado da API (campos raiz):
 * {
 *   request_id      : string,
 *   filename        : string,
 *   final_prediction: { label, score_all, score_hem, confidence_level, status },
 *   consensus       : { votes: { HEM, ALL }, weighted_probabilities: { HEM, ALL } },
 *   models          : [ { name, status, raw_predicted_label, xai?, ... } ],
 *   xai_consensus   : { all_models_returned_xai, models_with_valid_xai, ... },
 *   audit           : { ... }
 * }
 *
 * @param {Object} raw - resposta bruta retornada por callDALIAPI
 * @returns {{
 *   isPositive     : boolean,
 *   isInconclusive : boolean,
 *   confidence     : string,
 *   leukPct        : string,
 *   normPct        : string,
 *   votes          : Object,
 *   confidenceLevel: string,
 *   xaiArtifacts   : Object|null
 * }}
 */
function parseDALIResponse(raw) {
    if (!raw || !raw.final_prediction) {
        throw new Error('Resposta invalida ou vazia retornada pela API DALI.');
    }

    const prediction = raw.final_prediction;
    const label      = prediction.label;           // "ALL" ou "HEM"
    const scoreAll   = prediction.score_all || 0;
    const scoreHem   = prediction.score_hem || 0;
    const confLevel  = prediction.confidence_level || 'baixa';

    const isLeukemia   = label === 'ALL';
    const isInconclusive = confLevel === 'baixa';
    const isPositive   = isLeukemia && !isInconclusive;

    const leukPct    = (scoreAll * 100).toFixed(1);
    const normPct    = (scoreHem * 100).toFixed(1);
    const confidence = (Math.max(scoreAll, scoreHem) * 100).toFixed(1);

    // Votes vem de consensus.votes conforme contrato confirmado
    const votes = (raw.consensus && raw.consensus.votes)
        ? raw.consensus.votes
        : { ALL: 0, HEM: 0 };

    // Busca artefatos XAI percorrendo o array "models".
    // Caminho confirmado: model.xai.artifacts.overlay_png_base64
    var xaiArtifacts = null;
    var models       = raw.models || [];

    for (var i = 0; i < models.length; i++) {
        var model = models[i];

        if (
            model.xai &&
            model.xai.artifacts &&
            (model.xai.artifacts.overlay_png_base64 || model.xai.artifacts.grad_cam_png_base64)
        ) {
            xaiArtifacts = model.xai.artifacts;
            break;
        }
    }

    return {
        isPositive     : isPositive,
        isInconclusive : isInconclusive,
        confidence     : confidence,
        leukPct        : leukPct,
        normPct        : normPct,
        votes          : votes,
        confidenceLevel: confLevel,
        xaiArtifacts   : xaiArtifacts
    };
}

/**
 * Simula a resposta da API DALI para uso em desenvolvimento
 * enquanto USE_REAL_API = false em config.js.
 * Retorna objeto ja normalizado, no mesmo formato de parseDALIResponse.
 *
 * @returns {Promise<Object>}
 */
function mockDALIResponse() {
    return new Promise(function(resolve) {
        setTimeout(function() {
            const rand           = Math.random();
            const isLeuk         = rand > 0.45;
            const isInconclusive = !isLeuk && rand > 0.35;
            const scoreAll       = isLeuk         ? 0.85 + Math.random() * 0.13
                                 : isInconclusive ? 0.55 + Math.random() * 0.14
                                 :                  0.05 + Math.random() * 0.15;
            const scoreHem       = 1 - scoreAll;
            const confLevel      = scoreAll > 0.70 ? 'alta'
                                 : scoreAll > 0.50 ? 'moderada' : 'baixa';

            resolve({
                isPositive     : isLeuk && !isInconclusive,
                isInconclusive : isInconclusive,
                confidence     : (Math.max(scoreAll, scoreHem) * 100).toFixed(1),
                leukPct        : (scoreAll * 100).toFixed(1),
                normPct        : (scoreHem * 100).toFixed(1),
                votes          : { ALL: isLeuk ? 4 : 1, HEM: isLeuk ? 1 : 4 },
                confidenceLevel: confLevel,
                xaiArtifacts   : null
            });
        }, 3000);
    });
}