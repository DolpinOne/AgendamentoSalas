document.addEventListener('DOMContentLoaded', () => {
    // Seções
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const forgotPasswordSection = document.getElementById('forgot-password-section');
    const updatePasswordSection = document.getElementById('update-password-section');

    // Elementos Login
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const goToRegisterBtn = document.getElementById('go-to-register-btn');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    // Elementos Recuperar Senha
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const backToLoginFromForgotBtn = document.getElementById('back-to-login-from-forgot-btn');
    const forgotError = document.getElementById('forgot-error');
    const forgotSuccess = document.getElementById('forgot-success');

    // Elementos Atualizar Senha (via link)
    const updatePasswordForm = document.getElementById('update-password-form');
    const updateError = document.getElementById('update-error');
    const updateSuccess = document.getElementById('update-success');

    // Elementos Registro
    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');
    const backToLoginBtn = document.getElementById('back-to-login-btn');

    // --- CONFIGURAÇÃO DO SUPABASE ---
    const SUPABASE_URL = 'https://gmdzduejtkbhonmhatar.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_ZxDTz8UdVzyGbIjb_I-M4w_2VWn3rJb';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Inicialização da Sessão
    async function initSession() {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session && session.user) {
            // Se houver uma requisição de recuperação na URL, não redireciona ainda
            const hash = window.location.hash || window.location.search;
            if (!hash.includes('type=recovery') && !hash.includes('recovery')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            showScreen(loginSection);
        }

        // Monitorar mudanças no estado de autenticação (Sign In / Sign Out)
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                showScreen(updatePasswordSection);
            } else if (event === 'SIGNED_IN' && session) {
                if (!updatePasswordSection.classList.contains('active')) {
                    window.location.href = 'dashboard.html';
                }
            } else if (event === 'SIGNED_OUT') {
                showScreen(loginSection);
            }
        });
    }

    initSession();

    function showScreen(screenElement) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screenElement.classList.add('active');
    }

    // --- NAVEGAÇÃO ---
    goToRegisterBtn.addEventListener('click', () => {
        showScreen(registerSection);
        registerError.textContent = '';
    });

    backToLoginBtn.addEventListener('click', () => {
        showScreen(loginSection);
        loginError.textContent = '';
    });

    forgotPasswordLink.addEventListener('click', () => {
        showScreen(forgotPasswordSection);
        forgotError.textContent = '';
        forgotSuccess.textContent = '';
        document.getElementById('forgot-email').value = '';
    });

    backToLoginFromForgotBtn.addEventListener('click', () => {
        showScreen(loginSection);
    });

    // --- AÇÕES ---
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
            window.location.href = 'dashboard.html';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.textContent = '';
        registerError.style.color = 'var(--error-color)';

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-password').value;

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
            if (data.session) {
                window.location.href = 'dashboard.html';
            } else {
                registerError.style.color = 'var(--success-color)';
                registerError.textContent = 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.';
                setTimeout(() => {
                    registerError.style.color = 'var(--error-color)';
                    registerError.textContent = '';
                    showScreen(loginSection);
                }, 5000);
            }
        }
    });

    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        forgotError.textContent = '';
        forgotSuccess.textContent = '';

        const email = document.getElementById('forgot-email').value.trim();

        // Passando a URL atual para garantir que o redirecionamento caia no index.html correto
        const redirectUrl = window.location.href.split('#')[0].split('?')[0];

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        });

        if (error) {
            forgotError.textContent = 'Erro ao enviar e-mail: ' + error.message;
        } else {
            forgotSuccess.textContent = 'Instruções enviadas! Verifique sua caixa de entrada e spam.';
            setTimeout(() => {
                showScreen(loginSection);
            }, 5000);
        }
    });

    updatePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        updateError.textContent = '';
        updateSuccess.textContent = '';

        const newPassword = document.getElementById('update-password').value;

        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            updateError.textContent = 'Erro ao atualizar senha: ' + error.message;
        } else {
            updateSuccess.textContent = 'Senha atualizada com sucesso! Redirecionando...';
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
    });
});
