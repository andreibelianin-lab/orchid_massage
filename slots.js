/* ============================================================
   УПРАВЛЕНИЕ СЛОТАМИ
   ============================================================ */

var SLOTS_KEY          = 'orchid_slots';
var SLOT_OVERRIDES_KEY = 'orchid_slot_overrides';
var BUFFER_MINUTES     = 20;

var DEFAULT_SLOTS = (function() {
    var arr = [];
    for (var h = 9; h <= 20; h++) {
        arr.push({ id: 's' + h + '00', time: String(h).padStart(2, '0') + ':00' });
        if (h < 20) {
            arr.push({ id: 's' + h + '30', time: String(h).padStart(2, '0') + ':30' });
        }
    }
    return arr;
})();

function getSlotTemplates() {
    try {
        var raw = localStorage.getItem(SLOTS_KEY);
        if (!raw) { saveSlotTemplates(DEFAULT_SLOTS); return DEFAULT_SLOTS.slice(); }
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : DEFAULT_SLOTS.slice();
    } catch (e) { return DEFAULT_SLOTS.slice(); }
}
function saveSlotTemplates(list) { localStorage.setItem(SLOTS_KEY, JSON.stringify(list)); }
function getSlotTemplatesSorted() {
    return getSlotTemplates().slice().sort(function(a, b) { return a.time.localeCompare(b.time); });
}

function getDateOverrides() {
    try {
        var raw = localStorage.getItem(SLOT_OVERRIDES_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
}
function saveDateOverrides(obj) { localStorage.setItem(SLOT_OVERRIDES_KEY, JSON.stringify(obj)); }

function isSlotActiveOnDate(slotId, dateStr) {
    var overrides = getDateOverrides();
    if (Object.prototype.hasOwnProperty.call(overrides, dateStr)) {
        return overrides[dateStr].indexOf(slotId) !== -1;
    }
    return true;
}

function toggleSlotOnDate(slotId, dateStr) {
    var overrides = getDateOverrides();
    var templates = getSlotTemplatesSorted();
    var allIds = templates.map(function(s) { return s.id; });

    if (!Object.prototype.hasOwnProperty.call(overrides, dateStr)) {
        overrides[dateStr] = allIds.slice();
    }

    var idx = overrides[dateStr].indexOf(slotId);
    if (idx >= 0) overrides[dateStr].splice(idx, 1);
    else overrides[dateStr].push(slotId);

    if (overrides[dateStr].length === allIds.length) delete overrides[dateStr];
    saveDateOverrides(overrides);
}

function setAllSlotsOnDate(dateStr, active) {
    var overrides = getDateOverrides();
    if (active) delete overrides[dateStr];
    else overrides[dateStr] = [];
    saveDateOverrides(overrides);
}

function getActiveSlotsForDate(dateStr) {
    var templates = getSlotTemplatesSorted();
    var overrides = getDateOverrides();
    if (Object.prototype.hasOwnProperty.call(overrides, dateStr)) {
        var activeIds = overrides[dateStr];
        return templates.filter(function(s) { return activeIds.indexOf(s.id) !== -1; });
    }
    return templates;
}

function timeToMinutes(t) {
    var parts = String(t || '0:0').split(':');
    var h = Number(parts[0]) || 0;
    var m = Number(parts[1]) || 0;
    return h * 60 + m;
}

function getSlotMinutes() {
    var list = getSlotTemplatesSorted();
    if (list.length < 2) return 30;
    var minDiff = Infinity;
    for (var i = 1; i < list.length; i++) {
        var diff = timeToMinutes(list[i].time) - timeToMinutes(list[i - 1].time);
        if (diff > 0 && diff < minDiff) minDiff = diff;
    }
    return isFinite(minDiff) ? minDiff : 30;
}

/* Сколько слотов нужно для сеанса (округление вверх) */
function getSlotsNeeded(durationMin) {
    var slotLen = getSlotMinutes();
    if (slotLen <= 0) return 1;
    var total = Number(durationMin) + BUFFER_MINUTES;
    return Math.max(1, Math.ceil(total / slotLen));
}

/* Проверяет, что начиная с startTime нужное число слотов подряд доступно */
function isRangeAvailable(dateStr, startTime, needed, ignoreRequestId) {
    var allSlots = getSlotTemplatesSorted();
    var startIdx = -1;
    for (var i = 0; i < allSlots.length; i++) {
        if (allSlots[i].time === startTime) { startIdx = i; break; }
    }
    if (startIdx < 0) return { ok: false, reason: 'not-found' };

    var rangeSlots = allSlots.slice(startIdx, startIdx + needed);
    if (rangeSlots.length < needed) return { ok: false, reason: 'out-of-day' };

    var requests = (typeof getRequests === 'function') ? getRequests() : [];
    var activeBookings = requests.filter(function(r) {
        return r.type === 'booking' && r.status !== 'cancelled' && r.status !== 'done';
    });

    for (var j = 0; j < rangeSlots.length; j++) {
        var slot = rangeSlots[j];
        if (!isSlotActiveOnDate(slot.id, dateStr)) {
            return { ok: false, reason: 'slot-off', blockedBy: slot.time };
        }
        var conflict = activeBookings.find(function(b) {
            if (b.id === ignoreRequestId) return false;
            if (b.date !== dateStr) return false;
            if (b.slotsUsed && Array.isArray(b.slotsUsed)) {
                return b.slotsUsed.indexOf(slot.time) !== -1;
            }
            return b.time === slot.time;
        });
        if (conflict) {
            return { ok: false, reason: 'busy', blockedBy: slot.time };
        }
    }

    return { ok: true, times: rangeSlots.map(function(s) { return s.time; }) };
}