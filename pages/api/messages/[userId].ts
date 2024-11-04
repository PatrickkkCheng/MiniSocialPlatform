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

  const userId = req.query.userId as string

  if (req.method === 'GET') {
    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            {
              senderId: session.user.id,
              receiverId: userId,
            },
            {
              senderId: userId,
              receiverId: session.user.id,
            },
          ],
        },
        orderBy: {
          createdAt: 'asc',
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

      res.status(200).json(messages)
    } catch (error) {
      res.status(500).json({ message: '獲取訊息失敗' })
    }
  } else {
    res.status(405).json({ message: '不支援的請求方法' })
  }
} 