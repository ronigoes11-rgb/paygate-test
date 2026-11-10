const crypto = require("crypto");

exports.handler = async (event) => {
  try {
    const { amount, email } = JSON.parse(event.body || "{}");
    const monto = Number(amount);
    if (!monto || monto < 2 || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Monto o email inválido" }) };
    }

    const api = (process.env.PAYGATE_API || "https://api.paygate.to").trim().replace(/\/$/, "");
    const wallet = (process.env.WALLET_USDC || "").trim();
    const site = (process.env.SITE_URL || "").trim().replace(/\/$/, "");

    const order = crypto.randomUUID();
    const callback = `${site}/.netlify/functions/callback?order=${order}`;

    const walletUrl =
      `${api}/control/wallet.php?address=${encodeURIComponent(wallet)}&callback=${encodeURIComponent(callback)}`;

    const r = await fetch(walletUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NetlifyFunction/1.0)",
        "Accept": "application/json"
      }
    });
    const texto = await r.text();

    let data;
    try {
      data = JSON.parse(texto);
    } catch (e) {
      console.error("PayGate respondió algo que no es JSON:", r.status, texto.slice(0, 300));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: `PayGate respondió (${r.status}): ${texto.slice(0, 150)}` })
      };
    }

    if (!data.address_in) {
      return { statusCode: 502, body: JSON.stringify({ error: "PayGate no devolvió address_in: " + JSON.stringify(data).slice(0, 200) }) };
    }

    const url =
      `https://checkout.paygate.to/pay.php?address=${data.address_in}` +
      `&amount=${monto.toFixed(2)}&email=${encodeURIComponent(email)}&currency=USD`;

    console.log("PEDIDO CREADO", order, monto, email, "ipn_token:", data.ipn_token);
    return { statusCode: 200, body: JSON.stringify({ url, order }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
