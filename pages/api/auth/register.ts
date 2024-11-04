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
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: '所有欄位都是必填的' })
    }

    // 檢查電子郵件是否已被使用
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({ message: '此電子郵件已被註冊' })
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 12)

    // 創建新用戶
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // 移除密碼後返回用戶資料
    const { password: _, ...userWithoutPassword } = user

    res.status(201).json(userWithoutPassword)
  } catch (error) {
    console.error('註冊錯誤:', error)
    res.status(500).json({ message: '註冊時發生錯誤' })
  }
} 