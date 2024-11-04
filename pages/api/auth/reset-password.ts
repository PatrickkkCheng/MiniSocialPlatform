import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只允許 POST 請求' })
  }

  try {
    const { token, password } = req.body

    // 查找有效的重置令牌
    const resetToken = await prisma.passwordReset.findFirst({
      where: {
        token,
        expires: {
          gt: new Date(),
        },
      },
    })

    if (!resetToken) {
      return res.status(400).json({ message: '無效或已過期的重置連結' })
    }

    // 更新用戶密碼
    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    })

    // 刪除已使用的重置令牌
    await prisma.passwordReset.delete({
      where: { id: resetToken.id },
    })

    res.status(200).json({ message: '密碼已成功重置' })
  } catch (error) {
    console.error('重置密碼錯誤:', error)
    res.status(500).json({ message: '重置密碼時發生錯誤' })
  }
} 