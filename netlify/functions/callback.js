const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  const base = `${process.env.SITE_URL}/.netlify/functions/callback`;
  const signed = event.rawQuery ? `${base}?${event.rawQuery}` : base;
  const firma = event.headers["x-paygate-signature"] || "";

  let ok = false;
  try {
    const pem = fs.readFileSync(path.join(__dirname, "paygate_callback_public.pem"), "utf8");
    ok = crypto.createVerify("RSA-SHA256").update(signed).end().verify(pem, firma, "base64");
  } catch (e) {
    console.error("Error verificando firma:", e.message);
  }
  if (!ok) return { statusCode: 403, body: "firma inválida" };

  const q = event.queryStringParameters || {};
  console.log("PAGO CONFIRMADO", JSON.stringify({
    pedido: q.order,
    pagado_usdc: q.value_coin,
    recibido: q.value_forwarded_coin,
    tx: q.txid_in
  }));
  return { statusCode: 200, body: "ok" };
};
