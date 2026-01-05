
/**
 * DOCE CONTROLE - BACKEND OFICIAL
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
  
  let sheetClientes = ss.getSheetByName(NOME_PLANILHA_CLIENTES) || ss.insertSheet(NOME_PLANILHA_CLIENTES);
  const cabecalhosClientes = ["ID", "Nome", "Empresa", "Email", "Senha", "Status", "Plano", "Data", "Login", "Tentativas", "Obs"];
  if (sheetClientes.getLastRow() === 0) {
    sheetClientes.getRange(1, 1, 1, cabecalhosClientes.length).setValues([cabecalhosClientes])
      .setBackground("#EC4899").setFontColor("#FFFFFF").setFontWeight("bold");
    sheetClientes.setFrozenRows(1);
  }

  let sheetDados = ss.getSheetByName(NOME_PLANILHA_DADOS) || ss.insertSheet(NOME_PLANILHA_DADOS);
  const cabecalhosDados = ["CompanyID", "AppStateJSON", "UltimaSincronizacao"];
  if (sheetDados.getLastRow() === 0) {
    sheetDados.getRange(1, 1, 1, cabecalhosDados.length).setValues([cabecalhosDados])
      .setBackground("#3B82F6").setFontColor("#FFFFFF").setFontWeight("bold");
    sheetDados.setFrozenRows(1);
  }

  return "Tabelas Inicializadas!";
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;

    if (action === 'login') return handleLogin(request.email, request.password);
    if (action === 'register') return handleRegister(request.name, request.company, request.email, request.password);
    if (action === 'sync') return handleSync(request.companyId, request.state);
    if (action === 'create_collaborator') return handleCreateCollaborator(request);
    
    return createJsonResponse({ success: false, message: "Ação inválida." });
  } catch (err) {
    return createJsonResponse({ success: false, message: "Erro: " + err.message });
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
  return createJsonResponse({ success: false });
}

function handleLogin(email, senha) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_CLIENTES);
  if (!sheet) return createJsonResponse({ success: false, message: "Banco não iniciado." });
  
  const data = sheet.getDataRange().getValues();
  const emailLower = email.toLowerCase().trim();
  const senhaClean = senha.toString().trim();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3].toString().toLowerCase().trim() === emailLower) {
      if (data[i][4].toString().trim() === senhaClean) {
        return createJsonResponse({
          success: true,
          userId: data[i][0],
          name: data[i][1],
          companyId: data[i][0].toString().split('-')[0] === 'COLAB' ? data[i][10] : data[i][0], // Se for colab, usa a empresa do mestre
          email: data[i][3],
          role: data[i][6] === 'Plano' ? 'Dono' : data[i][10].includes("Membro") ? data[i][5] : "Dono" // Ajuste de role simples
        });
      }
    }
  }
  return createJsonResponse({ success: false, message: "Acesso negado." });
}

function handleRegister(name, company, email, password) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_CLIENTES);
  const emailLower = email.toLowerCase().trim();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][3].toString().toLowerCase().trim() === emailLower) return createJsonResponse({ success: false, message: "E-mail já existe." });
  }

  const newId = "DC-" + Math.floor(1000 + Math.random() * 8999);
  sheet.appendRow([newId, name, company, emailLower, password, "Ativa", "Teste", new Date(), "-", 0, "Dono"]);
  return createJsonResponse({ success: true, userId: newId, companyId: newId, email: emailLower, name: name });
}

function handleCreateCollaborator(req) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_CLIENTES);
  const emailLower = req.email.toLowerCase().trim();
  
  const newId = "COLAB-" + Math.floor(1000 + Math.random() * 8999);
  sheet.appendRow([
    newId, 
    req.name || "Membro", 
    "Equipe " + req.companyId, 
    emailLower, 
    req.password, 
    req.role, 
    "Colaborador", 
    new Date(), 
    "-", 
    0, 
    req.companyId // Armazena o ID da empresa vinculada
  ]);
  
  return createJsonResponse({ success: true });
}

function handleSync(companyId, stateJson) {
  const ss = getSs();
  let sheet = ss.getSheetByName(NOME_PLANILHA_DADOS);
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
