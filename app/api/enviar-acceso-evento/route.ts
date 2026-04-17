import { Resend } from "resend";

// ❌ No dejes logs con la API key
// console.log("API KEY:", process.env.RESEND_API_KEY);

// ✅ Validación clara
if (!process.env.RESEND_API_KEY) {
  throw new Error("Falta RESEND_API_KEY en variables de entorno");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, eventoTitulo, urlFormulario, urlStats, clave } = await req.json();

    if (!email) {
      return Response.json({ error: "Email requerido" }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || "eventos@labos.sustancial.uy",
      to: email,
      subject: `Acceso a evento: ${eventoTitulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.5;">
          <h2>${eventoTitulo}</h2>
          <p>Te compartimos el acceso al evento:</p>

          <p>
            <strong>Formulario:</strong><br/>
            <a href="${urlFormulario}">${urlFormulario}</a>
          </p>

          <p>
            <strong>Estadísticas:</strong><br/>
            <a href="${urlStats}">${urlStats}</a>
          </p>

          <p><strong>Clave de acceso:</strong></p>
          <h1 style="letter-spacing:4px;">${clave}</h1>

          <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;" />

          <p style="font-size:12px;color:#888;">
            Este acceso es confidencial. Equipo LabOS
          </p>
        </div>
      `,
    });

    return Response.json({ ok: true, data });

  } catch (error: any) {
    console.error("ERROR RESEND:", error);
    return Response.json(
      { error: error.message || "Error enviando email" },
      { status: 500 }
    );
  }
}