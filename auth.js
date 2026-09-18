/* ============================================================
   АВТОРИЗАЦИЯ
   ============================================================ */

const AUTH_KEY = 'orchid_auth';

/* ============================================================
   НАСТРОЙКИ АДМИНОВ
   ============================================================ */
const ADMIN_USERS = [
    {
        phone: '+79857341447',
        password: '1102',
        name: 'Админ'
    },
    {
        phone: '+79852684177',
        password: '7780',
        name: 'Специалист'
    }
];

/* Приводит любой ввод к 11 цифрам, начинающимся с 7 */
function normalizePhone(phone) {
    var digits = String(phone || '').replace(/\D/g, '');

    if (digits.length === 10) {
        digits = '7' + digits;
    } else if (digits.length === 11 && digits.charAt(0) === '8') {
        digits = '7' + digits.slice(1);
    }

    return digits;
}

function findAdminByPhone(phone) {
    const norm = normalizePhone(phone);
    return ADMIN_USERS.find(function(u) {
        return normalizePhone(u.phone) === norm;
    }) || null;
}

function isAdminPhone(phone) {
    return findAdminByPhone(phone) !== null;
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

    var norm = normalizePhone(phone);
    if (norm.length < 10) return { ok: false, error: 'Введите корректный телефон' };

    if (isAdminPhone(phone)) {
        window.__pendingAdminPhone = phone;
        return { ok: true, needPassword: true };
    }

    setSession({ role: 'client', name: name, phone: phone });
    return { ok: true, role: 'client' };
}

function loginStep2Admin(password) {
    var phone = window.__pendingAdminPhone;
    var admin = phone ? findAdminByPhone(phone) : null;

    if (!admin) {
        return { ok: false, error: 'Сессия входа истекла. Введите телефон заново.' };
    }

    if (password === admin.password) {
        setSession({ role: 'admin', name: admin.name, phone: admin.phone });
        window.__pendingAdminPhone = null;
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
    const who = session.role === 'admin'
        ? (session.name || 'Админ')
        : (session.name ? session.name.split(' ')[0] : 'Кабинет');
    el.innerHTML = `
        <a href="cabinet.html" class="auth-link">Кабинет (${escapeHtml(who)})</a>
        <a href="#" onclick="logout();return false;" style="margin-left:12px;color:var(--champagne);">Выйти</a>
    `;
}

/* НЕ вызываем автоматически — этим занимается cabinet.js, чтобы не конфликтовать */
