/* ============================================================
   КАТАЛОГ УСЛУГ (localStorage)
   ============================================================ */

const SERVICES_KEY = 'orchid_services';

const DEFAULT_SERVICES = [
    { id: 1,  name: 'Массаж всей спины',           duration: '40 мин', price: 1500, durationMin: 40 },
    { id: 2,  name: 'Шейно-воротниковая зона',     duration: '20 мин', price: 1000, durationMin: 30 },
    { id: 3,  name: 'Лицо',                        duration: '20 мин', price: 1000, durationMin: 30 },
    { id: 4,  name: 'Пояснично-крестцовая зона',   duration: '15 мин', price: 750,  durationMin: 30 },
    { id: 5,  name: 'Ноги',                        duration: '1 час',  price: 2200, durationMin: 60 },
    { id: 6,  name: 'Руки',                        duration: '40 мин', price: 1500, durationMin: 40 },
    { id: 7,  name: 'Антицеллюлитный',             duration: '40 мин', price: 1500, durationMin: 40 },
    { id: 8,  name: 'Дети до 1 года (все тело)',   duration: '20 мин', price: 1000, durationMin: 30 },
    { id: 9,  name: 'Дети до 1 года (вся спина)',  duration: '30 мин', price: 750,  durationMin: 30 },
    { id: 10, name: 'Все тело',                    duration: '1 час',  price: 1500, durationMin: 60 }
];

function getServices() {
    try {
        const raw = localStorage.getItem(SERVICES_KEY);
        if (!raw) {
            saveServices(DEFAULT_SERVICES);
            return DEFAULT_SERVICES.slice();
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : DEFAULT_SERVICES.slice();
    } catch (e) {
        return DEFAULT_SERVICES.slice();
    }
}

function saveServices(list) {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(list));
}

function getServiceByName(name) {
    if (!name) return null;
    const list = getServices();
    for (let i = 0; i < list.length; i++) {
        if (list[i].name === name) return list[i];
    }
    return null;
}

function getServiceDurationMin(service) {
    if (!service) return 30;
    const n = Number(service.durationMin);
    if (!isNaN(n) && n > 0) return n;
    return 30;
}

function formatPrice(price) {
    if (price === 0 || price === null || price === undefined || price === '') return '—';
    const n = Number(price);
    if (isNaN(n)) return String(price);
    return n.toLocaleString('ru-RU') + ' ₽';
}

function escapeHtmlServices(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ============================================================
   РЕНДЕР ПРАЙСА НА ГЛАВНОЙ
   ============================================================ */
function renderServicesTable() {
    const container = document.getElementById('services-table-body');
    if (!container) return;

    const list = getServices();
    container.innerHTML = '';

    if (!list.length) {
        container.innerHTML = '<div class="slots-empty">Услуг пока нет</div>';
        return;
    }

    list.forEach(s => {
        const row = document.createElement('div');
        row.className = 'price-row';
        row.dataset.serviceName = s.name;
        row.title = 'Нажмите, чтобы записаться на эту услугу';
        row.innerHTML =
            '<div class="price-row-left">' +
                '<div class="price-row-name">' + escapeHtmlServices(s.name) + '</div>' +
                '<div class="price-row-duration">' +
                    '<i class="far fa-clock"></i> ' + escapeHtmlServices(s.duration) +
                '</div>' +
            '</div>' +
            '<div class="price-row-price">' + formatPrice(s.price) + '</div>';

        row.addEventListener('click', function () {
            selectServiceAndScroll(s.name);
        });

        container.appendChild(row);
    });
}

function selectServiceAndScroll(serviceName) {
    const sel = document.getElementById('booking-service')
        || document.querySelector('select[name="service"]');
    if (sel) {
        sel.value = serviceName;
        if (typeof renderSlots === 'function') renderSlots();
    }

    const target = document.getElementById('booking-form');
    if (target) {
        const top = target.offsetTop - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }
}

/* ============================================================
   СЕЛЕКТ УСЛУГ В ФОРМАХ
   ============================================================ */
function fillServiceSelects() {
    const list = getServices();

    document.querySelectorAll('select[name="service"]').forEach(sel => {
        const currentValue = sel.value;
        sel.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.disabled = true;
        placeholder.selected = !currentValue;
        placeholder.value = '';
        placeholder.textContent = '— Сначала выберите услугу —';
        sel.appendChild(placeholder);

        list.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.name;
            opt.textContent = s.name + ' — ' + formatPrice(s.price) + ' (' + s.duration + ')';
            sel.appendChild(opt);
        });

        if (currentValue) sel.value = currentValue;
    });
}

/* ============================================================
   НАСТРОЙКА «ВЫЕЗД НА ДОМ» (отдельная плашка под прайсом)
   ============================================================ */

var TRIP_KEY = 'orchid_trip_option';

var DEFAULT_TRIP = {
    text: 'Выезд на дом — +300 ₽ к стоимости услуги',
    enabled: true
};

function getTripOption() {
    try {
        var raw = localStorage.getItem(TRIP_KEY);
        if (!raw) {
            localStorage.setItem(TRIP_KEY, JSON.stringify(DEFAULT_TRIP));
            return DEFAULT_TRIP;
        }
        var obj = JSON.parse(raw);
        return (obj && typeof obj === 'object') ? obj : DEFAULT_TRIP;
    } catch (e) {
        return DEFAULT_TRIP;
    }
}

function saveTripOption(obj) {
    localStorage.setItem(TRIP_KEY, JSON.stringify(obj));
}

function renderTripNote() {
    var container = document.getElementById('services-note-container');
    if (!container) return;

    var opts = getTripOption();
    if (!opts.enabled || !opts.text) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML =
        '<p class="services-note">' +
            '<i class="fas fa-info-circle"></i> ' +
            escapeHtmlServices(opts.text) +
        '</p>';
}

/* ============================================================
   СТАРТ И СИНХРОНИЗАЦИЯ
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    renderServicesTable();
    fillServiceSelects();
    renderTripNote();
});

window.addEventListener('storage', (e) => {
    if (e.key === SERVICES_KEY) {
        renderServicesTable();
        fillServiceSelects();
        if (typeof renderAdminServicesList === 'function') {
            renderAdminServicesList();
        }
    }
    if (e.key === TRIP_KEY) {
        renderTripNote();
    }
});