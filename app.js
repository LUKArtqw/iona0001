const titles = [
    "Lung Capacity",
    "Airflow Speed",
    "Weather Forecast",
    "Vital Score"
];

const cards = document.querySelectorAll(".carousel-track .main-card");
const dots = document.querySelectorAll(".dots-pagination .dot");
const titleElem = document.querySelector(".carousel-title");
const leftPeek = document.querySelector(".left-peek");
const rightPeek = document.querySelector(".right-peek");
const carouselContainer = document.querySelector(".carousel-container");

let currentIdx = 0;
let startX = 0;
let startY = 0;
let currentTranslateX = 0;
let isDragging = false;
let hasMoved = false;
let isNavigating = false;

// --- 1. ПЛАВНАЯ СМЕНА КАРТОЧКИ С 3D-УХОДОМ В ГЛУБИНУ ---
function switchCard(newIdx, direction = null) {
    if (isNavigating) return;

    if (newIdx === currentIdx) {
        const activeCard = cards[currentIdx];
        if (activeCard) {
            activeCard.classList.remove("dragging");
            activeCard.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
            activeCard.style.opacity = "1";
        }
        return;
    }

    const targetIdx = (newIdx + cards.length) % cards.length;
    const isNext = direction !== null ? direction > 0 : targetIdx > currentIdx;

    cards.forEach((card, idx) => {
        card.classList.remove("active", "prev", "dragging");
        if (idx === currentIdx) {
            // Уходящая карточка разворачивается боком и улетает в глубь
            if (isNext) {
                card.style.transform = "perspective(1100px) translateX(-70px) translateZ(-80px) rotateY(24deg) scale(0.9)";
            } else {
                card.style.transform = "perspective(1100px) translateX(70px) translateZ(-80px) rotateY(-24deg) scale(0.9)";
            }
            card.style.opacity = "0";
        }
    });

    const targetCard = cards[targetIdx];
    if (targetCard) {
        targetCard.classList.add("active");
        // Новая карта плавно встает по центру
        targetCard.style.transform = "perspective(1100px) translateX(0) translateZ(0) rotateY(0deg) scale(1)";
        targetCard.style.opacity = "1";
    }

    dots.forEach((dot, idx) => {
        dot.classList.toggle("active", idx === targetIdx);
    });

    if (titleElem) {
        titleElem.style.opacity = "0";
        setTimeout(() => {
            titleElem.textContent = titles[targetIdx];
            titleElem.style.opacity = "1";
        }, 150);
    }

    currentIdx = targetIdx;
}

// --- 2. 3D TILT ПАРАЛЛАКС В ПОКОЕ ---
function applyTilt(clientX, clientY) {
    if (isDragging || isNavigating) return;
    const activeCard = cards[currentIdx];
    if (!activeCard || !carouselContainer) return;

    const rect = carouselContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rotX = ((clientY - centerY) / (rect.height / 2)) * -8;
    const rotY = ((clientX - centerX) / (rect.width / 2)) * 8;

    activeCard.style.transform = `perspective(1100px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
}

function resetTilt() {
    if (isDragging || isNavigating) return;
    const activeCard = cards[currentIdx];
    if (activeCard) {
        activeCard.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    }
}

// --- 3. ЖЕСТЫ ПЕРЕТАСКИВАНИЯ (SWIPE/DRAG) ---
function dragStart(e) {
    if (isNavigating) return;
    isDragging = true;
    hasMoved = false;
    startX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    startY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    currentTranslateX = 0;

    const activeCard = cards[currentIdx];
    if (activeCard) {
        activeCard.classList.add("dragging");
    }
}

function dragMove(e) {
    if (isNavigating) return;
    const currentX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const currentY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    if (!isDragging) {
        applyTilt(currentX, currentY);
        return;
    }

    const diffX = currentX - startX;
    if (Math.abs(diffX) > 6) {
        hasMoved = true;
    }

    currentTranslateX = diffX;

    const activeCard = cards[currentIdx];
    if (activeCard) {
        const rotY = (diffX / 300) * 22;
        const rotZ = (diffX / 400) * -4;
        const depthZ = -Math.abs(diffX) * 0.25;
        const opacity = Math.max(0.45, 1 - Math.abs(diffX) / 420);

        activeCard.style.transform = `perspective(1100px) translateX(${diffX}px) translateZ(${depthZ}px) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;
        activeCard.style.opacity = opacity;
    }
}

function dragEnd() {
    if (!isDragging || isNavigating) return;
    isDragging = false;

    const activeCard = cards[currentIdx];
    if (activeCard) {
        activeCard.classList.remove("dragging");
    }

    const threshold = 60;
    if (currentTranslateX < -threshold) {
        switchCard(currentIdx + 1, 1);
    } else if (currentTranslateX > threshold) {
        switchCard(currentIdx - 1, -1);
    } else {
        switchCard(currentIdx);
    }

    currentTranslateX = 0;
}

// Привязка слушателей карусели
if (carouselContainer) {
    carouselContainer.addEventListener("touchstart", dragStart, { passive: true });
    carouselContainer.addEventListener("touchmove", dragMove, { passive: true });
    carouselContainer.addEventListener("touchend", dragEnd);
    carouselContainer.addEventListener("touchcancel", dragEnd);

    carouselContainer.addEventListener("mousedown", dragStart);
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragEnd);
    carouselContainer.addEventListener("mouseleave", resetTilt);
}

if (leftPeek) leftPeek.addEventListener("click", () => switchCard(currentIdx - 1, -1));
if (rightPeek) rightPeek.addEventListener("click", () => switchCard(currentIdx + 1, 1));

dots.forEach((dot, idx) => {
    dot.addEventListener("click", () => switchCard(idx));
});

// --- 4. КИНЕМАТОГРАФИЧНЫЙ ПЕРЕХОД МЕЖДУ СТРАНИЦАМИ ---
function navigateWithTransition(cardElement, targetUrl) {
    if (isNavigating) return;
    isNavigating = true;
    isDragging = false;

    const deviceScreen = document.querySelector(".device-screen");

    let overlay = document.querySelector(".screen-fade-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "screen-fade-overlay";
        document.body.appendChild(overlay);
    }

    if (deviceScreen) {
        deviceScreen.classList.add("screen-exit");
    }

    cardElement.classList.remove("dragging");
    cardElement.classList.add("card-expanding");

    setTimeout(() => {
        overlay.classList.add("active");
    }, 120);

    setTimeout(() => {
        window.location.href = targetUrl;
    }, 420);
}

// Клик по Красной карточке (Weather Forecast)
const weatherCard = document.getElementById("weather-card");
if (weatherCard) {
    weatherCard.addEventListener("click", () => {
        if (!hasMoved && weatherCard.classList.contains("active")) {
            navigateWithTransition(weatherCard, "weather.html");
        }
    });
}

// Клик по Желтой карточке (Daily test -> Sugar)
const sugarCard = document.getElementById("sugar-card");
if (sugarCard) {
    sugarCard.addEventListener("click", () => {
        if (!hasMoved && sugarCard.classList.contains("active")) {
            navigateWithTransition(sugarCard, "sugar.html");
        }
    });
}

// --- 5. ИНТЕРАКТИВНЫЕ ВИДЖЕТЫ НИЖНЕЙ СЕТКИ ---

// А) Интерактивная шкала Daily Streak
const streakTrack = document.getElementById("streak-track");
const streakThumb = document.getElementById("streak-thumb");
const streakNum = document.getElementById("streak-num");
const dashes = document.querySelectorAll("#dashes-row .dash");

if (streakTrack && streakThumb && streakNum) {
    let isTrackingStreak = false;

    function updateStreakScale(clientX) {
        const rect = streakTrack.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const progress = offsetX / rect.width;

        streakThumb.style.left = `${offsetX}px`;

        const totalDashes = dashes.length;
        const activeCount = Math.round(progress * totalDashes);

        dashes.forEach((dash, idx) => {
            dash.classList.toggle("on", idx < activeCount);
        });

        // Плавное обновление счетчика дней (от 100 до 365)
        streakNum.textContent = Math.round(100 + progress * 265);
    }

    streakTrack.addEventListener("pointerdown", (e) => {
        isTrackingStreak = true;
        streakTrack.setPointerCapture(e.pointerId);
        updateStreakScale(e.clientX);
    });

    streakTrack.addEventListener("pointermove", (e) => {
        if (isTrackingStreak) updateStreakScale(e.clientX);
    });

    const stopStreak = (e) => {
        if (isTrackingStreak) {
            isTrackingStreak = false;
            try { streakTrack.releasePointerCapture(e.pointerId); } catch (_) {}
        }
    };

    streakTrack.addEventListener("pointerup", stopStreak);
    streakTrack.addEventListener("pointercancel", stopStreak);
}

// Б) Тумблер Training Card
const trainingToggle = document.getElementById("training-toggle");
const trainingWidget = document.getElementById("training-widget");

if (trainingToggle && trainingWidget) {
    trainingToggle.addEventListener("change", () => {
        trainingWidget.classList.toggle("active-workout", trainingToggle.checked);
    });
}

// В) Симуляция вдоха / выдоха Breath Volume
const volumeWidget = document.getElementById("volume-widget");
const volumeVal = document.getElementById("volume-val");

if (volumeWidget && volumeVal) {
    let isInhaling = false;

    volumeWidget.addEventListener("click", () => {
        if (isInhaling) return;
        isInhaling = true;

        volumeWidget.classList.add("inhaling");
        volumeVal.textContent = "6.2";

        setTimeout(() => {
            volumeWidget.classList.remove("inhaling");
            volumeVal.textContent = "5.5";
            isInhaling = false;
        }, 1200);
    });
}