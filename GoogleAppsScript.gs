
/**
 * DOCE CONTROLE - BACKEND RESILIENTE v2.7
 * Foco: Sincronia Multi-usuário e Consistência de Dados
 */

const NOME_PLANILHA_CLIENTES = "Clientes";
const NOME_PLANILHA_DADOS = "SaaS_Data";

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  if (ui) {
    ui.createMenu('🧁 Doce Controle')
      .addItem('🚀 Restaurar Estrutura (Consertar App)', 'initSheet')
      .addToUi();
  }
}

function getSs() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function initSheet() {
  const ss = getSs();
  
  // Aba Clientes: ID | Nome | Empresa | Email | Senha | Role | Plano | Data | Login | Tentativas | CompanyID_Vinculo
  let sheetClientes = ss.getSheetByName(NOME_PLANILHA_CLIENTES) || ss.insertSheet(NOME_PLANILHA_CLIENTES);
  const cabecalhosClientes = ["ID", "Nome", "Empresa", "Email", "Senha", "Status/Role", "Plano", "Data", "Login", "Tentativas", "CompanyID_Vinculo"];
  sheetClientes.getRange(1, 1, 1, cabecalhosClientes.length).setValues([cabecalhosClientes])
    .setBackground("#EC4899").setFontColor("#FFFFFF").setFontWeight("bold");
  sheetClientes.setFrozenRows(1);

  // Aba Dados: CompanyID | AppStateJSON | UltimaSincronizacao
  let sheetDados = ss.getSheetByName(NOME_PLANILHA_DADOS) || ss.insertSheet(NOME_PLANILHA_DADOS);
  const cabecalhosDados = ["CompanyID", "AppStateJSON", "UltimaSincronizacao"];
  sheetDados.getRange(1, 1, 1, cabecalhosDados.length).setValues([cabecalhosDados])
    .setBackground("#3B82F6").setFontColor("#FFFFFF").setFontWeight("bold");
  sheetDados.setFrozenRows(1);

  return "Estrutura restaurada com sucesso!";
}

function doPost(e) {
  try {
    const contents = e.postData.contents;
    if (!contents) return createJsonResponse({ success: false, message: "Sem dados." });
    const request = JSON.parse(contents);
    const action = (request.action || "").toLowerCase().trim();

    if (action === 'login') return handleLogin(request.email, request.password);
    if (action === 'register') return handleRegister(request.name, request.company, request.email, request.password);
    if (action === 'sync') return handleSync(request.companyId, request.state);
    if (action === 'create_collaborator') return handleCreateCollaborator(request);
    
    return createJsonResponse({ success: false, message: "Ação inválida." });
  } catch (err) {
    return createJsonResponse({ success: false, message: err.message });
  }
}

function doGet(e) {
  try {
    const action = (e.parameter.action || "").toLowerCase().trim();
    const companyId = e.parameter.companyId;

    if (action === 'test') return createJsonResponse({ success: true, message: "Conectado!" });

    if (action === 'sync' && companyId) {
      const sheet = getSs().getSheetByName(NOME_PLANILHA_DADOS);
      if (!sheet) return createJsonResponse({ success: true, state: null });
      
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString() === companyId.toString()) {
          return createJsonResponse({ success: true, state: data[i][1] });
        }
      }
      return createJsonResponse({ success: true, state: null });
    }
  } catch (err) {
    return createJsonResponse({ success: false, message: err.message });
  }
}

function handleLogin(email, senha) {
  const sheet = getSs().getSheetByName(NOME_PLANILHA_CLIENTES);
  const data = sheet.getDataRange().getValues();
  const emailSearch = email.toLowerCase().trim();
  const passSearch = senha.toString().trim();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3].toString().toLowerCase() === emailSearch && data[i][4].toString() === passSearch) {
      const id = data[i][0].toString();
      // O Vínculo está na coluna 11 (index 10)
      const vinculo = data[i][10] ? data[i][10].toString() : id;
      const companyId = (vinculo === "PROPRIO" || !vinculo) ? id : vinculo;
      
      return createJsonResponse({
        success: true,
        userId: id,
        name: data[i][1],
        companyId: companyId, 
        email: data[i][3],
        role: data[i][5] || "Dono"
      });
    }
  }
  return createJsonResponse({ success: false, message: "Credenciais inválidas." });
}

function handleSync(companyId, stateJson) {
  const sheet = getSs().getSheetByName(NOME_PLANILHA_DADOS);
  const data = sheet.getDataRange().getValues();
  let row = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === companyId.toString()) {
      row = i + 1;
      break;
    }
  }
  if (row !== -1) {
    sheet.getRange(row, 2).setValue(stateJson);
    sheet.getRange(row, 3).setValue(new Date());
  } else {
    sheet.appendRow([companyId, stateJson, new Date()]);
  }
  return createJsonResponse({ success: true });
}

function handleRegister(name, company, email, password) {
  const sheet = getSs().getSheetByName(NOME_PLANILHA_CLIENTES);
  const id = "DC-" + Math.floor(1000 + Math.random() * 8999);
  sheet.appendRow([id, name, company, email.toLowerCase(), password, "Dono", "Free", new Date(), "-", 0, "PROPRIO"]);
  return createJsonResponse({ success: true, userId: id, companyId: id, email: email, name: name, role: "Dono" });
}

function handleCreateCollaborator(req) {
  const sheet = getSs().getSheetByName(NOME_PLANILHA_CLIENTES);
  const id = "COLAB-" + Math.floor(1000 + Math.random() * 8999);
  sheet.appendRow([id, req.name, "Filial", req.email.toLowerCase(), req.password, req.role, "Vendedor", new Date(), "-", 0, req.companyId]);
  return createJsonResponse({ success: true });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
