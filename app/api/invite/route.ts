import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, groupName, inviteCode, inviterName, groupColor = '#00DF81' } = await req.json()

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Falta la API Key de Resend en el servidor' }, { status: 500 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Xpenses <onboarding@resend.dev>',
        to: [email],
        subject: `¡${inviterName} te invitó a Xpenses!`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #000F0A; color: #E0E7E5; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .card { background-color: #001A14; border: 1px solid rgba(0, 223, 129, 0.1); border-radius: 24px; padding: 40px; text-align: center; }
                .logo { font-size: 40px; margin-bottom: 20px; }
                h1 { color: #FFFFFF; font-size: 24px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.5px; }
                p { color: #889995; font-size: 16px; line-height: 1.5; margin-bottom: 24px; }
                .code-box { background-color: #000F0A; border: 1.5px dashed ${groupColor}; border-radius: 16px; padding: 24px; margin: 32px 0; }
                .code-label { color: #889995; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
                .code-value { color: ${groupColor}; font-size: 32px; font-weight: 900; letter-spacing: 4px; margin: 0; }
                .btn { display: inline-block; background-color: ${groupColor}; color: #000F0A; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; transition: transform 0.2s; }
                .footer { color: #556662; font-size: 12px; margin-top: 32px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="logo">🎮</div>
                  <h1>Invitación a Grupo</h1>
                  <p><strong>${inviterName}</strong> te espera en el grupo <strong>${groupName}</strong> para empezar el juego de las finanzas inteligentes.</p>
                  
                  <div class="code-box">
                    <div class="code-label">Código de Invitación</div>
                    <div class="code-value">${inviteCode}</div>
                  </div>

                  <p>Copia el código y pegalo en la app para unirte al instante.</p>
                  
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" class="btn">
                    ACEPTAR INVITACIÓN
                  </a>

                  <div class="footer">
                    Este es un mensaje automático de Xpenses Game.<br>
                    Si no esperabas esto, podés ignorar el mensaje.
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })

    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
