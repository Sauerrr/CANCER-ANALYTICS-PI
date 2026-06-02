// ============================================================
//  auth.js - Autenticacao e inicializacao da aplicacao
//  Gerencia o fluxo de login e logout e orquestra a carga
//  inicial dos dados ao entrar na aplicacao.
//  Depende de: config.js, data.js, ui.js, patients.js
// ============================================================

/**
 * Valida as credenciais inseridas no formulario de login.
 * Em caso de sucesso, inicializa a aplicacao e exibe a tela principal.
 * Em caso de falha, exibe a mensagem de erro sem recarregar a pagina.
 *
 * Autenticacao simulada via objeto USERS em data.js.
 * Substituir por chamada autenticada ao backend quando disponivel.
 */
function doLogin() {
    var email = document.getElementById('input-email').value.trim();
    var pass  = document.getElementById('input-password').value;
    var err   = document.getElementById('login-error');
    var user  = USERS[email];

    if (user && user.password === pass) {
        currentUser = Object.assign({}, user, { email: email });

        err.style.display = 'none';
        document.getElementById('sidebar-name').textContent   = user.name;
        document.getElementById('sidebar-avatar').textContent = user.initials;

        initApp();

        document.getElementById('screen-login').classList.remove('active');
        document.getElementById('screen-app').classList.add('active');
    } else {
        err.style.display = 'block';
    }
}

/**
 * Encerra a sessao do usuario atual.
 * Limpa os campos do formulario e retorna a tela de login.
 * O estado global (currentUser, uploadedFile, etc.) e redefinido
 * indiretamente pelo recarregamento da view no proximo login.
 */
function doLogout() {
    document.getElementById('screen-app').classList.remove('active');
    document.getElementById('screen-login').classList.add('active');
    document.getElementById('input-email').value    = '';
    document.getElementById('input-password').value = '';
    currentUser = null;
}

/**
 * Inicializa os componentes da aplicacao apos autenticacao bem-sucedida.
 * Ordem de execucao importa: tabelas devem ser renderizadas antes
 * da navegacao para evitar DOM vazio.
 */
function initApp() {
    renderDashboard();
    renderPatientsTable();
    populatePatientSelect();
    switchView('dashboard', document.querySelector('[data-view=dashboard]'));
}