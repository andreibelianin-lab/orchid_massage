/* ============================================================
   ЗАПИСЬ НА ПРИЁМ — главная страница
   ============================================================ */

function renderSlots() {
    var dateInput = document.getElementById('booking-date');
    var serviceSel = document.getElementById('booking-service') || document.querySelector('select[name="service"]');
    var container = document.getElementById('slots-container');
    var hiddenTime = document.getElementById('booking-time');
    if (!dateInput || !container) return;

    hiddenTime.value = '';

    var dateStr = dateInput.value;
    var serviceName = serviceSel ? serviceSel.value : '';

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

    var active = (typeof getActiveSlotsForDate === 'function') ? getActiveSlotsForDate(dateStr) : [];

    if (!active.length) {
        container.innerHTML = '<div class="slots-empty">На этот день записи недоступны</div>';
        return;
    }

    container.innerHTML = '';

    var hint = document.createElement('div');
    hint.className = 'slots-hint';
    hint.innerHTML = '<i class="far fa-clock"></i> ' + service.name + ' · ' + (service.duration || (durationMin + ' мин'));
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
                document.querySelectorAll('#slots-container .slot-selected')
                    .forEach(function(el) { el.classList.remove('slot-selected'); });
                div.classList.add('slot-selected');
                hiddenTime.value = slot.time;
            });
        }
        container.appendChild(div);
    });
}

function submitBooking(e) {
    e.preventDefault();
    var form = e.target;
    var time = document.getElementById('booking-time').value;
    var serviceSel = document.getElementById('booking-service') || form.querySelector('select[name="service"]');
    var serviceName = serviceSel ? serviceSel.value : '';

    if (!serviceName) { alert('Пожалуйста, выберите услугу.'); return; }
    if (!time) { alert('Пожалуйста, выберите свободное время.'); return; }

    var dateStr = form.date.value;
    var service = (typeof getServiceByName === 'function') ? getServiceByName(serviceName) : null;
    if (!service) { alert('Услуга не найдена, обновите страницу.'); return; }

    var durationMin = (typeof getServiceDurationMin === 'function') ? getServiceDurationMin(service) : 30;
    var needed = (typeof getSlotsNeeded === 'function') ? getSlotsNeeded(durationMin) : 1;

    var range = (typeof isRangeAvailable === 'function')
        ? isRangeAvailable(dateStr, time, needed)
        : { ok: true };

    if (!range.ok) {
        alert('Этот талон только что заняли. Выберите другое время.');
        renderSlots();
        return;
    }

    var list = getRequests();
    list.push({
        id: Date.now(),
        type: 'booking',
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
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
    document.getElementById('booking-time').value = '';
    renderSlots();

    alert('Вы записаны на ' + dateStr + ' в ' + time + '. Ждите подтверждения!');
}

document.addEventListener('DOMContentLoaded', function() {
    var dateInput = document.getElementById('booking-date');
    if (dateInput) {
        var today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        renderSlots();
    }
});