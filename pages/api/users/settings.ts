import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: '只允許 PUT 請求' })
  }

  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ message: '請先登入' })
  }

  try {
    const { name, image, currentPassword, newPassword } = req.body

    // 準備更新的數據
    const updateData: any = {
      name,
      image,
    }

    // 如果要更改密碼
    if (newPassword) {
      // 驗證當前密碼
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      })

      if (!user?.password) {
        return res.status(400).json({ message: '無法驗證當前密碼' })
      }

      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return res.status(400).json({ message: '當前密碼錯誤' })
      }

      // 加密新密碼
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    // 更新用戶資料
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    res.status(200).json(updatedUser)
  } catch (error) {
    console.error('更新用戶設定失敗:', error)
    res.status(500).json({ message: '更新用戶設定時發生錯誤' })
  }
} 