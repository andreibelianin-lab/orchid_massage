/* ============================================================
   КАСТОМНЫЙ КАЛЕНДАРЬ ДЛЯ input[type="date"]
   ============================================================ */

(function () {
    var dpOverlay = null;
    var dpTarget = null;
    var dpYear, dpMonth;
    var dpMinDate = null;

    var MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                     'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    var DAYS_RU   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function dateToStr(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
    function strToDate(s) {
        if (!s) return null;
        var parts = s.split('-');
        if (parts.length !== 3) return null;
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    function todayDate() {
        var t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
    }

    /* Создание DOM один раз */
    function buildOverlay() {
        if (dpOverlay) return;

        dpOverlay = document.createElement('div');
        dpOverlay.className = 'dp-overlay';
        dpOverlay.innerHTML =
            '<div class="dp-card">' +
                '<div class="dp-header">' +
                    '<div class="dp-month" id="dp-month"></div>' +
                    '<div class="dp-nav">' +
                        '<button type="button" id="dp-prev" aria-label="Предыдущий месяц">‹</button>' +
                        '<button type="button" id="dp-next" aria-label="Следующий месяц">›</button>' +
                    '</div>' +
                '</div>' +
                '<div class="dp-weekdays" id="dp-weekdays"></div>' +
                '<div class="dp-days" id="dp-days"></div>' +
                '<div class="dp-footer">' +
                    '<button type="button" class="dp-btn" id="dp-cancel">Отмена</button>' +
                    '<button type="button" class="dp-btn dp-btn-today" id="dp-today">Сегодня</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(dpOverlay);

        var wd = dpOverlay.querySelector('#dp-weekdays');
        DAYS_RU.forEach(function (name) {
            var d = document.createElement('div');
            d.textContent = name;
            wd.appendChild(d);
        });

        dpOverlay.addEventListener('click', function (e) {
            if (e.target === dpOverlay) closePicker();
        });
        dpOverlay.querySelector('#dp-cancel').addEventListener('click', closePicker);

        dpOverlay.querySelector('#dp-prev').addEventListener('click', function () {
            dpMonth--;
            if (dpMonth < 0) { dpMonth = 11; dpYear--; }
            renderDays();
        });
        dpOverlay.querySelector('#dp-next').addEventListener('click', function () {
            dpMonth++;
            if (dpMonth > 11) { dpMonth = 0; dpYear++; }
            renderDays();
        });
        dpOverlay.querySelector('#dp-today').addEventListener('click', function () {
            var t = new Date();
            selectDate(t.getFullYear(), t.getMonth(), t.getDate());
        });
    }

    function openPicker(input) {
        buildOverlay();
        dpTarget = input;

        var current = strToDate(input.value);
        if (current) {
            dpYear = current.getFullYear();
            dpMonth = current.getMonth();
        } else {
            var now = new Date();
            dpYear = now.getFullYear();
            dpMonth = now.getMonth();
        }

        dpMinDate = input.getAttribute('min') ? strToDate(input.getAttribute('min')) : null;

        renderDays();
        dpOverlay.classList.add('active');
    }

    function closePicker() {
        if (dpOverlay) dpOverlay.classList.remove('active');
        dpTarget = null;
    }

    function renderDays() {
        var monthLabel = document.getElementById('dp-month');
        var grid = document.getElementById('dp-days');

        monthLabel.textContent = MONTHS_RU[dpMonth] + ' ' + dpYear;
        grid.innerHTML = '';

        var firstDay = new Date(dpYear, dpMonth, 1);
        var startOffset = firstDay.getDay() - 1;
        if (startOffset < 0) startOffset = 6;

        var daysInMonth = new Date(dpYear, dpMonth + 1, 0).getDate();
        var daysInPrevMonth = new Date(dpYear, dpMonth, 0).getDate();
        var today = todayDate();
        var selected = dpTarget ? strToDate(dpTarget.value) : null;

        for (var i = startOffset - 1; i >= 0; i--) {
            var d = daysInPrevMonth - i;
            var cell = document.createElement('div');
            cell.className = 'dp-day other-month';
            cell.textContent = d;
            grid.appendChild(cell);
        }

        for (var day = 1; day <= daysInMonth; day++) {
            (function (day) {
                var cellDate = new Date(dpYear, dpMonth, day);
                cellDate.setHours(0, 0, 0, 0);

                var cell = document.createElement('div');
                cell.className = 'dp-day';
                cell.textContent = day;

                if (cellDate.getTime() === today.getTime()) cell.classList.add('today');

                if (selected &&
                    cellDate.getFullYear() === selected.getFullYear() &&
                    cellDate.getMonth() === selected.getMonth() &&
                    cellDate.getDate() === selected.getDate()) {
                    cell.classList.add('selected');
                }

                if (dpMinDate && cellDate < dpMinDate) {
                    cell.classList.add('disabled');
                } else {
                    cell.addEventListener('click', function () {
                        selectDate(dpYear, dpMonth, day);
                    });
                }

                grid.appendChild(cell);
            })(day);
        }

        var totalCells = startOffset + daysInMonth;
        var remainder = totalCells % 7;
        if (remainder !== 0) {
            var toAdd = 7 - remainder;
            for (var k = 1; k <= toAdd; k++) {
                var cell2 = document.createElement('div');
                cell2.className = 'dp-day other-month';
                cell2.textContent = k;
                grid.appendChild(cell2);
            }
        }
    }

    function selectDate(y, m, d) {
        if (!dpTarget) return;
        var value = dateToStr(y, m, d);
        dpTarget.value = value;

        dpTarget.dispatchEvent(new Event('change', { bubbles: true }));
        dpTarget.dispatchEvent(new Event('input',  { bubbles: true }));

        closePicker();
    }

    /* ========================================================
       Подключение календаря ко всем input[type=date]
       ======================================================== */
    function attachDatePickers() {
        var inputs = document.querySelectorAll('input[type="date"]');
        inputs.forEach(function (input) {
            if (input.dataset.dpAttached === '1') return;
            input.dataset.dpAttached = '1';

            input.setAttribute('readonly', 'readonly');
            input.style.cursor = 'pointer';

            input.addEventListener('mousedown', function (e) {
                e.preventDefault();
                openPicker(input);
            });
            input.addEventListener('click', function (e) {
                e.preventDefault();
                openPicker(input);
            });
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPicker(input);
                }
            });
        });
    }

    /* Глобально доступная функция */
    window.initDatePickers = attachDatePickers;

    document.addEventListener('DOMContentLoaded', attachDatePickers);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && dpOverlay && dpOverlay.classList.contains('active')) {
            closePicker();
        }
    });
})();