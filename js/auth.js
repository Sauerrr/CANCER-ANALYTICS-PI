// ════════════════════════════════════════════════════════════
//  auth.js — Autenticação e inicialização do app
//  Depende de: config.js, data.js, ui.js, patients.js
// ════════════════════════════════════════════════════════════

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

function doLogout() {
  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('input-email').value    = '';
  document.getElementById('input-password').value = '';
  currentUser = null;
}

function initApp() {
  renderDashboard();
  renderPatientsTable();
  populatePatientSelect();
  switchView('dashboard', document.querySelector('[data-view=dashboard]'));
}   