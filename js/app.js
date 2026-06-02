// ============================================================
//  app.js - Ponto de entrada da aplicacao
//  Responsavel pela navegacao entre views, gerenciamento do
//  upload de imagens e registro dos event listeners globais.
//  Carregado por ultimo no index.html, apos todos os modulos.
//  Depende de: config.js e todos os demais modulos.
// ============================================================

// ============================================================
//  Navegacao
// ============================================================

/**
 * Ativa a view correspondente ao identificador informado e
 * marca o item de navegacao como ativo.
 * Remove o estado ativo de todas as views e itens antes de aplicar.
 *
 * @param {string}      id  - sufixo do id da view (ex: "dashboard" -> "view-dashboard")
 * @param {HTMLElement} btn - elemento do menu de navegacao a marcar como ativo
 */
function switchView(id, btn) {
    document.querySelectorAll('.view').forEach(function(v) {
        v.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(function(n) {
        n.classList.remove('active');
    });

    var view = document.getElementById('view-' + id);
    if (view) {
        view.classList.add('active');
        void view.offsetWidth; // forca reflow para reiniciar a animacao CSS
        view.classList.add('fade-in');
    }

    if (btn) btn.classList.add('active');
}

// ============================================================
//  Gerenciamento de upload de imagem
// ============================================================

/**
 * Processa o arquivo de imagem selecionado pelo usuario.
 * Exibe o preview, habilita o botao de analise e reseta
 * o painel de resultado de uma analise anterior.
 *
 * @param {File} file - arquivo de imagem selecionado
 */
function handleFile(file) {
    uploadedFile = file;

    document.getElementById('upload-preview').classList.add('show');
    document.getElementById('preview-name').textContent = file.name;
    document.getElementById('preview-size').textContent =
        (file.size / 1024).toFixed(1) + ' KB';

    var reader    = new FileReader();
    reader.onload = function(e) {
        document.getElementById('preview-img-wrap').innerHTML =
            '<img src="' + e.target.result + '" alt="Preview da imagem selecionada">';
    };
    reader.readAsDataURL(file);

    document.getElementById('btn-analyze').disabled         = false;
    document.getElementById('result-panel').classList.remove('show');
    document.getElementById('btn-export-pdf').style.display = 'none';
    gradcamData = null;
}

/**
 * Remove a imagem selecionada e reseta todos os estados
 * relacionados ao upload e ao resultado da analise anterior.
 */
function clearUpload() {
    uploadedFile = null;
    lastResult   = null;
    gradcamData  = null;

    document.getElementById('upload-file').value            = '';
    document.getElementById('upload-preview').classList.remove('show');
    document.getElementById('preview-img-wrap').innerHTML   = '[imagem]';
    document.getElementById('btn-analyze').disabled         = true;
    document.getElementById('result-panel').classList.remove('show');
    document.getElementById('btn-export-pdf').style.display = 'none';
}

// ============================================================
//  Registro de event listeners
//  Executado apos o DOM estar completamente carregado para
//  garantir que todos os elementos existam antes do bind.
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

    // Submissao do formulario de login via tecla Enter no campo de senha
    document.getElementById('input-password').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') doLogin();
    });

    // Selecao de arquivo via input file
    document.getElementById('upload-file').addEventListener('change', function() {
        if (this.files[0]) handleFile(this.files[0]);
    });

    // Suporte a drag and drop na area de upload
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