import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { createTransport } from 'nodemailer'
import crypto from 'crypto'

type ResponseData = {
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只允許 POST 請求' })
  }

  try {
    const { email } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(404).json({ message: '找不到此電子郵件的用戶' })
    }

    // 生成重置令牌
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1小時後過期

    // 儲存重置令牌
    await prisma.passwordReset.create({
      data: {
        email,
        token,
        expires,
      },
    })

    // 發送重置郵件
    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: '重置密碼',
      html: `
        <p>您好，</p>
        <p>請點擊以下連結重置密碼：</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>此連結將在一小時後失效。</p>
      `,
    })

    res.status(200).json({ message: '重置密碼郵件已發送' })
  } catch (error) {
    console.error('忘記密碼錯誤:', error)
    res.status(500).json({ message: '發送重置郵件時發生錯誤' })
  }
} 