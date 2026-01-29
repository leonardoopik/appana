const API_URL = 'https://appana-xlcl.onrender.com';

// 1. VERIFICAÇÃO DE SEGURANÇA (Se não tiver logado, chuta para fora)
const medicoId = localStorage.getItem('medicoId');
const medicoNome = localStorage.getItem('medicoNome');

if (!medicoId) {
    window.location.href = 'index.html';
} else {
    // Se tiver elemento para mostrar o nome do médico, mostra
    const nomeDisplay = document.getElementById('nome-medico-display');
    if (nomeDisplay) nomeDisplay.innerText = medicoNome;
}

// 2. CARREGAR A LISTA DE PACIENTES
async function carregarPacientes() {
    try {
        const response = await fetch(`${API_URL}/pacientes-por-medico/${medicoId}`);
        const pacientes = await response.json();

        const container = document.getElementById('lista-pacientes'); // <--- Verifique se no HTML tem uma div com esse ID
        
        // Se não achar o lugar de colocar os cards, para o código para não dar erro
        if (!container) return; 

        container.innerHTML = ''; // Limpa a lista antes de encher

        if (pacientes.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: #666;">Nenhum paciente encontrado.</p>';
            return;
        }

        pacientes.forEach(paciente => {
            const card = document.createElement('div');
            card.className = 'card-paciente'; // Certifique-se que essa classe existe no seu CSS para ficar bonito
            
            // Estilo básico do card via JS caso não tenha CSS ainda
            card.style.background = "white";
            card.style.padding = "20px";
            card.style.borderRadius = "10px";
            card.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
            card.style.cursor = "pointer";
            card.style.transition = "transform 0.2s";

            // Cria o HTML do Card
            card.innerHTML = `
                <h3 style="margin-bottom: 5px; color: #333;">${paciente.nome}</h3>
                <p style="color: #666; font-size: 0.9em;">Gestor: ${paciente.gestor || '---'}</p>
            `;

            // EVENTO DE CLIQUE (AQUI QUE FAZ ENTRAR NO PERFIL)
            card.onclick = function() {
                window.location.href = `perfil-paciente.html?id=${paciente.id}`;
            };
            
            // Efeito visual ao passar o mouse
            card.onmouseover = () => card.style.transform = "translateY(-3px)";
            card.onmouseout = () => card.style.transform = "translateY(0)";

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
        alert("Erro ao carregar a lista de pacientes.");
    }
}

// 3. FUNÇÃO DE SAIR (LOGOUT)
function sair() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// 4. INICIALIZAÇÃO
// Quando a página termina de carregar, roda a função
window.onload = carregarPacientes;