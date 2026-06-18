document.addEventListener('DOMContentLoaded', () => {
    const updatePasswordForm = document.getElementById('update-password-form');
    const updateError = document.getElementById('update-error');
    const updateSuccess = document.getElementById('update-success');

    // --- CONFIGURAÇÃO DO SUPABASE ---
    const SUPABASE_URL = 'https://gmdzduejtkbhonmhatar.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_ZxDTz8UdVzyGbIjb_I-M4w_2VWn3rJb';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Inicialização da Sessão
    async function initSession() {
        const { data: { session }, error } = await supabase.auth.getSession();

        // Se o usuário não tiver uma sessão ou não houver evento de recuperação na URL
        const hash = window.location.hash || window.location.search;
        if (!hash.includes('type=recovery') && !hash.includes('recovery') && !session) {
            window.location.href = 'index.html';
        }
    }

    initSession();

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
            updateSuccess.textContent = 'Senha atualizada com sucesso! Redirecionando para o login...';
            
            // Fazer logout após atualizar a senha para forçar o login
            await supabase.auth.signOut();

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    });
});
