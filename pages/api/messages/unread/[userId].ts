import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ message: '請先登入' })
  }

  const senderId = req.query.userId as string

  if (req.method === 'GET') {
    try {
      const count = await prisma.message.count({
        where: {
          senderId,
          receiverId: session.user.id,
          isRead: false,
        },
      })

      res.status(200).json({ count })
    } catch (error) {
      res.status(500).json({ message: '獲取未讀消息數失敗' })
    }
  } else {
    res.status(405).json({ message: '不支援的請求方法' })
  }
} 