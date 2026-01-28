const API_URL = 'https://appana-xlcl.onrender.com';

// ==========================================
// 1. FUNÇÕES DE NAVEGAÇÃO (Alterar Telas)
// ==========================================

function mostrarCadastro() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('forgot-section').classList.add('hidden');
    document.getElementById('register-section').classList.remove('hidden');
}

function mostrarRecuperar() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('forgot-section').classList.remove('hidden');
}

function voltarLogin() {
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('forgot-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
}

// ==========================================
// 2. FUNÇÕES DE API (Conexão com Servidor)
// ==========================================

async function fazerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-password').value;
    const btn = event.target.querySelector('button');
    const textoOriginal = btn.innerText;

    try {
        btn.disabled = true;
        btn.innerText = "Entrando...";

        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('medicoId', data.medicoId);
            localStorage.setItem('medicoNome', data.nome);
            window.location.href = 'dashboard.html'; 
        } else {
            alert("Erro: " + (data.error || "Falha ao entrar"));
        }
    } catch (error) {
        alert("Erro na conexão com o servidor. O backend pode estar 'dormindo' (aguarde 1 min).");
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.innerText = textoOriginal;
    }
}

async function registrarMedico(event) {
    event.preventDefault();
    
    const nome = document.getElementById('reg-name').value;
    // O CRM não é usado no backend atual, mas mantivemos aqui caso precise no futuro
    // const crm = document.getElementById('reg-crm').value; 
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-password').value;

    const btn = event.target.querySelector('button');
    const textoOriginal = btn.innerText;

    try {
        btn.disabled = true;
        btn.innerText = "Cadastrando...";

        // ATENÇÃO: Rota ajustada para /auth/register conforme o server.js
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Cadastro realizado com sucesso! Faça login para continuar.");
            voltarLogin();
        } else {
            // AQUI ESTÁ A CORREÇÃO: Mostra o erro exato do backend (Ex: "E-mail já cadastrado")
            alert(data.error || "Erro ao realizar cadastro.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão ao tentar cadastrar.");
    } finally {
        btn.disabled = false;
        btn.innerText = textoOriginal;
    }
}

async function recuperarSenha(event) {
    event.preventDefault();
    
    // Certifique-se que o ID do input no seu HTML de "Esqueci a Senha" é 'forgot-email'
    // Se for outro, altere aqui.
    const emailInput = document.getElementById('forgot-email') || document.getElementById('email-recuperar');
    const email = emailInput.value;
    
    const btn = event.target.querySelector('button');
    const textoOriginal = btn.innerText;

    if (!email) {
        alert("Digite seu e-mail.");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = "Enviando...";

        const response = await fetch(`${API_URL}/auth/esqueci-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Sucesso! Verifique seu e-mail (e a caixa de Spam) para redefinir a senha.");
            voltarLogin();
        } else {
            alert(data.error || "Erro ao solicitar recuperação.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão. Tente novamente.");
    } finally {
        btn.disabled = false;
        btn.innerText = textoOriginal;
    }
}