import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, groupName, inviteCode, inviterName } = await req.json()

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY no configurada')
      return NextResponse.json({ error: 'Configuración de email faltante' }, { status: 500 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Xpenses Game <onboarding@resend.dev>',
        to: [email],
        subject: `¡${inviterName} te invitó a jugar en el grupo ${groupName}!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #8b5cf6;">🎮 Xpenses Game</h1>
            <p>Hola,</p>
            <p><strong>${inviterName}</strong> quiere que te unas al grupo <strong>${groupName}</strong> para empezar a dividir gastos de forma inteligente.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin-bottom: 8px; font-size: 14px; color: #666;">Tu código de invitación es:</p>
              <h2 style="margin: 0; letter-spacing: 4px; color: #111;">${inviteCode}</h2>
            </div>
            <p>Para unirte, simplemente copia el código y pégalo en la sección "Unirme a un grupo" de la aplicación.</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" 
               style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
              Ir a la App
            </a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Esta es una invitación automática de Xpenses Game. Si no esperabas este correo, puedes ignorarlo.</p>
          </div>
        `,
      }),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
