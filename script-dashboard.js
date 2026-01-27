const API_URL = 'https://appana-xlcl.onrender.com';
const medicoId = localStorage.getItem('medicoId');
const medicoNome = localStorage.getItem('medicoNome');

// Verifica se está logado
if (!medicoId) {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('welcome-msg').innerText = `Olá, ${medicoNome || 'Doutor(a)'}`;
    carregarPacientes();
});

// --- FUNÇÕES DO MODAL ---
function abrirModal() {
    document.getElementById('modal-novo-paciente').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-novo-paciente').style.display = 'none';
    // Limpa os campos
    document.getElementById('paciente-nome').value = '';
    document.getElementById('paciente-whats').value = '';
    document.getElementById('paciente-nasc').value = '';
    document.getElementById('paciente-gestor').value = ''; // Limpa o gestor também
}

// --- FUNÇÕES DE API ---
async function carregarPacientes() {
    const container = document.getElementById('lista-pacientes');
    container.innerHTML = '<p>Carregando...</p>';

    try {
        const response = await fetch(`${API_URL}/pacientes-por-medico/${medicoId}`);
        const pacientes = await response.json();

       if (pacientes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-injured empty-icon"></i>
                    <p style="color: #64748b;">Nenhum paciente cadastrado ainda.</p>
                </div>
            `;
            return;
        }

        // Adicionei um atributo 'data-nome' para facilitar a pesquisa
        container.innerHTML = pacientes.map(p => `
            <div class="card-info" data-nome="${p.nome.toLowerCase()}" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h3 style="margin-bottom: 5px;">${p.nome}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 5px;">
                        <i class="fab fa-whatsapp"></i> ${p.whatsapp}
                    </p>
                    ${p.gestor ? `<p style="color: #64748b; font-size: 0.8rem;">Gestor: <strong>${p.gestor}</strong></p>` : ''}
                </div>
                <button onclick="verPaciente(${p.id})" class="btn-primary" style="width: 100%; margin-top: 15px;">
                    Acessar Prontuário <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = '<p style="color: red;">Erro ao carregar pacientes.</p>';
        console.error(error);
    }
}

async function salvarPaciente(event) {
    event.preventDefault();
    
    // Pegando valores
    const nome = document.getElementById('paciente-nome').value;
    const whatsapp = document.getElementById('paciente-whats').value;
    const data_nascimento = document.getElementById('paciente-nasc').value;
    const gestor = document.getElementById('paciente-gestor').value;

    // --- VALIDAÇÃO DO GESTOR ---
    if (gestor.length !== 5) {
        alert("O código do Gestor precisa ter exatamente 5 números!");
        return;
    }

    const dados = {
        medicoId: medicoId,
        nome: nome,
        whatsapp: whatsapp,
        data_nascimento: data_nascimento,
        gestor: gestor // Enviando o novo campo
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
            carregarPacientes();
        } else {
            alert("Erro ao cadastrar.");
        }
    } catch (error) {
        alert("Erro de conexão.");
        console.error(error);
    }
}

function verPaciente(id) {
    localStorage.setItem('pacienteSelecionadoId', id);
    window.location.href = 'paciente.html';
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// --- FUNÇÃO DE PESQUISA (NOVA) ---
function filtrarPacientes() {
    const termo = document.getElementById('pesquisaPaciente').value.toLowerCase();
    const cards = document.querySelectorAll('.card-info');

    cards.forEach(card => {
        // Pega o nome que guardamos no atributo data-nome ou procura no H3
        const nomePaciente = card.querySelector('h3').innerText.toLowerCase();

        if (nomePaciente.includes(termo)) {
            card.style.display = "flex"; // Mostra
        } else {
            card.style.display = "none"; // Esconde
        }
    });
}