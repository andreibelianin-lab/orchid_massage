/* ============================================================
   ДИПЛОМЫ / КВАЛИФИКАЦИЯ — витрина + редактор
   ============================================================ */

var DIPLOMAS_KEY = 'orchid_diplomas';
var DIPLOMA_IMG_MAX_WIDTH = 900;
var DIPLOMA_IMG_QUALITY = 0.82;

/* Дефолт — 3 примера, потом заменишь через админку */
var DEFAULT_DIPLOMAS = [
    { id: 1, title: 'Сертификат массажиста',      image: 'img/diploma-1.jpg', active: true, order: 1 },
    { id: 2, title: 'Профильное образование',     image: 'img/diploma-2.jpg', active: true, order: 2 },
    { id: 3, title: 'Курс по работе с телом',     image: 'img/diploma-3.jpg', active: true, order: 3 }
];

/* ---------- Хранилище ---------- */
function getDiplomas() {
    try {
        var raw = localStorage.getItem(DIPLOMAS_KEY);
        if (!raw) {
            saveDiplomas(DEFAULT_DIPLOMAS);
            return DEFAULT_DIPLOMAS.slice();
        }
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : DEFAULT_DIPLOMAS.slice();
    } catch (e) {
        return DEFAULT_DIPLOMAS.slice();
    }
}

function saveDiplomas(list) {
    try {
        localStorage.setItem(DIPLOMAS_KEY, JSON.stringify(list));
        return { ok: true };
    } catch (e) {
        if (e.name === 'QuotaExceededError' || /quota/i.test(e.message)) {
            return { ok: false, error: 'quota' };
        }
        return { ok: false, error: 'unknown' };
    }
}

function getActiveDiplomas() {
    return getDiplomas()
        .filter(function (d) { return d.active !== false; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
}

function escapeHtmlDiploma(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ============================================================
   ЛЕНТА НА ГЛАВНОЙ — анимированная прокрутка
   ============================================================ */

function renderDiplomasMarquee() {
    var track = document.getElementById('diplomas-track');
    var section = document.getElementById('diplomas');
    if (!track) return;

    var list = getActiveDiplomas();

    if (!list.length) {
        if (section) section.style.display = 'none';
        return;
    }
    if (section) section.style.display = '';

    var doubled = list.concat(list);

    track.innerHTML = '';
    doubled.forEach(function (d, i) {
        var card = document.createElement('div');
        card.className = 'diploma-card';
        card.dataset.diplomaId = d.id;

        var imgSrc = d.image || '';
        var title  = d.title || '';

        card.innerHTML =
            (imgSrc
                ? '<img src="' + escapeHtmlDiploma(imgSrc) + '" alt="' + escapeHtmlDiploma(title) + '" loading="lazy">'
                : '') +
            '<span class="diploma-zoom"><i class="fas fa-search-plus"></i></span>' +
            (title ? '<div class="diploma-caption">' + escapeHtmlDiploma(title) + '</div>' : '');

        if (imgSrc) {
            card.addEventListener('click', function () {
                openDiplomaLightbox(imgSrc);
            });
        }

        track.appendChild(card);
    });

    var baseSeconds = 8;
    var duration = Math.max(20, list.length * baseSeconds);
    track.style.animationDuration = duration + 's';
}

/* ============================================================
   ЛАЙТБОКС
   ============================================================ */

function openDiplomaLightbox(src) {
    var lb = document.getElementById('diplomas-lightbox');
    var img = document.getElementById('diplomas-lightbox-img');
    if (!lb || !img) return;
    img.src = src;
    lb.classList.add('active');
}

function closeDiplomaLightbox() {
    var lb = document.getElementById('diplomas-lightbox');
    if (lb) lb.classList.remove('active');
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDiplomaLightbox();
});

/* ============================================================
   РЕДАКТОР В АДМИНКЕ
   ============================================================ */

function renderAdminDiplomasList() {
    var container = document.getElementById('admin-diplomas-list');
    if (!container) return;

    var list = getDiplomas().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
    });

    container.innerHTML = '';

    if (!list.length) {
        container.innerHTML = '<div class="slots-empty">Дипломов нет. Нажмите «Добавить диплом».</div>';
        return;
    }

    list.forEach(function (d) {
        var card = document.createElement('div');
        card.className = 'diploma-edit-card';
        card.dataset.id = d.id;

        var hasPhoto = !!d.image;
        var thumbClass = 'diploma-edit-thumb' + (hasPhoto ? ' has-photo' : '');
        var thumbStyle = hasPhoto
            ? 'background-image: url(\'' + escapeHtmlDiploma(d.image) + '\');'
            : '';

        card.innerHTML =
            '<div class="' + thumbClass + '" style="' + thumbStyle + '" ' +
                'data-diploma-id="' + d.id + '" title="Нажмите, чтобы загрузить фото или перетащите файл">' +
                (hasPhoto ? '' : 'Нет фото') +
                '<button type="button" class="diploma-clear-photo" ' +
                    'onclick="clearDiplomaPhoto(event, ' + d.id + ')" title="Удалить фото">✕</button>' +
            '</div>' +
            '<div class="diploma-edit-fields">' +
                '<input type="text" class="diploma-edit-title" ' +
                    'value="' + escapeHtmlDiploma(d.title || '') + '" placeholder="Подпись (например: Диплом массажиста, 2023)">' +
                '<div class="diploma-edit-row">' +
                    '<input type="text" class="diploma-edit-image" ' +
                        'value="' + escapeHtmlDiploma(d.image || '') + '" placeholder="Или путь к фото, напр. img/diploma-1.jpg">' +
                    '<input type="number" class="diploma-edit-order" ' +
                        'value="' + (d.order || 0) + '" placeholder="Порядок" min="0" step="1">' +
                '</div>' +
                '<label class="diploma-edit-toggle">' +
                    '<input type="checkbox" class="diploma-edit-active" ' +
                        (d.active !== false ? 'checked' : '') + '>' +
                    'Показывать на сайте' +
                '</label>' +
            '</div>' +
            '<div class="diploma-edit-actions">' +
                '<button class="btn-save" onclick="saveDiplomaRow(' + d.id + ')" title="Сохранить">' +
                    '<i class="fas fa-check"></i>' +
                '</button>' +
                '<button class="btn-delete-row" onclick="deleteDiplomaRow(' + d.id + ')" title="Удалить">' +
                    '<i class="fas fa-trash"></i>' +
                '</button>' +
            '</div>';

        container.appendChild(card);
    });

    container.querySelectorAll('.diploma-edit-thumb').forEach(function (thumb) {
        var diplomaId = Number(thumb.dataset.diplomaId);

        thumb.addEventListener('click', function (e) {
            if (e.target.classList.contains('diploma-clear-photo')) return;
            openDiplomaFilePicker(diplomaId);
        });

        thumb.addEventListener('dragover', function (e) {
            e.preventDefault();
            thumb.style.borderColor = 'var(--champagne)';
        });
        thumb.addEventListener('dragleave', function () {
            thumb.style.borderColor = '';
        });
        thumb.addEventListener('drop', function (e) {
            e.preventDefault();
            thumb.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleDiplomaFile(diplomaId, e.dataTransfer.files[0]);
            }
        });
    });
}

function openDiplomaFilePicker(diplomaId) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.className = 'diploma-file-input';
    input.onchange = function () {
        if (input.files && input.files[0]) {
            handleDiplomaFile(diplomaId, input.files[0]);
        }
        input.remove();
    };
    document.body.appendChild(input);
    input.click();
}

function handleDiplomaFile(diplomaId, file) {
    if (!file.type || file.type.indexOf('image/') !== 0) {
        alert('Пожалуйста, выберите изображение (jpg, png, webp)');
        return;
    }
    if (file.size > 20 * 1024 * 1024) {
        alert('Файл слишком большой (больше 20 МБ). Выберите фото меньше.');
        return;
    }

    var thumb = document.querySelector('.diploma-edit-thumb[data-diploma-id="' + diplomaId + '"]');
    if (thumb) thumb.classList.add('loading');

    var reader = new FileReader();
    reader.onload = function (ev) {
        var img = new Image();
        img.onload = function () {
            try {
                var dataUrl = compressDiplomaImage(img, DIPLOMA_IMG_MAX_WIDTH, DIPLOMA_IMG_QUALITY);
                saveDiplomaImage(diplomaId, dataUrl);
            } catch (err) {
                alert('Не удалось обработать изображение: ' + err.message);
                if (thumb) thumb.classList.remove('loading');
            }
        };
        img.onerror = function () {
            alert('Не удалось прочитать файл. Возможно, он повреждён.');
            if (thumb) thumb.classList.remove('loading');
        };
        img.src = ev.target.result;
    };
    reader.onerror = function () {
        alert('Не удалось прочитать файл.');
        if (thumb) thumb.classList.remove('loading');
    };
    reader.readAsDataURL(file);
}

function compressDiplomaImage(img, maxWidth, quality) {
    var canvas = document.createElement('canvas');
    var ratio = img.width > maxWidth ? maxWidth / img.width : 1;
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', quality);
}

function saveDiplomaImage(diplomaId, dataUrl) {
    var list = getDiplomas();
    var diploma = list.find(function (d) { return d.id === diplomaId; });
    if (!diploma) return;

    var oldImage = diploma.image;
    diploma.image = dataUrl;

    var res = saveDiplomas(list);

    if (!res.ok && res.error === 'quota') {
        diploma.image = oldImage;
        var list2 = getDiplomas();
        var diploma2 = list2.find(function (d) { return d.id === diplomaId; });
        if (diploma2) diploma2.image = oldImage;
        saveDiplomas(list2);

        alert(
            'Хранилище браузера переполнено.\n\n' +
            'Освободите место: удалите ненужные фото у других дипломов ' +
            '(нажмите ✕ на превью) или удалите лишние дипломы целиком.'
        );
        var thumb = document.querySelector('.diploma-edit-thumb[data-diploma-id="' + diplomaId + '"]');
        if (thumb) thumb.classList.remove('loading');
        return;
    }

    renderAdminDiplomasList();
    if (document.getElementById('diplomas-track')) {
        renderDiplomasMarquee();
    }
}

function clearDiplomaPhoto(event, diplomaId) {
    event.stopPropagation();
    if (!confirm('Удалить фото у этого диплома?')) return;

    var list = getDiplomas();
    var diploma = list.find(function (d) { return d.id === diplomaId; });
    if (!diploma) return;

    diploma.image = '';
    saveDiplomas(list);

    renderAdminDiplomasList();
    if (document.getElementById('diplomas-track')) {
        renderDiplomasMarquee();
    }
}

function saveDiplomaRow(id) {
    var card = document.querySelector('.diploma-edit-card[data-id="' + id + '"]');
    if (!card) return;

    var list = getDiplomas();
    var diploma = list.find(function (d) { return d.id === id; });
    if (!diploma) return;

    diploma.title  = card.querySelector('.diploma-edit-title').value.trim();
    diploma.order  = Number(card.querySelector('.diploma-edit-order').value) || 0;
    diploma.active = card.querySelector('.diploma-edit-active').checked;

    var imageInput = card.querySelector('.diploma-edit-image').value.trim();
    if (imageInput && imageInput.indexOf('data:image') !== 0) {
        diploma.image = imageInput;
    } else if (!imageInput && diploma.image && diploma.image.indexOf('data:image') !== 0) {
        diploma.image = '';
    }

    var res = saveDiplomas(list);
    if (!res.ok) {
        alert('Не удалось сохранить. Возможно, хранилище переполнено.');
        return;
    }

    var thumb = card.querySelector('.diploma-edit-thumb');
    if (diploma.image) {
        thumb.style.backgroundImage = 'url(\'' + diploma.image + '\')';
        thumb.textContent = '';
        thumb.classList.add('has-photo');
    } else {
        thumb.style.backgroundImage = '';
        thumb.textContent = 'Нет фото';
        thumb.classList.remove('has-photo');
    }

    card.classList.add('saved');
    setTimeout(function () { card.classList.remove('saved'); }, 800);

    if (document.getElementById('diplomas-track')) {
        renderDiplomasMarquee();
    }
}

function deleteDiplomaRow(id) {
    if (!confirm('Удалить этот диплом из ленты?')) return;

    var list = getDiplomas().filter(function (d) { return d.id !== id; });
    saveDiplomas(list);

    renderAdminDiplomasList();

    if (document.getElementById('diplomas-track')) {
        renderDiplomasMarquee();
    }
}

function addDiploma() {
    var list = getDiplomas();

    var maxOrder = list.reduce(function (max, d) {
        return Math.max(max, d.order || 0);
    }, 0);

    var newId = Date.now();
    list.push({
        id: newId,
        title: 'Новый диплом',
        image: '',
        active: true,
        order: maxOrder + 1
    });
    saveDiplomas(list);

    renderAdminDiplomasList();

    setTimeout(function () {
        var card = document.querySelector('.diploma-edit-card[data-id="' + newId + '"]');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            var inp = card.querySelector('.diploma-edit-title');
            if (inp) { inp.focus(); inp.select(); }
        }
    }, 100);

    if (document.getElementById('diplomas-track')) {
        renderDiplomasMarquee();
    }
}

/* ============================================================
   СТАРТ
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('diplomas-track')) {
        renderDiplomasMarquee();
    }
    if (document.getElementById('admin-diplomas-list')) {
        renderAdminDiplomasList();
    }
});

window.addEventListener('storage', function (e) {
    if (e.key === DIPLOMAS_KEY) {
        if (document.getElementById('diplomas-track')) {
            renderDiplomasMarquee();
        }
        if (document.getElementById('admin-diplomas-list')) {
            renderAdminDiplomasList();
        }
    }
});
