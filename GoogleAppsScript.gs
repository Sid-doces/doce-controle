
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("ERRO CRÍTICO: Planilha não encontrada.");
  }
  return ss;
}

function initSheet() {
  const ss = getSs();
  
  let sheetClientes = ss.getSheetByName(NOME_PLANILHA_CLIENTES) || ss.insertSheet(NOME_PLANILHA_CLIENTES);
  const cabecalhosClientes = ["ID", "Nome", "Empresa", "Email", "Senha", "Status", "Plano", "Data", "Login", "Tentativas", "Obs"];
  sheetClientes.getRange(1, 1, 1, cabecalhosClientes.length).setValues([cabecalhosClientes])
    .setBackground("#EC4899").setFontColor("#FFFFFF").setFontWeight("bold");
  sheetClientes.setFrozenRows(1);

  let sheetDados = ss.getSheetByName(NOME_PLANILHA_DADOS) || ss.insertSheet(NOME_PLANILHA_DADOS);
  const cabecalhosDados = ["CompanyID", "AppStateJSON", "UltimaSincronizacao"];
  sheetDados.getRange(1, 1, 1, cabecalhosDados.length).setValues([cabecalhosDados])
    .setBackground("#3B82F6").setFontColor("#FFFFFF").setFontWeight("bold");
  sheetDados.setFrozenRows(1);

  if (sheetClientes.getLastRow() === 1) {
    sheetClientes.appendRow(["DC-ADMIN", "Admin", "Doceria", "admin@teste.com", "123456", "Ativa", "Pro", new Date(), "-", 0, "Mestre"]);
  }
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    if (request.action === 'login') return handleLogin(request.email, request.password);
    if (request.action === 'register') return handleRegister(request.name, request.company, request.email, request.password);
    if (request.action === 'sync') return handleSync(request.companyId, request.state);
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
  const data = sheet.getDataRange().getValues();
  const emailLower = email.toLowerCase().trim();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3].toString().toLowerCase().trim() === emailLower) {
      if (data[i][4].toString().trim() === senha.trim()) {
        return createJsonResponse({
          success: true,
          userId: data[i][0],
          name: data[i][1],
          companyId: data[i][0],
          email: data[i][3],
          role: "Dono"
        });
      }
    }
  }
  return createJsonResponse({ success: false, message: "E-mail ou senha incorretos." });
}

function handleRegister(name, company, email, password) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_CLIENTES);
  const data = sheet.getDataRange().getValues();
  const emailLower = email.toLowerCase().trim();

  // Verificar se já existe
  for (let i = 1; i < data.length; i++) {
    if (data[i][3].toString().toLowerCase().trim() === emailLower) {
      return createJsonResponse({ success: false, message: "E-mail já cadastrado." });
    }
  }

  // Criar Novo
  const newId = "DC-" + Math.floor(1000 + Math.random() * 9000);
  sheet.appendRow([
    newId, name, company, emailLower, password, "Ativa", "Teste", new Date(), "-", 0, "Cadastro Web"
  ]);

  return createJsonResponse({
    success: true,
    userId: newId,
    name: name,
    companyId: newId,
    email: emailLower,
    role: "Dono"
  });
}

function handleSync(companyId, stateJson) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_DADOS);
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
