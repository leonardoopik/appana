// Dados fictícios de pacientes
const pacientes = [
    { nome: "Carlos Alberto", remedio: "Amoxicilina", adesao: "90%", status: "ok", ultima: "10:00 - Confirmado" },
    { nome: "Maria Souza", remedio: "Losartana", adesao: "45%", status: "bad", ultima: "08:00 - Ignorado" },
    { nome: "Roberto Ferreira", remedio: "Metformina", adesao: "100%", status: "ok", ultima: "07:30 - Confirmado" }
];

function carregarPacientes() {
    const tableBody = document.getElementById('patient-table-body');
    tableBody.innerHTML = "";

    pacientes.forEach(p => {
        const row = `
            <tr>
                <td><strong>${p.nome}</strong></td>
                <td>${p.remedio}</td>
                <td><span class="status-pill status-${p.status}">${p.adesao}</span></td>
                <td>${p.ultima}</td>
                <td><button style="color: #1a73e8; border:none; background:none; cursor:pointer;">Ver Detalhes</button></td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Funções de Modal (Simples)
function openModal() { document.getElementById('modal').style.display = 'flex'; }
function closeModal() { document.getElementById('modal').style.display = 'none'; }

// Inicializar
window.onload = carregarPacientes;