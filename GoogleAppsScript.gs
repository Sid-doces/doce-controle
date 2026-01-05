
/**
 * DOCE CONTROLE - BACKEND OFICIAL v2.0
 * Gerencia Logins, Cadastros e Sincronização de Dados
 */

const NOME_PLANILHA_CLIENTES = "Clientes";
const NOME_PLANILHA_DADOS = "SaaS_Data";

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  if (ui) {
    ui.createMenu('🧁 Doce Controle')
      .addItem('🚀 Inicializar Tabelas', 'initSheet')
      .addToUi();
  }
}

function getSs() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function initSheet() {
  const ss = getSs();
  
  // Aba de Usuários/Logins
  let sheetClientes = ss.getSheetByName(NOME_PLANILHA_CLIENTES) || ss.insertSheet(NOME_PLANILHA_CLIENTES);
  const cabecalhosClientes = ["ID", "Nome", "Empresa", "Email", "Senha", "Status/Role", "Plano", "Data", "Login", "Tentativas", "CompanyID_Vinculo"];
  if (sheetClientes.getLastRow() === 0) {
    sheetClientes.getRange(1, 1, 1, cabecalhosClientes.length).setValues([cabecalhosClientes])
      .setBackground("#EC4899").setFontColor("#FFFFFF").setFontWeight("bold");
    sheetClientes.setFrozenRows(1);
  }

  // Aba de Dados do App (JSON)
  let sheetDados = ss.getSheetByName(NOME_PLANILHA_DADOS) || ss.insertSheet(NOME_PLANILHA_DADOS);
  const cabecalhosDados = ["CompanyID", "AppStateJSON", "UltimaSincronizacao"];
  if (sheetDados.getLastRow() === 0) {
    sheetDados.getRange(1, 1, 1, cabecalhosDados.length).setValues([cabecalhosDados])
      .setBackground("#3B82F6").setFontColor("#FFFFFF").setFontWeight("bold");
    sheetDados.setFrozenRows(1);
  }

  return "Tabelas Inicializadas com Sucesso!";
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;

    if (action === 'login') return handleLogin(request.email, request.password);
    if (action === 'register') return handleRegister(request.name, request.company, request.email, request.password);
    if (action === 'sync') return handleSync(request.companyId, request.state);
    if (action === 'create_collaborator') return handleCreateCollaborator(request);
    
    return createJsonResponse({ success: false, message: "Ação desconhecida." });
  } catch (err) {
    return createJsonResponse({ success: false, message: "Erro Servidor: " + err.message });
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const companyId = e.parameter.companyId;

  if (action === 'sync' && companyId) {
    const ss = getSs();
    const sheet = ss.getSheetByName(NOME_PLANILHA_DADOS);
    if (!sheet) return createJsonResponse({ success: true, state: null });
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === companyId) return createJsonResponse({ success: true, state: data[i][1] });
    }
    return createJsonResponse({ success: true, state: null });
  }
  return createJsonResponse({ success: false, message: "Parâmetros inválidos." });
}

function handleLogin(email, senha) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_CLIENTES);
  if (!sheet) return createJsonResponse({ success: false, message: "Banco de dados não encontrado." });
  
  const data = sheet.getDataRange().getValues();
  const emailLower = email.toLowerCase().trim();
  const senhaClean = senha.toString().trim();
  
  for (let i = 1; i < data.length; i++) {
    const rowEmail = data[i][3].toString().toLowerCase().trim();
    const rowSenha = data[i][4].toString().trim();
    
    if (rowEmail === emailLower && rowSenha === senhaClean) {
      const id = data[i][0].toString();
      const isColab = id.startsWith('COLAB-');
      
      return createJsonResponse({
        success: true,
        userId: id,
        name: data[i][1],
        // Se for colaborador, o CompanyID real está na coluna 11 (index 10)
        companyId: isColab ? data[i][10] : id, 
        email: data[i][3],
        // Se for colaborador, a função/role está na coluna 6 (index 5)
        role: isColab ? data[i][5] : "Dono"
      });
    }
  }
  return createJsonResponse({ success: false, message: "E-mail ou senha incorretos." });
}

function handleRegister(name, company, email, password) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_CLIENTES);
  const emailLower = email.toLowerCase().trim();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][3].toString().toLowerCase().trim() === emailLower) return createJsonResponse({ success: false, message: "E-mail já cadastrado." });
  }

  const newId = "DC-" + Math.floor(1000 + Math.random() * 8999);
  // Coluna 11 para Donos salvamos "PROPRIO"
  sheet.appendRow([newId, name, company, emailLower, password, "Ativa", "Teste", new Date(), "-", 0, "PROPRIO"]);
  return createJsonResponse({ success: true, userId: newId, companyId: newId, email: emailLower, name: name, role: "Dono" });
}

function handleCreateCollaborator(req) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_CLIENTES);
  const emailLower = req.email.toLowerCase().trim();
  
  // Verifica se o e-mail já existe
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3].toString().toLowerCase().trim() === emailLower) {
      return createJsonResponse({ success: false, message: "Este e-mail já está em uso por outra pessoa." });
    }
  }
  
  const newId = "COLAB-" + Math.floor(1000 + Math.random() * 8999);
  sheet.appendRow([
    newId, 
    req.name || "Membro Equipe", 
    "Equipe " + req.companyId, 
    emailLower, 
    req.password, 
    req.role, // Salva se é Vendedor, Auxiliar, etc na coluna Status/Role
    "Colaborador", 
    new Date(), 
    "-", 
    0, 
    req.companyId // Vínculo crucial com a empresa do Dono
  ]);
  
  return createJsonResponse({ success: true });
}

function handleSync(companyId, stateJson) {
  const ss = getSs();
  let sheet = ss.getSheetByName(NOME_PLANILHA_DADOS);
  if (!sheet) return createJsonResponse({ success: false, message: "Aba de dados não encontrada." });
  
  const data = sheet.getDataRange().getValues();
  let row = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === companyId) { row = i + 1; break; }
  }
  
  if (row !== -1) {
    sheet.getRange(row, 2).setValue(stateJson);
    sheet.getRange(row, 3).setValue(new Date());
  } else {
    sheet.appendRow([companyId, stateJson, new Date()]);
  }
  return createJsonResponse({ success: true });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
