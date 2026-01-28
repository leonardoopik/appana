const PORT = process.env.PORT || 3000;
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // <--- ADICIONADO
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Criar pasta de uploads se não existir
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static('uploads'));

// Configuração do Multer (Upload de imagens)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Configuração do Banco de Dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
pool.connect((err) => {
    if (err) console.error('❌ ERRO NO POSTGRES:', err.message);
    else console.log('✅ CONECTADO AO POSTGRES COM SUCESSO!');
});

// ==========================================
// CONFIGURAÇÃO DO E-MAIL (NODEMAILER)
// ==========================================
// ==========================================
// CONFIGURAÇÃO DO E-MAIL (MODO OFFICE 365)
// ==========================================
const transporter = nodemailer.createTransport({
    host: "smtp.office365.com", // Trocamos o endereço
    port: 587,
    secure: false, // STARTTLS
    requireTLS: true, // Força o uso de segurança
    auth: {
        user: 'meddashapp@hotmail.com',
        pass: 'SUA_SENHA_REAL_AQUI' // <--- COLOQUE A SENHA!!!
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    }
});
// ==========================================
// 1. ROTAS DE AUTENTICAÇÃO
// ==========================================

// ROTA: LOGIN
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await pool.query('SELECT * FROM medicos WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const match = await bcrypt.compare(senha, result.rows[0].senha);
            if (match) {
                res.json({ medicoId: result.rows[0].id, nome: result.rows[0].nome });
            } else {
                res.status(401).json({ error: "Senha incorreta." });
            }
        } else {
            res.status(404).json({ error: "Médico não encontrado." });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro no servidor." });
    }
});

// ROTA: CADASTRO (COM BLOQUEIO DE DUPLICIDADE)
app.post('/auth/register', async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        // 1. VERIFICAÇÃO DE DUPLICIDADE
        const userExist = await pool.query("SELECT * FROM medicos WHERE email = $1", [email]);
        
        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: "Este e-mail já está cadastrado!" });
        }

        // 2. SE NÃO EXISTIR, CADASTRA
        // Hash da senha (criptografia) deve ser feito aqui idealmente, 
        // mas vou manter como você enviou para não quebrar a lógica atual se você envia já hashado ou texto puro
        // Se estiver enviando texto puro, recomendo: const hashedPassword = await bcrypt.hash(senha, 10);
        
        const newUser = await pool.query(
            "INSERT INTO medicos (nome, email, senha) VALUES ($1, $2, $3) RETURNING *",
            [nome, email, senha]
        );

        res.json(newUser.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// ROTA: SOLICITAR LINK DE SENHA
app.post('/auth/esqueci-senha', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await pool.query("SELECT * FROM medicos WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: "E-mail não encontrado" });
        }

        // Gera token
        const token = crypto.randomBytes(20).toString('hex');
        const agora = new Date();
        agora.setHours(agora.getHours() + 1); // Expira em 1 hora

        // Salva no banco
        await pool.query(
            "UPDATE medicos SET reset_token = $1, reset_expires = $2 WHERE email = $3",
            [token, agora, email]
        );

        // Link para o Frontend
        const linkRecuperacao = `https://appana.vercel.app/nova-senha.html?token=${token}`;

        // Envia o E-mail
        await transporter.sendMail({
            from: '"MedDash App" <meddashapp@hotmail.com>',
            to: email,
            subject: 'Recuperação de Senha - MedDash',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Recuperação de Senha</h2>
                    <p>Você solicitou a redefinição da sua senha.</p>
                    <p>Clique no botão abaixo para criar uma nova senha:</p>
                    <a href="${linkRecuperacao}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Minha Senha</a>
                    <p>Este link expira em 1 hora.</p>
                </div>
            `
        });

        res.json({ message: "E-mail enviado!" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao processar");
    }
});

// ROTA: RESETAR SENHA
app.post('/auth/resetar-senha', async (req, res) => {
    const { token, novaSenha } = req.body;

    try {
        const user = await pool.query(
            "SELECT * FROM medicos WHERE reset_token = $1 AND reset_expires > NOW()",
            [token]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ error: "Link inválido ou expirado" });
        }

        // Criptografa a nova senha antes de salvar
        const hashedPassword = await bcrypt.hash(novaSenha, 10);

        await pool.query(
            "UPDATE medicos SET senha = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2",
            [hashedPassword, user.rows[0].id]
        );

        res.json({ message: "Senha alterada com sucesso!" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao resetar senha");
    }
});


// ==========================================
// 2. ROTAS DE PACIENTES
// ==========================================

app.get('/pacientes-por-medico/:medicoId', async (req, res) => {
    const { medicoId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM pacientes WHERE medico_id = $1 ORDER BY nome ASC', [medicoId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar pacientes." });
    }
});

app.post('/pacientes', async (req, res) => {
    const { medicoId, nome, whatsapp, data_nascimento, gestor } = req.body;
    try {
        await pool.query(
            'INSERT INTO pacientes (medico_id, nome, whatsapp, data_nascimento, gestor) VALUES ($1, $2, $3, $4, $5)',
            [medicoId, nome, whatsapp, data_nascimento, gestor]
        );
        res.status(201).json({ message: "Paciente cadastrado!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao salvar paciente." });
    }
});

app.put('/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, whatsapp, data_nascimento, gestor } = req.body;
    try {
        await pool.query(
            'UPDATE pacientes SET nome = $1, whatsapp = $2, data_nascimento = $3, gestor = $4 WHERE id = $5',
            [nome, whatsapp, data_nascimento, gestor, id]
        );
        res.json({ message: "Perfil atualizado!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao atualizar perfil." });
    }
});

app.delete('/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM pacientes WHERE id = $1', [id]);
        res.json({ message: "Paciente removido!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao excluir." });
    }
});

app.get('/perfil-paciente/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const paciente = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
        const remedios = await pool.query('SELECT * FROM medicamentos WHERE paciente_id = $1 ORDER BY horario ASC', [id]);
        const anotacoes = await pool.query('SELECT * FROM anotacoes_paciente WHERE paciente_id = $1 ORDER BY data_criacao DESC', [id]);
        const historico = await pool.query(`
            SELECT h.*, m.nome_remedio FROM historico_remedios h 
            JOIN medicamentos m ON h.medicamento_id = m.id 
            WHERE m.paciente_id = $1 ORDER BY h.data_dose DESC`, [id]);
        
        res.json({ 
            info: paciente.rows[0], 
            medicamentos: remedios.rows, 
            anotacoes: anotacoes.rows, 
            historico: historico.rows 
        });
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar perfil." });
    }
});

// ==========================================
// 3. ROTAS DE ANOTAÇÕES (CRUD)
// ==========================================

app.post('/pacientes/:id/anotacoes', async (req, res) => {
    const { id } = req.params;
    const { anotacao } = req.body;
    try {
        await pool.query(
            'INSERT INTO anotacoes_paciente (paciente_id, texto) VALUES ($1, $2)',
            [id, anotacao]
        );
        res.status(201).json({ message: "Anotação salva!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao salvar anotação." });
    }
});

app.put('/anotacoes/:id', async (req, res) => {
    const { id } = req.params;
    const { texto } = req.body;
    try {
        const result = await pool.query('UPDATE anotacoes_paciente SET texto = $1 WHERE id = $2', [texto, id]);
        if (result.rowCount === 0) return res.status(404).json({ error: "Anotação não encontrada." });
        res.json({ message: "Anotação atualizada!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao editar." });
    }
});

app.delete('/anotacoes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM anotacoes_paciente WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: "Não encontrada." });
        res.json({ message: "Anotação removida!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao excluir." });
    }
});

// ==========================================
// 4. ROTAS DE MEDICAMENTOS E DOSES
// ==========================================

app.post('/medicamentos', upload.single('foto'), async (req, res) => {
    const { pacienteId, nome_remedio, horarios } = req.body;
    const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;
    try {
        const listaHorarios = JSON.parse(horarios); 
        for (let h of listaHorarios) {
            await pool.query(
                'INSERT INTO medicamentos (paciente_id, nome_remedio, horario, imagem_url) VALUES ($1, $2, $3, $4)',
                [pacienteId, nome_remedio, h, imagem_url]
            );
        }
        res.status(201).json({ message: "Medicamentos salvos!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao cadastrar remédio." });
    }
});

app.post('/registrar-dose', async (req, res) => {
    const { medicamento_id, status, atraso_minutos } = req.body;
    try {
        await pool.query(
            'INSERT INTO historico_remedios (medicamento_id, status, atraso_minutos) VALUES ($1, $2, $3)',
            [medicamento_id, status, atraso_minutos]
        );
        res.json({ message: "Dose registrada!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao registrar dose." });
    }
});

app.put('/medicamentos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome_remedio, horario } = req.body;
    try {
        await pool.query(
            'UPDATE medicamentos SET nome_remedio = $1, horario = $2 WHERE id = $3',
            [nome_remedio, horario, id]
        );
        res.json({ message: "Medicamento atualizado!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao atualizar medicamento." });
    }
});

app.delete('/medicamentos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Primeiro apaga o histórico
        await pool.query('DELETE FROM historico_remedios WHERE medicamento_id = $1', [id]);
        // Depois apaga o remédio
        await pool.query('DELETE FROM medicamentos WHERE id = $1', [id]);
        res.json({ message: "Medicamento excluído!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao excluir medicamento." });
    }
});

app.listen(PORT, () => console.log(`🚀 SERVIDOR RODANDO`));