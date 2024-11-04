import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const postId = req.query.id as string

  if (req.method === 'GET') {
    try {
      const comments = await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })
      res.status(200).json(comments)
    } catch (error) {
      res.status(500).json({ message: '獲取評論時發生錯誤' })
    }
  } else if (req.method === 'POST') {
    const session = await getSession({ req })
    if (!session) {
      return res.status(401).json({ message: '請先登入' })
    }

    try {
      const { content } = req.body
      const comment = await prisma.comment.create({
        data: {
          content,
          postId,
          authorId: session.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })
      res.status(201).json(comment)
    } catch (error) {
      res.status(500).json({ message: '發表評論時發生錯誤' })
    }
  } else {
    res.status(405).json({ message: '不支援的請求方法' })
  }
} 