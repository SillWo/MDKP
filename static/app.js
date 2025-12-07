document.addEventListener('DOMContentLoaded', () => {
    const steps = Array.from(document.querySelectorAll('.wizard__step'));
    const pageLayout = document.getElementById('pageLayout');
    const progressBar = document.getElementById('progressBar');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const restartBtn = document.getElementById('restartBtn');
    const saveBtn = document.getElementById('saveBtn');
    const levelBadge = document.getElementById('levelBadge');
    const resultBox = document.getElementById('resultBox');
    const formMessage = document.getElementById('formMessage');
    const resultActions = document.getElementById('resultActions');

    const defaultResultHTML = resultBox.innerHTML;
    const defaultBadgeText = levelBadge.textContent;
    const defaultSaveText = saveBtn.textContent;

    let lastPayload = null;
    let lastResult = null;
    let activeIndex = 0;

    const setMessage = (text) => {
        formMessage.textContent = text;
    };

    const getEmployeesOnly = () => {
        const choice = document.querySelector('input[name="employeesOnly"]:checked');
        if (!choice) return null;
        return choice.value === 'yes';
    };

    const updateProgress = () => {
        const percent = ((activeIndex + 1) / steps.length) * 100;
        progressBar.style.width = `${percent}%`;
    };

    const updateButtons = () => {
        prevBtn.disabled = activeIndex === 0;
        const isLast = activeIndex === steps.length - 1;
        nextBtn.textContent = isLast ? 'Рассчитать' : 'Далее';
    };

    const setStep = (index, skipMessageReset = false) => {
        const clamped = Math.max(0, Math.min(index, steps.length - 1));
        activeIndex = clamped;

        steps.forEach((step) => step.classList.remove('active'));
        steps[clamped].classList.add('active');
        updateProgress();
        updateButtons();
        if (!skipMessageReset) {
            setMessage('');
        }
    };

    const validateCurrent = () => {
        const step = steps[activeIndex];
        setMessage('');

        if (step.dataset.step === '1') {
            const dataType = document.querySelector('input[name="dataType"]:checked');
            if (!dataType) {
                setMessage('Выберите тип данных.');
                return false;
            }
        }

        if (step.dataset.step === '2') {
            const threats = Array.from(step.querySelectorAll('input[type="checkbox"]:checked'));
            if (threats.length === 0) {
                setMessage('Отметьте хотя бы один тип угроз.');
                return false;
            }
        }

        if (step.dataset.step === '3') {
            const employeesChoice = getEmployeesOnly();
            if (employeesChoice === null) {
                setMessage('Укажите, обрабатываются ли только данные сотрудников.');
                return false;
            }
        }

        return true;
    };

    const collectPayload = () => {
        const dataType = document.querySelector('input[name="dataType"]:checked')?.value;
        const threats = Array.from(document.querySelectorAll('[data-step="2"] input[type="checkbox"]:checked')).map(
            (checkbox) => checkbox.value,
        );
        const employeesOnlyChoice = getEmployeesOnly();

        return {
            dataType,
            threats,
            employeesOnly: employeesOnlyChoice === true,
        };
    };

    const renderResult = (data) => {
        const { level, baseRequirements, measures, possibleLevels = [], unknownThreats = false } = data;
        lastResult = data;

        if (unknownThreats && possibleLevels.length > 0) {
            levelBadge.textContent = 'Не определен';
            levelBadge.style.background = 'rgba(247, 144, 9, 0.16)';
            levelBadge.style.color = '#b45309';

            const list = possibleLevels
                .map((item) => `<li>Угрозы ${item.threatType} типа: уровень ${item.level}</li>`)
                .join('');

            resultBox.innerHTML = `
                <div class="callout">
                    <p class="muted">Тип угроз выбран как «не известен».</p>
                    <h3>Возможные уровни защищенности</h3>
                    <ul>${list}</ul>
                    <p class="muted">Для уточнения уровня защищенности закажите услугу специалиста по определению типа актуальных угроз, после этого выполните перерасчет.</p>
                </div>
            `;
            resultActions.hidden = false;
            pageLayout.classList.add('layout--result');
            return;
        }

        levelBadge.textContent = `${level} уровень`;
        levelBadge.style.background = level === 1 ? 'rgba(248,113,113,0.18)' : 'rgba(37,99,235,0.12)';
        levelBadge.style.color = level === 1 ? '#b91c1c' : '#1d4ed8';

        const reqList = baseRequirements
            .map((item) => `<li>${item}</li>`)
            .join('');

        const measuresList = measures
            .map(
                (measure) => `
                <div class="measure">
                    <div class="measure__code">${measure.code}</div>
                    <div class="measure__section">${measure.section}</div>
                    <p class="measure__desc">${measure.description}</p>
                </div>
            `,
            )
            .join('');

        resultBox.innerHTML = `
            <div class="callout">
                <p class="muted">Рассчитан уровень защищенности</p>
                <h3>Уровень ${level}</h3>
                <p class="muted">Основные организационные требования:</p>
                <ul>${reqList}</ul>
            </div>
            <div class="divider"></div>
            <h4>Базовый набор мер (${measures.length})</h4>
            <div class="measures">${measuresList}</div>
        `;
        resultActions.hidden = false;
        pageLayout.classList.add('layout--result');
    };

    const submit = async () => {
        const payload = collectPayload();
        lastPayload = payload;
        try {
            nextBtn.disabled = true;
            nextBtn.textContent = 'Считаем...';
            const response = await fetch('/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('Не удалось получить результат');
            }
            const data = await response.json();
            renderResult(data);
        } catch (error) {
            setMessage(error.message);
        } finally {
            nextBtn.disabled = false;
            updateButtons();
        }
    };

    const resetFlow = () => {
        document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((input) => {
            input.checked = false;
        });
        lastPayload = null;
        lastResult = null;
        levelBadge.textContent = defaultBadgeText;
        levelBadge.style.background = '';
        levelBadge.style.color = '';
        resultBox.innerHTML = defaultResultHTML;
        resultActions.hidden = true;
        pageLayout.classList.remove('layout--result');
        saveBtn.disabled = false;
        saveBtn.textContent = defaultSaveText;
        activeIndex = 0;
        setMessage('');
        setStep(0, true);
    };

    const sanitizeFileName = (name) => {
        const fallback = 'Отчет ИСПДн';
        const safeName = (name || '').replace(/[\\/:*?"<>|]+/g, '').trim() || fallback;
        return safeName.toLowerCase().endsWith('.docx') ? safeName : `${safeName}.docx`;
    };

    const saveReport = async () => {
        if (!lastResult || !lastPayload) {
            setMessage('Сначала пройдите опрос, чтобы сохранить отчёт.');
            return;
        }
        const desiredName = prompt('Введите название отчёта', 'Отчет ИСПДн');
        if (desiredName === null) return;
        const fileName = sanitizeFileName(desiredName);
        try {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Сохраняем...';
            const response = await fetch('/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, payload: lastPayload }),
            });
            if (!response.ok) {
                throw new Error('Не удалось сохранить отчёт');
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            setMessage(error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = defaultSaveText;
        }
    };

    const threatCheckboxes = Array.from(document.querySelectorAll('[data-step="2"] input[type="checkbox"]'));

    threatCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', (event) => {
            if (event.target.value === 'unknown' && event.target.checked) {
                threatCheckboxes.forEach((cb) => {
                    if (cb.value !== 'unknown') cb.checked = false;
                });
            } else if (event.target.value !== 'unknown' && event.target.checked) {
                const unknown = threatCheckboxes.find((cb) => cb.value === 'unknown');
                if (unknown) unknown.checked = false;
            }
        });
    });

    prevBtn.addEventListener('click', () => {
        const targetIndex = activeIndex - 1;
        setStep(targetIndex);
    });

    nextBtn.addEventListener('click', () => {
        if (!validateCurrent()) return;
        const isLast = activeIndex === steps.length - 1;
        if (isLast) {
            submit();
        } else {
            setStep(activeIndex + 1);
        }
    });

    restartBtn.addEventListener('click', resetFlow);
    saveBtn.addEventListener('click', saveReport);

    setStep(0, true);
});
