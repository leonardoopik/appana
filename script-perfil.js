const API_URL = 'https://appana-xlcl.onrender.com';
const pacienteId = localStorage.getItem('pacienteSelecionadoId');
let meuGrafico = null;
let diasFiltro = 7;

document.addEventListener('DOMContentLoaded', () => {
    if (!pacienteId) {
        window.location.href = 'dashboard.html';
        return;
    }
    carregarDadosPerfil();
});

// ==========================================
// 1. CARREGAMENTO E FILTROS
// ==========================================

async function carregarDadosPerfil() {
    try {
        const response = await fetch(`${API_URL}/perfil-paciente/${pacienteId}`);
        const data = await response.json();

        // Dados Pessoais
        document.getElementById('detalhe-nome').innerText = data.info.nome;
        document.getElementById('detalhe-nasc').innerText = data.info.data_nascimento ? 
            new Date(data.info.data_nascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '---';
        document.getElementById('detalhe-whats').innerText = data.info.whatsapp;

        // Renderização
        renderizarNotas(data.anotacoes);
        renderizarControleRemedios(data.medicamentos); // Função Nova
        gerarGraficoAdesao(data.historico);
        renderizarLogDiario(data.historico);
        
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

function atualizarPeriodo(dias, btn) {
    diasFiltro = dias;
    document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    carregarDadosPerfil();
}

// ==========================================
// 2. SISTEMA DE ANOTAÇÕES
// ==========================================

function renderizarNotas(notas) {
    const container = document.getElementById('historico-notas');
    if (!notas || notas.length === 0) {
        container.innerHTML = "<p class='text-muted-small'>Nenhuma anotação registrada.</p>";
        return;
    }

    container.innerHTML = notas.map(n => `
        <div class="nota-item">
            <div class="nota-actions">
                <button onclick="prepararEdicaoNota(${n.id})" class="btn-edit-small" title="Editar"><i class="fas fa-edit"></i></button>
                <button onclick="excluirNota(${n.id})" class="btn-delete-small" title="Excluir"><i class="fas fa-trash"></i></button>
            </div>
            <span class="nota-data">${new Date(n.data_criacao).toLocaleString('pt-BR')}</span>
            <p id="texto-nota-${n.id}">${n.texto}</p>
        </div>
    `).join('');
}

async function salvarNovaNota() {
    const campo = document.getElementById('nova-nota-texto');
    if (!campo.value.trim()) return;

    try {
        await fetch(`${API_URL}/pacientes/${pacienteId}/anotacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anotacao: campo.value })
        });
        campo.value = "";
        carregarDadosPerfil();
    } catch (error) {
        alert("Erro ao salvar nota.");
    }
}

function prepararEdicaoNota(id) {
    const p = document.getElementById(`texto-nota-${id}`);
    const textoAtual = p.innerText;
    p.innerHTML = `
        <textarea id="edit-campo-${id}" class="edit-nota-area">${textoAtual}</textarea>
        <div class="nota-edit-actions">
            <button onclick="salvarEdicaoNota(${id})" class="btn-save-small">Salvar</button>
            <button onclick="carregarDadosPerfil()" class="btn-cancel-small">Cancelar</button>
        </div>
    `;
}

async function salvarEdicaoNota(id) {
    const novoTexto = document.getElementById(`edit-campo-${id}`).value;
    if (!novoTexto.trim()) return alert("O texto não pode estar vazio.");

    try {
        const response = await fetch(`${API_URL}/anotacoes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: novoTexto })
        });

        if (response.ok) {
            carregarDadosPerfil();
        } else {
            alert("Erro ao salvar edição.");
        }
    } catch (error) {
        alert("Erro de conexão.");
    }
}

async function excluirNota(id) {
    if (!confirm("Excluir esta nota?")) return;
    try {
        await fetch(`${API_URL}/anotacoes/${id}`, { method: 'DELETE' });
        carregarDadosPerfil();
    } catch (error) {
        alert("Erro ao excluir.");
    }
}

// ==========================================
// 3. MEDICAMENTOS (AGRUPADOS POR NOME)
// ==========================================

function renderizarControleRemedios(remedios) {
    const lista = document.getElementById('lista-controle-remedios');
    
    if (remedios.length === 0) {
        lista.innerHTML = '<p class="text-muted-small">Nenhum medicamento cadastrado.</p>';
        return;
    }

    // 1. Agrupamento
    const grupos = {};
    remedios.forEach(r => {
        const nomeChave = r.nome_remedio.trim().toLowerCase();
        if (!grupos[nomeChave]) {
            grupos[nomeChave] = {
                nome: r.nome_remedio,
                imagem: r.imagem_url,
                horarios: []
            };
        }
        grupos[nomeChave].horarios.push({ id: r.id, hora: r.horario });
    });

    // 2. Ordenação dos horários
    Object.values(grupos).forEach(grupo => {
        grupo.horarios.sort((a, b) => a.hora.localeCompare(b.hora));
    });

    // 3. Renderização
    lista.innerHTML = Object.values(grupos).map(grupo => `
        <div class="card-remedio-agrupado">
            <div class="remedio-header">
                <img src="${grupo.imagem ? API_URL + grupo.imagem : 'https://via.placeholder.com/60'}" class="remedio-thumb-large">
                <div class="remedio-titulo">
                    <strong>${grupo.nome}</strong>
                    <small>${grupo.horarios.length} horários</small>
                </div>
            </div>

            <div class="lista-horarios-wrapper">
                ${grupo.horarios.map(h => `
                    <div class="horario-row">
                        <div class="hora-badge">
                            <i class="fas fa-clock"></i> ${h.hora}
                        </div>
                        
                        <div class="acoes-wrapper">
                            <div class="check-actions-mini">
                                <button onclick="registrarDose(${h.id}, 'tomou')" class="btn-check-mini" title="Tomou"><i class="fas fa-check"></i></button>
                                <button onclick="registrarDose(${h.id}, 'nao_tomou')" class="btn-x-mini" title="Não tomou"><i class="fas fa-times"></i></button>
                            </div>
                            <div class="admin-actions-mini">
                                <button onclick="prepararEdicaoRemedio(${h.id}, '${grupo.nome}', '${h.hora}')" class="btn-icon-edit" title="Editar"><i class="fas fa-pen"></i></button>
                                <button onclick="excluirRemedio(${h.id})" class="btn-icon-del" title="Excluir"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Funções de Gerenciamento de Remédios
async function excluirRemedio(id) {
    if(!confirm("Excluir este horário de medicamento?")) return;
    try {
        const res = await fetch(`${API_URL}/medicamentos/${id}`, { method: 'DELETE' });
        if(res.ok) carregarDadosPerfil();
        else alert("Erro ao excluir.");
    } catch(err) { alert("Erro de conexão."); }
}

function prepararEdicaoRemedio(id, nome, horario) {
    document.getElementById('edit-remedio-id').value = id;
    document.getElementById('edit-remedio-nome').value = nome;
    document.getElementById('edit-remedio-horario').value = horario;
    document.getElementById('modal-editar-remedio').style.display = 'flex';
}

async function salvarEdicaoRemedio() {
    const id = document.getElementById('edit-remedio-id').value;
    const nome = document.getElementById('edit-remedio-nome').value;
    const horario = document.getElementById('edit-remedio-horario').value;

    try {
        const res = await fetch(`${API_URL}/medicamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_remedio: nome, horario: horario })
        });
        if(res.ok) {
            document.getElementById('modal-editar-remedio').style.display = 'none';
            carregarDadosPerfil();
        } else {
            alert("Erro ao editar.");
        }
    } catch(err) { alert("Erro de conexão."); }
}

async function salvarNovoRemedio() {
    const nome = document.getElementById('remedio-nome').value;
    const fotoFile = document.getElementById('foto-remedio').files[0];
    const horarios = Array.from(document.querySelectorAll('.input-hora')).map(i => i.value).filter(h => h !== "");
    
    if(!nome || horarios.length === 0) return alert("Preencha o nome e horário.");

    const formData = new FormData();
    formData.append('pacienteId', pacienteId);
    formData.append('nome_remedio', nome);
    formData.append('horarios', JSON.stringify(horarios));
    if (fotoFile) formData.append('foto', fotoFile);
    
    try {
        const res = await fetch(`${API_URL}/medicamentos`, { method: 'POST', body: formData });
        if (res.ok) {
            document.getElementById('remedio-nome').value = "";
            document.getElementById('container-horarios').innerHTML = '<input type="time" class="input-hora" required>';
            carregarDadosPerfil();
        }
    } catch (error) { alert("Erro ao salvar."); }
}

function addInputHora() {
    const container = document.getElementById('container-horarios');
    const input = document.createElement('input');
    input.type = 'time'; input.className = 'input-hora';
    container.appendChild(input);
}

// ==========================================
// 4. GRÁFICOS E LOGS
// ==========================================

function gerarGraficoAdesao(historico) {
    const ctx = document.getElementById('graficoAdesao').getContext('2d');
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasFiltro);

    const filtrado = historico.filter(h => new Date(h.data_dose) >= dataLimite);
    const contagem = { tomou: 0, atraso: 0, nao_tomou: 0 };
    
    filtrado.forEach(h => {
        if (contagem[h.status] !== undefined) contagem[h.status]++;
    });

    if (meuGrafico) meuGrafico.destroy();
    
    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tomou', 'Atraso', 'Não Tomou'],
            datasets: [{ 
                data: [contagem.tomou, contagem.atraso, contagem.nao_tomou], 
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function renderizarLogDiario(historico) {
    const container = document.getElementById('lista-diaria-log');
    if (!container) return;
    container.innerHTML = "";
    
    const logsRecentes = [...historico].sort((a, b) => new Date(b.data_dose) - new Date(a.data_dose)).slice(0, 15);

    logsRecentes.forEach(log => {
        const dataF = new Date(log.data_dose).toLocaleDateString('pt-BR');
        container.innerHTML += `
            <div class="log-item ${log.status}">
                <span><strong>${dataF}</strong> - ${log.horario_previsto || 'N/A'}</span>
                <span class="status-texto">${log.status.replace('_', ' ').toUpperCase()}</span>
            </div>
        `;
    });
}

async function registrarDose(id, status) {
    await fetch(`${API_URL}/registrar-dose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicamento_id: id, status, atraso_minutos: 0 })
    });
    carregarDadosPerfil();
}

// ==========================================
// 5. MODAIS DE PERFIL
// ==========================================

function abrirModalEdicao() {
    document.getElementById('edit-nome').value = document.getElementById('detalhe-nome').innerText;
    document.getElementById('edit-whats').value = document.getElementById('detalhe-whats').innerText;
    document.getElementById('modal-editar-paciente').style.display = 'flex';
}

function fecharModalEdicao() { document.getElementById('modal-editar-paciente').style.display = 'none'; }

async function atualizarPerfil(event) {
    event.preventDefault();
    const dados = {
        nome: document.getElementById('edit-nome').value,
        whatsapp: document.getElementById('edit-whats').value,
        data_nascimento: document.getElementById('edit-nasc').value
    };
    await fetch(`${API_URL}/pacientes/${pacienteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
    fecharModalEdicao();
    carregarDadosPerfil();
}

async function excluirPaciente() {
    if (confirm("Excluir paciente permanentemente?")) {
        await fetch(`${API_URL}/pacientes/${pacienteId}`, { method: 'DELETE' });
        window.location.href = 'dashboard.html';
    }
}