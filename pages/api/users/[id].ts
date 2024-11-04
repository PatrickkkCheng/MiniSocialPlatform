import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '只允許 GET 請求' })
  }

  const userId = req.query.id as string

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({ message: '找不到用戶' })
    }

    res.status(200).json(user)
  } catch (error) {
    console.error('獲取用戶資料失敗:', error)
    res.status(500).json({ message: '獲取用戶資料時發生錯誤' })
  }
} 