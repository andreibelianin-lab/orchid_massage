/* ============================================================
   ПОДАРОЧНЫЕ СЕРТИФИКАТЫ (витрина + редактор с загрузкой фото)
   ============================================================ */

var CERT_KEY = 'orchid_certificates';
var CERT_IMG_MAX_WIDTH = 600;
var CERT_IMG_QUALITY = 0.8;

var DEFAULT_CERTIFICATES = [
    {
        id: 1,
        title: 'Премиальный сертификат',
        desc: 'На любые услуги салона. Стильный чёрно-золотой дизайн.',
        image: 'img/cert-1.jpg',
        active: true,
        order: 1
    },
    {
        id: 2,
        title: 'Массаж — это удовольствие',
        desc: 'Подарок для тех, кто заботится о себе и своём теле.',
        image: 'img/cert-2.jpg',
        active: true,
        order: 2
    },
    {
        id: 3,
        title: 'Подарочный сертификат',
        desc: 'Нежный розовый дизайн. Идеально для подарка близким.',
        image: 'img/cert-3.jpg',
        active: true,
        order: 3
    }
];

/* ---------- Хранилище ---------- */
function getCertificates() {
    try {
        var raw = localStorage.getItem(CERT_KEY);
        if (!raw) {
            saveCertificates(DEFAULT_CERTIFICATES);
            return DEFAULT_CERTIFICATES.slice();
        }
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : DEFAULT_CERTIFICATES.slice();
    } catch (e) {
        return DEFAULT_CERTIFICATES.slice();
    }
}

function saveCertificates(list) {
    try {
        localStorage.setItem(CERT_KEY, JSON.stringify(list));
        return { ok: true };
    } catch (e) {
        if (e.name === 'QuotaExceededError' || /quota/i.test(e.message)) {
            return { ok: false, error: 'quota' };
        }
        return { ok: false, error: 'unknown' };
    }
}

function getActiveCertificates() {
    return getCertificates()
        .filter(function (c) { return c.active !== false; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
}

function escapeHtmlCert(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ============================================================
   ВИТРИНА НА ГЛАВНОЙ — 3D-карусель
   ============================================================ */

var certCurrentIndex = 0;

function renderCertificateShowcase() {
    var stage = document.getElementById('cert-stage');
    var dotsContainer = document.getElementById('cert-dots');
    var titleEl = document.getElementById('cert-title');
    var descEl = document.getElementById('cert-desc');
    var ctaEl = document.getElementById('cert-cta');
    var prevBtn = document.getElementById('cert-prev');
    var nextBtn = document.getElementById('cert-next');

    if (!stage) return;

    var list = getActiveCertificates();

    var section = document.getElementById('certificates');
    if (!list.length) {
        if (section) section.style.display = 'none';
        return;
    }
    if (section) section.style.display = '';

    stage.innerHTML = '';
    list.forEach(function (cert, i) {
        var card = document.createElement('div');
        card.className = 'cert-card';
        card.dataset.index = i;

        var imgSrc = cert.image || '';
        card.innerHTML =
            (imgSrc
                ? '<img src="' + escapeHtmlCert(imgSrc) + '" alt="' + escapeHtmlCert(cert.title) + '" loading="lazy">'
                : '') +
            '<div class="cert-badge">Подарок</div>';

        card.addEventListener('click', function () {
            if (i === certCurrentIndex) {
                if (imgSrc) openCertLightbox(imgSrc);
            } else {
                certCurrentIndex = i;
                updateCertShowcase();
            }
        });

        stage.appendChild(card);
    });

    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        list.forEach(function (cert, i) {
            var dot = document.createElement('span');
            dot.className = 'cert-dot' + (i === certCurrentIndex ? ' active' : '');
            dot.dataset.index = i;
            dot.addEventListener('click', function () {
                certCurrentIndex = i;
                updateCertShowcase();
            });
            dotsContainer.appendChild(dot);
        });
    }

    if (prevBtn) {
        prevBtn.onclick = function () {
            certCurrentIndex = (certCurrentIndex - 1 + list.length) % list.length;
            updateCertShowcase();
        };
    }
    if (nextBtn) {
        nextBtn.onclick = function () {
            certCurrentIndex = (certCurrentIndex + 1) % list.length;
            updateCertShowcase();
        };
    }

    if (list.length < 2) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (dotsContainer) dotsContainer.style.display = 'none';
    } else {
        if (prevBtn) prevBtn.style.display = '';
        if (nextBtn) nextBtn.style.display = '';
        if (dotsContainer) dotsContainer.style.display = '';
    }

    if (certCurrentIndex >= list.length) certCurrentIndex = 0;

    var active = list[certCurrentIndex];
    if (titleEl) titleEl.textContent = active.title || '';
    if (descEl)  descEl.textContent  = active.desc || '';
    if (ctaEl)   ctaEl.href = '#consultation';

    updateCertShowcase();
}

function updateCertShowcase() {
    var stage = document.getElementById('cert-stage');
    if (!stage) return;

    var cards = stage.querySelectorAll('.cert-card');
    var total = cards.length;

    cards.forEach(function (card, i) {
        card.className = 'cert-card';

        var diff = i - certCurrentIndex;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        if (diff === 0)          card.classList.add('pos-active', 'is-active');
        else if (diff === -1)    card.classList.add('pos-prev');
        else if (diff === 1)     card.classList.add('pos-next');
        else if (diff < 0)       card.classList.add('pos-far-left');
        else                     card.classList.add('pos-far-right');
    });

    var dots = document.querySelectorAll('.cert-dot');
    dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === certCurrentIndex);
    });

    var list = getActiveCertificates();
    var active = list[certCurrentIndex];
    if (active) {
        var titleEl = document.getElementById('cert-title');
        var descEl  = document.getElementById('cert-desc');
        if (titleEl) titleEl.textContent = active.title || '';
        if (descEl)  descEl.textContent  = active.desc || '';
    }
}

/* ============================================================
   ЛАЙТБОКС
   ============================================================ */

function openCertLightbox(imageSrc) {
    var lb = document.getElementById('cert-lightbox');
    var img = document.getElementById('cert-lightbox-img');
    if (!lb || !img) return;
    img.src = imageSrc;
    lb.classList.add('active');
}

function closeCertLightbox() {
    var lb = document.getElementById('cert-lightbox');
    if (lb) lb.classList.remove('active');
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCertLightbox();
    var lb = document.getElementById('cert-lightbox');
    if (lb && lb.classList.contains('active')) return;
    if (!document.getElementById('cert-stage')) return;
    if (e.key === 'ArrowLeft') {
        var list = getActiveCertificates();
        if (list.length > 1) {
            certCurrentIndex = (certCurrentIndex - 1 + list.length) % list.length;
            updateCertShowcase();
        }
    }
    if (e.key === 'ArrowRight') {
        var list2 = getActiveCertificates();
        if (list2.length > 1) {
            certCurrentIndex = (certCurrentIndex + 1) % list2.length;
            updateCertShowcase();
        }
    }
});

/* ============================================================
   РЕДАКТОР В АДМИНКЕ
   ============================================================ */

function renderAdminCertificatesList() {
    var container = document.getElementById('admin-certificates-list');
    if (!container) return;

    var list = getCertificates().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
    });

    container.innerHTML = '';

    if (!list.length) {
        container.innerHTML = '<div class="slots-empty">Сертификатов нет. Нажмите «Добавить сертификат».</div>';
        return;
    }

    list.forEach(function (cert) {
        var card = document.createElement('div');
        card.className = 'cert-edit-card';
        card.dataset.id = cert.id;

        var hasPhoto = !!cert.image;
        var thumbClass = 'cert-edit-thumb' + (hasPhoto ? ' has-photo' : '');
        var thumbStyle = hasPhoto
            ? 'background-image: url(\'' + escapeHtmlCert(cert.image) + '\');'
            : '';

        card.innerHTML =
            '<div class="' + thumbClass + '" style="' + thumbStyle + '" ' +
                'data-cert-id="' + cert.id + '" title="Нажмите, чтобы загрузить фото или перетащите файл">' +
                (hasPhoto ? '' : 'Нет фото') +
                '<button type="button" class="cert-clear-photo" ' +
                    'onclick="clearCertPhoto(event, ' + cert.id + ')" title="Удалить фото">✕</button>' +
                '<span class="cert-edit-thumb-label">Клик — загрузить</span>' +
            '</div>' +
            '<div class="cert-edit-fields">' +
                '<input type="text" class="cert-edit-title" ' +
                    'value="' + escapeHtmlCert(cert.title || '') + '" placeholder="Название">' +
                '<textarea class="cert-edit-desc" placeholder="Описание">' +
                    escapeHtmlCert(cert.desc || '') +
                '</textarea>' +
                '<div class="cert-edit-row">' +
                    '<input type="text" class="cert-edit-image" ' +
                        'value="' + escapeHtmlCert(cert.image || '') + '" placeholder="Или вставьте путь к фото, напр. img/cert-1.jpg">' +
                    '<input type="number" class="cert-edit-order" ' +
                        'value="' + (cert.order || 0) + '" placeholder="Порядок" min="0" step="1">' +
                '</div>' +
                '<label class="cert-edit-toggle">' +
                    '<input type="checkbox" class="cert-edit-active" ' +
                        (cert.active !== false ? 'checked' : '') + '>' +
                    'Показывать на сайте' +
                '</label>' +
            '</div>' +
            '<div class="cert-edit-actions">' +
                '<button class="btn-save" onclick="saveCertRow(' + cert.id + ')" title="Сохранить">' +
                    '<i class="fas fa-check"></i>' +
                '</button>' +
                '<button class="btn-delete-row" onclick="deleteCertRow(' + cert.id + ')" title="Удалить">' +
                    '<i class="fas fa-trash"></i>' +
                '</button>' +
            '</div>';

        container.appendChild(card);
    });

    /* Навешиваем обработчики на превью */
    container.querySelectorAll('.cert-edit-thumb').forEach(function (thumb) {
        var certId = Number(thumb.dataset.certId);

        /* Клик — открываем диалог выбора файла */
        thumb.addEventListener('click', function (e) {
            if (e.target.classList.contains('cert-clear-photo')) return;
            openCertFilePicker(certId);
        });

        /* Drag & drop */
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
                handleCertFile(certId, e.dataTransfer.files[0]);
            }
        });
    });
}

/* Скрытый input[type=file] для выбора */
function openCertFilePicker(certId) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.className = 'cert-file-input';
    input.onchange = function () {
        if (input.files && input.files[0]) {
            handleCertFile(certId, input.files[0]);
        }
        input.remove();
    };
    document.body.appendChild(input);
    input.click();
}

/* Загрузка и сжатие файла */
function handleCertFile(certId, file) {
    if (!file.type || file.type.indexOf('image/') !== 0) {
        alert('Пожалуйста, выберите изображение (jpg, png, webp)');
        return;
    }
    if (file.size > 15 * 1024 * 1024) {
        alert('Файл слишком большой (больше 15 МБ). Выберите фото меньше.');
        return;
    }

    var thumb = document.querySelector('.cert-edit-thumb[data-cert-id="' + certId + '"]');
    if (thumb) thumb.classList.add('loading');

    var reader = new FileReader();
    reader.onload = function (ev) {
        var img = new Image();
        img.onload = function () {
            try {
                var dataUrl = compressImage(img, CERT_IMG_MAX_WIDTH, CERT_IMG_QUALITY);
                saveCertImage(certId, dataUrl);
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

/* Сжатие через canvas */
function compressImage(img, maxWidth, quality) {
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

/* Сохранение base64 в сертификат */
function saveCertImage(certId, dataUrl) {
    var list = getCertificates();
    var cert = list.find(function (c) { return c.id === certId; });
    if (!cert) return;

    var oldImage = cert.image;
    cert.image = dataUrl;

    var res = saveCertificates(list);

    if (!res.ok && res.error === 'quota') {
        /* Откатываем — вернуть старое значение */
        cert.image = oldImage;
        var list2 = getCertificates();
        var cert2 = list2.find(function (c) { return c.id === certId; });
        if (cert2) cert2.image = oldImage;
        saveCertificates(list2);

        alert(
            'Хранилище браузера переполнено.\n\n' +
            'Освободите место: удалите ненужные фото у других сертификатов ' +
            '(нажмите ✕ на превью) или удалите лишние сертификаты целиком.'
        );
        var thumb = document.querySelector('.cert-edit-thumb[data-cert-id="' + certId + '"]');
        if (thumb) thumb.classList.remove('loading');
        return;
    }

    /* Перерисовываем редактор и витрину */
    renderAdminCertificatesList();
    if (document.getElementById('cert-stage')) {
        renderCertificateShowcase();
    }
}

/* Очистка фото */
function clearCertPhoto(event, certId) {
    event.stopPropagation();
    if (!confirm('Удалить фото у этого сертификата?')) return;

    var list = getCertificates();
    var cert = list.find(function (c) { return c.id === certId; });
    if (!cert) return;

    cert.image = '';
    saveCertificates(list);

    renderAdminCertificatesList();
    if (document.getElementById('cert-stage')) {
        renderCertificateShowcase();
    }
}

/* ============================================================
   СОХРАНЕНИЕ / УДАЛЕНИЕ / ДОБАВЛЕНИЕ
   ============================================================ */

function saveCertRow(id) {
    var card = document.querySelector('.cert-edit-card[data-id="' + id + '"]');
    if (!card) return;

    var list = getCertificates();
    var cert = list.find(function (c) { return c.id === id; });
    if (!cert) return;

    cert.title  = card.querySelector('.cert-edit-title').value.trim();
    cert.desc   = card.querySelector('.cert-edit-desc').value.trim();
    cert.order  = Number(card.querySelector('.cert-edit-order').value) || 0;
    cert.active = card.querySelector('.cert-edit-active').checked;

    /* Поле «Путь к фото» — только если пользователь вручную поменял.
       Если там URL/путь (не base64), берём его. Если пусто и был base64 — оставляем. */
    var imageInput = card.querySelector('.cert-edit-image').value.trim();
    if (imageInput && imageInput.indexOf('data:image') !== 0) {
        cert.image = imageInput;
    } else if (!imageInput && cert.image && cert.image.indexOf('data:image') !== 0) {
        cert.image = '';
    } else if (imageInput && imageInput.indexOf('data:image') === 0) {
        cert.image = imageInput;
    }

    if (!cert.title) {
        alert('Название не может быть пустым');
        return;
    }

    var res = saveCertificates(list);
    if (!res.ok) {
        alert('Не удалось сохранить. Возможно, хранилище переполнено.');
        return;
    }

    var thumb = card.querySelector('.cert-edit-thumb');
    if (cert.image) {
        thumb.style.backgroundImage = 'url(\'' + cert.image + '\')';
        thumb.textContent = '';
        thumb.classList.add('has-photo');
    } else {
        thumb.style.backgroundImage = '';
        thumb.textContent = 'Нет фото';
        thumb.classList.remove('has-photo');
    }

    card.classList.add('saved');
    setTimeout(function () { card.classList.remove('saved'); }, 800);

    if (document.getElementById('cert-stage')) {
        renderCertificateShowcase();
    }
}

function deleteCertRow(id) {
    if (!confirm('Удалить этот сертификат из витрины?')) return;

    var list = getCertificates().filter(function (c) { return c.id !== id; });
    saveCertificates(list);

    renderAdminCertificatesList();

    if (document.getElementById('cert-stage')) {
        renderCertificateShowcase();
    }
}

function addCertificate() {
    var list = getCertificates();

    var maxOrder = list.reduce(function (max, c) {
        return Math.max(max, c.order || 0);
    }, 0);

    var newId = Date.now();
    list.push({
        id: newId,
        title: 'Новый сертификат',
        desc: 'Описание появится здесь',
        image: '',
        active: true,
        order: maxOrder + 1
    });
    saveCertificates(list);

    renderAdminCertificatesList();

    setTimeout(function () {
        var card = document.querySelector('.cert-edit-card[data-id="' + newId + '"]');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            var inp = card.querySelector('.cert-edit-title');
            if (inp) { inp.focus(); inp.select(); }
        }
    }, 100);

    if (document.getElementById('cert-stage')) {
        renderCertificateShowcase();
    }
}

/* ============================================================
   СТАРТ
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('cert-stage')) {
        renderCertificateShowcase();
    }
    if (document.getElementById('admin-certificates-list')) {
        renderAdminCertificatesList();
    }
});

window.addEventListener('storage', function (e) {
    if (e.key === CERT_KEY) {
        if (document.getElementById('cert-stage')) {
            renderCertificateShowcase();
        }
        if (document.getElementById('admin-certificates-list')) {
            renderAdminCertificatesList();
        }
    }
});