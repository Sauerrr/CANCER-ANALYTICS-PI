// ════════════════════════════════════════════════════════════
//  config.js — Configurações globais e HuggingFace
//  Carregado PRIMEIRO. Todos os outros arquivos dependem deste.
// ════════════════════════════════════════════════════════════

var HF_CONFIG = {
  // ┌─────────────────────────────────────────────────────────┐
  // │  PASSO 1 — Cole o ID do seu modelo aqui                 │
  // │  Formato: "seu-usuario/nome-do-modelo"                  │
  // │  Exemplo: "canceranalytics/leukemia-resnet50"           │
  // └─────────────────────────────────────────────────────────┘
  MODEL_ID: 'SEU_USUARIO/SEU_MODELO',

  // ┌─────────────────────────────────────────────────────────┐
  // │  PASSO 2 — Cole sua HF API Key aqui                     │
  // │  Obtenha em: huggingface.co/settings/tokens             │
  // │  Deixe vazio '' para modelos públicos sem autenticação  │
  // └─────────────────────────────────────────────────────────┘
  API_KEY: '',

  // URL base da Inference API — não altere
  BASE_URL: 'https://api-inference.huggingface.co/models/',

  // ┌─────────────────────────────────────────────────────────┐
  // │  PASSO 3 — Mapeamento dos labels do modelo              │
  // │  Ajuste com os labels exatos que seu modelo retorna.    │
  // │  Exemplos: "ALL", "AML", "hem", "normal"               │
  // └─────────────────────────────────────────────────────────┘
  LEUKEMIA_LABELS: ['ALL', 'AML', 'all', 'leukemia', 'positive'],
  NORMAL_LABELS:   ['hem', 'normal', 'HEM', 'healthy', 'negative'],

  // Limiar abaixo do qual o resultado é INCONCLUSIVO (0–1)
  INCONCLUSIVE_THRESHOLD: 0.70,

  // Nome exibido na UI e no PDF
  MODEL_DISPLAY_NAME: 'ResNet-50 — HuggingFace',

  // true  → chama a API real (preencha MODEL_ID e API_KEY antes)
  // false → usa simulação local (mock)
  USE_REAL_API: false
};

// ─── STATE GLOBAL ─────────────────────────────────────────────
// Compartilhado entre todos os módulos via variáveis globais.
// Quando migrar para ES Modules, transforme em exports.

var currentUser     = null;
var uploadedFile    = null;
var selectedPatient = null;
var lastResult      = null;
var gradcamMode     = 'overlay';
var gradcamData     = null;