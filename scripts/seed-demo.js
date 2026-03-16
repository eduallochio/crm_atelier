/**
 * SEED DE DEMONSTRAÇÃO — CRM Atelier
 *
 * Popula o banco com dados realistas simulando produção:
 *   - 5 organizações (planos free e enterprise)
 *   - Usuários, clientes, serviços, ordens, financeiro e caixa
 *
 * USO:
 *   node scripts/seed-demo.js
 *
 * ATENÇÃO: Este script limpa os dados existentes antes de inserir.
 *           NÃO execute em produção com dados reais.
 */

const path   = require('path')
const crypto = require('crypto')

// Carrega .env.local
try {
  require('fs').readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
    .split(/\r?\n/)
    .forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) return
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (key && process.env[key] === undefined) process.env[key] = val
    })
} catch { /* usa variáveis do ambiente */ }

const sql    = require('mssql')
const bcrypt = require('bcryptjs')

const uid = () => crypto.randomUUID().toUpperCase()
const dt  = (daysOffset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d
}
const dateStr = (daysOffset = 0) => {
  const d = dt(daysOffset)
  return d.toISOString().split('T')[0]
}

// ─── UUIDs pré-definidos para referência cruzada ───────────────────────────

const ORG = {
  maria:    uid(), // Ateliê da Maria (free)
  costura:  uid(), // Costura & Arte (free)
  elegance: uid(), // Studio Elegance (enterprise)
  premium:  uid(), // Alta Costura Premium (enterprise)
  bella:    uid(), // Modas Bella (enterprise)
}

const USER = {
  maria:    uid(),
  joana:    uid(),
  carla:    uid(),
  ana:      uid(),     // admin do elegance
  patricia: uid(),
  fernanda: uid(),     // membro do premium
  roberto:  uid(),     // membro do premium
  bella:    uid(),
}

// ─── DADOS DAS ORGANIZAÇÕES ─────────────────────────────────────────────────

const organizations = [
  {
    id: ORG.maria, name: 'Ateliê da Maria', slug: 'atelie-da-maria',
    plan: 'free', subscription_status: 'active',
    email: 'contato@ateliedamaria.com.br', phone: '(11) 99234-5678',
    cnpj: '12.345.678/0001-90', city: 'São Paulo', state: 'SP',
    address: 'Rua das Flores, 123', zip_code: '01310-100',
  },
  {
    id: ORG.costura, name: 'Costura & Arte', slug: 'costura-arte',
    plan: 'free', subscription_status: 'active',
    email: 'joana@costuraarte.com', phone: '(21) 98765-4321',
    cnpj: '98.765.432/0001-10', city: 'Rio de Janeiro', state: 'RJ',
    address: 'Av. Copacabana, 500', zip_code: '22070-011',
  },
  {
    id: ORG.elegance, name: 'Studio Elegance', slug: 'studio-elegance',
    plan: 'enterprise', subscription_status: 'active',
    email: 'atendimento@studioelegance.com.br', phone: '(31) 3333-4444',
    cnpj: '11.222.333/0001-44', city: 'Belo Horizonte', state: 'MG',
    address: 'Rua da Moda, 789', zip_code: '30130-110',
    website: 'https://studioelegance.com.br',
  },
  {
    id: ORG.premium, name: 'Alta Costura Premium', slug: 'alta-costura-premium',
    plan: 'enterprise', subscription_status: 'active',
    email: 'contato@altacosturapremium.com.br', phone: '(41) 3232-5656',
    cnpj: '55.666.777/0001-88', city: 'Curitiba', state: 'PR',
    address: 'Rua XV de Novembro, 1000', zip_code: '80020-310',
    website: 'https://altacosturapremium.com.br',
  },
  {
    id: ORG.bella, name: 'Modas Bella', slug: 'modas-bella',
    plan: 'enterprise', subscription_status: 'active',
    email: 'bella@modasbella.com', phone: '(85) 99111-2222',
    cnpj: '33.444.555/0001-66', city: 'Fortaleza', state: 'CE',
    address: 'Av. Beira Mar, 2500', zip_code: '60165-121',
  },
]

// ─── USUÁRIOS ────────────────────────────────────────────────────────────────

const PASSWORD_HASH_DEMO = '$2b$12$demo.hash.placeholder' // substituído abaixo

const usersData = [
  { id: USER.maria,    org: ORG.maria,    email: 'maria@ateliedamaria.com.br',        name: 'Maria Silva',         role: 'owner', is_owner: 1 },
  { id: USER.joana,    org: ORG.costura,  email: 'joana@costuraarte.com',              name: 'Joana Costa',         role: 'owner', is_owner: 1 },
  { id: USER.carla,    org: ORG.elegance, email: 'carla@studioelegance.com.br',        name: 'Carla Mendes',        role: 'owner', is_owner: 1 },
  { id: USER.ana,      org: ORG.elegance, email: 'ana@studioelegance.com.br',          name: 'Ana Paula Ferreira',  role: 'admin', is_owner: 0 },
  { id: USER.patricia, org: ORG.premium,  email: 'patricia@altacosturapremium.com.br', name: 'Patricia Oliveira',   role: 'owner', is_owner: 1 },
  { id: USER.fernanda, org: ORG.premium,  email: 'fernanda@altacosturapremium.com.br', name: 'Fernanda Rocha',      role: 'admin', is_owner: 0 },
  { id: USER.roberto,  org: ORG.premium,  email: 'roberto@altacosturapremium.com.br',  name: 'Roberto Alves',       role: 'member',is_owner: 0 },
  { id: USER.bella,    org: ORG.bella,    email: 'bella@modasbella.com',               name: 'Isabella Rodrigues',  role: 'owner', is_owner: 1 },
]

// ─── CLIENTES por organização ─────────────────────────────────────────────

const clientesPorOrg = {
  [ORG.maria]: [
    { nome: 'Luciana Ferreira',    telefone: '(11) 99111-2233', email: 'luciana@email.com', cidade: 'São Paulo', estado: 'SP', data_nascimento: '1985-03-15' },
    { nome: 'Roberta Santos',      telefone: '(11) 98222-3344', email: 'roberta@email.com', cidade: 'São Paulo', estado: 'SP', data_nascimento: '1990-07-22' },
    { nome: 'Camila Andrade',      telefone: '(11) 97333-4455', email: null,                cidade: 'Guarulhos', estado: 'SP', data_nascimento: '1978-11-30' },
    { nome: 'Fernanda Lima',       telefone: '(11) 96444-5566', email: 'flima@email.com',   cidade: 'São Paulo', estado: 'SP', data_nascimento: null },
    { nome: 'Patrícia Moura',      telefone: '(11) 95555-6677', email: null,                cidade: 'Osasco',   estado: 'SP', data_nascimento: '1995-01-08' },
    { nome: 'Vanessa Carvalho',    telefone: '(11) 94666-7788', email: 'vanessa@email.com', cidade: 'São Paulo', estado: 'SP', data_nascimento: '1988-05-19' },
    { nome: 'Jéssica Ribeiro',     telefone: '(11) 93777-8899', email: null,                cidade: 'São Paulo', estado: 'SP', data_nascimento: '2000-09-03' },
    { nome: 'Tatiane Nascimento',  telefone: '(11) 92888-9900', email: 'tati@email.com',    cidade: 'São Paulo', estado: 'SP', data_nascimento: '1983-12-14' },
  ],
  [ORG.costura]: [
    { nome: 'Aline Souza',         telefone: '(21) 99000-1122', email: 'aline@email.com',   cidade: 'Rio de Janeiro', estado: 'RJ', data_nascimento: '1992-06-25' },
    { nome: 'Bruna Cavalcante',    telefone: '(21) 98100-2233', email: null,                 cidade: 'Niterói',        estado: 'RJ', data_nascimento: '1986-04-10' },
    { nome: 'Cristiane Dias',      telefone: '(21) 97200-3344', email: 'cris@email.com',     cidade: 'Rio de Janeiro', estado: 'RJ', data_nascimento: '1975-08-31' },
    { nome: 'Débora Freitas',      telefone: '(21) 96300-4455', email: null,                 cidade: 'Duque de Caxias',estado: 'RJ', data_nascimento: null },
    { nome: 'Elaine Marques',      telefone: '(21) 95400-5566', email: 'elaine@email.com',   cidade: 'Rio de Janeiro', estado: 'RJ', data_nascimento: '1998-02-17' },
    { nome: 'Flávia Araújo',       telefone: '(21) 94500-6677', email: null,                 cidade: 'Nova Iguaçu',    estado: 'RJ', data_nascimento: '1981-10-05' },
  ],
  [ORG.elegance]: [
    { nome: 'Gabriela Teixeira',   telefone: '(31) 99700-0011', email: 'gabi@email.com',    cidade: 'Belo Horizonte', estado: 'MG', data_nascimento: '1989-07-14' },
    { nome: 'Helena Gomes',        telefone: '(31) 98800-1122', email: 'helena@email.com',  cidade: 'Belo Horizonte', estado: 'MG', data_nascimento: '1993-03-28' },
    { nome: 'Isabela Martins',     telefone: '(31) 97900-2233', email: null,                cidade: 'Contagem',       estado: 'MG', data_nascimento: '1972-11-09' },
    { nome: 'Juliana Pereira',     telefone: '(31) 97000-3344', email: 'ju@email.com',      cidade: 'Belo Horizonte', estado: 'MG', data_nascimento: '1996-05-21' },
    { nome: 'Karen Albuquerque',   telefone: '(31) 96100-4455', email: null,                cidade: 'Betim',          estado: 'MG', data_nascimento: null },
    { nome: 'Larissa Barbosa',     telefone: '(31) 95200-5566', email: 'lari@email.com',    cidade: 'Belo Horizonte', estado: 'MG', data_nascimento: '1984-09-16' },
    { nome: 'Marcela Cunha',       telefone: '(31) 94300-6677', email: null,                cidade: 'Belo Horizonte', estado: 'MG', data_nascimento: '1991-01-03' },
    { nome: 'Natália Pinto',       telefone: '(31) 93400-7788', email: 'nati@email.com',    cidade: 'Nova Lima',      estado: 'MG', data_nascimento: '1987-06-12' },
    { nome: 'Olivia Cardoso',      telefone: '(31) 92500-8899', email: null,                cidade: 'Belo Horizonte', estado: 'MG', data_nascimento: '1979-12-25' },
    { nome: 'Paula Bastos',        telefone: '(31) 91600-9900', email: 'paula@email.com',   cidade: 'Belo Horizonte', estado: 'MG', data_nascimento: '2001-04-07' },
    { nome: 'Quésia Monteiro',     telefone: '(31) 90700-0011', email: null,                cidade: 'Belo Horizonte', estado: 'MG', data_nascimento: '1994-08-19' },
    { nome: 'Renata Vieira',       telefone: '(31) 89800-1122', email: 'renata@email.com',  cidade: 'Contagem',       estado: 'MG', data_nascimento: '1977-02-28' },
  ],
  [ORG.premium]: [
    { nome: 'Sandra Lopes',        telefone: '(41) 99900-2233', email: 'sandra@email.com',  cidade: 'Curitiba', estado: 'PR', data_nascimento: '1982-10-11' },
    { nome: 'Tânia Correia',       telefone: '(41) 99000-3344', email: null,                cidade: 'Curitiba', estado: 'PR', data_nascimento: '1990-06-30' },
    { nome: 'Úrsula Neves',        telefone: '(41) 98100-4455', email: 'ursula@email.com',  cidade: 'Curitiba', estado: 'PR', data_nascimento: '1975-03-22' },
    { nome: 'Veridiana Castro',    telefone: '(41) 97200-5566', email: null,                cidade: 'Londrina', estado: 'PR', data_nascimento: '1998-07-04' },
    { nome: 'Wanda Barros',        telefone: '(41) 96300-6677', email: 'wanda@email.com',   cidade: 'Curitiba', estado: 'PR', data_nascimento: '1985-12-18' },
    { nome: 'Ximena Figueiredo',   telefone: '(41) 95400-7788', email: null,                cidade: 'Maringá',  estado: 'PR', data_nascimento: null },
    { nome: 'Yara Cavalcanti',     telefone: '(41) 94500-8899', email: 'yara@email.com',    cidade: 'Curitiba', estado: 'PR', data_nascimento: '1993-09-26' },
    { nome: 'Zilda Pacheco',       telefone: '(41) 93600-9900', email: null,                cidade: 'Ponta Grossa', estado: 'PR', data_nascimento: '1969-01-15' },
    { nome: 'Amanda Silveira',     telefone: '(41) 92700-0011', email: 'amanda@email.com',  cidade: 'Curitiba', estado: 'PR', data_nascimento: '2002-05-08' },
    { nome: 'Beatriz Nogueira',    telefone: '(41) 91800-1122', email: null,                cidade: 'Curitiba', estado: 'PR', data_nascimento: '1980-11-23' },
    { nome: 'Cecília Ramos',       telefone: '(41) 90900-2233', email: 'ceci@email.com',    cidade: 'Curitiba', estado: 'PR', data_nascimento: '1976-04-14' },
    { nome: 'Diana Soares',        telefone: '(41) 89000-3344', email: null,                cidade: 'Cascavel',  estado: 'PR', data_nascimento: '1999-08-02' },
    { nome: 'Ester Macedo',        telefone: '(41) 88100-4455', email: 'ester@email.com',   cidade: 'Curitiba', estado: 'PR', data_nascimento: '1988-02-17' },
    { nome: 'Fátima Rezende',      telefone: '(41) 87200-5566', email: null,                cidade: 'Curitiba', estado: 'PR', data_nascimento: '1972-06-09' },
    { nome: 'Giovana Siqueira',    telefone: '(41) 86300-6677', email: 'gio@email.com',     cidade: 'Curitiba', estado: 'PR', data_nascimento: '1995-10-31' },
  ],
  [ORG.bella]: [
    { nome: 'Heloise Duarte',      telefone: '(85) 99400-7788', email: 'heloise@email.com', cidade: 'Fortaleza', estado: 'CE', data_nascimento: '1991-03-07' },
    { nome: 'Ingrid Magalhães',    telefone: '(85) 98500-8899', email: null,                cidade: 'Fortaleza', estado: 'CE', data_nascimento: '1986-07-20' },
    { nome: 'Joelma Alencar',      telefone: '(85) 97600-9900', email: 'joelma@email.com',  cidade: 'Caucaia',   estado: 'CE', data_nascimento: '1979-11-04' },
    { nome: 'Kátia Vasconcelos',   telefone: '(85) 96700-0011', email: null,                cidade: 'Fortaleza', estado: 'CE', data_nascimento: null },
    { nome: 'Liliane Fontenele',   telefone: '(85) 95800-1122', email: 'lili@email.com',    cidade: 'Fortaleza', estado: 'CE', data_nascimento: '1997-05-16' },
    { nome: 'Miriam Benevides',    telefone: '(85) 94900-2233', email: null,                cidade: 'Maracanaú',  estado: 'CE', data_nascimento: '1983-09-28' },
    { nome: 'Norma Ximenes',       telefone: '(85) 93000-3344', email: 'norma@email.com',   cidade: 'Fortaleza', estado: 'CE', data_nascimento: '1974-01-19' },
    { nome: 'Odete Coelho',        telefone: '(85) 92100-4455', email: null,                cidade: 'Fortaleza', estado: 'CE', data_nascimento: '2000-06-11' },
    { nome: 'Priscila Mendonça',   telefone: '(85) 91200-5566', email: 'priscila@email.com',cidade: 'Fortaleza', estado: 'CE', data_nascimento: '1992-12-03' },
    { nome: 'Quirina Lustosa',     telefone: '(85) 90300-6677', email: null,                cidade: 'Sobral',    estado: 'CE', data_nascimento: '1988-04-25' },
  ],
}

// ─── SERVIÇOS por organização ─────────────────────────────────────────────

const servicosPorOrg = {
  [ORG.maria]: [
    { nome: 'Bainha Simples',        preco: 25.00,  categoria: 'Ajustes',   tempo_estimado: '1 dia',    nivel_dificuldade: 'facil' },
    { nome: 'Ajuste de Calça',       preco: 45.00,  categoria: 'Ajustes',   tempo_estimado: '2 dias',   nivel_dificuldade: 'medio' },
    { nome: 'Ajuste de Vestido',     preco: 80.00,  categoria: 'Ajustes',   tempo_estimado: '3 dias',   nivel_dificuldade: 'medio' },
    { nome: 'Costura de Roupa',      preco: 120.00, categoria: 'Criação',   tempo_estimado: '5 dias',   nivel_dificuldade: 'dificil' },
    { nome: 'Reparo de Zíper',       preco: 20.00,  categoria: 'Reparos',   tempo_estimado: '1 dia',    nivel_dificuldade: 'facil' },
    { nome: 'Bordado Personalizado', preco: 150.00, categoria: 'Criação',   tempo_estimado: '7 dias',   nivel_dificuldade: 'dificil' },
  ],
  [ORG.costura]: [
    { nome: 'Bainha Calça Jeans',    preco: 30.00,  categoria: 'Bainhas',   tempo_estimado: '1 dia',    nivel_dificuldade: 'facil' },
    { nome: 'Ajuste de Blazer',      preco: 90.00,  categoria: 'Ajustes',   tempo_estimado: '3 dias',   nivel_dificuldade: 'medio' },
    { nome: 'Costura de Roupa Fina', preco: 200.00, categoria: 'Criação',   tempo_estimado: '10 dias',  nivel_dificuldade: 'dificil' },
    { nome: 'Conserto de Rasgado',   preco: 35.00,  categoria: 'Reparos',   tempo_estimado: '1 dia',    nivel_dificuldade: 'facil' },
    { nome: 'Transformação de Roupa',preco: 110.00, categoria: 'Criação',   tempo_estimado: '5 dias',   nivel_dificuldade: 'medio' },
  ],
  [ORG.elegance]: [
    { nome: 'Vestido Sob Medida',    preco: 450.00, categoria: 'Alta Costura', tempo_estimado: '15 dias', nivel_dificuldade: 'dificil' },
    { nome: 'Terno Masculino',       preco: 380.00, categoria: 'Alta Costura', tempo_estimado: '12 dias', nivel_dificuldade: 'dificil' },
    { nome: 'Ajuste de Terno',       preco: 120.00, categoria: 'Ajustes',      tempo_estimado: '5 dias',  nivel_dificuldade: 'medio' },
    { nome: 'Bainha Premium',        preco: 45.00,  categoria: 'Bainhas',      tempo_estimado: '1 dia',   nivel_dificuldade: 'facil' },
    { nome: 'Bordado Fino',          preco: 280.00, categoria: 'Criação',      tempo_estimado: '10 dias', nivel_dificuldade: 'dificil' },
    { nome: 'Ajuste de Vestido',     preco: 150.00, categoria: 'Ajustes',      tempo_estimado: '5 dias',  nivel_dificuldade: 'medio' },
    { nome: 'Costura de Lingerie',   preco: 200.00, categoria: 'Criação',      tempo_estimado: '7 dias',  nivel_dificuldade: 'dificil' },
    { nome: 'Reparo Geral',          preco: 60.00,  categoria: 'Reparos',      tempo_estimado: '2 dias',  nivel_dificuldade: 'facil' },
    { nome: 'Customização Jeans',    preco: 180.00, categoria: 'Criação',      tempo_estimado: '5 dias',  nivel_dificuldade: 'medio' },
  ],
  [ORG.premium]: [
    { nome: 'Vestido de Noiva',      preco: 2500.00, categoria: 'Noivas',     tempo_estimado: '30 dias',  nivel_dificuldade: 'dificil' },
    { nome: 'Ajuste de Noiva',       preco: 400.00,  categoria: 'Noivas',     tempo_estimado: '10 dias',  nivel_dificuldade: 'dificil' },
    { nome: 'Vestido de Festa',      preco: 800.00,  categoria: 'Festa',      tempo_estimado: '20 dias',  nivel_dificuldade: 'dificil' },
    { nome: 'Vestido Sob Medida',    preco: 650.00,  categoria: 'Alta Costura', tempo_estimado: '15 dias', nivel_dificuldade: 'dificil' },
    { nome: 'Terno Exclusivo',       preco: 900.00,  categoria: 'Alta Costura', tempo_estimado: '20 dias', nivel_dificuldade: 'dificil' },
    { nome: 'Ajuste Fino',           preco: 200.00,  categoria: 'Ajustes',    tempo_estimado: '5 dias',   nivel_dificuldade: 'medio' },
    { nome: 'Bordado Couture',       preco: 500.00,  categoria: 'Criação',    tempo_estimado: '15 dias',  nivel_dificuldade: 'dificil' },
    { nome: 'Bainha Fina',           preco: 80.00,   categoria: 'Bainhas',    tempo_estimado: '2 dias',   nivel_dificuldade: 'facil' },
    { nome: 'Roupa Executiva',       preco: 1200.00, categoria: 'Alta Costura', tempo_estimado: '25 dias', nivel_dificuldade: 'dificil' },
    { nome: 'Kit Madrinha',          preco: 350.00,  categoria: 'Festa',      tempo_estimado: '12 dias',  nivel_dificuldade: 'medio' },
  ],
  [ORG.bella]: [
    { nome: 'Moda Praia',            preco: 180.00, categoria: 'Criação',   tempo_estimado: '7 dias',  nivel_dificuldade: 'medio' },
    { nome: 'Vestido Casual',        preco: 250.00, categoria: 'Criação',   tempo_estimado: '10 dias', nivel_dificuldade: 'medio' },
    { nome: 'Ajuste de Roupa',       preco: 60.00,  categoria: 'Ajustes',   tempo_estimado: '2 dias',  nivel_dificuldade: 'facil' },
    { nome: 'Bainha Jeans',          preco: 35.00,  categoria: 'Bainhas',   tempo_estimado: '1 dia',   nivel_dificuldade: 'facil' },
    { nome: 'Conjunto Casual',       preco: 420.00, categoria: 'Criação',   tempo_estimado: '12 dias', nivel_dificuldade: 'dificil' },
    { nome: 'Reparo de Zíper',       preco: 25.00,  categoria: 'Reparos',   tempo_estimado: '1 dia',   nivel_dificuldade: 'facil' },
    { nome: 'Personalização',        preco: 150.00, categoria: 'Criação',   tempo_estimado: '5 dias',  nivel_dificuldade: 'medio' },
  ],
}

// ─── FORNECEDORES ─────────────────────────────────────────────────────────

const fornecedoresPorOrg = {
  [ORG.elegance]: [
    { nome: 'Tecidos MG', telefone: '(31) 3100-2200', email: 'vendas@tecidosmg.com', cnpj: '22.333.444/0001-55' },
    { nome: 'Aviamentos Sul', telefone: '(31) 3200-3300', email: null, cnpj: null },
  ],
  [ORG.premium]: [
    { nome: 'Casa dos Tecidos PR', telefone: '(41) 3100-1100', email: 'compras@casatecidospr.com', cnpj: '44.555.666/0001-77' },
    { nome: 'Renda & Bordado', telefone: '(41) 3200-2200', email: null, cnpj: null },
    { nome: 'Importadora Fashion', telefone: '(41) 3300-3300', email: 'fashion@import.com', cnpj: '77.888.999/0001-00' },
  ],
  [ORG.bella]: [
    { nome: 'Feirinha do Tecido CE', telefone: '(85) 3100-4400', email: null, cnpj: null },
  ],
}

// ─── MAIN ─────────────────────────────────────────────────────────────────

async function main() {
  const config = {
    user:     process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
    server:   process.env.SQLSERVER_SERVER,
    database: process.env.SQLSERVER_DATABASE || 'CrmAtelier',
    port:     Number(process.env.SQLSERVER_PORT) || 1433,
    options: { encrypt: false, trustServerCertificate: true },
  }

  console.log(`\n🌱 CRM Atelier — Seed de Demonstração`)
  console.log(`📦 Conectando ao SQL Server (${config.server}/${config.database})...`)
  const pool = await sql.connect(config)
  console.log('✓ Conectado\n')

  // ─── Verifica coluna is_master ──────────────────────────────────────────
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='is_master')
      ALTER TABLE users ADD is_master BIT NOT NULL DEFAULT 0
  `)

  // ─── Hash de senha padrão (Senha@123 para todos) ───────────────────────
  console.log('🔐 Gerando hash de senha...')
  const passwordHash = await bcrypt.hash('Senha@123', 12)
  console.log('   ✓ Hash gerado (senha padrão: Senha@123)\n')

  // ─── Limpeza seletiva (preserva master) ───────────────────────────────
  console.log('🗑️  Limpando dados demo anteriores...')
  const slugs = organizations.map(o => `'${o.slug}'`).join(',')
  await pool.request().query(`
    DELETE FROM org_cashier_reconciliations WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_cashier_movements       WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_cashier_sessions        WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_cashiers                WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_transactions            WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_payables                WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_receivables             WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_suppliers               WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_service_order_notes     WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_service_order_history   WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_service_order_items     WHERE order_id IN (SELECT id FROM org_service_orders WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs})))
    DELETE FROM org_service_orders          WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_clients                 WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_services                WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_payment_methods         WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_financial_categories    WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_financial_settings      WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_notification_settings   WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_order_settings          WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM org_system_preferences      WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM customization_settings      WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM usage_metrics               WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs}))
    DELETE FROM users                       WHERE organization_id IN (SELECT id FROM organizations WHERE slug IN (${slugs})) AND is_master = 0
    DELETE FROM organizations               WHERE slug IN (${slugs})
  `)
  console.log('   ✓ Limpo\n')

  // ─── Organizações ──────────────────────────────────────────────────────
  console.log('🏢 Inserindo organizações...')
  for (const org of organizations) {
    await pool.request()
      .input('id',   sql.UniqueIdentifier, org.id)
      .input('name', sql.NVarChar, org.name)
      .input('slug', sql.NVarChar, org.slug)
      .input('plan', sql.NVarChar, org.plan)
      .input('status', sql.NVarChar, org.subscription_status)
      .input('email', sql.NVarChar, org.email || null)
      .input('phone', sql.NVarChar, org.phone || null)
      .input('cnpj',  sql.NVarChar, org.cnpj || null)
      .input('address', sql.NVarChar, org.address || null)
      .input('city',  sql.NVarChar, org.city || null)
      .input('state', sql.NVarChar, org.state || null)
      .input('zip',   sql.NVarChar, org.zip_code || null)
      .input('website', sql.NVarChar, org.website || null)
      .query(`INSERT INTO organizations (id,name,slug,[plan],subscription_status,email,phone,cnpj,address,city,state,zip_code,website)
              VALUES (@id,@name,@slug,@plan,@status,@email,@phone,@cnpj,@address,@city,@state,@zip,@website)`)
  }
  console.log(`   ✓ ${organizations.length} organizações\n`)

  // ─── Usuários ──────────────────────────────────────────────────────────
  console.log('👤 Inserindo usuários...')
  for (const u of usersData) {
    await pool.request()
      .input('id',   sql.UniqueIdentifier, u.id)
      .input('org',  sql.UniqueIdentifier, u.org)
      .input('email', sql.NVarChar, u.email)
      .input('hash',  sql.NVarChar, passwordHash)
      .input('name',  sql.NVarChar, u.name)
      .input('role',  sql.NVarChar, u.role)
      .input('is_owner', sql.Bit, u.is_owner)
      .query(`INSERT INTO users (id,organization_id,email,password_hash,full_name,[role],is_owner,is_master)
              VALUES (@id,@org,@email,@hash,@name,@role,@is_owner,0)`)
  }
  console.log(`   ✓ ${usersData.length} usuários (senha padrão: Senha@123)\n`)

  // ─── Clientes, Serviços, Ordens, Financeiro por org ───────────────────
  const statsClientes = {}
  const statsOrdens   = {}
  const clienteIds    = {}   // orgId → [{ id, nome }]
  const servicoIds    = {}   // orgId → [{ id, nome, preco }]
  const categIds      = {}   // orgId → { receita: id, despesa: id }
  const pmIds         = {}   // orgId → { pix: id, dinheiro: id, credito: id }

  for (const org of organizations) {
    const orgId = org.id
    clienteIds[orgId] = []
    servicoIds[orgId] = []

    // ── Clientes ────────────────────────────────────────────────────────
    for (const c of (clientesPorOrg[orgId] || [])) {
      const cid = uid()
      clienteIds[orgId].push({ id: cid, nome: c.nome })
      await pool.request()
        .input('id',   sql.UniqueIdentifier, cid)
        .input('org',  sql.UniqueIdentifier, orgId)
        .input('nome', sql.NVarChar, c.nome)
        .input('tel',  sql.NVarChar, c.telefone || null)
        .input('email', sql.NVarChar, c.email || null)
        .input('nasc', sql.Date, c.data_nascimento ? new Date(c.data_nascimento) : null)
        .input('cidade', sql.NVarChar, c.cidade || null)
        .input('estado', sql.NVarChar, c.estado || null)
        .query(`INSERT INTO org_clients (id,organization_id,nome,telefone,email,data_nascimento,cidade,estado)
                VALUES (@id,@org,@nome,@tel,@email,@nasc,@cidade,@estado)`)
    }
    statsClientes[org.slug] = clienteIds[orgId].length

    // ── Serviços ─────────────────────────────────────────────────────────
    for (const s of (servicosPorOrg[orgId] || [])) {
      const sid = uid()
      servicoIds[orgId].push({ id: sid, nome: s.nome, preco: s.preco })
      await pool.request()
        .input('id',   sql.UniqueIdentifier, sid)
        .input('org',  sql.UniqueIdentifier, orgId)
        .input('nome', sql.NVarChar, s.nome)
        .input('preco', sql.Decimal(10,2), s.preco)
        .input('cat',  sql.NVarChar, s.categoria || null)
        .input('tempo', sql.NVarChar, s.tempo_estimado || null)
        .input('nivel', sql.NVarChar, s.nivel_dificuldade || null)
        .query(`INSERT INTO org_services (id,organization_id,nome,preco,categoria,tempo_estimado,nivel_dificuldade)
                VALUES (@id,@org,@nome,@preco,@cat,@tempo,@nivel)`)
    }

    // ── Categorias financeiras ───────────────────────────────────────────
    const catRecId = uid(), catDespId = uid(), catServId = uid()
    categIds[orgId] = { receita: catRecId, despesa: catDespId, servico: catServId }
    for (const cat of [
      { id: catRecId,  nome: 'Receita de Serviços', tipo: 'receita', cor: '#22c55e' },
      { id: catDespId, nome: 'Despesas Operacionais', tipo: 'despesa', cor: '#ef4444' },
      { id: catServId, nome: 'Material e Insumos', tipo: 'despesa', cor: '#f97316' },
    ]) {
      await pool.request()
        .input('id',   sql.UniqueIdentifier, cat.id)
        .input('org',  sql.UniqueIdentifier, orgId)
        .input('nome', sql.NVarChar, cat.nome)
        .input('tipo', sql.NVarChar, cat.tipo)
        .input('cor',  sql.NVarChar, cat.cor)
        .query(`INSERT INTO org_financial_categories (id,organization_id,nome,tipo,cor)
                VALUES (@id,@org,@nome,@tipo,@cor)`)
    }

    // ── Métodos de pagamento ─────────────────────────────────────────────
    const pmPix = uid(), pmDin = uid(), pmCred = uid(), pmDeb = uid()
    pmIds[orgId] = { pix: pmPix, dinheiro: pmDin, credito: pmCred, debito: pmDeb }
    for (const pm of [
      { id: pmPix,  nome: 'PIX',             tipo: 'pix' },
      { id: pmDin,  nome: 'Dinheiro',        tipo: 'dinheiro' },
      { id: pmCred, nome: 'Cartão Crédito',  tipo: 'cartao_credito' },
      { id: pmDeb,  nome: 'Cartão Débito',   tipo: 'cartao_debito' },
    ]) {
      await pool.request()
        .input('id',   sql.UniqueIdentifier, pm.id)
        .input('org',  sql.UniqueIdentifier, orgId)
        .input('nome', sql.NVarChar, pm.nome)
        .input('tipo', sql.NVarChar, pm.tipo)
        .query(`INSERT INTO org_payment_methods (id,organization_id,nome,tipo)
                VALUES (@id,@org,@nome,@tipo)`)
    }

    // ── Fornecedores ─────────────────────────────────────────────────────
    const fornList = fornecedoresPorOrg[orgId] || []
    for (const f of fornList) {
      await pool.request()
        .input('id',   sql.UniqueIdentifier, uid())
        .input('org',  sql.UniqueIdentifier, orgId)
        .input('nome', sql.NVarChar, f.nome)
        .input('tel',  sql.NVarChar, f.telefone || null)
        .input('email', sql.NVarChar, f.email || null)
        .input('cnpj', sql.NVarChar, f.cnpj || null)
        .query(`INSERT INTO org_suppliers (id,organization_id,nome,telefone,email,cnpj)
                VALUES (@id,@org,@nome,@tel,@email,@cnpj)`)
    }

    // ── Ordens de Serviço ─────────────────────────────────────────────────
    const clientes  = clienteIds[orgId]
    const servicos  = servicoIds[orgId]
    const numOrdens = org.plan === 'enterprise' ? 20 : 8
    const pmList    = [pmPix, pmDin, pmCred, pmDeb]
    const pmNomes   = ['PIX', 'Dinheiro', 'Cartão Crédito', 'Cartão Débito']
    const statuses  = ['concluido','concluido','concluido','em_andamento','em_andamento','pendente','pendente','cancelado']

    let ordensCount = 0
    for (let i = 0; i < numOrdens; i++) {
      const orderId   = uid()
      const cliente   = clientes[i % clientes.length]
      const servico   = servicos[i % servicos.length]
      const status    = statuses[i % statuses.length]
      const pmIdx     = i % 4
      const valor     = servico.preco * (1 + (i % 3) * 0.2)
      const valorArred= Math.round(valor * 100) / 100
      const entrada   = status === 'concluido' ? valorArred : Math.round(valorArred * 0.5 * 100) / 100
      const pago      = status === 'concluido' ? valorArred : entrada
      const stPag     = status === 'concluido' ? 'pago' : (entrada > 0 ? 'parcial' : 'pendente')
      const diasAberto= -(numOrdens - i) * 5
      const dataAbert = dt(diasAberto)
      const dataPrev  = dateStr(diasAberto + 7)
      const dataConc  = status === 'concluido' ? dt(diasAberto + 5) : null

      await pool.request()
        .input('id',     sql.UniqueIdentifier, orderId)
        .input('num',    sql.Int, i + 1)
        .input('org',    sql.UniqueIdentifier, orgId)
        .input('client', sql.UniqueIdentifier, cliente.id)
        .input('status', sql.NVarChar, status)
        .input('valor',  sql.Decimal(10,2), valorArred)
        .input('entrada', sql.Decimal(10,2), entrada)
        .input('pago',   sql.Decimal(10,2), pago)
        .input('stPag',  sql.NVarChar, stPag)
        .input('dataPrev', sql.Date, new Date(dataPrev))
        .input('dataConc', sql.DateTime2, dataConc)
        .input('formas', sql.NVarChar, pmNomes[pmIdx])
        .input('abertura', sql.DateTime2, dataAbert)
        .query(`INSERT INTO org_service_orders
                  (id,numero,organization_id,client_id,status,valor_total,valor_entrada,valor_pago,
                   status_pagamento,data_prevista,data_conclusao,forma_pagamento,data_abertura)
                VALUES (@id,@num,@org,@client,@status,@valor,@entrada,@pago,@stPag,@dataPrev,@dataConc,@formas,@abertura)`)

      // Item da ordem
      await pool.request()
        .input('id',     sql.UniqueIdentifier, uid())
        .input('order',  sql.UniqueIdentifier, orderId)
        .input('svcId',  sql.UniqueIdentifier, servico.id)
        .input('nome',   sql.NVarChar, servico.nome)
        .input('qty',    sql.Int, 1)
        .input('unit',   sql.Decimal(10,2), valorArred)
        .input('total',  sql.Decimal(10,2), valorArred)
        .query(`INSERT INTO org_service_order_items (id,order_id,service_id,service_nome,quantidade,valor_unitario,valor_total)
                VALUES (@id,@order,@svcId,@nome,@qty,@unit,@total)`)

      // Contas a receber para ordens concluídas
      if (status === 'concluido') {
        await pool.request()
          .input('id',     sql.UniqueIdentifier, uid())
          .input('org',    sql.UniqueIdentifier, orgId)
          .input('ordId',  sql.UniqueIdentifier, orderId)
          .input('cliId',  sql.UniqueIdentifier, cliente.id)
          .input('catId',  sql.UniqueIdentifier, catRecId)
          .input('pmId',   sql.UniqueIdentifier, pmList[pmIdx])
          .input('desc',   sql.NVarChar, `Pagamento OS #${i+1} - ${cliente.nome}`)
          .input('valor',  sql.Decimal(10,2), valorArred)
          .input('venc',   sql.Date, new Date(dataPrev))
          .input('receb',  sql.Date, dataConc)
          .input('status', sql.NVarChar, 'recebido')
          .query(`INSERT INTO org_receivables
                    (id,organization_id,service_order_id,client_id,category_id,payment_method_id,
                     descricao,valor,data_vencimento,data_recebimento,status)
                  VALUES (@id,@org,@ordId,@cliId,@catId,@pmId,@desc,@valor,@venc,@receb,@status)`)

        // Transação correspondente
        await pool.request()
          .input('id',    sql.UniqueIdentifier, uid())
          .input('org',   sql.UniqueIdentifier, orgId)
          .input('tipo',  sql.NVarChar, 'entrada')
          .input('desc',  sql.NVarChar, `Recebimento OS #${i+1} - ${cliente.nome}`)
          .input('valor', sql.Decimal(10,2), valorArred)
          .input('data',  sql.Date, dataConc)
          .input('cat',   sql.UniqueIdentifier, catRecId)
          .input('pm',    sql.UniqueIdentifier, pmList[pmIdx])
          .query(`INSERT INTO org_transactions (id,organization_id,tipo,descricao,valor,data_transacao,category_id,payment_method_id)
                  VALUES (@id,@org,@tipo,@desc,@valor,@data,@cat,@pm)`)
      }

      ordensCount++
    }
    statsOrdens[org.slug] = ordensCount

    // ── Contas a pagar (despesas operacionais) ──────────────────────────
    const despesas = [
      { desc: 'Aluguel do espaço',   valor: org.plan === 'enterprise' ? 1800.00 : 600.00,  offset: -30, status: 'pago' },
      { desc: 'Material e aviamentos', valor: 280.00, offset: -20, status: 'pago' },
      { desc: 'Energia elétrica',     valor: 180.00,  offset: -15, status: 'pago' },
      { desc: 'Aluguel do espaço',   valor: org.plan === 'enterprise' ? 1800.00 : 600.00,  offset: 0,   status: 'pendente' },
      { desc: 'Material e aviamentos', valor: 320.00, offset: 10,  status: 'pendente' },
    ]
    for (const d of despesas) {
      await pool.request()
        .input('id',    sql.UniqueIdentifier, uid())
        .input('org',   sql.UniqueIdentifier, orgId)
        .input('desc',  sql.NVarChar, d.desc)
        .input('valor', sql.Decimal(10,2), d.valor)
        .input('venc',  sql.Date, new Date(dateStr(d.offset)))
        .input('pag',   sql.Date, d.status === 'pago' ? new Date(dateStr(d.offset - 2)) : null)
        .input('status', sql.NVarChar, d.status)
        .query(`INSERT INTO org_payables (id,organization_id,descricao,valor,data_vencimento,data_pagamento,status)
                VALUES (@id,@org,@desc,@valor,@venc,@pag,@status)`)

      if (d.status === 'pago') {
        await pool.request()
          .input('id',   sql.UniqueIdentifier, uid())
          .input('org',  sql.UniqueIdentifier, orgId)
          .input('tipo', sql.NVarChar, 'saida')
          .input('desc', sql.NVarChar, d.desc)
          .input('valor', sql.Decimal(10,2), d.valor)
          .input('data', sql.Date, new Date(dateStr(d.offset - 2)))
          .input('cat',  sql.UniqueIdentifier, catDespId)
          .query(`INSERT INTO org_transactions (id,organization_id,tipo,descricao,valor,data_transacao,category_id)
                  VALUES (@id,@org,@tipo,@desc,@valor,@data,@cat)`)
      }
    }

    // ── Caixa ────────────────────────────────────────────────────────────
    const caixaId = uid(), sessaoId = uid()
    const ownerUser = usersData.find(u => u.org === orgId && u.is_owner === 1)

    await pool.request()
      .input('id',   sql.UniqueIdentifier, caixaId)
      .input('org',  sql.UniqueIdentifier, orgId)
      .input('nome', sql.NVarChar, 'Caixa Principal')
      .query(`INSERT INTO org_cashiers (id,organization_id,nome,descricao)
              VALUES (@id,@org,@nome,'Caixa principal do atelier')`)

    await pool.request()
      .input('id',     sql.UniqueIdentifier, sessaoId)
      .input('org',    sql.UniqueIdentifier, orgId)
      .input('caixa',  sql.UniqueIdentifier, caixaId)
      .input('userId', sql.UniqueIdentifier, ownerUser.id)
      .input('saldo',  sql.Decimal(10,2), 500.00)
      .query(`INSERT INTO org_cashier_sessions (id,organization_id,caixa_id,usuario_abertura_id,saldo_inicial,status)
              VALUES (@id,@org,@caixa,@userId,@saldo,'aberto')`)

    // ── Customização ─────────────────────────────────────────────────────
    const cores = {
      [ORG.maria]:    { primary: '#ec4899', secondary: '#8b5cf6' },
      [ORG.costura]:  { primary: '#3b82f6', secondary: '#06b6d4' },
      [ORG.elegance]: { primary: '#7c3aed', secondary: '#c026d3' },
      [ORG.premium]:  { primary: '#b45309', secondary: '#d97706' },
      [ORG.bella]:    { primary: '#059669', secondary: '#0d9488' },
    }
    const cor = cores[orgId] || { primary: '#3b82f6', secondary: '#10b981' }
    await pool.request()
      .input('id',      sql.UniqueIdentifier, uid())
      .input('org',     sql.UniqueIdentifier, orgId)
      .input('primary', sql.NVarChar, cor.primary)
      .input('second',  sql.NVarChar, cor.secondary)
      .input('name',    sql.NVarChar, org.name)
      .query(`INSERT INTO customization_settings (id,organization_id,primary_color,secondary_color,atelier_name)
              VALUES (@id,@org,@primary,@second,@name)`)

    // ── usage_metrics ────────────────────────────────────────────────────
    await pool.request()
      .input('id',      sql.UniqueIdentifier, uid())
      .input('org',     sql.UniqueIdentifier, orgId)
      .input('clients', sql.Int, clienteIds[orgId].length)
      .input('orders',  sql.Int, ordensCount)
      .input('users',   sql.Int, usersData.filter(u => u.org === orgId).length)
      .query(`INSERT INTO usage_metrics (id,organization_id,clients_count,orders_count,users_count)
              VALUES (@id,@org,@clients,@orders,@users)`)

    console.log(`   ✓ ${org.name} [${org.plan}] — ${clienteIds[orgId].length} clientes, ${ordensCount} ordens`)
  }

  await pool.close()

  console.log('\n' + '─'.repeat(60))
  console.log('🎉 Seed concluído!\n')
  console.log('📊 Resumo:')
  console.log(`   • ${organizations.length} organizações (2 free, 3 enterprise)`)
  console.log(`   • ${usersData.length} usuários`)
  console.log(`   • ${Object.values(statsClientes).reduce((a,b) => a+b, 0)} clientes`)
  console.log(`   • ${Object.values(statsOrdens).reduce((a,b) => a+b, 0)} ordens de serviço`)
  console.log('\n🔑 Credenciais de acesso (senha padrão: Senha@123):')
  for (const u of usersData) {
    const org = organizations.find(o => o.id === u.org)
    console.log(`   ${u.email.padEnd(48)} [${org.plan.padEnd(10)}] ${u.role}`)
  }
  console.log()
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
