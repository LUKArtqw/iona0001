document.addEventListener("DOMContentLoaded", () => {
    // --- 1. ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ПЛАВНОГО СЧЕТА ---
    function animateNumber(element, startVal, endVal, duration = 320) {
        if (!element || startVal === endVal) return;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startVal + (endVal - startVal) * easeOut);
            
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // --- 2. ПЕРЕКЛЮЧЕНИЕ ДНЕЙ, DYNAMIC ISLAND И КОЛЬЦО ГЛЮКОЗЫ ---
    const dayChips = document.querySelectorAll(".day-chip");
    const sugarVal = document.getElementById("sugar-val");
    const island = document.querySelector(".dynamic-island");
    const ringFill = document.querySelector(".ring-fill");
    const ringVal = document.querySelector(".ring-value");
    const glucoseNum = document.querySelector(".hero-num");

    const dataByDay = [
        { sugar: 88, avg: 82, offset: 46 },
        { sugar: 90, avg: 84, offset: 38 },
        { sugar: 93, avg: 87, offset: 30 },
        { sugar: 85, avg: 80, offset: 52 },
        { sugar: 91, avg: 85, offset: 36 }
    ];

    dayChips.forEach((chip, index) => {
        chip.addEventListener("click", () => {
            dayChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            // Отклик Dynamic Island
            if (island) {
                island.classList.add("island-pulse");
                setTimeout(() => island.classList.remove("island-pulse"), 260);
            }

            const currentData = dataByDay[index] || dataByDay[1];

            // Плавный пересчет Sugar
            if (sugarVal) {
                const currentNum = parseInt(sugarVal.textContent, 10) || 90;
                animateNumber(sugarVal, currentNum, currentData.sugar);
            }

            // Плавный пересчет Average Glucose
            if (glucoseNum) {
                const currAvg = parseInt(glucoseNum.textContent, 10) || 84;
                animateNumber(glucoseNum, currAvg, currentData.avg);
            }
            if (ringVal) {
                const currRing = parseInt(ringVal.textContent, 10) || 84;
                animateNumber(ringVal, currRing, currentData.avg);
            }

            // Перекрутка неонового кольца
            if (ringFill) {
                ringFill.style.strokeDashoffset = currentData.offset;
            }
        });
    });

    // --- 3. ИНТЕРАКТИВНЫЙ ГРАФИК САХАРА И БЕГУЩИЙ СКАНЕР ---
    const chartWrap = document.getElementById("sugar-chart");
    const marker = document.getElementById("sugar-marker");
    const curve = document.getElementById("glucose-curve");
    const scannerDot = document.getElementById("wave-scanner-dot");

    if (curve) {
        const totalLen = curve.getTotalLength();
        let isDraggingChart = false;

        // Постоянно бегущая световая точка по синусоиде
        let scanProgress = 0;
        function loopScan() {
            if (!isDraggingChart && scannerDot) {
                scanProgress = (scanProgress + 0.0035) % 1;
                const p = curve.getPointAtLength(scanProgress * totalLen);
                scannerDot.setAttribute("cx", p.x);
                scannerDot.setAttribute("cy", p.y);
            }
            requestAnimationFrame(loopScan);
        }
        requestAnimationFrame(loopScan);

        function updateMarkerPosition(clientX) {
            const rect = chartWrap.getBoundingClientRect();
            const currentX = clientX - rect.left;
            const progress = Math.max(0.01, Math.min(currentX / rect.width, 0.99));
            const pt = curve.getPointAtLength(progress * totalLen);

            marker.setAttribute("transform", `translate(${pt.x}, 0)`);
            const markerCircle = marker.querySelector("circle");
            if (markerCircle) markerCircle.setAttribute("cy", pt.y);

            if (sugarVal) {
                const dynamicSugar = Math.round(80 + (40 - pt.y) * 0.9);
                sugarVal.textContent = dynamicSugar;
            }
        }

        if (chartWrap && marker) {
            chartWrap.addEventListener("pointerdown", (e) => {
                isDraggingChart = true;
                chartWrap.setPointerCapture(e.pointerId);
                updateMarkerPosition(e.clientX);
            });

            chartWrap.addEventListener("pointermove", (e) => {
                if (isDraggingChart) updateMarkerPosition(e.clientX);
            });

            const stopDrag = (e) => {
                if (isDraggingChart) {
                    isDraggingChart = false;
                    try { chartWrap.releasePointerCapture(e.pointerId); } catch (_) {}
                }
            };

            chartWrap.addEventListener("pointerup", stopDrag);
            chartWrap.addEventListener("pointercancel", stopDrag);
        }
    }

    // --- 4. ТАКТИЛЬНЫЙ КЛИК ПО SPIKES С ГЛИТЧ-ВСПЫШКОЙ ---
    const spikesCard = document.querySelector(".spikes-card");
    if (spikesCard) {
        spikesCard.addEventListener("click", () => {
            spikesCard.classList.remove("flash-active");
            void spikesCard.offsetWidth; // перезапуск анимации
            spikesCard.classList.add("flash-active");
            setTimeout(() => spikesCard.classList.remove("flash-active"), 320);
        });
    }

    // --- 5. МНОГОСЛОЙНЫЙ 3D TILT ПАРАЛЛАКС ---
    const cards = document.querySelectorAll(".interactive-tilt");

    cards.forEach(card => {
        function handleTilt(clientX, clientY) {
            const rect = card.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            // Нормализованные координаты от -1 до +1
            const normX = (x / rect.width - 0.5) * 2;
            const normY = (y / rect.height - 0.5) * 2;

            // Углы наклона карточки (до 14 градусов)
            const rotX = -normY * 14;
            const rotY = normX * 14;

            // Тень падает в противоположную сторону от точки нажатия
            const shadowX = -normX * 18;
            const shadowY = -normY * 18 + 14;
            const shadowBlur = 28;

            card.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(12px)`;
            card.style.boxShadow = `
                inset 0 1px 2px rgba(255, 255, 255, 0.25),
                ${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px ${shadowBlur}px rgba(0, 0, 0, 0.9),
                0 4px 10px rgba(0, 0, 0, 0.5)
            `;
        }

        // Поддержка мыши и сенсорного пальца
        card.addEventListener("pointermove", (e) => {
            handleTilt(e.clientX, e.clientY);
        });

        const resetTilt = () => {
            card.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0px)";
            card.style.boxShadow = `
                inset 0 1px 1px rgba(255, 255, 255, 0.14),
                0 12px 24px rgba(0, 0, 0, 0.7)
            `;
        };

        card.addEventListener("pointerleave", resetTilt);
        card.addEventListener("pointerup", resetTilt);
        card.addEventListener("pointercancel", resetTilt);
    });
});