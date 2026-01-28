const API_URL = 'https://appana-xlcl.onrender.com';
const pacienteId = localStorage.getItem('pacienteSelecionadoId');
let meuGrafico = null;
let diasFiltro = 7;
let dadosPacienteAtual = null; // Guarda tudo (Info, Histórico, Remédios)

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
        
        // Guarda TUDO na memória global
        dadosPacienteAtual = data; 

        // Dados Pessoais
        document.getElementById('detalhe-nome').innerText = data.info.nome;
        document.getElementById('detalhe-nasc').innerText = data.info.data_nascimento ? 
            new Date(data.info.data_nascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '---';
        document.getElementById('detalhe-whats').innerText = data.info.whatsapp;
        
        const gestorDisplay = document.getElementById('detalhe-gestor');
        if(gestorDisplay) {
            gestorDisplay.innerText = data.info.gestor || '---';
        }

        // --- PREENCHER O SELECT DO GRÁFICO (NOVO) ---
        preencherSelectRemedios(data.medicamentos);

        // Renderização
        renderizarNotas(data.anotacoes);
        renderizarControleRemedios(data.medicamentos);
        atualizarGrafico(); // Chama a função que já filtra e desenha
        renderizarLogDiario(data.historico);
        
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// Função nova para preencher o dropdown
function preencherSelectRemedios(medicamentos) {
    const select = document.getElementById('filtro-remedio-grafico');
    // Limpa mantendo apenas o "Todos"
    select.innerHTML = '<option value="todos">Todos os Remédios</option>';
    
    // Cria um Set para não repetir nomes iguais
    const nomesUnicos = new Set();
    
    medicamentos.forEach(m => {
        // Se ainda não adicionamos esse nome...
        if (!nomesUnicos.has(m.nome_remedio)) {
            const option = document.createElement('option');
            // Usaremos o NOME como valor para filtrar todos os horários daquele remédio
            option.value = m.nome_remedio; 
            option.innerText = m.nome_remedio;
            select.appendChild(option);
            nomesUnicos.add(m.nome_remedio);
        }
    });
}

// Função atualizada para redesenhar quando muda data ou remédio
function atualizarGrafico() {
    if (!dadosPacienteAtual || !dadosPacienteAtual.historico) return;
    gerarGraficoAdesao(dadosPacienteAtual.historico);
}

function atualizarPeriodo(dias, btn) {
    diasFiltro = dias;
    document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    atualizarGrafico();
}

// ==========================================
// 4. GRÁFICOS E LOGS (LÓGICA DO FILTRO AQUI)
// ==========================================

function gerarGraficoAdesao(historico) {
    const ctx = document.getElementById('graficoAdesao').getContext('2d');
    
    // 1. Filtro de Data
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasFiltro);

    // 2. Filtro de Remédio (NOVO)
    const remedioSelecionado = document.getElementById('filtro-remedio-grafico').value;

    const filtrado = historico.filter(h => {
        const dataOk = new Date(h.data_dose) >= dataLimite;
        
        // Se for "todos", passa direto. Se não, compara o nome do remédio.
        // O backend precisa mandar o nome do remédio no histórico. 
        // Se seu backend manda 'medicamento_id', precisamos achar o nome.
        
        // Lógica: Vamos assumir que temos acesso ao nome.
        // Se o histórico só tem ID, comparamos ID. Mas aqui vou filtrar pelo NOME 
        // cruzando com a lista de medicamentos salva em 'dadosPacienteAtual'.
        
        let remedioOk = true;
        if (remedioSelecionado !== 'todos') {
            // Acha o medicamento correspondente a esse histórico
            const remedioInfo = dadosPacienteAtual.medicamentos.find(m => m.id === h.medicamento_id);
            if (remedioInfo && remedioInfo.nome_remedio === remedioSelecionado) {
                remedioOk = true;
            } else {
                remedioOk = false;
            }
        }

        return dataOk && remedioOk;
    });

    // Contagem
    const contagem = { tomou: 0, atraso: 0, nao_tomou: 0 };
    filtrado.forEach(h => {
        if (contagem[h.status] !== undefined) contagem[h.status]++;
    });

    // Desenha
    if (meuGrafico) meuGrafico.destroy();
    
    // Verifica se tem dados para não mostrar gráfico vazio feio
    const total = contagem.tomou + contagem.atraso + contagem.nao_tomou;
    
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
            plugins: { 
                legend: { position: 'bottom' },
                title: {
                    display: total === 0,
                    text: 'Sem dados para este filtro',
                    position: 'top'
                }
            }
        }
    });
}

// ==========================================
// RESTO DO CÓDIGO (ANOTAÇÕES, REMÉDIOS, ETC...)
// MANTENHA AS OUTRAS FUNÇÕES IGUAIS AS ANTERIORES
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
                <button onclick="prepararEdicaoNota(${n.id})" class="btn-edit-small"><i class="fas fa-edit"></i></button>
                <button onclick="excluirNota(${n.id})" class="btn-delete-small"><i class="fas fa-trash"></i></button>
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
    } catch (error) { alert("Erro ao salvar nota."); }
}

function prepararEdicaoNota(id) {
    const p = document.getElementById(`texto-nota-${id}`);
    const textoAtual = p.innerText;
    p.innerHTML = `<textarea id="edit-campo-${id}" class="edit-nota-area">${textoAtual}</textarea>
        <div class="nota-edit-actions"><button onclick="salvarEdicaoNota(${id})" class="btn-save-small">Salvar</button>
        <button onclick="carregarDadosPerfil()" class="btn-cancel-small">Cancelar</button></div>`;
}

async function salvarEdicaoNota(id) {
    const novoTexto = document.getElementById(`edit-campo-${id}`).value;
    if (!novoTexto.trim()) return alert("Texto vazio.");
    try {
        const res = await fetch(`${API_URL}/anotacoes/${id}`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({texto: novoTexto})
        });
        if(res.ok) carregarDadosPerfil();
    } catch(e) { alert("Erro conexão"); }
}

async function excluirNota(id) {
    if(confirm("Excluir?")) {
        await fetch(`${API_URL}/anotacoes/${id}`, {method: 'DELETE'});
        carregarDadosPerfil();
    }
}

function renderizarControleRemedios(remedios) {
    const lista = document.getElementById('lista-controle-remedios');
    if (remedios.length === 0) {
        lista.innerHTML = '<p class="text-muted-small">Nenhum medicamento.</p>'; return;
    }
    const grupos = {};
    remedios.forEach(r => {
        const nomeChave = r.nome_remedio.trim().toLowerCase();
        if (!grupos[nomeChave]) grupos[nomeChave] = { nome: r.nome_remedio, imagem: r.imagem_url, horarios: [] };
        grupos[nomeChave].horarios.push({ id: r.id, hora: r.horario });
    });
    Object.values(grupos).forEach(g => g.horarios.sort((a,b)=>a.hora.localeCompare(b.hora)));

    lista.innerHTML = Object.values(grupos).map(g => `
        <div class="card-remedio-agrupado">
            <div class="remedio-header">
                <img src="${g.imagem ? API_URL + g.imagem : 'https://via.placeholder.com/60'}" class="remedio-thumb-large">
                <div class="remedio-titulo"><strong>${g.nome}</strong><small>${g.horarios.length} horários</small></div>
            </div>
            <div class="lista-horarios-wrapper">
                ${g.horarios.map(h => `
                    <div class="horario-row"><div class="hora-badge"><i class="fas fa-clock"></i> ${h.hora}</div>
                    <div class="acoes-wrapper"><div class="check-actions-mini">
                    <button onclick="registrarDose(${h.id}, 'tomou')" class="btn-check-mini"><i class="fas fa-check"></i></button>
                    <button onclick="registrarDose(${h.id}, 'nao_tomou')" class="btn-x-mini"><i class="fas fa-times"></i></button></div>
                    <div class="admin-actions-mini"><button onclick="prepararEdicaoRemedio(${h.id}, '${g.nome}', '${h.hora}')" class="btn-icon-edit"><i class="fas fa-pen"></i></button>
                    <button onclick="excluirRemedio(${h.id})" class="btn-icon-del"><i class="fas fa-trash"></i></button></div></div></div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

async function excluirRemedio(id) { if(confirm("Excluir?")) { await fetch(`${API_URL}/medicamentos/${id}`, {method:'DELETE'}); carregarDadosPerfil(); }}

function prepararEdicaoRemedio(id, n, h) {
    document.getElementById('edit-remedio-id').value = id;
    document.getElementById('edit-remedio-nome').value = n;
    document.getElementById('edit-remedio-horario').value = h;
    document.getElementById('modal-editar-remedio').style.display = 'flex';
}

async function salvarEdicaoRemedio() {
    const id = document.getElementById('edit-remedio-id').value;
    const nome = document.getElementById('edit-remedio-nome').value;
    const horario = document.getElementById('edit-remedio-horario').value;
    await fetch(`${API_URL}/medicamentos/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({nome_remedio: nome, horario})});
    document.getElementById('modal-editar-remedio').style.display='none'; carregarDadosPerfil();
}

async function salvarNovoRemedio() {
    const nome = document.getElementById('remedio-nome').value;
    const horarios = Array.from(document.querySelectorAll('.input-hora')).map(i=>i.value).filter(h=>h!=="");
    const foto = document.getElementById('foto-remedio').files[0];
    if(!nome || horarios.length===0) return alert("Preencha tudo");
    const fd = new FormData();
    fd.append('pacienteId', pacienteId); fd.append('nome_remedio', nome); fd.append('horarios', JSON.stringify(horarios));
    if(foto) fd.append('foto', foto);
    await fetch(`${API_URL}/medicamentos`, {method:'POST', body:fd});
    document.getElementById('remedio-nome').value=""; document.getElementById('container-horarios').innerHTML='<input type="time" class="input-hora">';
    carregarDadosPerfil();
}

function addInputHora() { document.getElementById('container-horarios').innerHTML += '<input type="time" class="input-hora">'; }

function renderizarLogDiario(historico) {
    const container = document.getElementById('lista-diaria-log');
    if(!container) return; container.innerHTML="";
    const recents = [...historico].sort((a,b)=>new Date(b.data_dose)-new Date(a.data_dose)).slice(0,15);
    recents.forEach(log => {
        container.innerHTML += `<div class="log-item ${log.status}"><span><strong>${new Date(log.data_dose).toLocaleDateString('pt-BR')}</strong></span><span class="status-texto">${log.status}</span></div>`;
    });
}

async function registrarDose(id, status) {
    await fetch(`${API_URL}/registrar-dose`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({medicamento_id: id, status, atraso_minutos:0})});
    carregarDadosPerfil();
}

function abrirModalEdicao() {
    if(dadosPacienteAtual) {
        document.getElementById('edit-nome').value = dadosPacienteAtual.info.nome;
        document.getElementById('edit-whats').value = dadosPacienteAtual.info.whatsapp;
        document.getElementById('edit-gestor').value = dadosPacienteAtual.info.gestor || '';
        if(dadosPacienteAtual.info.data_nascimento) document.getElementById('edit-nasc').value = dadosPacienteAtual.info.data_nascimento.split('T')[0];
    }
    document.getElementById('modal-editar-paciente').style.display = 'flex';
}

function fecharModalEdicao() { document.getElementById('modal-editar-paciente').style.display = 'none'; }

async function atualizarPerfil(event) {
    event.preventDefault();
    const g = document.getElementById('edit-gestor').value;
    if(g.length!==5) return alert("Gestor deve ter 5 dígitos");
    await fetch(`${API_URL}/pacientes/${pacienteId}`, {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
            nome: document.getElementById('edit-nome').value,
            whatsapp: document.getElementById('edit-whats').value,
            data_nascimento: document.getElementById('edit-nasc').value,
            gestor: g
        })
    });
    fecharModalEdicao(); carregarDadosPerfil();
}

async function excluirPaciente() {
    if(confirm("Excluir permanentemente?")) {
        await fetch(`${API_URL}/pacientes/${pacienteId}`, {method:'DELETE'});
        window.location.href='dashboard.html';
    }
}