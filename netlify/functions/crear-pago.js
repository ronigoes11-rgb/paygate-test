const crypto = require("crypto");

exports.handler = async (event) => {
  try {
    const { amount, email } = JSON.parse(event.body || "{}");
    const monto = Number(amount);
    if (!monto || monto < 2 || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Monto o email inválido" }) };
    }

    const order = crypto.randomUUID();
    const callback = `${process.env.SITE_URL}/.netlify/functions/callback?order=${order}`;

    const r = await fetch(
      `https://api.paygate.to/control/wallet.php?address=${process.env.WALLET_USDC}&callback=${encodeURIComponent(callback)}`
    );
    const data = await r.json();
    if (!data.address_in) {
      return { statusCode: 502, body: JSON.stringify({ error: "PayGate no devolvió address_in", data }) };
    }

    const url =
      `https://checkout.paygate.to/pay.php?address=${data.address_in}` +
      `&amount=${monto.toFixed(2)}&email=${encodeURIComponent(email)}&currency=USD`;

    console.log("PEDIDO CREADO", order, monto, email, "ipn_token:", data.ipn_token);
    return { statusCode: 200, body: JSON.stringify({ url, order }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
