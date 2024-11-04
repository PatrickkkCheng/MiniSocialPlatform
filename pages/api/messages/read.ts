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

  if (req.method === 'POST') {
    try {
      const { senderId } = req.body

      // 將所有來自特定發送者的未讀消息標記為已讀
      await prisma.message.updateMany({
        where: {
          senderId,
          receiverId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      })

      res.status(200).json({ message: '消息已標記為已讀' })
    } catch (error) {
      res.status(500).json({ message: '標記已讀失敗' })
    }
  } else {
    res.status(405).json({ message: '不支援的請求方法' })
  }
} 