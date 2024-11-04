import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'
import { emitMessage } from '@/server/socket'

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
      const { content, receiverId } = req.body

      const message = await prisma.message.create({
        data: {
          content,
          senderId: session.user.id,
          receiverId,
          isRead: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })

      // 通過 Socket.IO 發送消息
      emitMessage(req.socket.server.io, receiverId, message)

      res.status(201).json(message)
    } catch (error) {
      res.status(500).json({ message: '發送訊息失敗' })
    }
  } else {
    res.status(405).json({ message: '不支援的請求方法' })
  }
} 