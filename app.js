document.addEventListener('DOMContentLoaded', () => {
    // Seções
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const calendarSection = document.getElementById('calendar-section');

    // Elementos Login
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const goToRegisterBtn = document.getElementById('go-to-register-btn');

    // Elementos Registro
    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');
    const backToLoginBtn = document.getElementById('back-to-login-btn');

    // Elementos Dashboard
    const logoutBtn = document.getElementById('logout-btn');
    const loggedUserSpan = document.getElementById('logged-user');
    const roomCards = document.querySelectorAll('.room-card');

    // Elementos Calendário
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
    const calendarRoomTitle = document.getElementById('calendar-room-title');
    const currentMonthYear = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const calendarDays = document.getElementById('calendar-days');

    // Elementos Modal Agendamento (Booking)
    const bookingModal = document.getElementById('booking-modal');
    const closeBookingModalBtn = document.getElementById('close-modal');
    const bookingForm = document.getElementById('booking-form');
    const bookingEditId = document.getElementById('booking-edit-id');
    const bookingTimeStartInput = document.getElementById('booking-time-start');
    const bookingTimeEndInput = document.getElementById('booking-time-end');
    const bookingTitleInput = document.getElementById('booking-title');
    const bookingError = document.getElementById('booking-error');
    const bookingDeleteBtn = document.getElementById('booking-delete-btn');
    const selectedDateDisplay = document.getElementById('selected-date-display');

    // Elementos Modal Detalhes (Details)
    const detailsModal = document.getElementById('details-modal');
    const closeDetailsModalBtn = document.getElementById('close-details-modal');
    const detailTitle = document.getElementById('detail-title');
    const detailUser = document.getElementById('detail-user');
    const detailDatetime = document.getElementById('detail-datetime');
    const editActions = document.getElementById('edit-actions');
    const editAppointmentBtn = document.getElementById('edit-appointment-btn');
    const deleteAppointmentBtn = document.getElementById('delete-appointment-btn');

    // --- CONFIGURAÇÃO DO SUPABASE ---
    const SUPABASE_URL = 'https://gmdzduejtkbhonmhatar.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_ZxDTz8UdVzyGbIjb_I-M4w_2VWn3rJb'; // Substitua com a sua anon key do painel do Supabase
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Estado da Aplicação
    let currentUser = null; // Email do usuário ativo
    let currentUserName = ''; // Nome do usuário ativo
    let currentRoom = '';
    let appointments = [];

    // Estado do Calendário
    let currentCalendarDate = new Date();
    let selectedBookingDate = null; // Guardará a data selecionada no calendário (YYYY-MM-DD)
    let selectedAppointmentForEdit = null;

    // Cores das Salas (mapeando pelo tema do data-theme)
    const themeColors = {
        'green': { primary: 'var(--room-green)', hover: 'var(--room-green-hover)' },
        'red': { primary: 'var(--room-red)', hover: 'var(--room-red-hover)' },
        'yellow': { primary: 'var(--room-yellow)', hover: 'var(--room-yellow-hover)' },
        'default': { primary: 'var(--primary-color)', hover: 'var(--primary-hover)' }
    };

    // Helper function para gerar o nome amigável a partir do e-mail
    function getUserName(email) {
        if (!email) return '';
        const namePart = email.split('@')[0];
        return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }

    // Inicialização da Sessão
    async function initSession() {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session && session.user) {
            currentUser = session.user.email;
            currentUserName = session.user.user_metadata.name || getUserName(currentUser);
            loggedUserSpan.textContent = `Olá, ${currentUserName}`;
            showScreen(dashboardSection);
        } else {
            showScreen(loginSection);
        }

        // Monitorar mudanças no estado de autenticação (Sign In / Sign Out)
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user.email;
                currentUserName = session.user.user_metadata.name || getUserName(currentUser);
                loggedUserSpan.textContent = `Olá, ${currentUserName}`;
                showScreen(dashboardSection);
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                currentUserName = '';
                showScreen(loginSection);
            }
        });
    }

    initSession();

    // --- NAVEGAÇÃO GENÉRICA ---
    function showScreen(screenElement) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screenElement.classList.add('active');

        // Resetar o tema dinâmico se voltar pro dashboard
        if (screenElement === dashboardSection) {
            setDynamicTheme('default');
        }
    }

    // Aplica a cor dinâmica no root via CSS variables
    function setDynamicTheme(themeKey) {
        const theme = themeColors[themeKey] || themeColors['default'];
        document.documentElement.style.setProperty('--dynamic-primary', theme.primary);
        document.documentElement.style.setProperty('--dynamic-hover', theme.hover);
    }

    // --- FLUXO DE LOGIN / REGISTRO ---
    goToRegisterBtn.addEventListener('click', () => {
        showScreen(registerSection);
        registerError.textContent = '';
    });

    backToLoginBtn.addEventListener('click', () => {
        showScreen(loginSection);
        loginError.textContent = '';
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.textContent = '';
        registerError.style.color = 'var(--error-color)';

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-password').value;

        // Registrar no Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: pass,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (error) {
            registerError.textContent = error.message;
            return;
        }

        if (data.user) {
            registerForm.reset();
            // Se o login automático após o cadastro não ocorrer (ex: confirmação de email pendente)
            if (data.session) {
                currentUser = data.user.email;
                currentUserName = name;
                loggedUserSpan.textContent = `Olá, ${currentUserName}`;
                showScreen(dashboardSection);
            } else {
                registerError.style.color = 'var(--success-color)';
                registerError.textContent = 'Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta (ou desative a confirmação de e-mail no painel do Supabase).';
                setTimeout(() => {
                    registerError.style.color = 'var(--error-color)';
                    registerError.textContent = '';
                    showScreen(loginSection);
                }, 5000);
            }
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';

        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('password').value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: pass
        });

        if (error) {
            loginError.textContent = 'E-mail ou senha incorretos: ' + error.message;
        } else {
            loginError.textContent = '';
            currentUser = data.user.email;
            currentUserName = data.user.user_metadata.name || getUserName(currentUser);
            loggedUserSpan.textContent = `Olá, ${currentUserName}`;
            showScreen(dashboardSection);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        currentUser = null;
        currentUserName = '';
        document.getElementById('login-email').value = '';
        document.getElementById('password').value = '';
        showScreen(loginSection);
    });

    // --- DASHBOARD E SALAS ---
    backToDashboardBtn.addEventListener('click', () => {
        showScreen(dashboardSection);
    });

    roomCards.forEach(card => {
        card.addEventListener('click', () => {
            currentRoom = card.getAttribute('data-room');
            const theme = card.getAttribute('data-theme');

            // Setar o tema visual da tela de calendário
            setDynamicTheme(theme);

            calendarRoomTitle.textContent = `Agendamentos - ${currentRoom}`;
            currentCalendarDate = new Date(); // Volta pro mês atual
            renderCalendar();
            showScreen(calendarSection);
        });
    });

    // --- LÓGICA DO CALENDÁRIO ---
    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    async function renderCalendar() {
        // Buscar agendamentos desta sala direto do Supabase
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('room', currentRoom);

        if (error) {
            console.error('Erro ao buscar agendamentos:', error);
            appointments = [];
        } else {
            appointments = data || [];
        }

        calendarDays.innerHTML = '';

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        currentMonthYear.textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Células vazias
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDiv);
        }

        // Dias do mês
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayOfWeek = dateObj.getDay();

            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';

            // Elemento de número do dia
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.className = 'day-number';
            dayNumberSpan.textContent = i;
            dayDiv.appendChild(dayNumberSpan);

            // Verificar fim de semana (0=Dom, 6=Sáb)
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

            // Verificar passado
            const dateWithoutTime = new Date(year, month, i);
            const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isPast = dateWithoutTime < todayWithoutTime;

            if (isWeekend || isPast) {
                dayDiv.classList.add('disabled');
            } else {
                dayDiv.addEventListener('click', () => {
                    openBookingModal(dateStr, i, monthNames[month], year);
                });
            }

            if (dateStr === todayStr) {
                dayDiv.classList.add('today');
            }

            // --- INJETAR CHIPS DOS AGENDAMENTOS NESTE DIA ---
            const dayAppointments = appointments
                .filter(app => app.room === currentRoom && app.date === dateStr)
                .sort((a, b) => new Date(`1970-01-01T${a.start_time}`) - new Date(`1970-01-01T${b.start_time}`));

            dayAppointments.forEach(app => {
                const chip = document.createElement('div');
                chip.className = 'event-chip';

                const isMe = (app.user_email === currentUser) ? "(Eu) " : "";
                const startTime = app.start_time ? app.start_time.substring(0, 5) : "00:00";
                const endTime = app.end_time ? app.end_time.substring(0, 5) : "00:00";
                chip.textContent = `${startTime}-${endTime} ${isMe}${app.title}`;

                // Ao clicar no agendamento
                chip.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evita abrir o modal de novo agendamento
                    openDetailsModal(app, i, monthNames[month], year);
                });

                dayDiv.appendChild(chip);
            });

            calendarDays.appendChild(dayDiv);
        }
    }

    // --- MODAL DE DETALHES ---
    function openDetailsModal(app, day, monthName, year) {
        selectedAppointmentForEdit = app;

        detailTitle.textContent = app.title;
        detailUser.textContent = getUserName(app.user_email);
        const startTime = app.start_time ? app.start_time.substring(0, 5) : "00:00";
        const endTime = app.end_time ? app.end_time.substring(0, 5) : "00:00";
        detailDatetime.textContent = `${day} de ${monthName} de ${year} das ${startTime} às ${endTime}`;

        if (app.user_email === currentUser) {
            editActions.classList.remove('hidden');
            editActions.style.display = 'flex';
        } else {
            editActions.classList.add('hidden');
            editActions.style.display = 'none';
        }

        detailsModal.classList.remove('hidden');
    }

    closeDetailsModalBtn.addEventListener('click', () => {
        detailsModal.classList.add('hidden');
    });

    editAppointmentBtn.addEventListener('click', () => {
        // Fechar detalhes e abrir booking modal em modo edição
        detailsModal.classList.add('hidden');

        const app = selectedAppointmentForEdit;
        const [y, m, d] = app.date.split('-');
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        selectedBookingDate = app.date;
        selectedDateDisplay.textContent = `Data: ${parseInt(d, 10)} de ${monthNames[parseInt(m, 10) - 1]} de ${y} (Editando)`;

        bookingEditId.value = app.id;
        bookingTimeStartInput.value = app.start_time ? app.start_time.substring(0, 5) : "";
        bookingTimeEndInput.value = app.end_time ? app.end_time.substring(0, 5) : "";
        bookingTitleInput.value = app.title;
        bookingError.textContent = '';

        bookingDeleteBtn.classList.remove('hidden');

        bookingModal.classList.remove('hidden');
    });

    // Excluir Agendamento via detalhes
    deleteAppointmentBtn.addEventListener('click', async () => {
        if (!selectedAppointmentForEdit) return;

        const confirmDelete = confirm('Tem certeza que deseja excluir este agendamento?');
        if (confirmDelete) {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', selectedAppointmentForEdit.id);

            if (error) {
                alert('Erro ao excluir agendamento: ' + error.message);
                return;
            }

            detailsModal.classList.add('hidden');
            renderCalendar();
        }
    });

    // --- MODAL DE AGENDAMENTO (NOVO / EDITAR) ---
    function openBookingModal(dateStr, day, monthName, year) {
        selectedBookingDate = dateStr;
        selectedDateDisplay.textContent = `Data: ${day} de ${monthName} de ${year}`;

        bookingForm.reset();
        bookingEditId.value = ''; // Limpar id de edição
        bookingError.textContent = '';
        bookingDeleteBtn.classList.add('hidden');

        bookingModal.classList.remove('hidden');
    }

    closeBookingModalBtn.addEventListener('click', () => {
        bookingModal.classList.add('hidden');
    });

    // Auto-preencher o horário de fim para 1 hora a mais do que o início
    bookingTimeStartInput.addEventListener('change', (e) => {
        if (e.target.value) {
            const [hourStr, minStr] = e.target.value.split(':');
            let hour = parseInt(hourStr, 10);
            hour = (hour + 1) % 24;
            bookingTimeEndInput.value = `${String(hour).padStart(2, '0')}:${minStr}`;
        }
    });

    // Excluir Agendamento via formulário de edição
    bookingDeleteBtn.addEventListener('click', async () => {
        const editId = bookingEditId.value;
        if (!editId) return;

        const confirmDelete = confirm('Tem certeza que deseja excluir este agendamento?');
        if (confirmDelete) {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', editId);

            if (error) {
                alert('Erro ao excluir agendamento: ' + error.message);
                return;
            }

            bookingModal.classList.add('hidden');
            renderCalendar();
        }
    });

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        bookingError.textContent = '';

        const editId = bookingEditId.value;
        const startTime = bookingTimeStartInput.value;
        const endTime = bookingTimeEndInput.value;
        const title = bookingTitleInput.value;

        if (!startTime || !endTime) {
            bookingError.textContent = 'Por favor, selecione um horário válido de início e fim.';
            return;
        }

        if (startTime >= endTime) {
            bookingError.textContent = 'O horário de fim deve ser depois do horário de início.';
            return;
        }

        // Validação adicional: Se for a data de hoje, não permitir agendar pra um horário que já passou
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        if (selectedBookingDate === todayStr) {
            const [hourStr, minStr] = startTime.split(':');
            const currentHour = today.getHours();
            const currentMinutes = today.getMinutes();

            if (parseInt(hourStr) < currentHour || (parseInt(hourStr) === currentHour && parseInt(minStr) <= currentMinutes)) {
                bookingError.textContent = 'Este horário já passou. Escolha um horário futuro.';
                return;
            }
        }

        // Validar conflito localmente antes de tentar salvar
        const conflict = appointments.find(app => {
            if (app.room !== currentRoom || app.date !== selectedBookingDate || app.id === editId) return false;
            const appStart = app.start_time;
            const appEnd = app.end_time;
            return (startTime < appEnd && endTime > appStart);
        });

        if (conflict) {
            bookingError.textContent = 'Já existe um agendamento neste horário nesta sala.';
            return;
        }

        if (editId) {
            // Atualizar no Supabase
            const { error } = await supabase
                .from('appointments')
                .update({
                    start_time: startTime,
                    end_time: endTime,
                    title: title
                })
                .eq('id', editId);

            if (error) {
                bookingError.textContent = 'Erro ao atualizar agendamento: ' + error.message;
                return;
            }
        } else {
            // Criar novo no Supabase
            const { error } = await supabase
                .from('appointments')
                .insert({
                    user_email: currentUser,
                    room: currentRoom,
                    date: selectedBookingDate,
                    start_time: startTime,
                    end_time: endTime,
                    title: title
                });

            if (error) {
                bookingError.textContent = 'Erro ao criar agendamento: ' + error.message;
                return;
            }
        }

        bookingModal.classList.add('hidden');
        renderCalendar();
    });
});
