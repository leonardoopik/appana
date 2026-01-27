const PORT = process.env.PORT || 3000; // A nuvem decide a porta
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Criar pasta de uploads se não existir
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static('uploads'));

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Configuração do Banco
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // A URL virá da nuvem
    ssl: {
        rejectUnauthorized: false // Obrigatório para conexões externas gratuitas
    }
});
pool.connect((err) => {
    if (err) console.error('❌ ERRO NO POSTGRES:', err.message);
    else console.log('✅ CONECTADO AO POSTGRES COM SUCESSO!');
});

// ==========================================
// 1. ROTAS DE AUTENTICAÇÃO
// ==========================================

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

app.post('/register', async (req, res) => {
    const { nome, crm, email, senha } = req.body;
    try {
        const hash = await bcrypt.hash(senha, 10);
        const result = await pool.query(
            'INSERT INTO medicos (nome, crm, email, senha) VALUES ($1, $2, $3, $4) RETURNING id, nome',
            [nome, crm, email, hash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erro ao cadastrar médico." });
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
    const { nome, whatsapp, data_nascimento } = req.body;
    try {
        await pool.query(
            'UPDATE pacientes SET nome = $1, whatsapp = $2, data_nascimento = $3 WHERE id = $4',
            [nome, whatsapp, data_nascimento, id]
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
            SELECT h.* FROM historico_remedios h 
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

// --- NOVAS ROTAS PARA MEDICAMENTOS (Editar e Excluir) ---

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
        // Primeiro apaga o histórico desse remédio para não dar erro de chave estrangeira
        await pool.query('DELETE FROM historico_remedios WHERE medicamento_id = $1', [id]);
        // Depois apaga o remédio
        await pool.query('DELETE FROM medicamentos WHERE id = $1', [id]);
        res.json({ message: "Medicamento excluído!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao excluir medicamento." });
    }
});



// No final do arquivo
app.listen(PORT, () => console.log(`🚀 SERVIDOR RODANDO`));