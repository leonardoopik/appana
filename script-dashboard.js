const API_URL = 'https://appana-xlcl.onrender.com';

// 1. VERIFICA SE ESTÁ LOGADO
const medicoId = localStorage.getItem('medicoId');
const medicoNome = localStorage.getItem('medicoNome');

if (!medicoId) {
    alert("Você precisa fazer login.");
    window.location.href = 'index.html';
} else {
    // Coloca o nome do médico no topo da tela
    const nomeDisplay = document.getElementById('nome-medico-display'); // Certifique-se que tem esse ID no HTML
    if (nomeDisplay) nomeDisplay.innerText = medicoNome;
    
    // Carrega os pacientes
    carregarPacientes();
}

// 2. FUNÇÃO DE CARREGAR PACIENTES
async function carregarPacientes() {
    try {
        const response = await fetch(`${API_URL}/pacientes-por-medico/${medicoId}`);
        const pacientes = await response.json();

        const container = document.getElementById('lista-pacientes'); // O local onde os cards vão aparecer
        if (!container) return; // Se não achar o container, para.

        container.innerHTML = ''; // Limpa antes de preencher

        if (pacientes.length === 0) {
            container.innerHTML = '<p style="text-align:center; color: #666;">Nenhum paciente cadastrado ainda.</p>';
            return;
        }

        pacientes.forEach(paciente => {
            const card = document.createElement('div');
            card.className = 'paciente-card'; // Use a classe do seu CSS
            
            // Link para ir para o PERFIL DO PACIENTE clicando no card
            card.innerHTML = `
                <div onclick="window.location.href='perfil-paciente.html?id=${paciente.id}'" style="cursor: pointer;">
                    <h3>${paciente.nome}</h3>
                    <p>Gestor: ${paciente.gestor || '---'}</p>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
    }
}

// 3. FUNÇÃO DE LOGOUT
function sair() {
    localStorage.clear();
    window.location.href = 'index.html';
}