/* ============================================================
   АВТОРИЗАЦИЯ
   ============================================================ */

const AUTH_KEY = 'orchid_auth';

/* ============================================================
   НАСТРОЙКИ АДМИНА
   ============================================================ */
const ADMIN_PHONE    = '+79857341447';
const ADMIN_PASSWORD = '1102';
const ADMIN_NAME     = 'Админ';

function normalizePhone(phone) {
    return String(phone || '').replace(/\D/g, '');
}
function isAdminPhone(phone) {
    return normalizePhone(phone) === normalizePhone(ADMIN_PHONE);
}

/* ============================================================
   СЕССИЯ
   ============================================================ */
function getSession() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
    catch (e) { return null; }
}
function setSession(s) { localStorage.setItem(AUTH_KEY, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(AUTH_KEY); }
function isAdmin()  { const s = getSession(); return s && s.role === 'admin'; }
function isClient() { const s = getSession(); return s && s.role === 'client'; }

/* ============================================================
   ДВУХШАГОВЫЙ ВХОД
   ============================================================ */
function loginStep1(name, phone) {
    name  = (name  || '').trim();
    phone = (phone || '').trim();

    if (name.length < 2) return { ok: false, error: 'Введите имя (минимум 2 символа)' };
    if (normalizePhone(phone).length < 6) return { ok: false, error: 'Введите корректный телефон' };

    if (isAdminPhone(phone)) {
        return { ok: true, needPassword: true };
    }

    setSession({ role: 'client', name, phone });
    return { ok: true, role: 'client' };
}

function loginStep2Admin(password) {
    if (password === ADMIN_PASSWORD) {
        setSession({ role: 'admin', name: ADMIN_NAME, phone: ADMIN_PHONE });
        return { ok: true };
    }
    return { ok: false, error: 'Неверный пароль' };
}

function logout() {
    clearSession();
    window.location.href = 'index.html';
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ============================================================
   ОБНОВЛЕНИЕ ПУНКТА "КАБИНЕТ" В ШАПКЕ
   ============================================================ */
function updateHeaderAuth() {
    const el = document.getElementById('header-auth-item');
    if (!el) return;

    const session = getSession();
    if (!session) {
        el.innerHTML = '<a href="login.html" class="auth-link">Кабинет</a>';
        return;
    }
    const who = session.role === 'admin' ? 'Админ' : session.name.split(' ')[0];
    el.innerHTML = `
        <a href="cabinet.html" class="auth-link">Кабинет (${escapeHtml(who)})</a>
        <a href="#" onclick="logout();return false;" style="margin-left:12px;color:var(--champagne);">Выйти</a>
    `;
}

/* НЕ вызываем автоматически — этим занимается cabinet.js, чтобы не конфликтовать */