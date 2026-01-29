const API_URL = 'https://appana-xlcl.onrender.com';

// ==========================================
// 1. VERIFICAÇÃO DE LOGIN
// ==========================================
const medicoId = localStorage.getItem('medicoId');
const medicoNome = localStorage.getItem('medicoNome');

if (!medicoId) {
    window.location.href = 'index.html';
} else {
    // Mostra o nome do médico (se houver o elemento no HTML)
    const nomeDisplay = document.getElementById('welcome-msg');
    if (nomeDisplay) nomeDisplay.innerText = `Olá, Dr(a). ${medicoNome}`;
}

// ==========================================
// 2. LISTAGEM DE PACIENTES
// ==========================================
async function carregarPacientes() {
    try {
        const response = await fetch(`${API_URL}/pacientes-por-medico/${medicoId}`);
        const pacientes = await response.json();

        const container = document.getElementById('lista-pacientes');
        if (!container) return;

        container.innerHTML = ''; // Limpa antes de preencher

        if (pacientes.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: #666;">Nenhum paciente cadastrado.</p>';
            return;
        }

        pacientes.forEach(paciente => {
            const card = document.createElement('div');
            card.className = 'card-paciente'; 
            
            // Estilo básico do card via JS (caso não tenha CSS)
            card.style.background = "white";
            card.style.padding = "20px";
            card.style.borderRadius = "10px";
            card.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
            card.style.cursor = "pointer";
            card.style.transition = "transform 0.2s";

            // HTML do Card
            card.innerHTML = `
                <h3 class="nome-paciente" style="margin-bottom: 5px; color: #333;">${paciente.nome}</h3>
                <p style="color: #666; font-size: 0.9em;">Gestor: ${paciente.gestor || '---'}</p>
                <p style="color: #999; font-size: 0.8em; margin-top: 5px;">WhatsApp: ${paciente.whatsapp}</p>
            `;

            // Clique leva ao perfil
            card.onclick = function() {
                window.location.href = `perfil-paciente.html?id=${paciente.id}`;
            };
            
            // Efeito visual hover
            card.onmouseover = () => card.style.transform = "translateY(-3px)";
            card.onmouseout = () => card.style.transform = "translateY(0)";

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao carregar lista.");
    }
}

// ==========================================
// 3. PESQUISA (FILTRO EM TEMPO REAL)
// ==========================================
function filtrarPacientes() {
    const termo = document.getElementById('pesquisaPaciente').value.toLowerCase();
    const cards = document.getElementsByClassName('card-paciente');

    for (let card of cards) {
        const nome = card.querySelector('.nome-paciente').innerText.toLowerCase();
        if (nome.includes(termo)) {
            card.style.display = ""; // Mostra
        } else {
            card.style.display = "none"; // Esconde
        }
    }
}

// ==========================================
// 4. FUNÇÕES DO MODAL (NOVO PACIENTE)
// ==========================================
function abrirModal() {
    document.getElementById('modal-novo-paciente').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-novo-paciente').style.display = 'none';
}

// Fechar se clicar fora do modal
window.onclick = function(event) {
    const modal = document.getElementById('modal-novo-paciente');
    if (event.target == modal) {
        fecharModal();
    }
}

// ==========================================
// 5. SALVAR NOVO PACIENTE
// ==========================================
async function salvarPaciente(event) {
    event.preventDefault(); // Não deixa a página recarregar

    const nome = document.getElementById('paciente-nome').value;
    const whatsapp = document.getElementById('paciente-whats').value;
    const nasc = document.getElementById('paciente-nasc').value;
    const gestor = document.getElementById('paciente-gestor').value;

    const dados = {
        medicoId: medicoId,
        nome: nome,
        whatsapp: whatsapp,
        data_nascimento: nasc,
        gestor: gestor
    };

    try {
        const response = await fetch(`${API_URL}/pacientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            alert("Paciente cadastrado com sucesso!");
            fecharModal();
            carregarPacientes(); // Atualiza a lista na hora
            
            // Limpa o formulário
            document.getElementById('paciente-nome').value = '';
            document.getElementById('paciente-whats').value = '';
            document.getElementById('paciente-nasc').value = '';
            document.getElementById('paciente-gestor').value = '';
        } else {
            alert("Erro ao cadastrar. Verifique os dados.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão.");
    }
}

// ==========================================
// 6. LOGOUT
// ==========================================
function sair() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Inicializa
window.onload = carregarPacientes;