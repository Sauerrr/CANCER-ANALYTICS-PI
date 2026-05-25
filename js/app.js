// ════════════════════════════════════════════════════════════
//  app.js — Ponto de entrada
//  Navegação, upload e event listeners.
//  Carregado por ÚLTIMO no index.html.
// ════════════════════════════════════════════════════════════

// ─── NAVEGAÇÃO ────────────────────────────────────────────────

function switchView(id, btn) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });

  var view = document.getElementById('view-' + id);
  if (view) {
    view.classList.add('active');
    void view.offsetWidth; // reflow para reiniciar animação CSS
    view.classList.add('fade-in');
  }
  if (btn) btn.classList.add('active');
}

// ─── UPLOAD ───────────────────────────────────────────────────

function handleFile(file) {
  uploadedFile = file;
  document.getElementById('upload-preview').classList.add('show');
  document.getElementById('preview-name').textContent = file.name;
  document.getElementById('preview-size').textContent = (file.size / 1024).toFixed(1) + ' KB';

  var reader    = new FileReader();
  reader.onload = function(e) {
    document.getElementById('preview-img-wrap').innerHTML =
      '<img src="' + e.target.result + '" alt="preview">';
  };
  reader.readAsDataURL(file);

  document.getElementById('btn-analyze').disabled         = false;
  document.getElementById('result-panel').classList.remove('show');
  document.getElementById('btn-export-pdf').style.display = 'none';
  gradcamData = null;
}

function clearUpload() {
  uploadedFile = null;
  lastResult   = null;
  gradcamData  = null;

  document.getElementById('upload-file').value            = '';
  document.getElementById('upload-preview').classList.remove('show');
  document.getElementById('preview-img-wrap').innerHTML   = '🔬';
  document.getElementById('btn-analyze').disabled         = true;
  document.getElementById('result-panel').classList.remove('show');
  document.getElementById('btn-export-pdf').style.display = 'none';
}

// ─── EVENT LISTENERS ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {

  // Enter no campo de senha
  document.getElementById('input-password').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });

  // Seleção de arquivo
  document.getElementById('upload-file').addEventListener('change', function() {
    if (this.files[0]) handleFile(this.files[0]);
  });

  // Drag & drop
  var uploadArea = document.getElementById('upload-area');
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', function() {
    uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

});