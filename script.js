const API_URL = 'http://localhost:3000';

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
            alert("Erro: " + data.error);
        }
    } catch (error) {
        alert("Erro na conexão com o servidor. Verifique se o backend está rodando.");
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.innerText = "Entrar";
    }
}

async function registrarMedico(event) {
    event.preventDefault();
    const nome = document.getElementById('reg-name').value;
    const crm = document.getElementById('reg-crm').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-password').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, crm, email, senha })
        });

        if (response.ok) {
            alert("Cadastro realizado com sucesso! Faça login para continuar.");
            voltarLogin();
        } else {
            const data = await response.json();
            alert("Erro ao cadastrar: " + (data.error || "Tente novamente."));
        }
    } catch (error) {
        alert("Erro de conexão ao tentar cadastrar.");
    }
}

async function recuperarSenha(event) {
    event.preventDefault();
    // Simulação - Backend ainda não tem rota de e-mail real
    alert("Se este e-mail estiver cadastrado, você receberá um link de redefinição.");
    voltarLogin();
}