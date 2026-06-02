// ============================================================
//  config.js - Configuracoes globais da aplicacao
//  Primeiro arquivo carregado. Todos os modulos dependem deste.
//  Altere apenas este arquivo para trocar de ambiente ou modelo.
// ============================================================

var HF_CONFIG = {
    // URL base da API DALI hospedada no HuggingFace Space.
    // Nao inclui trailing slash.
    BASE_URL: 'https://wandraski-dali-space.hf.space',

    // Nome do modelo exibido na interface e no relatorio PDF.
    MODEL_DISPLAY_NAME: 'DALI - Consenso de 5 Modelos',

    // Limiar abaixo do qual o resultado e tratado como INCONCLUSIVO.
    // Baseado no campo confidence_level retornado pela API DALI.
    // A API ja classifica: "alta", "moderada", "baixa".
    // O front usa esse campo diretamente; este threshold e reserva local.
    INCONCLUSIVE_THRESHOLD: 0.70,

    // true  : chama a API DALI real (BASE_URL deve estar acessivel)
    // false : usa simulacao local sem chamada de rede
    USE_REAL_API: false
};

// ============================================================
//  Estado global da aplicacao
//  Compartilhado entre todos os modulos via escopo global.
//  Quando migrar para ES Modules, converter em exports nomeados.
// ============================================================

var currentUser     = null;  // usuario autenticado
var uploadedFile    = null;  // arquivo de imagem selecionado
var selectedPatient = null;  // paciente em visualizacao
var lastResult      = null;  // ultimo resultado normalizado para o PDF
var gradcamData     = null;  // dados do GradCAM para renderizacao
var gradcamMode     = 'overlay'; // modo ativo: original | heatmap | overlay