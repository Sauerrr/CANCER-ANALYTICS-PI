// ============================================================
//  gradcam.js - Renderizacao dos mapas de ativacao XAI
//  Responsavel por exibir os artefatos de explicabilidade
//  retornados pela API DALI em base64.
//
//  A API DALI retorna os seguintes artefatos por modelo:
//    - overlay_png_base64       : imagem original + heatmap sobrepostos
//    - grad_cam_png_base64      : mapa de ativacao puro (GradCAM)
//    - guided_gradcam_png_base64: GradCAM guiado por backpropagation
//
//  Este modulo nao gera mais heatmaps sinteticos. Exibe
//  diretamente o que a API retorna.
//  Depende de: config.js
// ============================================================

/**
 * Inicializa o painel GradCAM com os artefatos recebidos da API DALI.
 * Armazena os dados em gradcamData e renderiza o modo padrao (overlay).
 *
 * @param {Object} xaiArtifacts - objeto xai.artifacts de um modelo da resposta DALI
 * {
 *   overlay_png_base64       : string,
 *   grad_cam_png_base64      : string,
 *   guided_gradcam_png_base64: string
 * }
 * @param {string} originalImageSrc - src da imagem original (dataURL do preview)
 */
function initGradCAM(xaiArtifacts, originalImageSrc) {
    const loading = document.getElementById('gradcam-loading');
    loading.classList.add('show');

    gradcamData = {
        // Imagem original carregada pelo usuario, usada no modo "original"
        originalSrc: originalImageSrc,

        // Artefatos XAI em base64 retornados pela API DALI.
        // Prefixo data:image/png;base64, adicionado para uso direto em <img>.
        overlaySrc      : 'data:image/png;base64,' + xaiArtifacts.overlay_png_base64,
        gradcamSrc      : 'data:image/png;base64,' + xaiArtifacts.grad_cam_png_base64,
        guidedGradcamSrc: 'data:image/png;base64,' + (xaiArtifacts.guided_gradcam_png_base64 || xaiArtifacts.grad_cam_png_base64)
    };

    loading.classList.remove('show');
    setGradcamMode('overlay');
}

/**
 * Exibe uma mensagem de indisponibilidade no painel GradCAM.
 * Chamada quando a API nao retorna artefatos XAI validos.
 */
function showGradCAMUnavailable() {
    const loading = document.getElementById('gradcam-loading');
    loading.classList.remove('show');

    const canvas = document.getElementById('gradcam-canvas');
    const ctx    = canvas.getContext('2d');
    canvas.width  = 480;
    canvas.height = 480;

    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, 480, 480);

    ctx.fillStyle = '#3d4460';
    ctx.font      = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('XAI nao disponivel para este resultado.', 240, 240);
}

/**
 * Alterna entre os modos de visualizacao do painel GradCAM
 * e atualiza os botoes de controle.
 *
 * Modos disponiveis:
 *   original  : imagem enviada pelo usuario sem processamento
 *   heatmap   : mapa de ativacao GradCAM puro
 *   overlay   : sobreposicao do heatmap sobre a imagem original (padrao)
 *   guided    : GradCAM guiado por backpropagation
 *
 * @param {string} mode - identificador do modo desejado
 */
function setGradcamMode(mode) {
    if (!gradcamData) return;

    gradcamMode = mode;

    // Atualiza estado visual dos botoes de controle
    ['original', 'heatmap', 'overlay', 'guided'].forEach(function(m) {
        const btn = document.getElementById('btn-' + m);
        if (btn) btn.classList.toggle('active', m === mode);
    });

    // Seleciona a fonte da imagem conforme o modo
    const srcMap = {
        original: gradcamData.originalSrc,
        heatmap  : gradcamData.gradcamSrc,
        overlay  : gradcamData.overlaySrc,
        guided   : gradcamData.guidedGradcamSrc
    };

    const src = srcMap[mode];
    if (!src) return;

    // Carrega a imagem e desenha no canvas para manter consistencia
    // com o restante do pipeline (PDF usa canvas.toDataURL)
    const img    = new Image();
    img.onload   = function() {
        const canvas  = document.getElementById('gradcam-canvas');
        canvas.width  = img.naturalWidth  || 480;
        canvas.height = img.naturalHeight || 480;
        const ctx     = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.onerror = function() {
        showGradCAMUnavailable();
    };
    img.src = src;
}