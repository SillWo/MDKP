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
    const resultPanel = document.getElementById('resultPanel');
    const formMessage = document.getElementById('formMessage');
    const resultActions = document.getElementById('resultActions');
    const templatesBlock = document.getElementById('templatesBlock');
    const downloadActBtn = document.getElementById('downloadActBtn');
    const actModal = document.getElementById('actModal');
    const actModalClose = document.getElementById('actModalClose');
    const actModalCancel = document.getElementById('actModalCancel');
    const actModalSubmit = document.getElementById('actModalSubmit');
    const actModalMessage = document.getElementById('actModalMessage');
    const orgInput = document.getElementById('orgInput');
    const headInput = document.getElementById('headInput');
    const systemInput = document.getElementById('systemInput');
    const reportModal = document.getElementById('reportModal');
    const reportModalClose = document.getElementById('reportModalClose');
    const reportModalCancel = document.getElementById('reportModalCancel');
    const reportModalSubmit = document.getElementById('reportModalSubmit');
    const reportModalMessage = document.getElementById('reportModalMessage');
    const reportNameInput = document.getElementById('reportNameInput');

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

    const getVisibleSteps = () => steps;

    const updateProgress = () => {
        const visible = getVisibleSteps();
        const percent = ((activeIndex + 1) / visible.length) * 100;
        progressBar.style.width = `${percent}%`;
    };

    const updateButtons = () => {
        prevBtn.disabled = activeIndex === 0;
        const isLast = activeIndex === getVisibleSteps().length - 1;
        nextBtn.textContent = isLast ? 'Рассчитать' : 'Далее';
    };

    const setStep = (index, skipMessageReset = false) => {
        const visible = getVisibleSteps();
        const clamped = Math.max(0, Math.min(index, visible.length - 1));
        activeIndex = clamped;

        steps.forEach((step) => step.classList.remove('active'));
        visible[clamped].classList.add('active');
        updateProgress();
        updateButtons();
        if (!skipMessageReset) {
            setMessage('');
        }
    };

    const validateCurrent = () => {
        const step = getVisibleSteps()[activeIndex];
        setMessage('');

        if (step.dataset.step === '1') {
            const dataType = document.querySelector('input[name="dataType"]:checked');
            if (!dataType) {
                setMessage('Выберите тип данных.');
                return false;
            }
        }

        if (step.dataset.step === '2') {
            const threat = document.querySelector('input[name="threatType"]:checked');
            if (!threat) {
                setMessage('Укажите тип актуальных угроз.');
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

        if (step.dataset.step === '4') {
            const scope = document.querySelector('input[name="nonEmployeeScope"]:checked');
            if (!scope) {
                setMessage('Выберите диапазон количества внешних субъектов.');
                return false;
            }
        }

        return true;
    };

    const collectPayload = () => {
        const dataType = document.querySelector('input[name="dataType"]:checked')?.value;
        const threat = document.querySelector('input[name="threatType"]:checked')?.value;
        const threats = threat ? [threat] : [];
        const employeesOnlyChoice = getEmployeesOnly();
        const nonEmployeeScope = document.querySelector('input[name="nonEmployeeScope"]:checked')?.value;

        return {
            dataType,
            threats,
            employeesOnly: employeesOnlyChoice === true,
            nonEmployeeScope,
        };
    };

    const renderResult = (data) => {
        const { level, baseRequirements, measures, possibleLevels = [], unknownThreats = false } = data;
        lastResult = data;
        resultPanel.hidden = false;

        const reqList = baseRequirements.map((item) => `<li>${item}</li>`).join('');

        const sectionLabels = {
            'Идентификация и аутентификация': 'Идентификация и аутентификация субъектов доступа и объектов доступа',
            'Управление доступом': 'Управление доступом субъектов доступа к объектам доступа',
            'Ограничение программной среды': 'Ограничение программной среды',
            'Защита машинных носителей': 'Защита машинных носителей информации, на которых хранятся и (или) обрабатываются персональные данные (машинные носители персональных данных)',
            'Регистрация событий': 'Регистрация событий безопасности',
            'Антивирусная защита': 'Антивирусная защита',
            'Обнаружение вторжений': 'Обнаружение (предотвращение) вторжений',
            'Контроль защищенности': 'Контроль (анализ) защищенности персональных данных',
            'Целостность': 'Обеспечение целостности информационной системы и персональных данных',
            'Доступность': 'Обеспечение доступности персональных данных',
            'Защита среды виртуализации': 'Защита среды виртуализации',
            'Защита технических средств': 'Защита технических средств',
            'Защита информационной системы': 'Защита информационной системы, ее средств, систем связи и передачи данных',
            'Управление конфигурацией': 'Управление конфигурацией',
            'Выявление инцидентов': 'Выявление инцидентов и реагирование',
        };

        const sectionOrder = [
            'Идентификация и аутентификация',
            'Управление доступом',
            'Ограничение программной среды',
            'Защита машинных носителей',
            'Регистрация событий',
            'Антивирусная защита',
            'Обнаружение вторжений',
            'Контроль защищенности',
            'Целостность',
            'Доступность',
            'Защита среды виртуализации',
            'Защита технических средств',
            'Защита информационной системы',
            'Управление конфигурацией',
            'Выявление инцидентов',
        ];

        const groupedMeasures = measures.reduce((acc, item) => {
            acc[item.section] = acc[item.section] || [];
            acc[item.section].push(item);
            return acc;
        }, {});

        const accordions = sectionOrder
            .filter((key) => groupedMeasures[key] && groupedMeasures[key].length > 0)
            .map((key) => {
                const items = groupedMeasures[key]
                    .map(
                        (m) => `
                            <li>
                                <span class="measure__code">${m.code}</span>
                                <span class="measure__desc">${m.description}</span>
                            </li>
                        `,
                    )
                    .join('');
                return `
                    <details class="accordion" open>
                        <summary>${sectionLabels[key] || key}</summary>
                        <ul class="measure-list">
                            ${items}
                        </ul>
                    </details>
                `;
            })
            .join('');

        const calloutHtml = unknownThreats && possibleLevels.length > 0
            ? `
                <div class="callout callout--result">
                    <p class="muted">Тип угроз выбран как «не известен».</p>
                    <h3>Возможные уровни защищенности</h3>
                    <ul>${possibleLevels.map((item) => `<li>Угрозы ${item.threatType} типа: уровень ${item.level}</li>`).join('')}</ul>
                    <p class="muted">Для уточнения уровня защищенности закажите услугу специалиста по определению типа актуальных угроз, после этого выполните перерасчет.</p>
                </div>
            `
            : `
                <div class="callout callout--result">
                    <p class="muted">Рассчитан уровень защищенности</p>
                    <h3>Уровень ${level}</h3>
                    <p class="muted">Основные организационные требования:</p>
                    <ul>${reqList}</ul>
                </div>
            `;

        if (!unknownThreats) {
            levelBadge.textContent = `${level} уровень`;
            levelBadge.style.background = level === 1 ? 'rgba(248,113,113,0.18)' : 'rgba(37,99,235,0.12)';
            levelBadge.style.color = level === 1 ? '#b91c1c' : '#1d4ed8';
        } else {
            levelBadge.textContent = 'Не определен';
            levelBadge.style.background = 'rgba(247, 144, 9, 0.16)';
            levelBadge.style.color = '#b45309';
        }

        resultBox.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'result-grid';

        const calloutWrapper = document.createElement('div');
        calloutWrapper.innerHTML = calloutHtml;
        grid.appendChild(calloutWrapper.firstElementChild);

        templatesBlock.classList.add('docs-panel');
        grid.appendChild(templatesBlock);

        resultBox.appendChild(grid);

        resultActions.classList.add('result-actions-inline');
        resultActions.hidden = false;
        resultBox.appendChild(resultActions);

        if (!unknownThreats) {
            const measuresWrapper = document.createElement('div');
            measuresWrapper.innerHTML = `
                <div class="divider"></div>
                <h4>Базовый набор мер (${measures.length})</h4>
                <div class="measures measures--accordion">${accordions}</div>
            `;
            resultBox.appendChild(measuresWrapper);
        }

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
        resultPanel.hidden = true;
        pageLayout.classList.remove('layout--result');
        saveBtn.disabled = false;
        saveBtn.textContent = defaultSaveText;
        resultActions.hidden = true;
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
        reportModal.classList.add('active');
        reportModal.setAttribute('aria-hidden', 'false');
        reportModalMessage.textContent = '';
        reportNameInput.focus();
    };

    const downloadAct = async () => {
        const downloadBlob = (blob, fileName) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        };

        // Если расчёт ещё не выполнен — скачиваем акт для ручного заполнения
        if (!lastPayload) {
            try {
                downloadActBtn.disabled = true;
                downloadActBtn.textContent = 'Готовим...';
                const response = await fetch('/act-self');
                if (!response.ok) throw new Error('Не удалось скачать шаблон акта');
                const blob = await response.blob();
                downloadBlob(blob, 'АКТ_для_ручного_заполнения.docx');
            } catch (error) {
                setMessage(error.message);
            } finally {
                downloadActBtn.disabled = false;
                downloadActBtn.textContent = 'Скачать шаблон';
            }
            return;
        }

        // При неизвестных угрозах также предлагаем ручной шаблон
        if (lastPayload.threats.includes('unknown')) {
            try {
                downloadActBtn.disabled = true;
                downloadActBtn.textContent = 'Готовим...';
                const response = await fetch('/act-self');
                if (!response.ok) throw new Error('Не удалось скачать шаблон акта');
                const blob = await response.blob();
                downloadBlob(blob, 'АКТ_для_ручного_заполнения.docx');
            } catch (error) {
                setMessage(error.message);
            } finally {
                downloadActBtn.disabled = false;
                downloadActBtn.textContent = 'Скачать шаблон';
            }
            return;
        }

        // Открываем модал для обязательного ввода
        actModal.classList.add('active');
        actModal.setAttribute('aria-hidden', 'false');
        actModalMessage.textContent = '';
        orgInput.focus();
    };

    document.querySelectorAll('input[name="employeesOnly"]').forEach((input) => {
        input.addEventListener('change', () => {});
    });

    prevBtn.addEventListener('click', () => {
        const targetIndex = activeIndex - 1;
        setStep(targetIndex);
    });

    nextBtn.addEventListener('click', () => {
        if (!validateCurrent()) return;
        const isLast = activeIndex === getVisibleSteps().length - 1;
        if (isLast) {
            submit();
        } else {
            setStep(activeIndex + 1);
        }
    });

    restartBtn.addEventListener('click', resetFlow);
    saveBtn.addEventListener('click', saveReport);
    downloadActBtn.addEventListener('click', downloadAct);

    const closeActModal = () => {
        actModal.classList.remove('active');
        actModal.setAttribute('aria-hidden', 'true');
        actModalMessage.textContent = '';
    };

    actModalClose.addEventListener('click', closeActModal);
    actModalCancel.addEventListener('click', closeActModal);
    actModal.addEventListener('click', (e) => {
        if (e.target === actModal || e.target.classList.contains('modal__backdrop')) {
            closeActModal();
        }
    });

   actModal.addEventListener('keydown', (e) => {
       if (e.key === 'Escape') {
           closeActModal();
       }
   });

   actModal.querySelector('form').addEventListener('submit', async (e) => {
       e.preventDefault();
        if (!lastPayload) {
            actModalMessage.textContent = 'Сначала завершите опрос.';
            return;
        }
        if (!orgInput.value.trim() || !headInput.value.trim() || !systemInput.value.trim()) {
            actModalMessage.textContent = 'Заполните все поля.';
            return;
        }
        const fileName = sanitizeFileName(`АКТ_${systemInput.value.trim()}.docx`);
        try {
            actModalSubmit.disabled = true;
            actModalSubmit.textContent = 'Готовим...';
            const response = await fetch('/export-act', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName,
                    payload: lastPayload,
                    userInputs: {
                        organization: orgInput.value.trim(),
                        headPosition: headInput.value.trim(),
                        systemName: systemInput.value.trim(),
                    },
                }),
            });
            if (!response.ok) throw new Error('Не удалось сформировать акт');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            closeActModal();
        } catch (error) {
            actModalMessage.textContent = error.message;
        } finally {
            actModalSubmit.disabled = false;
            actModalSubmit.textContent = 'Скачать акт';
       }
   });

    const closeReportModal = () => {
        reportModal.classList.remove('active');
        reportModal.setAttribute('aria-hidden', 'true');
        reportModalMessage.textContent = '';
    };

    reportModalClose.addEventListener('click', closeReportModal);
    reportModalCancel.addEventListener('click', closeReportModal);
    reportModal.addEventListener('click', (e) => {
        if (e.target === reportModal || e.target.classList.contains('modal__backdrop')) {
            closeReportModal();
        }
    });

    reportModal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeReportModal();
        }
    });

    reportModal.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!lastPayload) {
            reportModalMessage.textContent = 'Сначала завершите опрос.';
            return;
        }
        const desiredName = reportNameInput.value.trim() || 'Отчет ИСПДн';
        const fileName = sanitizeFileName(desiredName);
        try {
            reportModalSubmit.disabled = true;
            reportModalSubmit.textContent = 'Сохраняем...';
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
            closeReportModal();
        } catch (error) {
            reportModalMessage.textContent = error.message;
        } finally {
            reportModalSubmit.disabled = false;
            reportModalSubmit.textContent = 'Скачать';
        }
    });

    setStep(0, true);
});
