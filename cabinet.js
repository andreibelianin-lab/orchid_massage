/* ============================================================
   РОУТИНГ КАБИНЕТА
   ============================================================ */

function renderHeaderAuthItem() {
    const el = document.getElementById('header-auth-item');
    if (!el) return;
    const session = getSession();
    if (!session) {
        el.innerHTML = '<a href="login.html">Войти</a>';
        return;
    }
    el.innerHTML =
        '<a href="cabinet.html">' + (session.role === 'admin' ? 'Админ' : session.name.split(' ')[0]) + '</a>' +
        '<a href="#" onclick="logout();return false;" style="margin-left:12px;color:var(--champagne);">Выйти</a>';
}

document.addEventListener('DOMContentLoaded', () => {
    renderHeaderAuthItem();

    const session = getSession();
    const viewAdmin  = document.getElementById('view-admin');
    const viewClient = document.getElementById('view-client');
    const viewGuest  = document.getElementById('view-guest');

    if (viewAdmin)  viewAdmin.style.display  = 'none';
    if (viewClient) viewClient.style.display = 'none';
    if (viewGuest)  viewGuest.style.display  = 'none';

    if (!session) {
        if (viewGuest) viewGuest.style.display = 'block';
        return;
    }

    if (session.role === 'admin') {
        if (viewAdmin) viewAdmin.style.display = 'block';
        if (typeof initCalendar === 'function') initCalendar();
        if (typeof renderAdminServicesList === 'function') renderAdminServicesList();
        if (typeof renderAdminCertificatesList === 'function') renderAdminCertificatesList();
        if (typeof renderConsultationAlert === 'function') renderConsultationAlert();
        if (typeof renderTripOptionEditor === 'function') renderTripOptionEditor();
        if (typeof renderAdminDiplomasList === 'function') renderAdminDiplomasList();
    } else if (session.role === 'client') {
        if (viewClient) viewClient.style.display = 'block';
        const nameEl = document.getElementById('client-name');
        if (nameEl) nameEl.textContent = session.name;
        initClientCabinet();
    }
});

/* ============================================================
   АДМИН: ВКЛАДКИ
   ============================================================ */
function switchAdminTab(evt, tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
    const target = document.getElementById('admin-' + tab);
    if (target) target.classList.add('active');

    if (tab === 'services' && typeof renderAdminServicesList === 'function') {
        renderAdminServicesList();
    }
    if (tab === 'services' && typeof renderTripOptionEditor === 'function') {
        renderTripOptionEditor();
    }
    if (tab === 'slots' && typeof renderSlotsEditor === 'function') {
        renderSlotsEditor();
    }
    if (tab === 'certificates' && typeof renderAdminCertificatesList === 'function') {
        renderAdminCertificatesList();
    }
    if (tab === 'diplomas' && typeof renderAdminDiplomasList === 'function') {
        renderAdminDiplomasList();
    }
}

/* ============================================================
   АДМИН: РЕДАКТОР ПРАЙСА
   ============================================================ */
function renderAdminServicesList() {
    const container = document.getElementById('admin-services-list');
    if (!container) return;

    const list = getServices();
    container.innerHTML = '';

    if (!list.length) {
        container.innerHTML = '<div class="slots-empty">Услуг пока нет. Нажмите «Добавить услугу».</div>';
        return;
    }

    list.forEach(s => {
        const card = document.createElement('div');
        card.className = 'service-edit-card';
        card.dataset.id = s.id;

        card.innerHTML =
            '<div class="service-edit-fields">' +
                '<input type="text" class="edit-name" value="' + escapeHtml(s.name) + '" placeholder="Название">' +
                '<input type="text" class="edit-duration" value="' + escapeHtml(s.duration) + '" placeholder="Текст (40 мин)">' +
                '<input type="number" class="edit-duration-min" value="' + (s.durationMin || 30) + '" placeholder="Мин" min="5" step="5">' +
                '<input type="number" class="edit-price" value="' + s.price + '" placeholder="Цена" min="0" step="50">' +
            '</div>' +
            '<div class="service-edit-actions">' +
                '<button class="btn-save" onclick="saveServiceRow(' + s.id + ')" title="Сохранить"><i class="fas fa-check"></i></button>' +
                '<button class="btn-delete-row" onclick="deleteServiceRow(' + s.id + ')" title="Удалить"><i class="fas fa-trash"></i></button>' +
            '</div>';

        container.appendChild(card);
    });
}

function saveServiceRow(id) {
    const card = document.querySelector('.service-edit-card[data-id="' + id + '"]');
    if (!card) return;

    const list = getServices();
    const service = list.find(s => s.id === id);
    if (!service) return;

    service.name        = card.querySelector('.edit-name').value.trim();
    service.duration    = card.querySelector('.edit-duration').value.trim();
    service.durationMin = Number(card.querySelector('.edit-duration-min').value) || 30;
    service.price       = Number(card.querySelector('.edit-price').value) || 0;

    if (!service.name) {
        alert('Название не может быть пустым');
        return;
    }

    saveServices(list);
    card.classList.add('saved');
    setTimeout(() => card.classList.remove('saved'), 800);
    if (typeof renderServicesTable === 'function') renderServicesTable();
    if (typeof fillServiceSelects === 'function') fillServiceSelects();
}

function deleteServiceRow(id) {
    if (!confirm('Удалить эту услугу из прайса?')) return;
    const list = getServices().filter(s => s.id !== id);
    saveServices(list);
    renderAdminServicesList();
    if (typeof renderServicesTable === 'function') renderServicesTable();
    if (typeof fillServiceSelects === 'function') fillServiceSelects();
}

function addService() {
    const list = getServices();
    const newId = Date.now();
    list.push({
        id: newId,
        name: 'Новая услуга',
        duration: '30 мин',
        durationMin: 30,
        price: 1000
    });
    saveServices(list);
    renderAdminServicesList();
    if (typeof renderServicesTable === 'function') renderServicesTable();
    if (typeof fillServiceSelects === 'function') fillServiceSelects();

    setTimeout(() => {
        const card = document.querySelector('.service-edit-card[data-id="' + newId + '"]');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.querySelector('.edit-name').focus();
            card.querySelector('.edit-name').select();
        }
    }, 100);
}

/* ============================================================
   АДМИН: РЕДАКТОР СЛОТОВ — недельная сетка + drag&drop
   ============================================================ */

var gridWeekStart = null;
var gridIsPainting = false;
var gridPaintValue = false;

function getMonday(d) {
    var copy = new Date(d);
    var day = copy.getDay();
    var diff = (day === 0 ? -6 : 1 - day);
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function dateToStr(d) {
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
}

function addDays(d, n) {
    var copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy;
}

function renderSlotTemplates() {
    var el = document.getElementById('slot-templates-list');
    if (!el) return;

    var list = getSlotTemplatesSorted();
    el.innerHTML = '';

    if (!list.length) {
        el.innerHTML = '<div class="slots-empty">Слотов нет. Добавьте время выше.</div>';
        return;
    }

    list.forEach(function(s) {
        var chip = document.createElement('div');
        chip.className = 'slot-template-chip';
        chip.innerHTML =
            '<span>' + s.time + '</span>' +
            '<button onclick="deleteSlotTemplate(\'' + s.id + '\')" title="Удалить">' +
                '<i class="fas fa-times"></i>' +
            '</button>';
        el.appendChild(chip);
    });
}

function renderWeekGrid() {
    var grid = document.getElementById('week-grid');
    var title = document.getElementById('week-title');
    if (!grid) return;

    if (!gridWeekStart) {
        gridWeekStart = getMonday(new Date());
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var end = addDays(gridWeekStart, 6);
    var months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
    if (title) {
        title.textContent =
            gridWeekStart.getDate() + ' ' + months[gridWeekStart.getMonth()] + ' — ' +
            end.getDate() + ' ' + months[end.getMonth()] + ' ' + end.getFullYear();
    }

    grid.innerHTML = '';

    var templates = getSlotTemplatesSorted();
    if (!templates.length) {
        grid.innerHTML = '<div class="slots-empty">Сначала добавьте шаблоны времени.</div>';
        return;
    }

    var corner = document.createElement('div');
    corner.className = 'week-cell week-corner';
    grid.appendChild(corner);

    var dayNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    for (var i = 0; i < 7; i++) {
        var dHead = addDays(gridWeekStart, i);
        var head = document.createElement('div');
        head.className = 'week-cell week-day-head';
        if (dHead.getTime() === today.getTime()) head.classList.add('is-today');
        head.innerHTML =
            '<span class="wd-name">' + dayNames[i] + '</span>' +
            '<span class="wd-date">' + dHead.getDate() + '</span>';
        grid.appendChild(head);
    }

    var requests = (typeof getRequests === 'function') ? getRequests() : [];
    var activeBookings = requests.filter(function(r) {
        return r.type === 'booking' && r.status !== 'cancelled' && r.status !== 'done';
    });

    templates.forEach(function(slot) {
        var timeCell = document.createElement('div');
        timeCell.className = 'week-cell week-time';
        timeCell.textContent = slot.time;
        grid.appendChild(timeCell);

        for (var j = 0; j < 7; j++) {
            var d = addDays(gridWeekStart, j);
            var dateStr = dateToStr(d);

            var active = isSlotActiveOnDate(slot.id, dateStr);
            var booked = activeBookings.find(function(b) {
                if (b.date !== dateStr) return false;
                if (b.slotsUsed && Array.isArray(b.slotsUsed)) {
                    return b.slotsUsed.indexOf(slot.time) !== -1;
                }
                return b.time === slot.time;
            });

            var cell = document.createElement('div');
            cell.className = 'week-cell week-slot';
            if (booked)        cell.classList.add('is-booked');
            else if (active)   cell.classList.add('is-active');
            else               cell.classList.add('is-off');

            cell.dataset.slotId = slot.id;
            cell.dataset.date   = dateStr;
            cell.dataset.time   = slot.time;

            if (booked) {
                cell.classList.add('is-draggable');
                cell.setAttribute('draggable', 'true');
                cell.dataset.bookingId = booked.id;

                var bookingText = document.createElement('span');
                bookingText.className = 'week-slot-service';
                bookingText.textContent = booked.service || 'Запись';
                cell.appendChild(bookingText);

                cell.addEventListener('click', function(b, c) {
                    return function() {
                        if (c.dataset.justDragged === '1') {
                            c.dataset.justDragged = '';
                            return;
                        }
                        openModal(b.id);
                    };
                }(booked, cell));

                cell.addEventListener('dragstart', function(b, c, ds, st) {
                    return function(e) {
                        window.__dragBookingId = b.id;
                        window.__dragFromDate  = ds;
                        window.__dragFromTime  = st;
                        c.classList.add('is-dragging');
                        try {
                            e.dataTransfer.setData('text/plain', String(b.id));
                            e.dataTransfer.effectAllowed = 'move';
                        } catch (err) {}
                    };
                }(booked, cell, dateStr, slot.time));

                cell.addEventListener('dragend', function(c) {
                    return function() {
                        c.classList.remove('is-dragging');
                        document.querySelectorAll('.week-slot.is-drop-hover').forEach(function(el) {
                            el.classList.remove('is-drop-hover');
                        });
                        document.querySelectorAll('.week-slot.is-drop-invalid').forEach(function(el) {
                            el.classList.remove('is-drop-invalid');
                        });
                        if (window.__dragBookingId) {
                            c.dataset.justDragged = '1';
                            setTimeout(function() { c.dataset.justDragged = ''; }, 300);
                        }
                        window.__dragBookingId = null;
                        window.__dragFromDate = null;
                        window.__dragFromTime = null;
                    };
                }(cell));

            } else if (active) {
                cell.addEventListener('dragover', function(ds, st) {
                    return function(e) {
                        if (!window.__dragBookingId) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';

                        var booking = getRequests().find(function(r) {
                            return r.id === window.__dragBookingId;
                        });
                        if (!booking) return;

                        var needed = (typeof getSlotsNeeded === 'function' && booking.durationMin)
                            ? getSlotsNeeded(booking.durationMin)
                            : 1;

                        var range = (typeof isRangeAvailable === 'function')
                            ? isRangeAvailable(ds, st, needed, booking.id)
                            : { ok: true };

                        cell.classList.toggle('is-drop-hover', range.ok);
                        cell.classList.toggle('is-drop-invalid', !range.ok);
                    };
                }(dateStr, slot.time));

                cell.addEventListener('dragleave', function() {
                    cell.classList.remove('is-drop-hover');
                    cell.classList.remove('is-drop-invalid');
                });

                cell.addEventListener('drop', function(ds, st) {
                    return function(e) {
                        e.preventDefault();
                        cell.classList.remove('is-drop-hover');
                        cell.classList.remove('is-drop-invalid');
                        if (!window.__dragBookingId) return;
                        handleBookingDrop(window.__dragBookingId, ds, st);
                    };
                }(dateStr, slot.time));

            } else {
                cell.addEventListener('dragover', function(e) {
                    if (!window.__dragBookingId) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'none';
                    cell.classList.add('is-drop-invalid');
                });
                cell.addEventListener('dragleave', function() {
                    cell.classList.remove('is-drop-invalid');
                });
            }

            if (!booked) {
                cell.addEventListener('mousedown', function(e) {
                    if (window.__dragBookingId) return;
                    e.preventDefault();
                    gridIsPainting = true;
                    var current = isSlotActiveOnDate(this.dataset.slotId, this.dataset.date);
                    gridPaintValue = !current;
                    applyCell(this, gridPaintValue);
                });
                cell.addEventListener('mouseover', function() {
                    if (gridIsPainting && !window.__dragBookingId) {
                        applyCell(this, gridPaintValue);
                    }
                });
            }

            grid.appendChild(cell);
        }
    });
}

function handleBookingDrop(bookingId, newDate, newTime) {
    var list = getRequests();
    var booking = list.find(function(r) { return r.id === bookingId; });
    if (!booking) return;

    if (booking.date === newDate && booking.time === newTime) return;

    var needed = (typeof getSlotsNeeded === 'function' && booking.durationMin)
        ? getSlotsNeeded(booking.durationMin)
        : 1;

    var range = (typeof isRangeAvailable === 'function')
        ? isRangeAvailable(newDate, newTime, needed, booking.id)
        : { ok: true };

    if (!range.ok) {
        showDragToast('Нельзя перенести: ' + dropReasonRu(range.reason), 'error');
        return;
    }

    var oldTime = booking.time;

    booking.date = newDate;
    booking.time = newTime;
    if (range.times) booking.slotsUsed = range.times;

    saveRequests(list);

    if (typeof renderWeekGrid === 'function') renderWeekGrid();
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderDayPanel === 'function') renderDayPanel();
    if (typeof renderMyBookings === 'function') renderMyBookings();

    showDragToast('Перенесено: ' + oldTime + ' → ' + newTime + ' (' + newDate + ')', 'success');
}

function dropReasonRu(reason) {
    var map = {
        'busy': 'это время занято',
        'slot-off': 'слот выключен',
        'out-of-day': 'не хватает места до конца дня',
        'not-found': 'слот не найден'
    };
    return map[reason] || 'недоступно';
}

function showDragToast(text, type) {
    var old = document.getElementById('drag-toast');
    if (old) old.remove();

    var toast = document.createElement('div');
    toast.id = 'drag-toast';
    toast.className = 'drag-toast drag-toast-' + (type || 'success');
    toast.textContent = text;
    document.body.appendChild(toast);

    setTimeout(function() { toast.classList.add('active'); }, 10);
    setTimeout(function() {
        toast.classList.remove('active');
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

function applyCell(cell, value) {
    var slotId = cell.dataset.slotId;
    var dateStr = cell.dataset.date;
    if (!slotId || !dateStr) return;

    var currentlyActive = isSlotActiveOnDate(slotId, dateStr);
    if (currentlyActive === value) return;

    toggleSlotOnDate(slotId, dateStr);
    cell.classList.toggle('is-active', value);
    cell.classList.toggle('is-off', !value);
}

document.addEventListener('mouseup', function() {
    gridIsPainting = false;
});

function gridPrevWeek() {
    if (!gridWeekStart) gridWeekStart = getMonday(new Date());
    gridWeekStart = addDays(gridWeekStart, -7);
    renderWeekGrid();
}
function gridNextWeek() {
    if (!gridWeekStart) gridWeekStart = getMonday(new Date());
    gridWeekStart = addDays(gridWeekStart, 7);
    renderWeekGrid();
}

function gridSelectAll() {
    if (!gridWeekStart) return;
    for (var i = 0; i < 7; i++) {
        setAllSlotsOnDate(dateToStr(addDays(gridWeekStart, i)), true);
    }
    renderWeekGrid();
}

function gridClearAll() {
    if (!gridWeekStart) return;
    for (var i = 0; i < 7; i++) {
        setAllSlotsOnDate(dateToStr(addDays(gridWeekStart, i)), false);
    }
    renderWeekGrid();
}

function gridResetAll() {
    if (!gridWeekStart) return;
    var overrides = getDateOverrides();
    for (var i = 0; i < 7; i++) {
        delete overrides[dateToStr(addDays(gridWeekStart, i))];
    }
    saveDateOverrides(overrides);
    renderWeekGrid();
}

function renderSlotsEditor() {
    renderSlotTemplates();
    renderWeekGrid();
}

function addSlotTemplate() {
    var input = document.getElementById('new-slot-time');
    if (!input) return;
    var time = (input.value || '').trim();
    if (!/^\d{1,2}:\d{2}$/.test(time)) {
        alert('Введите время в формате ЧЧ:ММ');
        return;
    }
    var parts = time.split(':');
    var hh = Number(parts[0]);
    var mm = Number(parts[1]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
        alert('Некорректное время');
        return;
    }
    var norm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');

    var list = getSlotTemplates();
    for (var i = 0; i < list.length; i++) {
        if (list[i].time === norm) {
            alert('Такой слот уже есть');
            return;
        }
    }
    list.push({ id: 's' + Date.now(), time: norm });
    saveSlotTemplates(list);
    input.value = '';
    renderSlotsEditor();
}

function deleteSlotTemplate(id) {
    if (!confirm('Удалить этот слот из шаблона? Он исчезнет у всех дней.')) return;
    var list = getSlotTemplates().filter(function(s) { return s.id !== id; });
    saveSlotTemplates(list);

    var overrides = getDateOverrides();
    var changed = false;
    Object.keys(overrides).forEach(function(dateStr) {
        var idx = overrides[dateStr].indexOf(id);
        if (idx >= 0) {
            overrides[dateStr].splice(idx, 1);
            changed = true;
        }
    });
    if (changed) saveDateOverrides(overrides);

    renderSlotsEditor();
}

/* ============================================================
   АДМИН: РЕДАКТОР ПЛАШКИ «ВЫЕЗД НА ДОМ»
   ============================================================ */

function renderTripOptionEditor() {
    var checkbox = document.getElementById('trip-enabled');
    var input    = document.getElementById('trip-text');
    if (!checkbox || !input) return;

    if (typeof getTripOption !== 'function') return;

    var opts = getTripOption();
    checkbox.checked = opts.enabled !== false;
    input.value = opts.text || '';
}

function saveTripOptionFromAdmin() {
    if (typeof saveTripOption !== 'function') return;

    var checkbox = document.getElementById('trip-enabled');
    var input    = document.getElementById('trip-text');
    if (!checkbox || !input) return;

    var opts = {
        enabled: checkbox.checked,
        text: input.value.trim()
    };

    saveTripOption(opts);

    if (typeof renderTripNote === 'function') renderTripNote();

    input.classList.add('saved-input');
    setTimeout(function() { input.classList.remove('saved-input'); }, 800);
}

/* ============================================================
   КЛИЕНТ — свои записи и консультации
   ============================================================ */

function normalizePhoneClient(p) {
    return String(p || '').replace(/\D/g, '');
}

function initClientCabinet() {
    var dateInput = document.getElementById('client-booking-date');
    if (dateInput) {
        var today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        clientRenderSlots();
    }
    renderMyBookings();
}

/* Все заявки клиента: и записи на приём, и консультации */
function getMyRequests() {
    var session = getSession();
    if (!session || session.role !== 'client') return [];

    var myPhone = normalizePhoneClient(session.phone);
    var all = getRequests();

    return all.filter(function (r) {
        return normalizePhoneClient(r.phone) === myPhone;
    }).sort(function (a, b) {
        /* Сначала новые сверху */
        var aKey = (a.date || '') + ' ' + (a.time || '');
        var bKey = (b.date || '') + ' ' + (b.time || '');
        return bKey.localeCompare(aKey);
    });
}

function getMyBookingsOnly() {
    return getMyRequests().filter(function (r) { return r.type === 'booking'; });
}

function renderMyBookings() {
    var container = document.getElementById('my-bookings');
    if (!container) return;

    var list = getMyRequests();

    if (!list.length) {
        container.innerHTML = '<div class="slots-empty">У вас пока нет записей и заявок</div>';
        return;
    }

    /* Разделяем на актуальные и архив */
    var today = new Date().toISOString().split('T')[0];

    var upcoming = [];
    var past = [];

    list.forEach(function (r) {
        if (r.type === 'booking') {
            if (r.date && r.date >= today && r.status !== 'cancelled' && r.status !== 'done') {
                upcoming.push(r);
            } else {
                past.push(r);
            }
        } else {
            /* Консультации — всегда в актуальные, пока не отменены */
            if (r.status !== 'cancelled') {
                upcoming.push(r);
            } else {
                past.push(r);
            }
        }
    });

    /* Сортируем актуальные — ближайшие сверху */
    upcoming.sort(function (a, b) {
        var aKey = (a.date || '0000-00-00') + ' ' + (a.time || '');
        var bKey = (b.date || '0000-00-00') + ' ' + (b.time || '');
        return aKey.localeCompare(bKey);
    });

    var html = '';

    /* --- Актуальные --- */
    if (upcoming.length) {
        html += '<h4 class="my-bookings-subtitle">Актуальные</h4>';
        html += '<div class="my-bookings-group">';
        upcoming.forEach(function (r) { html += renderBookingCard(r); });
        html += '</div>';
    }

    /* --- Архив --- */
    if (past.length) {
        html += '<h4 class="my-bookings-subtitle my-bookings-subtitle-archive">История</h4>';
        html += '<div class="my-bookings-group my-bookings-group-archive">';
        past.forEach(function (r) { html += renderBookingCard(r); });
        html += '</div>';
    }

    container.innerHTML = html;
}

function renderBookingCard(req) {
    var statusLabel = {
        pending:   '⏳ Ждёт подтверждения',
        confirmed: '✓ Подтверждено',
        done:      '✔ Выполнено',
        cancelled: '✕ Отменено'
    }[req.status] || req.status;

    /* Консультация */
    if (req.type === 'consultation') {
        return '' +
            '<div class="my-booking-card my-booking-consult status-' + (req.status || 'pending') + '">' +
                '<div class="my-booking-head">' +
                    '<span class="my-booking-date">Заявка на консультацию</span>' +
                    '<span class="my-booking-time">' +
                        (req.createdAt ? new Date(req.createdAt).toLocaleDateString('ru-RU') : '') +
                    '</span>' +
                '</div>' +
                '<div class="my-booking-service">Специалист перезвонит по номеру ' +
                    escapeHtml(req.phone) + '</div>' +
                '<div class="my-booking-status">' + statusLabel + '</div>' +
            '</div>';
    }

    /* Запись на приём */
    var dateLabel = '';
    if (req.date) {
        try {
            dateLabel = new Date(req.date + 'T00:00:00').toLocaleDateString('ru-RU', {
                weekday: 'short', day: 'numeric', month: 'long'
            });
        } catch (e) { dateLabel = req.date; }
    }

    var timeLabel = req.time || '';
    if (req.durationMin) timeLabel += ' · ' + req.durationMin + ' мин';

    return '' +
        '<div class="my-booking-card status-' + (req.status || 'pending') + '">' +
            '<div class="my-booking-head">' +
                '<span class="my-booking-date">' + dateLabel + '</span>' +
                '<span class="my-booking-time">' + timeLabel + '</span>' +
            '</div>' +
            '<div class="my-booking-service">' + escapeHtml(req.service || '') + '</div>' +
            '<div class="my-booking-status">' + statusLabel + '</div>' +
        '</div>';
}

/* Запись на приём (форма в кабинете) */
function clientRenderSlots() {
    var dateInput = document.getElementById('client-booking-date');
    var serviceSel = document.getElementById('client-service');
    var container = document.getElementById('client-slots-container');
    var hiddenTime = document.getElementById('client-booking-time');
    if (!dateInput || !container || !serviceSel) return;

    hiddenTime.value = '';

    var dateStr = dateInput.value;
    var serviceName = serviceSel.value;

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

    var hint = document.createElement('div');
    hint.className = 'slots-hint';
    hint.innerHTML = '<i class="far fa-clock"></i> ' + service.name + ' · ' +
                     (service.duration || (durationMin + ' мин'));
    container.appendChild(hint);

    active.forEach(function(slot) {
        var range = (typeof isRangeAvailable === 'function')
            ? isRangeAvailable(dateStr, slot.time, needed)
            : { ok: true };

        var div = document.createElement('div');
        if (!range.ok) {
            div.className = 'slot slot-busy';
            div.textContent = slot.time;
            div.title = 'Недоступно';
        } else {
            div.className = 'slot slot-free';
            div.textContent = slot.time;
            div.title = 'Свободно';
            div.addEventListener('click', function() {
                document.querySelectorAll('#client-slots-container .slot-selected')
                    .forEach(function(el) { el.classList.remove('slot-selected'); });
                div.classList.add('slot-selected');
                hiddenTime.value = slot.time;
            });
        }
        container.appendChild(div);
    });
}

function clientSubmitBooking(e) {
    e.preventDefault();
    var form = e.target;
    var session = getSession();
    if (!session || session.role !== 'client') return;

    var serviceSel = document.getElementById('client-service');
    var serviceName = serviceSel ? serviceSel.value : '';
    var time = document.getElementById('client-booking-time').value;

    if (!serviceName) { alert('Выберите услугу.'); return; }
    if (!time) { alert('Пожалуйста, выберите свободное время.'); return; }

    var service = (typeof getServiceByName === 'function') ? getServiceByName(serviceName) : null;
    if (!service) { alert('Услуга не найдена'); return; }

    var dateStr = form.date.value;
    var durationMin = (typeof getServiceDurationMin === 'function') ? getServiceDurationMin(service) : 30;
    var needed = (typeof getSlotsNeeded === 'function') ? getSlotsNeeded(durationMin) : 1;

    var range = (typeof isRangeAvailable === 'function')
        ? isRangeAvailable(dateStr, time, needed)
        : { ok: true };

    if (!range.ok) {
        alert('Этот талон только что заняли. Выберите другое время.');
        clientRenderSlots();
        return;
    }

    var list = getRequests();
    list.push({
        id: Date.now(),
        type: 'booking',
        name: session.name,
        phone: session.phone,
        service: service.name,
        durationMin: durationMin,
        slotsUsed: range.times || [time],
        date: dateStr,
        time: time,
        status: 'pending',
        createdAt: new Date().toISOString()
    });
    saveRequests(list);

    form.reset();
    document.getElementById('client-booking-time').value = '';
    clientRenderSlots();
    renderMyBookings();

    alert('Вы записаны на ' + dateStr + ' в ' + time + '. Ждите подтверждения!');
}