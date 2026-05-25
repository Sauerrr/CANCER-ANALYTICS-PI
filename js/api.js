// ════════════════════════════════════════════════════════════
//  api.js — Adapter HuggingFace Inference API
//  Este é o único arquivo que muda quando o modelo for hospedado.
//  Depende de: config.js
// ════════════════════════════════════════════════════════════

/**
 * Chama a Inference API do HuggingFace com a imagem.
 *
 * A API de image-classification retorna um array ordenado por score:
 * [
 *   { "label": "ALL", "score": 0.9632 },
 *   { "label": "hem", "score": 0.0368 }
 * ]
 *
 * @param {File} imageFile
 * @returns {Promise<ParsedResult>}
 */
async function callHuggingFaceAPI(imageFile) {
  var url     = HF_CONFIG.BASE_URL + HF_CONFIG.MODEL_ID;
  var headers = { 'Content-Type': imageFile.type };

  if (HF_CONFIG.API_KEY) {
    headers['Authorization'] = 'Bearer ' + HF_CONFIG.API_KEY;
  }

  var response = await fetch(url, {
    method:  'POST',
    headers: headers,
    body:    imageFile  // envia o binário direto
  });

  if (!response.ok) {
    var errText = await response.text();
    throw new Error('HuggingFace API erro ' + response.status + ': ' + errText);
  }

  var predictions = await response.json();
  return parseHFResponse(predictions);
}

/**
 * Interpreta a resposta da API e normaliza para o formato
 * que o resto do front espera.
 *
 * @param {Array<{label: string, score: number}>} predictions
 * @returns {{ isPositive, isInconclusive, confidence, leukPct, normPct, rawLabel, rawScore }}
 */
function parseHFResponse(predictions) {
  if (!predictions || predictions.length === 0) {
    throw new Error('Resposta vazia da API');
  }

  var top      = predictions[0];
  var rawLabel = top.label;
  var rawScore = top.score;

  var labelUpper = rawLabel.toUpperCase();
  var isLeukemia = HF_CONFIG.LEUKEMIA_LABELS.some(function(l) {
    return l.toUpperCase() === labelUpper;
  });
  var isNormal = HF_CONFIG.NORMAL_LABELS.some(function(l) {
    return l.toUpperCase() === labelUpper;
  });

  if (!isLeukemia && !isNormal) {
    console.warn('[HF] Label nao mapeado: "' + rawLabel + '". Ajuste HF_CONFIG em config.js.');
  }

  var confidence     = rawScore * 100;
  var isInconclusive = rawScore < HF_CONFIG.INCONCLUSIVE_THRESHOLD;
  var isPositive     = isLeukemia && !isInconclusive;

  // Soma scores por categoria (pode vir mais de 2 labels)
  var leukScore = 0, normScore = 0;
  predictions.forEach(function(p) {
    var lbl = p.label.toUpperCase();
    if (HF_CONFIG.LEUKEMIA_LABELS.some(function(l) { return l.toUpperCase() === lbl; })) {
      leukScore += p.score;
    } else if (HF_CONFIG.NORMAL_LABELS.some(function(l) { return l.toUpperCase() === lbl; })) {
      normScore += p.score;
    }
  });

  // Fallback se só veio 1 label
  if (leukScore === 0 && normScore === 0) {
    leukScore = isLeukemia ? rawScore : 1 - rawScore;
    normScore = 1 - leukScore;
  }

  var total   = leukScore + normScore || 1;
  var leukPct = ((leukScore / total) * 100).toFixed(1);
  var normPct = ((normScore / total) * 100).toFixed(1);

  return {
    isPositive:     isPositive,
    isInconclusive: isInconclusive,
    confidence:     confidence.toFixed(1),
    leukPct:        leukPct,
    normPct:        normPct,
    rawLabel:       rawLabel,
    rawScore:       rawScore
  };
}

/**
 * Mock local — simula resposta da API enquanto USE_REAL_API = false.
 * Remover quando o modelo estiver hospedado.
 *
 * @returns {Promise<Array<{label, score}>>}
 */
function mockAPIResponse() {
  return new Promise(function(resolve) {
    setTimeout(function() {
      var rand      = Math.random();
      var isLeuk    = rand > 0.45;
      var isInconc  = !isLeuk && rand > 0.35;
      var score     = isLeuk   ? 0.85 + Math.random() * 0.13
                    : isInconc ? 0.55 + Math.random() * 0.14
                    :            0.86 + Math.random() * 0.12;
      var leukLabel = isLeuk || isInconc ? 'ALL' : 'hem';
      var normLabel = isLeuk || isInconc ? 'hem' : 'ALL';

      resolve([
        { label: leukLabel, score: isLeuk || isInconc ? score : 1 - score },
        { label: normLabel, score: isLeuk || isInconc ? 1 - score : score }
      ]);
    }, 3200);
  });
}