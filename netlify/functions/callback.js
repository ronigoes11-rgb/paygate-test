exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  console.log("PAGO CONFIRMADO", JSON.stringify({
    pedido: q.order,
    pagado_usdc: q.value_coin,
    recibido_en_tu_billetera: q.value_forwarded_coin,
    tx: q.txid_out
  }));
  return { statusCode: 200, body: "ok" };
};
