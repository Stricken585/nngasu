(function () {
    'use strict';

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const SLOTS = [
        { start: '08:00', end: '09:30' },
        { start: '09:45', end: '11:15' },
        { start: '11:30', end: '13:00' },
        { start: '13:20', end: '14:50' },
        { start: '15:10', end: '16:40' }
    ];

    // 1 - понедельник 6 - суббота, slot — номер пары из SLOTS
    const STUDENT = {
        1: [{ slot: 0, subject: 'Управление проектами', room: 'ауд. 301', kind: 'лекция' },
            { slot: 1, subject: 'Проектный практикум', room: 'ауд. 305', kind: 'лекция' },
            { slot: 2, subject: 'Проектный практикум', room: 'ауд. 305', kind: 'практика' },
            { slot: 3, subject: 'Управление проектами', room: 'ауд. 305', kind: 'практика' },
            { slot: 4, subject: 'Качество и методология ПО', room: 'ауд. 305', kind: 'практика' }],
        2: [{ slot: 0, subject: 'Архитектура ЭВМ', room: 'ауд. 305', kind: 'практика' },
            { slot: 1, subject: 'Архитектура ЭВМ', room: 'ауд. 305', kind: 'лекция' },
            { slot: 2, subject: 'Разработка мобильных приложений', room: 'ауд. 312', kind: 'практика' }],
        3: [{ slot: 0, subject: 'УРА КАНИКУЛЫ' }],
        4: [{ slot: 0, subject: 'УРА ВТОРЫЕ КАНИКУЛЫ'}],
        5: [{ slot: 0, subject: 'Проектирование ПО', room: 'ауд. 201', kind: 'практика' },
            { slot: 1, subject: 'Проектирование ПО', room: 'ауд. 305', kind: 'лекция' }],
        6: [{ slot: 0, subject: 'УРА 3 НА СЧАСТЬЕ' }]
    };

    const TEACHER = {
        1: [{ slot: 0, subject: 'Управление проектами', group: 'ПРИ23/1', room: 'ауд. 301' },
            { slot: 1, subject: 'Проектный практикум', group: 'ПРИ23/1', room: 'ауд. 305' },
            { slot: 3, subject: 'Проектный практикум', group: 'ПРИ23/1', room: 'ауд. 305'},
            { slot: 3, subject: 'Управление проектами', group: 'ПРИ23/1', room: 'ауд. 305'},
            { slot: 3, subject: 'Качество и метология ПО', group: 'ПРИ23/1', room: 'ауд. 305'},],
        2: [{ slot: 1, subject: 'Архитектура ЗВМ', group: 'ПРИ23/1', room: 'ауд. 305' },
            { slot: 1, subject: 'Архитектура ЗВМ', group: 'ПРИ23/1', room: 'ауд. 305' },
            { slot: 2, subject: 'Разработка мобильных приложений', group: 'ПРИ23/1', room: 'ауд. 312' }],
        3: [{ slot: 0, subject: 'УРА В БАААР'}],
        4: [{ slot: 1, subject: 'УРА В БАР НА НОООЧЬ'}],
        5: [{ slot: 0, subject: 'Проектирование ПО', group: 'ПРИ23/1', room: 'ауд. 201' },
            { slot: 1, subject: 'Проектирование ПО', group: 'При23/1', room: 'ауд. 305' }],
        6: []
    };

    const COPY = {
        student: {
            lead: 'Расписание вашей группы, задания со сроками и чат с группой и преподавателем.',
            title: 'Кабинет студента',
            tasksTitle: 'Задания',
            tasks: [{ text: 'Написать сайт для вуза', chip: 'до 10 дек' }, { text: 'Дипломный проект', chip: 'до 24 дек' }],
            chatTitle: 'Чат группы',
            chat: { who: 'Преподаватель', text: 'Чтоб в пятницу все пришли.' },
            group: 'Первая группа во всем ПРИ23/1'
        },
        teacher: {
            lead: 'Ваши группы по дням недели, выдача и правка заданий, чат с каждой группой.',
            title: 'Кабинет преподавателя',
            tasksTitle: 'Задания групп',
            tasks: [{ text: 'Написать сайт для вуза · ПРИ23/1', chip: 'сдали 5 из 25' }, { text: 'Дипломный проект · ПРИ23/1', chip: 'на проверке' }],
            chatTitle: 'Чаты групп',
            chat: { who: 'Группа ПРИ23/1', text: 'Можно сдать сайт сегодня?' },
            group: 'Мои группы'
        }
    };

    const DAY_NAMES = { 1: 'пн', 2: 'вт', 3: 'ср', 4: 'чт', 5: 'пт', 6: 'сб' };
    const DAY_FULL = { 1: 'понедельник', 2: 'вторник', 3: 'среда', 4: 'четверг', 5: 'пятница', 6: 'суббота' };

    /* Состояние */
    const now = new Date();
    const jsDay = now.getDay();                         // 0 = воскресенье
    const todayIdx = jsDay >= 1 && jsDay <= 6 ? jsDay : 1;   // воскресенье показываем как понедельник
    const isRealToday = jsDay >= 1 && jsDay <= 6;

    let role = 'student';
    try {
        const savedRole = localStorage.getItem('role');
        if (savedRole === 'teacher' || savedRole === 'student') role = savedRole;
    } catch (e) { /* localStorage может быть недоступен */ }

    let selectedDay = todayIdx;

    /* Тема */
    const themeBtn = $('#themeToggle');

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        const dark = theme === 'dark';
        themeBtn.setAttribute('aria-pressed', String(dark));
        themeBtn.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    }

    applyTheme(document.documentElement.dataset.theme || 'light');

    themeBtn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    });

    /* Мобильное меню */
    const burger = $('#burger');
    const nav = $('#nav');

    function setMenu(open) {
        nav.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    }
    burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

    /* Время обэда (пар) */
    const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

    // какая пара идёт сейчас или следующая: возвращает { index, state }
    function lessonState(list) {
        if (!isRealToday) return null;
        const cur = now.getHours() * 60 + now.getMinutes();
        for (let i = 0; i < list.length; i++) {
            const s = SLOTS[list[i].slot];
            if (cur >= toMin(s.start) && cur < toMin(s.end)) return { index: i, state: 'now' };
        }
        for (let i = 0; i < list.length; i++) {
            if (cur < toMin(SLOTS[list[i].slot].start)) return { index: i, state: 'next' };
        }
        return null;
    }

    function lessonHTML(item, day, mark, forTeacher) {
        const time = SLOTS[item.slot].start;
        const detail = forTeacher
            ? `${esc(item.group)} · ${esc(item.room)}`
            : `${esc(item.room)} · ${esc(item.kind)}`;
        const tag = mark
            ? `<span class="tag${mark === 'next' ? ' tag-plain' : ''}">${mark === 'now' ? 'сейчас' : 'далее'}</span>`
            : '<span></span>';
        return `<li class="${mark === 'now' ? 'now' : ''}"><time>${time}</time><div><b>${esc(item.subject)}</b><small>${detail}</small></div>${tag}</li>`;
    }

    /* Превью кабинета */
    function renderPreview() {
        const c = COPY[role];
        const forTeacher = role === 'teacher';
        const list = (forTeacher ? TEACHER : STUDENT)[todayIdx] || [];

        $('#heroLead').textContent = c.lead;
        $('#pvTitle').textContent = c.title;
        $('#pvTasksTitle').textContent = c.tasksTitle;
        $('#pvChatTitle').textContent = c.chatTitle;

        const date = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }).format(now);
        $('#pvDayLabel').textContent = isRealToday ? 'Сегодня' : 'Ближайший учебный день';
        $('#pvDate').textContent = isRealToday ? date : DAY_FULL[todayIdx];

        const st = lessonState(list);
        $('#pvLessons').innerHTML = list.length
            ? list.map((item, i) => lessonHTML(item, todayIdx, st && st.index === i ? st.state : null, forTeacher)).join('')
            : '<li><span></span><div><b>Занятий нет</b></div><span></span></li>';

        $('#pvTasks').innerHTML = c.tasks.map(t => `<li>${esc(t.text)}<br><span class="chip">${esc(t.chip)}</span></li>`).join('');
        $('#pvChat').innerHTML = `<small>${esc(c.chat.who)}</small>${esc(c.chat.text)}`;
    }

    /* Блок Расписание: вкладки дней */
    const daysBox = $('#days');

    function renderDays() {
        daysBox.innerHTML = Object.keys(DAY_NAMES).map(d =>
            `<button type="button" role="tab" data-day="${d}" aria-selected="${Number(d) === selectedDay}">${DAY_NAMES[d]}</button>`
        ).join('');
    }

    function renderSchedule() {
        const forTeacher = role === 'teacher';
        const list = (forTeacher ? TEACHER : STUDENT)[selectedDay] || [];
        $('#schedGroup').textContent = COPY[role].group;

        const st = selectedDay === todayIdx ? lessonState(list) : null;

        $('#schedList').innerHTML = list.length
            ? list.map((item, i) => lessonHTML(item, selectedDay, st && st.index === i ? st.state : null, forTeacher)).join('')
            : `<li class="sched-empty" style="display:block"><b>Занятий нет</b><br><small>В ${DAY_FULL[selectedDay] === 'суббота' ? 'субботу' : DAY_FULL[selectedDay]} пар не запланировано.</small></li>`;

        $$('button', daysBox).forEach(b => b.setAttribute('aria-selected', String(Number(b.dataset.day) === selectedDay)));
    }

    daysBox.addEventListener('click', e => {
        const btn = e.target.closest('button[data-day]');
        if (!btn) return;
        selectedDay = Number(btn.dataset.day);
        renderSchedule();
    });

    // стрелки влево/вправо между днями
    daysBox.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        selectedDay = ((selectedDay - 1 + dir + 6) % 6) + 1;
        renderSchedule();
        const active = $(`button[data-day="${selectedDay}"]`, daysBox);
        if (active) active.focus();
    });

    /* Щелкалка роли*/
    function setRole(next) {
        role = next;
        $$('.hero-copy .seg button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.role === role)));
        try { localStorage.setItem('role', role); } catch (e) { /* ignore */ }
        renderPreview();
        renderSchedule();
    }

    $$('.hero-copy .seg button').forEach(b => b.addEventListener('click', () => setRole(b.dataset.role)));

    /* Окно входа и регистрации (пока макет, без отправки данных) */
    const dialog = $('#auth');
    const loginForm = $('#loginForm');
    const registerForm = $('#registerForm');
    const authTitle = $('#authTitle');
    let lastTrigger = null;

    function showAuthTab(name) {
        const isLogin = name === 'login';
        loginForm.hidden = !isLogin;
        registerForm.hidden = isLogin;
        authTitle.textContent = isLogin ? 'Вход' : 'Регистрация';
        $$('[data-auth-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.authTab === name)));
        clearMessages();
    }

    function openAuth(tab) {
        lastTrigger = document.activeElement;
        showAuthTab(tab);
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
        const first = $('input:not([type=radio])', tab === 'login' ? loginForm : registerForm);
        if (first) first.focus();
        setMenu(false);
    }

    function closeAuth() {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
    }

    dialog.addEventListener('close', () => { if (lastTrigger && lastTrigger.focus) lastTrigger.focus(); });

    $$('[data-open-auth]').forEach(b => b.addEventListener('click', () => openAuth(b.dataset.openAuth)));
    $$('[data-auth-tab]').forEach(b => b.addEventListener('click', () => showAuthTab(b.dataset.authTab)));
    $('#authClose').addEventListener('click', closeAuth);

    // клик по затемнённому фону закрывает окно
    dialog.addEventListener('mousedown', e => { if (e.target === dialog) closeAuth(); });

    function clearMessages() {
        $$('.form-msg').forEach(m => { m.textContent = ''; m.classList.remove('ok'); });
        $$('.auth input').forEach(i => i.removeAttribute('aria-invalid'));
    }

    function fail(form, input, text) {
        const msg = $('.form-msg', form);
        msg.classList.remove('ok');
        msg.textContent = text;
        $$('input', form).forEach(i => i.removeAttribute('aria-invalid'));
        if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
    }

    const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = loginForm.elements.email;
        const pass = loginForm.elements.password;
        if (!emailOk(email.value.trim())) return fail(loginForm, email, 'Введите почту в формате name@mail.ru');
        if (pass.value.length < 6) return fail(loginForm, pass, 'Пароль не короче 6 символов');
        clearMessages();
        const msg = $('.form-msg', loginForm);
        msg.classList.add('ok');
        msg.textContent = 'Данные верны. Вход подключим на следующем шаге.';
    });

    registerForm.addEventListener('submit', e => {
        e.preventDefault();
        const f = registerForm.elements;
        if (f.name.value.trim().split(/\s+/).filter(Boolean).length < 2) return fail(registerForm, f.name, 'Укажите фамилию и имя');
        if (!f.extra.value.trim()) return fail(registerForm, f.extra, f.role.value === 'student' ? 'Укажите группу' : 'Укажите кафедру');
        if (!emailOk(f.email.value.trim())) return fail(registerForm, f.email, 'Введите почту в формате name@mail.ru');
        if (f.password.value.length < 6) return fail(registerForm, f.password, 'Пароль не короче 6 символов');
        clearMessages();
        const msg = $('.form-msg', registerForm);
        msg.classList.add('ok');
        msg.textContent = 'Данные верны. Регистрацию подключим на следующем шаге.';
    });

    // поле «Группа» для студента, «Кафедра» для преподавателя
    $$('input[name="role"]', registerForm).forEach(r => r.addEventListener('change', () => {
        const student = r.value === 'student' && r.checked;
        if (!r.checked) return;
        $('#extraLabel').textContent = student ? 'Группа' : 'Кафедра';
        $('#extraInput').placeholder = student ? '3-ИСТ-2' : 'Информационные системы';
    }));

    // выбранная вверху роль подставляется в форму регистрации
    function syncRegisterRole() {
        const radio = $(`input[name="role"][value="${role}"]`, registerForm);
        if (radio && !radio.checked) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
    }
    $$('[data-open-auth="register"]').forEach(b => b.addEventListener('click', syncRegisterRole));

    /* Погнали старт */
    renderDays();
    setRole(role);
})();
