export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' });
  }

  try {
    const sheetUrl =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vS4UGIamTj88f6vFgRg8ULT_1PA1FZZOUCEu1OJfsZbd8n20Z3zxcVNi2ZgOp--GeCc6_zFmy2QRZV3/pub?output=csv';

    const response = await fetch(sheetUrl);
    const text = await response.text();

    const rows = text
      .trim()
      .split('\n')
      .map(r => r.split(','));

    const headers = rows[0];

    const users = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = row[i]?.trim();
      });
      return obj;
    });

    const user = users.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    return res.status(200).json({
      userId: user.userId,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro no login' });
  }
}
