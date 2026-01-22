
/**
 * DOCE CONTROLE - BACKEND RESILIENTE v2.6
 * Gerenciamento de Sincronização e Acessos
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
  
  // Aba Clientes
  let sheetClientes = ss.getSheetByName(NOME_PLANILHA_CLIENTES) || ss.insertSheet(NOME_PLANILHA_CLIENTES);
  const cabecalhosClientes = ["ID", "Nome", "Empresa", "Email", "Senha", "Status/Role", "Plano", "Data", "Login", "Tentativas", "CompanyID_Vinculo"];
  sheetClientes.getRange(1, 1, 1, cabecalhosClientes.length).setValues([cabecalhosClientes])
    .setBackground("#EC4899").setFontColor("#FFFFFF").setFontWeight("bold");
  sheetClientes.setFrozenRows(1);

  // Aba Dados
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
    if (!contents) return createJsonResponse({ success: false, message: "Corpo da requisição vazio." });
    
    const request = JSON.parse(contents);
    const action = (request.action || "").toLowerCase().trim();

    if (action === 'login') return handleLogin(request.email, request.password);
    if (action === 'register') return handleRegister(request.name, request.company, request.email, request.password);
    if (action === 'sync') return handleSync(request.companyId, request.state);
    if (action === 'create_collaborator') return handleCreateCollaborator(request);
    
    return createJsonResponse({ success: false, message: "Ação POST não reconhecida: " + action });
  } catch (err) {
    return createJsonResponse({ success: false, message: "Erro crítico no servidor: " + err.message });
  }
}

function doGet(e) {
  try {
    const action = (e.parameter.action || "").toLowerCase().trim();
    const companyId = e.parameter.companyId;

    // Ação de teste de conexão
    if (action === 'test') {
      return createJsonResponse({ success: true, message: "Conexão com a nuvem estabelecida!", timestamp: new Date() });
    }

    if (action === 'sync' && companyId) {
      const ss = getSs();
      const sheet = ss.getSheetByName(NOME_PLANILHA_DADOS);
      if (!sheet) return createJsonResponse({ success: true, state: null });
      
      const data = sheet.getDataRange().getValues();
      const searchId = companyId.toString().trim();

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().trim() === searchId) {
          return createJsonResponse({ success: true, state: data[i][1] });
        }
      }
      return createJsonResponse({ success: true, state: null, message: "Nenhum dado prévio encontrado para este ID." });
    }
  } catch (err) {
    return createJsonResponse({ success: false, message: "Erro no GET: " + err.message });
  }
  return createJsonResponse({ success: false, message: "Parâmetros de consulta inválidos." });
}

function handleLogin(email, senha) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_CLIENTES);
  if (!sheet) return createJsonResponse({ success: false, message: "Planilha 'Clientes' não encontrada. Execute 'Restaurar Estrutura'." });
  
  const data = sheet.getDataRange().getValues();
  const emailSearch = (email || "").toLowerCase().trim();
  const passSearch = (senha || "").toString().trim();
  
  for (let i = 1; i < data.length; i++) {
    const rowEmail = (data[i][3] || "").toString().toLowerCase().trim();
    const rowSenha = (data[i][4] || "").toString().trim();
    
    if (rowEmail === emailSearch && rowSenha === passSearch) {
      const id = data[i][0].toString();
      // Se for colaborador (vendedor), pega o ID do dono na coluna 11 (index 10)
      const companyId = id.startsWith('COLAB-') ? (data[i][10] || id) : id;
      
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
  return createJsonResponse({ success: false, message: "E-mail ou senha incorretos." });
}

function handleSync(companyId, stateJson) {
  if (!companyId) return createJsonResponse({ success: false, message: "ID da empresa não fornecido para sincronia." });
  
  const ss = getSs();
  let sheet = ss.getSheetByName(NOME_PLANILHA_DADOS);
  if (!sheet) {
    initSheet();
    sheet = ss.getSheetByName(NOME_PLANILHA_DADOS);
  }
  
  const data = sheet.getDataRange().getValues();
  const searchId = companyId.toString().trim();
  let row = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === searchId) {
      row = i + 1;
      break;
    }
  }
  
  if (row !== -1) {
    sheet.getRange(row, 2).setValue(stateJson);
    sheet.getRange(row, 3).setValue(new Date());
  } else {
    sheet.appendRow([searchId, stateJson, new Date()]);
  }
  return createJsonResponse({ success: true });
}

function handleRegister(name, company, email, password) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_CLIENTES);
  const emailLower = email.toLowerCase().trim();
  const newId = "DC-" + Math.floor(1000 + Math.random() * 8999);
  sheet.appendRow([newId, name, company, emailLower, password, "Dono", "Free", new Date(), "-", 0, "PROPRIO"]);
  return createJsonResponse({ success: true, userId: newId, companyId: newId, email: emailLower, name: name, role: "Dono" });
}

function handleCreateCollaborator(req) {
  const ss = getSs();
  const sheet = ss.getSheetByName(NOME_PLANILHA_CLIENTES);
  const newId = "COLAB-" + Math.floor(1000 + Math.random() * 8999);
  sheet.appendRow([newId, req.name, "Equipe " + req.companyId, req.email.toLowerCase(), req.password, req.role, "Colab", new Date(), "-", 0, req.companyId]);
  return createJsonResponse({ success: true });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
