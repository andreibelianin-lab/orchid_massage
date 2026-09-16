/* ============================================================
   АДМИН-ПАНЕЛЬ: календарь, часы, модальное окно
   ============================================================ */

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

let currentYear, currentMonth;
let selectedDate;

function getWorkHoursForDate(dateStr) {
    if (typeof getActiveSlotsForDate === 'function') {
        return getActiveSlotsForDate(dateStr).map(s => s.time);
    }
    return ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
}

function findBookingAtTime(dayBookings, time, ignoreId) {
    return dayBookings.find(function(b) {
        if (b.status === 'cancelled') return false;
        if (ignoreId && b.id === ignoreId) return false;
        if (b.slotsUsed && Array.isArray(b.slotsUsed)) {
            return b.slotsUsed.indexOf(time) !== -1;
        }
        return b.time === time;
    });
}

/* ============================================================
   КАЛЕНДАРЬ
   ============================================================ */
function initCalendar() {
    const now = new Date();
    currentYear  = now.getFullYear();
    currentMonth = now.getMonth();
    selectedDate = todayStr();
    renderCalendar();
    renderDayPanel();
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
}
function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
}

function renderCalendar() {
    const titleEl = document.getElementById('month-title');
    const container = document.getElementById('calendar-days');
    if (!titleEl || !container) return;

    titleEl.textContent = MONTHS[currentMonth] + ' ' + currentYear;
    container.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const requests = getRequests();
    const today = todayStr();

    for (let i = startOffset - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const cell = document.createElement('div');
        cell.className = 'calendar-day other-month';
        cell.textContent = d;
        container.appendChild(cell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = toDateStr(currentYear, currentMonth, d);
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.textContent = d;

        if (dateStr === today) cell.classList.add('today');
        if (dateStr === selectedDate) cell.classList.add('selected');

        const hasBookings = requests.some(r => r.type === 'booking' && r.date === dateStr);
        if (hasBookings) cell.classList.add('has-bookings');

        cell.addEventListener('click', () => {
            selectedDate = dateStr;
            renderCalendar();
            renderDayPanel();
        });
        container.appendChild(cell);
    }

    const totalCells = startOffset + daysInMonth;
    const remainder = totalCells % 7;
    if (remainder !== 0) {
        const toAdd = 7 - remainder;
        for (let d = 1; d <= toAdd; d++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day other-month';
            cell.textContent = d;
            container.appendChild(cell);
        }
    }
}

/* ============================================================
   СПИСОК ЧАСОВ
   ============================================================ */
function renderDayPanel() {
    const title = document.getElementById('day-title');
    const list  = document.getElementById('hours-list');
    if (!title || !list) return;

    title.textContent = selectedDate ? formatDateRu(selectedDate) : 'Выберите дату';
    list.innerHTML = '';

    if (!selectedDate) {
        list.innerHTML = '<div class="slots-empty">Выберите дату в календаре</div>';
        updateStats(0, 0, 0);
        return;
    }

    const requests = getRequests();
    const dayBookings = requests.filter(r => r.type === 'booking' && r.date === selectedDate);
    const hours = getWorkHoursForDate(selectedDate);

    if (!hours.length) {
        list.innerHTML = '<div class="slots-empty">На этот день слоты выключены (выходной)</div>';
        updateStats(0, 0, 0);
        return;
    }

    let freeCount = 0, busyCount = 0, doneCount = 0;
    const seenIds = {};

    hours.forEach(time => {
        const booking = findBookingAtTime(dayBookings, time);

        const row = document.createElement('div');
        row.className = 'hour-row';

        const timeEl = document.createElement('div');
        timeEl.className = 'hour-time';
        timeEl.textContent = time;
        row.appendChild(timeEl);

        const statusEl = document.createElement('div');
        statusEl.className = 'hour-status';

        if (!booking) {
            statusEl.classList.add('status-free');
            statusEl.innerHTML = '<span>Свободно</span>';
            freeCount++;
        } else {
            const isFirstSlot = !seenIds[booking.id];
            seenIds[booking.id] = true;

            statusEl.classList.add('status-' + booking.status);

            const client  = escapeHtml(booking.name);
            const service = escapeHtml(booking.service || '');
            const phone   = escapeHtml(booking.phone || '');

            let label = 'Заявка';
            if (booking.status === 'confirmed') label = 'Подтверждено';
            if (booking.status === 'done')      label = 'Выполнено';

            if (isFirstSlot) {
                statusEl.innerHTML =
                    '<span class="hour-info">' +
                        '<span class="hour-client">' + client + '</span>' +
                        '<span class="hour-phone">☎ ' + phone + '</span>' +
                        '<span class="hour-service">💆 ' + service + '</span>' +
                    '</span>' +
                    '<span class="hour-label">' + label + '</span>';

                if (booking.status === 'done') doneCount++;
                else busyCount++;
            } else {
                statusEl.innerHTML =
                    '<span class="hour-info">' +
                        '<span class="hour-client">' + client + '</span>' +
                        '<span class="hour-service">💆 ' + service + '</span>' +
                    '</span>' +
                    '<span class="hour-label hour-label-cont">' +
                        label + ' · продолжение' +
                    '</span>';
            }

            statusEl.addEventListener('click', function() { openModal(booking.id); });
            row.addEventListener('click', function() { openModal(booking.id); });
        }

        row.appendChild(statusEl);
        list.appendChild(row);
    });

    updateStats(freeCount, busyCount, doneCount);
}

function updateStats(free, busy, done) {
    const f = document.getElementById('stat-free');
    const b = document.getElementById('stat-busy');
    const d = document.getElementById('stat-done');
    if (f) f.textContent = free;
    if (b) b.textContent = busy;
    if (d) d.textContent = done;
}

/* ============================================================
   МОДАЛЬНОЕ ОКНО
   ============================================================ */
function openModal(id) {
    const req = getRequests().find(r => r.id === id);
    if (!req) return;

    const card = document.getElementById('modal-card');
    if (!card) return;

    let timeLabel = req.time || '—';
    if (req.durationMin) timeLabel += ' · ' + req.durationMin + ' мин';
    if (req.slotsUsed && req.slotsUsed.length > 1) {
        timeLabel += ' (' + req.slotsUsed.join(', ') + ')';
    }

    card.innerHTML =
        '<h3>Запись №' + req.id + '</h3>' +
        '<p><b>Клиент:</b> ' + escapeHtml(req.name) + '</p>' +
        '<p><b>Телефон:</b> ' + escapeHtml(req.phone) + '</p>' +
        '<p><b>Услуга:</b> ' + escapeHtml(req.service || '—') + '</p>' +
        '<p><b>Дата:</b> ' + (req.date || '—') + '</p>' +
        '<p><b>Время:</b> ' + timeLabel + '</p>' +
        '<p><b>Статус:</b> ' + translateStatus(req.status) + '</p>' +
        '<div class="modal-actions">' +
            (req.status === 'pending' ?
                '<button class="btn-status" onclick="changeStatus(' + req.id + ', \'confirmed\')">✓ Подтвердить</button>' : '') +
            (req.status === 'confirmed' ?
                '<button class="btn-status" onclick="changeStatus(' + req.id + ', \'done\')">✓ Отметить выполненной</button>' : '') +
            (req.status !== 'done' && req.status !== 'cancelled' ?
                '<button class="btn-reschedule" onclick="toggleReschedule(' + req.id + ')">↻ Переназначить</button>' +
                '<button class="btn-delete" onclick="cancelRequest(' + req.id + ')">✕ Отменить</button>' : '') +
            '<button class="btn-close" onclick="closeModal()">Закрыть</button>' +
        '</div>' +
        '<div id="reschedule-area"></div>';

    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.classList.remove('active');
}

function changeStatus(id, newStatus) {
    const list = getRequests();
    const req = list.find(r => r.id === id);
    if (!req) return;
    req.status = newStatus;
    saveRequests(list);
    closeModal();
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderDayPanel === 'function') renderDayPanel();
    if (typeof renderWeekGrid === 'function') renderWeekGrid();
    if (typeof renderMyBookings === 'function') renderMyBookings();
}

function cancelRequest(id) {
    if (!confirm('Отменить эту запись?')) return;
    changeStatus(id, 'cancelled');
}

/* ============================================================
   ПЕРЕНАЗНАЧЕНИЕ
   ============================================================ */
function toggleReschedule(id) {
    const area = document.getElementById('reschedule-area');
    if (!area) return;

    if (area.innerHTML.trim()) {
        area.innerHTML = '';
        return;
    }

    const req = getRequests().find(r => r.id === id);
    if (!req) return;

    area.innerHTML =
        '<div class="reschedule-box">' +
            '<label>Новая дата</label>' +
            '<input type="date" id="reschedule-date" value="' + req.date + '" onchange="renderRescheduleSlots(' + id + ')">' +
            '<label>Новое время</label>' +
            '<div class="slots-grid" id="reschedule-slots"></div>' +
            '<button class="btn-reschedule-apply" onclick="applyReschedule(' + id + ')">Применить</button>' +
        '</div>';
    renderRescheduleSlots(id);
}

function renderRescheduleSlots(id) {
    const dateInput = document.getElementById('reschedule-date');
    const container = document.getElementById('reschedule-slots');
    const req = getRequests().find(r => r.id === id);
    if (!dateInput || !container || !req) return;

    const dateStr = dateInput.value;
    if (!dateStr) {
        container.innerHTML = '<div class="slots-empty">Выберите дату</div>';
        return;
    }

    const hours = getWorkHoursForDate(dateStr);
    const needed = (typeof getSlotsNeeded === 'function' && req.durationMin)
        ? getSlotsNeeded(req.durationMin) : 1;

    container.innerHTML = '';

    if (!hours.length) {
        container.innerHTML = '<div class="slots-empty">На этот день слоты выключены</div>';
        return;
    }

    hours.forEach(function(time) {
        var range = (typeof isRangeAvailable === 'function')
            ? isRangeAvailable(dateStr, time, needed, id)
            : { ok: true };

        var div = document.createElement('div');
        if (!range.ok) {
            div.className = 'slot slot-busy';
            div.textContent = time;
        } else {
            div.className = 'slot slot-free';
            div.textContent = time;
            if (req.date === dateStr && req.time === time) div.classList.add('slot-selected');
            div.addEventListener('click', function() {
                document.querySelectorAll('#reschedule-slots .slot-selected')
                    .forEach(function(el) { el.classList.remove('slot-selected'); });
                div.classList.add('slot-selected');
            });
        }
        container.appendChild(div);
    });
}

function applyReschedule(id) {
    const dateInput = document.getElementById('reschedule-date');
    const selected = document.querySelector('#reschedule-slots .slot-selected');
    if (!dateInput || !dateInput.value) { alert('Выберите дату'); return; }
    if (!selected) { alert('Выберите время'); return; }

    const list = getRequests();
    const req = list.find(r => r.id === id);
    if (!req) return;

    const newDate = dateInput.value;
    const newTime = selected.textContent.trim();
    const needed = (typeof getSlotsNeeded === 'function' && req.durationMin)
        ? getSlotsNeeded(req.durationMin) : 1;

    var range = (typeof isRangeAvailable === 'function')
        ? isRangeAvailable(newDate, newTime, needed, id)
        : { ok: true };

    if (!range.ok) {
        alert('Это время не подходит для этой услуги.');
        return;
    }

    req.date = newDate;
    req.time = newTime;
    if (range.times) req.slotsUsed = range.times;

    saveRequests(list);

    closeModal();
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderDayPanel === 'function') renderDayPanel();
    if (typeof renderWeekGrid === 'function') renderWeekGrid();
    if (typeof renderMyBookings === 'function') renderMyBookings();
}

/* ============================================================
   УТИЛИТЫ
   ============================================================ */
function translateStatus(st) {
    const map = {
        pending: 'Заявка (ждёт подтверждения)',
        confirmed: 'Подтверждено',
        done: 'Выполнено',
        cancelled: 'Отменено'
    };
    return map[st] || st;
}

function toDateStr(y, m, d) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

function todayStr() {
    const t = new Date();
    return toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

function formatDateRu(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

window.addEventListener('storage', function(e) {
    if (e.key === 'orchid_requests' || e.key === 'orchid_slots' || e.key === 'orchid_slot_overrides') {
        var adminVisible = document.getElementById('view-admin') && document.getElementById('view-admin').style.display !== 'none';
        if (adminVisible) {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderDayPanel === 'function') renderDayPanel();
            if (typeof renderWeekGrid === 'function') renderWeekGrid();
        }
    }
});
