const nodemailer = require('nodemailer');

function escaparHtml(valor) {
  return String(valor == null ? '' : valor).replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caracter]);
}

async function enviarRespuestaPQRS({ destinatario, nombre, radicado, contenido }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  const faltantes = [];
  if (!SMTP_HOST) faltantes.push('SMTP_HOST');
  if (!SMTP_PORT) faltantes.push('SMTP_PORT');
  if (!SMTP_USER) faltantes.push('SMTP_USER');
  if (!SMTP_PASS) faltantes.push('SMTP_PASS');
  if (!SMTP_FROM) faltantes.push('SMTP_FROM');

  if (faltantes.length) {
    throw new Error('Falta configurar el correo institucional en .env: ' + faltantes.join(', '));
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const texto = String(contenido || '');
  const html = escaparHtml(texto).replace(/\n/g, '<br>');

  return transporter.sendMail({
    from: SMTP_FROM,
    to: destinatario,
    subject: 'Respuesta a su PQRS - ' + radicado + ' | AIREC Grupo Médico',
    text: texto,
    html: `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f3f6fa;font-family:Arial,sans-serif;color:#34475e">
  <main style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #e5ebf2;border-radius:12px;overflow:hidden">
    <header style="padding:24px 28px;background:#244b78;color:#fff">
      <div style="font-size:12px;letter-spacing:2px;font-weight:bold">AIREC GRUPO MÉDICO</div>
      <h1 style="margin:12px 0 0;font-size:20px">Respuesta a su PQRS</h1>
    </header>
    <section style="padding:26px 28px;line-height:1.65">
      <p>Señor(a) <strong>${escaparHtml(nombre)}</strong>:</p>
      <p>Reciba un cordial saludo. Adjuntamos en el cuerpo de este mensaje la respuesta correspondiente a su solicitud.</p>
      <p style="padding:10px 14px;background:#f3f6fa;border-left:3px solid #7895b4"><strong>Radicado:</strong> ${escaparHtml(radicado)}</p>
      <div style="white-space:normal;line-height:1.7">${html}</div>
      <p style="margin-top:28px">Atentamente,<br><strong>AIREC Grupo Médico</strong></p>
    </section>
    <footer style="padding:14px 28px;background:#f7f9fc;color:#8793a2;font-size:11px">Mensaje enviado desde el sistema de gestión de PQRS de AIREC. Por favor conserve el número de radicado para futuras consultas.</footer>
  </main>
</body>
</html>`
  });
}

module.exports = { enviarRespuestaPQRS };
