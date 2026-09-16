/* ============================================================
   ХРАНИЛИЩЕ ЗАЯВОК
   ============================================================ */
var STORAGE_KEY = 'orchid_requests';

function getRequests() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
}
function saveRequests(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ============================================================
   СЛАЙДЕР
   ============================================================ */
var slideIndex = 0;
var slides = document.querySelectorAll('.slide');
var dots = document.querySelectorAll('.dot');
var slideTimer = null;

function showSlide(i) {
    if (!slides.length) return;
    slides.forEach(function(s) { s.classList.remove('active'); });
    dots.forEach(function(d) { d.classList.remove('active'); });
    slideIndex = (i + slides.length) % slides.length;
    slides[slideIndex].classList.add('active');
    dots[slideIndex].classList.add('active');
}
function startSlider() {
    clearInterval(slideTimer);
    slideTimer = setInterval(function() { showSlide(slideIndex + 1); }, 5000);
}
if (slides.length) {
    showSlide(0);
    startSlider();
    dots.forEach(function(dot, i) {
        dot.addEventListener('click', function() { showSlide(i); startSlider(); });
    });
}

/* ============================================================
   ПЛАВНАЯ ПРОКРУТКА
   ============================================================ */
document.querySelectorAll('nav a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    });
});

/* ============================================================
   ЗАЯВКА НА КОНСУЛЬТАЦИЮ
   ============================================================ */
function submitConsultation(e) {
    e.preventDefault();
    var form = e.target;
    var list = getRequests();
    list.push({
        id: Date.now(),
        type: 'consultation',
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
    });
    saveRequests(list);
    form.reset();
    alert('Заявка на консультацию отправлена! Специалист перезвонит.');
}