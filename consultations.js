/* ============================================================
   ЗАЯВКИ НА КОНСУЛЬТАЦИЮ — ВИЗУАЛЬНОЕ ОПОВЕЩЕНИЕ В АДМИНКЕ
   ============================================================ */

var CONSULT_SEEN_KEY = 'orchid_consult_seen';

function getSeenConsultIds() {
    try {
        return JSON.parse(localStorage.getItem(CONSULT_SEEN_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

function markConsultSeen(id) {
    var seen = getSeenConsultIds();
    if (seen.indexOf(id) === -1) {
        seen.push(id);
        localStorage.setItem(CONSULT_SEEN_KEY, JSON.stringify(seen));
    }
}

function isConsultSeen(id) {
    return getSeenConsultIds().indexOf(id) !== -1;
}

function getUnseenConsultations() {
    if (typeof getRequests !== 'function') return [];
    var all = getRequests();
    return all.filter(function (r) {
        return r.type === 'consultation' && !isConsultSeen(r.id);
    });
}

function escapeHtmlConsult(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDateTimeRu(iso) {
    if (!iso) return '';
    try {
        var d = new Date(iso);
        return d.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return ''; }
}

/* ============================================================
   РЕНДЕР
   ============================================================ */

function renderConsultationAlert() {
    var container = document.getElementById('admin-consult-alert');
    if (!container) return;

    var unseen = getUnseenConsultations();

    if (!unseen.length) {
        container.innerHTML = '';
        container.classList.remove('has-alerts');
        return;
    }

    container.classList.add('has-alerts');

    var html = '';

    html +=
        '<div class="consult-bang" title="Есть новые заявки">' +
            '<span>!</span>' +
        '</div>';

    html += '<div class="consult-list">';
    unseen.forEach(function (c) {
        html +=
            '<div class="consult-card" data-id="' + c.id + '">' +
                '<div class="consult-content">' +
                    '<div class="consult-icon"><i class="fas fa-phone-volume"></i></div>' +
                    '<div class="consult-text">' +
                        '<div class="consult-name">' + escapeHtmlConsult(c.name) + '</div>' +
                        '<a class="consult-phone" href="tel:' + escapeHtmlConsult(c.phone) + '">' +
                            escapeHtmlConsult(c.phone) +
                        '</a>' +
                        '<div class="consult-time">' +
                            '<i class="far fa-clock"></i> ' +
                            formatDateTimeRu(c.createdAt) +
                        '</div>' +
                    '</div>' +
                    '<div class="consult-actions">' +
                        '<a class="consult-call-btn" href="tel:' + escapeHtmlConsult(c.phone) + '">' +
                            '<i class="fas fa-phone"></i> Позвонить' +
                        '</a>' +
                        '<button class="consult-done-btn" onclick="onConsultDoneClick(' + c.id + ')">' +
                            '<i class="fas fa-check"></i> Обработано' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
}

function onConsultDoneClick(id) {
    var req = getRequests().find(function (r) { return r.id === id; });
    if (!req) return;

    var old = document.getElementById('consult-dialog');
    if (old) old.remove();

    var dialog = document.createElement('div');
    dialog.id = 'consult-dialog';
    dialog.className = 'consult-dialog-overlay';
    dialog.innerHTML =
        '<div class="consult-dialog" onclick="event.stopPropagation()">' +
            '<div class="consult-dialog-icon">' +
                '<i class="fas fa-phone-volume"></i>' +
            '</div>' +
            '<h3>Заявка от ' + escapeHtmlConsult(req.name) + '</h3>' +
            '<p class="consult-dialog-phone">' + escapeHtmlConsult(req.phone) + '</p>' +
            '<p class="consult-dialog-q">Что сделать с заявкой?</p>' +
            '<div class="consult-dialog-actions">' +
                '<button class="consult-dialog-btn consult-dialog-btn-primary" ' +
                    'onclick="consultGoToBooking(' + id + ')">' +
                    '<i class="fas fa-calendar-plus"></i>' +
                    '<span>Записать клиента<br>на приём</span>' +
                '</button>' +
                '<button class="consult-dialog-btn consult-dialog-btn-outline" ' +
                    'onclick="consultJustMark(' + id + ')">' +
                    '<i class="fas fa-check"></i>' +
                    '<span>Просто отметить<br>обработанной</span>' +
                '</button>' +
            '</div>' +
            '<button class="consult-dialog-cancel" onclick="closeConsultDialog()">' +
                'Отмена' +
            '</button>' +
        '</div>';

    dialog.addEventListener('click', function () {
        closeConsultDialog();
    });

    document.body.appendChild(dialog);
    setTimeout(function () { dialog.classList.add('active'); }, 10);
}

function closeConsultDialog() {
    var dialog = document.getElementById('consult-dialog');
    if (!dialog) return;
    dialog.classList.remove('active');
    setTimeout(function () { dialog.remove(); }, 200);
}

function consultJustMark(id) {
    markConsultSeen(id);
    closeConsultDialog();
    renderConsultationAlert();
    if (typeof updateAdminTabCounter === 'function') updateAdminTabCounter();
}

function consultGoToBooking(consultId) {
    var consult = getRequests().find(function (r) { return r.id === consultId; });
    if (!consult) return;

    window.__pendingConsultId = consultId;

    closeConsultDialog();
    openBookingFromConsult(consult);
}

/* ============================================================
   ФОРМА ЗАПИСИ ИЗ КОНСУЛЬТАЦИИ
   ============================================================ */

function openBookingFromConsult(consult) {
    var old = document.getElementById('consult-booking-modal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.id = 'consult-booking-modal';
    modal.className = 'consult-booking-overlay';

    var services = (typeof getServices === 'function') ? getServices() : [];
    var serviceOptions = '<option value="" disabled selected>— Выберите услугу —</option>';
    services.forEach(function (s) {
        serviceOptions +=
            '<option value="' + escapeHtmlConsult(s.name) + '">' +
                escapeHtmlConsult(s.name) + ' · ' + escapeHtmlConsult(s.duration) +
            '</option>';
    });

    modal.innerHTML =
        '<div class="consult-booking-card" onclick="event.stopPropagation()">' +
            '<button class="consult-booking-close" onclick="closeConsultBooking()" title="Закрыть">✕</button>' +
            '<h3><i class="fas fa-calendar-plus"></i> Записать клиента на приём</h3>' +
            '<p class="consult-booking-sub">Данные из заявки уже заполнены. Осталось выбрать услугу, дату и время.</p>' +

            '<div class="consult-booking-data">' +
                '<div class="consult-booking-row">' +
                    '<span class="consult-booking-label">Клиент:</span>' +
                    '<span class="consult-booking-value">' + escapeHtmlConsult(consult.name) + '</span>' +
                '</div>' +
                '<div class="consult-booking-row">' +
                    '<span class="consult-booking-label">Телефон:</span>' +
                    '<span class="consult-booking-value">' + escapeHtmlConsult(consult.phone) + '</span>' +
                '</div>' +
            '</div>' +

            '<form onsubmit="submitBookingFromConsult(event)">' +
                '<label class="consult-booking-label">Услуга</label>' +
                '<select id="cbm-service" required onchange="cbmRenderSlots()">' +
                    serviceOptions +
                '</select>' +

                '<label class="consult-booking-label">Дата визита</label>' +
                '<input type="date" id="cbm-date" required onchange="cbmRenderSlots()">' +

                '<label class="consult-booking-label">Свободное время</label>' +
                '<div id="cbm-slots" class="slots-grid">' +
                    '<div class="slots-empty">Сначала выберите услугу и дату</div>' +
                '</div>' +
                '<input type="hidden" id="cbm-time" required>' +

                '<button type="submit" class="consult-booking-submit">' +
                    '<i class="fas fa-check"></i> Подтвердить запись' +
                '</button>' +
            '</form>' +
        '</div>';

    modal.addEventListener('click', function () {
        closeConsultBooking();
    });

    document.body.appendChild(modal);
    setTimeout(function () { modal.classList.add('active'); }, 10);

    /* Минимальная дата — сегодня */
    var dateInput = document.getElementById('cbm-date');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }

    /* Подключаем кастомный календарь (как в обычной заявке) */
    setTimeout(function () {
        if (typeof initDatePickers === 'function') {
            initDatePickers();
        }
    }, 60);
}

function closeConsultBooking() {
    var modal = document.getElementById('consult-booking-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(function () { modal.remove(); }, 200);
    window.__pendingConsultId = null;
}

/* Рендер слотов в модалке */
function cbmRenderSlots() {
    var serviceSel = document.getElementById('cbm-service');
    var dateInput  = document.getElementById('cbm-date');
    var container  = document.getElementById('cbm-slots');
    var hiddenTime = document.getElementById('cbm-time');
    if (!serviceSel || !dateInput || !container) return;

    hiddenTime.value = '';
    var serviceName = serviceSel.value;
    var dateStr = dateInput.value;

    if (!serviceName) {
        container.innerHTML = '<div class="slots-empty">Сначала выберите услугу</div>';
        return;
    }
    var service = (typeof getServiceByName === 'function') ? getServiceByName(serviceName) : null;
    if (!service) {
        container.innerHTML = '<div class="slots-empty">Услуга не найдена</div>';
        return;
    }
    if (!dateStr) {
        container.innerHTML = '<div class="slots-empty">Выберите дату</div>';
        return;
    }

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var chosen = new Date(dateStr + 'T00:00:00');
    if (chosen < today) {
        container.innerHTML = '<div class="slots-empty">Нельзя записаться на прошедшую дату</div>';
        return;
    }

    var durationMin = (typeof getServiceDurationMin === 'function') ? getServiceDurationMin(service) : 30;
    var needed = (typeof getSlotsNeeded === 'function') ? getSlotsNeeded(durationMin) : 1;

    var active = (typeof getActiveSlotsForDate === 'function')
        ? getActiveSlotsForDate(dateStr)
        : [];

    if (!active.length) {
        container.innerHTML = '<div class="slots-empty">На этот день записи недоступны</div>';
        return;
    }

    container.innerHTML = '';
    active.forEach(function (slot) {
        var range = (typeof isRangeAvailable === 'function')
            ? isRangeAvailable(dateStr, slot.time, needed)
            : { ok: true };

        var div = document.createElement('div');
        if (!range.ok) {
            div.className = 'slot slot-busy';
            div.textContent = slot.time;
        } else {
            div.className = 'slot slot-free';
            div.textContent = slot.time;
            div.addEventListener('click', function () {
                document.querySelectorAll('#cbm-slots .slot-selected')
                    .forEach(function (el) { el.classList.remove('slot-selected'); });
                div.classList.add('slot-selected');
                hiddenTime.value = slot.time;
            });
        }
        container.appendChild(div);
    });
}

function submitBookingFromConsult(e) {
    e.preventDefault();

    var consultId = window.__pendingConsultId;
    if (!consultId) {
        alert('Ошибка: консультация не найдена.');
        return;
    }

    var consult = getRequests().find(function (r) { return r.id === consultId; });
    if (!consult) {
        alert('Ошибка: консультация не найдена.');
        return;
    }

    var serviceSel = document.getElementById('cbm-service');
    var dateInput  = document.getElementById('cbm-date');
    var timeVal    = document.getElementById('cbm-time').value;

    if (!serviceSel.value) { alert('Выберите услугу'); return; }
    if (!dateInput.value)  { alert('Выберите дату'); return; }
    if (!timeVal)          { alert('Выберите время'); return; }

    var service = (typeof getServiceByName === 'function')
        ? getServiceByName(serviceSel.value) : null;
    if (!service) { alert('Услуга не найдена'); return; }

    var durationMin = (typeof getServiceDurationMin === 'function')
        ? getServiceDurationMin(service) : 30;
    var needed = (typeof getSlotsNeeded === 'function')
        ? getSlotsNeeded(durationMin) : 1;

    var range = (typeof isRangeAvailable === 'function')
        ? isRangeAvailable(dateInput.value, timeVal, needed)
        : { ok: true };

    if (!range.ok) {
        alert('Это время уже занято. Выберите другое.');
        cbmRenderSlots();
        return;
    }

    var list = getRequests();
    list.push({
        id: Date.now(),
        type: 'booking',
        name: consult.name,
        phone: consult.phone,
        service: service.name,
        durationMin: durationMin,
        slotsUsed: range.times || [timeVal],
        date: dateInput.value,
        time: timeVal,
        status: 'confirmed',
        fromConsultId: consultId,
        createdAt: new Date().toISOString()
    });
    saveRequests(list);

    markConsultSeen(consultId);

    closeConsultBooking();
    renderConsultationAlert();
    if (typeof updateAdminTabCounter === 'function') updateAdminTabCounter();

    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderDayPanel === 'function') renderDayPanel();
    if (typeof renderWeekGrid === 'function') renderWeekGrid();

    alert('Клиент записан на ' + dateInput.value + ' в ' + timeVal + '. Статус: Подтверждено.');
}

/* ============================================================
   СЧЁТЧИК
   ============================================================ */

function updateAdminTabCounter() {
    var unseen = getUnseenConsultations();
    var count = unseen.length;

    var tab = null;
    var tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(function (t) {
        if (t.textContent.indexOf('Расписание') !== -1) tab = t;
    });
    if (!tab) return;

    var existing = tab.querySelector('.admin-tab-counter');
    if (existing) existing.remove();

    if (count > 0) {
        var counter = document.createElement('span');
        counter.className = 'admin-tab-counter';
        counter.textContent = count;
        tab.appendChild(counter);
    }
}

/* ============================================================
   СТАРТ
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('admin-consult-alert')) {
        renderConsultationAlert();
        updateAdminTabCounter();
    }
});

window.addEventListener('storage', function (e) {
    if (e.key === 'orchid_requests' || e.key === CONSULT_SEEN_KEY) {
        if (document.getElementById('admin-consult-alert')) {
            renderConsultationAlert();
            updateAdminTabCounter();
        }
    }
});

document.addEventListener('visibilitychange', function () {
    if (!document.hidden && document.getElementById('admin-consult-alert')) {
        renderConsultationAlert();
        updateAdminTabCounter();
    }
});