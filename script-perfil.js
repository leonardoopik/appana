const API_URL = 'https://appana-xlcl.onrender.com';

// Pega o ID do paciente da URL (ex: perfil-paciente.html?id=123)
const urlParams = new URLSearchParams(window.location.search);
const pacienteId = urlParams.get('id');

// ==========================================
// 1. LISTA DE SUGESTÕES (AUTOCOMPLETAR)
// ==========================================
const PROTOCOLOS_MEDICOS = {
    "CAPTOPRIL 25mg": { nome: "Captopril 25mg", dose: "2 cp (Jejum - 1h antes ou 2h pós refeição)", horarios: ["11:00"] },
    "ENALAPRIL 10mg": { nome: "Maleato de Enalapril 10mg", dose: "1 cp", horarios: ["20:00"] },
    "LOSARTANA 50mg": { nome: "Losartana Potássica 50mg", dose: "1 cp", horarios: ["08:00"] },
    "HIDROCLOROTIAZIDA 25mg": { nome: "Hidroclorotiazida 25mg", dose: "1 cp (Pela manhã - evitar noctúria)", horarios: ["08:00"] },
    "ESPIRONOLACTONA 25mg": { nome: "Espironolactona 25mg", dose: "2 cp", horarios: ["08:00"] },
    "SINVASTATINA 20mg": { nome: "Sinvastatina 20mg", dose: "1 cp", horarios: ["20:00"] },
    "METFORMINA 500mg": { nome: "Cloridrato de Metformina 500mg", dose: "1 cp (Junto com café da manhã)", horarios: ["08:00"] },
    "GLICAZIDA 30mg": { nome: "Glicazida 30mg", dose: "1 cp", horarios: ["08:00"] },
    "AMOXICILINA + CLAVULANATO (8/8h)": { nome: "Amoxicilina 500mg + Clavulanato 125mg", dose: "1 cp (Duração: 7 a 10 dias)", horarios: ["07:00", "15:00", "23:00"] },
    "AZITROMICINA 500mg": { nome: "Azitromicina 500mg", dose: "1 cp (Duração: 3 dias)", horarios: ["08:00"] },
    "LEVOFLOXACINO 500mg": { nome: "Levofloxacino 500mg", dose: "1 cp (7 a 10 dias - Longe de leite/antiácidos)", horarios: ["15:00"] },
    "LEVOFLOXACINO 750mg": { nome: "Levofloxacino 750mg (1cp 500 + 1cp 250)", dose: "Dose única (5 dias - Longe de leite/antiácidos)", horarios: ["15:00"] },
    "LEVOTIROXINA 25mcg": { nome: "Levotiroxina Sódica 25mcg", dose: "1 cp (Jejum absoluto - min 30min antes café)", horarios: ["07:00"] },
    "LEVOTIROXINA 50mcg": { nome: "Levotiroxina Sódica 50mcg", dose: "1 cp (Jejum absoluto - min 30min antes café)", horarios: ["07:00"] },
    "LEVOTIROXINA 100mcg": { nome: "Levotiroxina Sódica 100mcg", dose: "1 cp (Jejum absoluto - min 30min antes café)", horarios: ["07:00"] }
};

// Carrega as opções na lista invisível ao abrir a página
function carregarSugestoes() {
    const datalist = document.getElementById('lista-sugestoes');
    if (!datalist) return;
    datalist.innerHTML = '';
    Object.keys(PROTOCOLOS_MEDICOS).forEach(chave => {
        const option = document.createElement('option');
        option.value = chave;
        datalist.appendChild(option);
    });
}

// Preenche os campos quando o médico seleciona
function aplicarSugestao(input) {
    const dados = PROTOCOLOS_MEDICOS[input.value];
    if (dados) {
        document.getElementById('nome-remedio').value = dados.nome;
        document.getElementById('obs-remedio').value = dados.dose;
        
        // Limpa horários antigos
        const container = document.getElementById('container-horarios');
        container.innerHTML = '<label>Horários</label>';
        
        // Adiciona os novos horários
        dados.horarios.forEach(hora => {
            const div = document.createElement('div');
            div.className = 'horario-row';
            div.innerHTML = `<input type="time" class="input-hora" value="${hora}">`;
            container.appendChild(div);
        });
    }
}

// ==========================================
// 2. FUNÇÕES PRINCIPAIS DO PERFIL
// ==========================================

async function carregarPerfil() {
    if (!pacienteId) {
        alert("Paciente não especificado.");
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/perfil-paciente/${pacienteId}`);
        const data = await response.json();

        if (response.ok) {
            // Preenche Card Principal
            document.getElementById('detalhe-nome').innerText = data.info.nome;
            document.getElementById('detalhe-whats').innerText = data.info.whatsapp;
            document.getElementById('detalhe-gestor').innerText = data.info.gestor || "---";

            // Formata Data de Nascimento
            const dataNasc = new Date(data.info.data_nascimento);
            document.getElementById('detalhe-nasc').innerText = dataNasc.toLocaleDateString('pt-BR');

            // Preenche Listas
            listarMedicamentos(data.medicamentos);
            listarAnotacoes(data.anotacoes);
            
        } else {
            alert("Erro ao carregar paciente.");
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

function listarMedicamentos(lista) {
    const container = document.getElementById('lista-controle-remedios');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum medicamento cadastrado.</p>';
        return;
    }

    lista.forEach(med => {
        const card = document.createElement('div');
        card.className = 'remedio-item';
        // Mostra o nome e o horário. Se tiver foto, mostra ícone.
        card.innerHTML = `
            <div class="remedio-info">
                <strong>${med.nome_remedio}</strong>
                <span class="remedio-hora"><i class="far fa-clock"></i> ${med.horario}</span>
            </div>
            <button onclick="excluirRemedio(${med.id})" class="btn-icon-delete"><i class="fas fa-trash"></i></button>
        `;
        container.appendChild(card);
    });
}

function listarAnotacoes(lista) {
    const container = document.getElementById('historico-notas');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p class="text-muted-small">Nenhuma anotação.</p>';
        return;
    }

    lista.forEach(nota => {
        const div = document.createElement('div');
        div.className = 'nota-item';
        const data = new Date(nota.data_criacao).toLocaleDateString('pt-BR');
        div.innerHTML = `
            <p>${nota.texto}</p>
            <small>${data}</small>
            <button onclick="excluirNota(${nota.id})" class="btn-small-delete">x</button>
        `;
        container.appendChild(div);
    });
}

// ==========================================
// 3. FUNÇÕES DE ADICIONAR (SALVAR)
// ==========================================

// Adiciona mais um campo de horário na tela
function addInputHora() {
    const container = document.getElementById('container-horarios');
    const div = document.createElement('div');
    div.className = 'horario-row';
    div.innerHTML = `<input type="time" class="input-hora">`;
    container.appendChild(div);
}

// CORREÇÃO AQUI: Salvar Novo Remédio
async function salvarNovoRemedio() {
    // 1. Pega o Nome e a Dose
    const nomeInput = document.getElementById('nome-remedio').value;
    const doseInput = document.getElementById('obs-remedio').value;

    if (!nomeInput) {
        alert("Digite o nome do remédio.");
        return;
    }

    // CONCATENAÇÃO: Junta Nome + Dose para salvar no banco (já que não temos coluna dose ainda)
    const nomeFinal = doseInput ? `${nomeInput} (${doseInput})` : nomeInput;

    // 2. Pega TODOS os horários preenchidos
    const inputsHoras = document.querySelectorAll('.input-hora');
    let listaHorarios = [];
    
    inputsHoras.forEach(input => {
        if (input.value) {
            listaHorarios.push(input.value);
        }
    });

    if (listaHorarios.length === 0) {
        alert("Adicione pelo menos um horário.");
        return;
    }

    const fotoInput = document.getElementById('foto-remedio');
    const formData = new FormData();
    formData.append('pacienteId', pacienteId);
    formData.append('nome_remedio', nomeFinal); // Envia o nome completo
    formData.append('horarios', JSON.stringify(listaHorarios)); // Envia lista de horários
    
    if (fotoInput.files[0]) {
        formData.append('foto', fotoInput.files[0]);
    }

    try {
        const response = await fetch(`${API_URL}/medicamentos`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert("Medicamento salvo!");
            carregarPerfil(); // Recarrega a tela
            
            // Limpa os campos
            document.getElementById('nome-remedio').value = '';
            document.getElementById('obs-remedio').value = '';
            document.getElementById('container-horarios').innerHTML = `
                <label>Horários</label>
                <div class="horario-row"><input type="time" class="input-hora"></div>
            `;
        } else {
            alert("Erro ao salvar medicamento.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão.");
    }
}

async function salvarNovaNota() {
    const texto = document.getElementById('nova-nota-texto').value;
    if (!texto) return;

    try {
        const response = await fetch(`${API_URL}/pacientes/${pacienteId}/anotacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anotacao: texto })
        });

        if (response.ok) {
            document.getElementById('nova-nota-texto').value = '';
            carregarPerfil();
        }
    } catch (error) {
        console.error(error);
    }
}

// ==========================================
// 4. FUNÇÕES DE EXCLUIR
// ==========================================

async function excluirRemedio(id) {
    if (!confirm("Tem certeza que deseja excluir este medicamento?")) return;
    try {
        await fetch(`${API_URL}/medicamentos/${id}`, { method: 'DELETE' });
        carregarPerfil();
    } catch (error) {
        console.error(error);
    }
}

async function excluirNota(id) {
    if (!confirm("Apagar anotação?")) return;
    try {
        await fetch(`${API_URL}/anotacoes/${id}`, { method: 'DELETE' });
        carregarPerfil();
    } catch (error) {
        console.error(error);
    }
}

async function excluirPaciente() {
    if (!confirm("ATENÇÃO: Isso apagará todo o histórico e medicamentos deste paciente. Continuar?")) return;
    try {
        await fetch(`${API_URL}/pacientes/${pacienteId}`, { method: 'DELETE' });
        alert("Paciente removido.");
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error(error);
    }
}

// ==========================================
// 5. INICIALIZAÇÃO
// ==========================================
// Chama as funções quando a página carrega
window.onload = function() {
    carregarPerfil();
    carregarSugestoes(); // <--- IMPORTANTE: Carrega a lista do autocompletar
};