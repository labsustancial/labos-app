import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Falta RESEND_API_KEY en variables de entorno");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const {
      nombre,
      apellido,
      email,
      eventoTitulo,
      eventoFecha,
      eventoHora,
      eventoCalle,
      eventoCiudad,
      eventoDepartamento,
      registroId,
    } = await req.json();

    if (!email) {
      return Response.json({ error: "Email requerido" }, { status: 400 });
    }

    const direccion = [eventoCalle, eventoCiudad, eventoDepartamento]
      .filter(Boolean).join(", ");

    // QR code via api.qrserver.com — gratis, sin auth
    const qrData = encodeURIComponent(`registro:${registroId}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}&color=333333&bgcolor=ffffff&margin=10`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu registro está confirmado</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">

        <!-- CUPÓN CONTENEDOR -->
        <table width="420" cellpadding="0" cellspacing="0" style="max-width:420px;width:100%;">

          <!-- HEADER DEL CUPÓN -->
          <tr>
            <td style="background:#1a1a1a;border-radius:16px 16px 0 0;padding:28px 32px 24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:#888;text-transform:uppercase;">Registro confirmado</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">${eventoTitulo}</h1>
            </td>
          </tr>

          <!-- LÍNEA DE CORTE -->
          <tr>
            <td style="background:#ffffff;position:relative;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="20" style="background:#f4f4f5;border-radius:0 10px 10px 0;"></td>
                  <td style="border-top:2px dashed #e0e0e0;padding:0;height:2px;"></td>
                  <td width="20" style="background:#f4f4f5;border-radius:10px 0 0 10px;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DATOS DEL REGISTRO -->
          <tr>
            <td style="background:#ffffff;padding:24px 32px 20px;">

              <!-- Nombre del asistente -->
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;">Asistente</p>
              <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#1a1a1a;">${nombre} ${apellido}</p>

              <!-- Grid de datos -->
              <table width="100%" cellpadding="0" cellspacing="0">
                ${eventoFecha ? `
                <tr>
                  <td style="padding-bottom:14px;vertical-align:top;width:50%;">
                    <p style="margin:0 0 3px;font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;">Fecha</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">${eventoFecha}</p>
                  </td>
                  ${eventoHora ? `
                  <td style="padding-bottom:14px;vertical-align:top;">
                    <p style="margin:0 0 3px;font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;">Hora</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">${eventoHora}hs</p>
                  </td>` : ''}
                </tr>` : ''}
                ${direccion ? `
                <tr>
                  <td colspan="2" style="padding-bottom:14px;vertical-align:top;">
                    <p style="margin:0 0 3px;font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;">Lugar</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">${direccion}</p>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <!-- LÍNEA DE CORTE 2 -->
          <tr>
            <td style="background:#ffffff;position:relative;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="20" style="background:#f4f4f5;border-radius:0 10px 10px 0;"></td>
                  <td style="border-top:2px dashed #e0e0e0;padding:0;height:2px;"></td>
                  <td width="20" style="background:#f4f4f5;border-radius:10px 0 0 10px;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR CODE -->
          <tr>
            <td style="background:#ffffff;padding:24px 32px 28px;text-align:center;">
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;">Presentá este código en la entrada</p>
              <img src="${qrUrl}" alt="Código QR de acceso" width="150" height="150"
                style="display:block;margin:16px auto 0;border-radius:8px;" />
              <p style="margin:12px 0 0;font-size:11px;color:#bbb;font-family:monospace;letter-spacing:1px;">${registroId.slice(0, 8).toUpperCase()}</p>
            </td>
          </tr>

          <!-- FOOTER — marca de agua Sustancial -->
          <tr>
            <td style="background:#f9f9f9;border-top:1px solid #efefef;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#bbb;letter-spacing:1px;text-transform:uppercase;">Gestionado por <strong style="color:#999;">Sustancial</strong></p>
            </td>
          </tr>

        </table>
        <!-- FIN CUPÓN -->

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || "eventos@labos.sustancial.uy",
      to: email,
      subject: `✅ Tu registro está confirmado — ${eventoTitulo}`,
      html,
    });

    return Response.json({ ok: true, data });

  } catch (error: any) {
    console.error("ERROR RESEND confirmacion:", error);
    return Response.json(
      { error: error.message || "Error enviando email" },
      { status: 500 }
    );
  }
}