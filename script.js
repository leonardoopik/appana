const API_URL = 'https://appana-xlcl.onrender.com';




// ==========================================
// 0. CATALOGO DE MEDICAMENTOS (Sugestões)
// ==========================================
const PROTOCOLOS_MEDICOS = {
    "CAPTOPRIL 25mg": {
        nome: "Captopril 25mg",
        dose: "2 comprimidos (Jejum - 1h antes ou 2h pós refeição)",
        horarios: ["11:00"]
    },
    "ENALAPRIL 10mg": {
        nome: "Maleato de Enalapril 10mg",
        dose: "1 comprimido",
        horarios: ["20:00"]
    },
    "LOSARTANA 50mg": {
        nome: "Losartana Potássica 50mg",
        dose: "1 comprimido",
        horarios: ["08:00"]
    },
    "HIDROCLOROTIAZIDA 25mg": {
        nome: "Hidroclorotiazida 25mg",
        dose: "1 comprimido (Pela manhã para evitar noctúria)",
        horarios: ["08:00"]
    },
    "ESPIRONOLACTONA 25mg": {
        nome: "Espironolactona 25mg",
        dose: "2 comprimidos",
        horarios: ["08:00"]
    },
    "SINVASTATINA 20mg": {
        nome: "Sinvastatina 20mg",
        dose: "1 comprimido",
        horarios: ["20:00"]
    },
    "METFORMINA 500mg": {
        nome: "Cloridrato de Metformina 500mg",
        dose: "1 comprimido (Junto com café da manhã)",
        horarios: ["08:00"]
    },
    "GLICAZIDA 30mg": {
        nome: "Glicazida 30mg",
        dose: "1 comprimido",
        horarios: ["08:00"]
    },
    "AMOXICILINA + CLAVULANATO (8/8h)": {
        nome: "Amoxicilina 500mg + Clavulanato 125mg",
        dose: "1 comprimido (Duração: 7 a 10 dias)",
        horarios: ["07:00", "15:00", "23:00"]
    },
    "AZITROMICINA 500mg": {
        nome: "Azitromicina 500mg",
        dose: "1 comprimido (Duração: 3 dias)",
        horarios: ["08:00"]
    },
    "LEVOFLOXACINO 500mg": {
        nome: "Levofloxacino 500mg",
        dose: "1 comprimido (Duração: 7 a 10 dias - Longe de leite/antiácidos)",
        horarios: ["15:00"]
    },
    "LEVOFLOXACINO 750mg": {
        nome: "Levofloxacino 750mg (1 cp 500mg + 1 cp 250mg)",
        dose: "Tomar os 2 juntos (Duração: 5 dias - Longe de leite/antiácidos)",
        horarios: ["15:00"]
    },
    "LEVOTIROXINA 25mcg": {
        nome: "Levotiroxina Sódica 25mcg",
        dose: "1 comprimido (Jejum absoluto - min 30min antes café)",
        horarios: ["07:00"]
    },
    "LEVOTIROXINA 50mcg": {
        nome: "Levotiroxina Sódica 50mcg",
        dose: "1 comprimido (Jejum absoluto - min 30min antes café)",
        horarios: ["07:00"]
    },
    "LEVOTIROXINA 100mcg": {
        nome: "Levotiroxina Sódica 100mcg",
        dose: "1 comprimido (Jejum absoluto - min 30min antes café)",
        horarios: ["07:00"]
    }
};



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
    const textoOriginal = btn.innerText;

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
            alert("Erro: " + (data.error || "Falha ao entrar"));
        }
    } catch (error) {
        alert("Erro na conexão com o servidor. O backend pode estar 'dormindo' (aguarde 1 min).");
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.innerText = textoOriginal;
    }
}

async function registrarMedico(event) {
    event.preventDefault();
    
    const nome = document.getElementById('reg-name').value;
    // O CRM não é usado no backend atual, mas mantivemos aqui caso precise no futuro
    // const crm = document.getElementById('reg-crm').value; 
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-password').value;

    const btn = event.target.querySelector('button');
    const textoOriginal = btn.innerText;

    try {
        btn.disabled = true;
        btn.innerText = "Cadastrando...";

        // ATENÇÃO: Rota ajustada para /auth/register conforme o server.js
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Cadastro realizado com sucesso! Faça login para continuar.");
            voltarLogin();
        } else {
            // AQUI ESTÁ A CORREÇÃO: Mostra o erro exato do backend (Ex: "E-mail já cadastrado")
            alert(data.error || "Erro ao realizar cadastro.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão ao tentar cadastrar.");
    } finally {
        btn.disabled = false;
        btn.innerText = textoOriginal;
    }
}




// Função para carregar as opções no HTML assim que a página abre
function carregarSugestoes() {
    const datalist = document.getElementById('lista-sugestoes');
    if(!datalist) return;

    datalist.innerHTML = ''; // Limpa antes de preencher
    
    // Cria uma opção para cada remédio da nossa lista
    Object.keys(PROTOCOLOS_MEDICOS).forEach(chave => {
        const option = document.createElement('option');
        option.value = chave; // O que aparece na lista
        datalist.appendChild(option);
    });
}

// Função chamada quando o médico seleciona um remédio da lista
function aplicarSugestao(inputElement) {
    const selecionado = inputElement.value;
    const dados = PROTOCOLOS_MEDICOS[selecionado];

    if (dados) {
        // 1. Atualiza o Nome (para ficar bonitinho, sem o código da chave)
        document.getElementById('nome-remedio').value = dados.nome;

        // 2. Preenche a Observação/Dosagem
        // Certifique-se que existe um input com id 'obs-remedio' ou o nome que você usou para dose
        const campoDose = document.getElementById('obs-remedio') || document.getElementById('dosagem'); 
        if(campoDose) campoDose.value = dados.dose;

        // 3. Preenche os Horários Automaticamente
        // Aqui assumo que sua lógica de horários usa um array global ou inputs
        // Vou simular limpando e adicionando os novos:
        
        listaHorariosTemp = []; // Limpa horários anteriores (variável global que você deve ter criado na tela de remédios)
        
        dados.horarios.forEach(hora => {
            listaHorariosTemp.push(hora);
        });
        
        // Atualiza a visualização dos horários (Chame sua função que desenha as bolinhas de horário)
        renderizarHorarios(); 
    }
}

// CHAME ISSO NO FINAL DO ARQUIVO OU NO WINDOW.ONLOAD
// Para garantir que a lista carregue quando abrir o site
document.addEventListener('DOMContentLoaded', carregarSugestoes);







async function recuperarSenha(event) {
    event.preventDefault();
    
    // Certifique-se que o ID do input no seu HTML de "Esqueci a Senha" é 'forgot-email'
    // Se for outro, altere aqui.
    const emailInput = document.getElementById('forgot-email') || document.getElementById('email-recuperar');
    const email = emailInput.value;
    
    const btn = event.target.querySelector('button');
    const textoOriginal = btn.innerText;

    if (!email) {
        alert("Digite seu e-mail.");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = "Enviando...";

        const response = await fetch(`${API_URL}/auth/esqueci-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Sucesso! Verifique seu e-mail (e a caixa de Spam) para redefinir a senha.");
            voltarLogin();
        } else {
            alert(data.error || "Erro ao solicitar recuperação.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão. Tente novamente.");
    } finally {
        btn.disabled = false;
        btn.innerText = textoOriginal;
    }
}