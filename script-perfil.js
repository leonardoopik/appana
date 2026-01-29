const API_URL = 'https://appana-xlcl.onrender.com';

// Pega o ID do paciente da URL
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

function aplicarSugestao(input) {
    const dados = PROTOCOLOS_MEDICOS[input.value];
    if (dados) {
        document.getElementById('nome-remedio').value = dados.nome;
        document.getElementById('obs-remedio').value = dados.dose;
        
        // Limpa horários antigos e adiciona novos
        const container = document.getElementById('container-horarios');
        container.innerHTML = ''; 
        
        dados.horarios.forEach(hora => {
            const inputHora = document.createElement('input');
            inputHora.type = 'time';
            inputHora.className = 'input-hora';
            inputHora.value = hora;
            inputHora.style.marginRight = '5px';
            container.appendChild(inputHora);
        });
    }
}

// ==========================================
// 2. FUNÇÕES PRINCIPAIS (Carregar, Listar)
// ==========================================
async function carregarPerfil() {
    if (!pacienteId) {
        alert("Paciente não encontrado.");
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/perfil-paciente/${pacienteId}`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('detalhe-nome').innerText = data.info.nome;
            document.getElementById('detalhe-whats').innerText = data.info.whatsapp;
            document.getElementById('detalhe-gestor').innerText = data.info.gestor || "---";
            
            const dataNasc = new Date(data.info.data_nascimento);
            document.getElementById('detalhe-nasc').innerText = dataNasc.toLocaleDateString('pt-BR');

            listarMedicamentos(data.medicamentos);
            listarAnotacoes(data.anotacoes);
        }
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }
}

function listarMedicamentos(lista) {
    const container = document.getElementById('lista-controle-remedios');
    if (!container) return;
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum medicamento cadastrado.</p>';
        return;
    }

    lista.forEach(med => {
        const card = document.createElement('div');
        card.className = 'remedio-item'; // Certifique-se de ter CSS para isso
        card.style.background = "white";
        card.style.padding = "10px";
        card.style.marginBottom = "10px";
        card.style.borderRadius = "8px";
        card.style.borderLeft = "4px solid #3b82f6";
        card.style.display = "flex";
        card.style.justifyContent = "space-between";
        card.style.alignItems = "center";

        card.innerHTML = `
            <div class="remedio-info">
                <strong style="display:block; font-size:1.1em;">${med.nome_remedio}</strong>
                <span class="remedio-hora" style="color:#666; font-size:0.9em;">
                    <i class="far fa-clock"></i> ${med.horario}
                </span>
            </div>
            <button onclick="excluirRemedio(${med.id})" style="background:none; border:none; color:red; cursor:pointer;">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(card);
    });
}

function listarAnotacoes(lista) {
    const container = document.getElementById('historico-notas');
    if (!container) return;
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p class="text-muted-small">Nenhuma anotação.</p>';
        return;
    }

    lista.forEach(nota => {
        const div = document.createElement('div');
        div.style.borderBottom = "1px solid #eee";
        div.style.padding = "8px 0";
        const data = new Date(nota.data_criacao).toLocaleDateString('pt-BR');
        div.innerHTML = `
            <p style="margin:0;">${nota.texto}</p>
            <small style="color:#999;">${data}</small>
            <button onclick="excluirNota(${nota.id})" style="float:right; border:none; background:none; color:red; cursor:pointer;">x</button>
        `;
        container.appendChild(div);
    });
}

// ==========================================
// 3. FUNÇÕES DE ADICIONAR (SALVAR)
// ==========================================

function addInputHora() {
    const container = document.getElementById('container-horarios');
    const input = document.createElement('input');
    input.type = 'time';
    input.className = 'input-hora';
    input.setAttribute('aria-label', 'Horário da dose'); // <--- ADICIONADO ISSO
    input.style.marginRight = '5px';
    input.style.marginTop = '5px';
    container.appendChild(input);
}

async function salvarNovoRemedio() {
    // 1. Captura dos dados
    const nomeInput = document.getElementById('nome-remedio').value;
    const doseInput = document.getElementById('obs-remedio').value;
    const duracaoElement = document.getElementById('duracao-remedio');
    const duracaoInput = duracaoElement ? duracaoElement.value : '';

    if (!nomeInput) {
        alert("Digite o nome do remédio.");
        return;
    }

    // 2. Montagem do Nome Completo (Nome + Dose + Duração)
    let infoExtra = [];
    if (doseInput) infoExtra.push(doseInput);
    if (duracaoInput) infoExtra.push(`Duração: ${duracaoInput}`);

    let nomeFinal = nomeInput;
    if (infoExtra.length > 0) {
        nomeFinal += ` (${infoExtra.join(' - ')})`;
    }

    // 3. Captura dos Horários
    const inputsHoras = document.querySelectorAll('.input-hora');
    let listaHorarios = [];
    inputsHoras.forEach(input => {
        if (input.value) listaHorarios.push(input.value);
    });

    if (listaHorarios.length === 0) {
        alert("Adicione pelo menos um horário.");
        return;
    }

    // 4. Envio para o Servidor
    const fotoInput = document.getElementById('foto-remedio');
    const formData = new FormData();
    formData.append('pacienteId', pacienteId);
    formData.append('nome_remedio', nomeFinal);
    formData.append('horarios', JSON.stringify(listaHorarios));
    
    if (fotoInput && fotoInput.files[0]) {
        formData.append('foto', fotoInput.files[0]);
    }

    try {
        const response = await fetch(`${API_URL}/medicamentos`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert("Medicamento salvo com sucesso!");
            carregarPerfil(); // Recarrega a lista
            
            // Limpa formulário
            document.getElementById('nome-remedio').value = '';
            document.getElementById('obs-remedio').value = '';
            if(duracaoElement) duracaoElement.value = '';
            document.getElementById('container-horarios').innerHTML = '<input type="time" class="input-hora">';
        } else {
            alert("Erro ao salvar.");
        }
    } catch (error) {
        console.error("Erro na conexão:", error);
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
    if (!confirm("Excluir este medicamento?")) return;
    try {
        await fetch(`${API_URL}/medicamentos/${id}`, { method: 'DELETE' });
        carregarPerfil();
    } catch (error) { console.error(error); }
}

async function excluirNota(id) {
    if (!confirm("Apagar nota?")) return;
    try {
        await fetch(`${API_URL}/anotacoes/${id}`, { method: 'DELETE' });
        carregarPerfil();
    } catch (error) { console.error(error); }
}

async function excluirPaciente() {
    if (!confirm("Isso apagará TUDO deste paciente. Continuar?")) return;
    try {
        await fetch(`${API_URL}/pacientes/${pacienteId}`, { method: 'DELETE' });
        window.location.href = 'dashboard.html';
    } catch (error) { console.error(error); }
}

// ==========================================
// 5. INICIALIZAÇÃO
// ==========================================
window.onload = function() {
    carregarPerfil();
    carregarSugestoes();
};