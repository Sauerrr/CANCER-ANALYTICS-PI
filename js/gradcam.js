// ════════════════════════════════════════════════════════════
//  gradcam.js — GradCAM simulado via Canvas API
//  Depende de: config.js (gradcamData, gradcamMode)
// ════════════════════════════════════════════════════════════

/**
 * Gera o heatmap simulado sobre a imagem e armazena em gradcamData.
 *
 * @param {string}  imageSrc       - src da imagem (dataURL)
 * @param {boolean} isPositive
 * @param {boolean} isInconclusive
 */
function generateGradCAM(imageSrc, isPositive, isInconclusive) {
  var loading = document.getElementById('gradcam-loading');
  loading.classList.add('show');

  var img    = new Image();
  img.onload = function() {
    var SIZE = 480;

    // Heatmap canvas
    var heatCanvas    = document.createElement('canvas');
    heatCanvas.width  = SIZE;
    heatCanvas.height = SIZE;
    var heatCtx       = heatCanvas.getContext('2d');

    heatCtx.fillStyle = '#000';
    heatCtx.fillRect(0, 0, SIZE, SIZE);

    // Blobs quentes (vermelho/laranja) — centro da imagem
    var blobCount = isPositive ? 6 : isInconclusive ? 3 : 2;
    var maxRadius = isPositive ? 120 : isInconclusive ? 90 : 70;

    for (var i = 0; i < blobCount; i++) {
      var cx    = SIZE * (0.25 + Math.random() * 0.5);
      var cy    = SIZE * (0.25 + Math.random() * 0.5);
      var r     = maxRadius * (0.5 + Math.random() * 0.5);
      var alpha = isPositive ? 0.55 + Math.random() * 0.35 : 0.3 + Math.random() * 0.3;
      drawHotBlob(heatCtx, cx, cy, r, alpha, isPositive);
    }

    // Blobs frios (azul/ciano) — bordas da imagem
    for (var j = 0; j < 4; j++) {
      var leftSide = Math.random() < 0.5;
      var cx2 = leftSide ? Math.random() * SIZE * 0.2 : SIZE * 0.8 + Math.random() * SIZE * 0.2;
      var cy2 = SIZE * (0.1 + Math.random() * 0.8);
      var r2  = 60 + Math.random() * 60;
      drawCoolBlob(heatCtx, cx2, cy2, r2, 0.4 + Math.random() * 0.3);
    }

    // Canvas suavizado (blur via filter)
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

/**
 * Desenha um blob de alta ativação (quente).
 */
function drawHotBlob(ctx, cx, cy, r, alpha, isPositive) {
  var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  if (isPositive) {
    grad.addColorStop(0,   'rgba(255,  30,  30, ' + alpha + ')');
    grad.addColorStop(0.3, 'rgba(255, 100,   0, ' + (alpha * 0.8) + ')');
    grad.addColorStop(0.6, 'rgba(255, 220,   0, ' + (alpha * 0.5) + ')');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
  } else {
    grad.addColorStop(0,   'rgba(255, 180,   0, ' + alpha + ')');
    grad.addColorStop(0.4, 'rgba(255, 220,  50, ' + (alpha * 0.7) + ')');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

/**
 * Desenha um blob de baixa ativação (frio).
 */
function drawCoolBlob(ctx, cx, cy, r, alpha) {
  var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0,   'rgba(  0, 120, 255, ' + alpha + ')');
  grad.addColorStop(0.5, 'rgba(  0, 200, 255, ' + (alpha * 0.6) + ')');
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

/**
 * Renderiza o canvas no modo selecionado: original | heatmap | overlay.
 *
 * @param {string} mode
 */
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
    // Overlay: imagem em escala de cinza + heatmap com blend screen
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