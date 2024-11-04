import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '只允許 GET 請求' })
  }

  const userId = req.query.id as string
  const session = await getSession({ req })

  try {
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: session ? {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
          },
        } : false,
      },
    })

    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: post.likes?.length > 0,
      likes: undefined,
    }))

    res.status(200).json(postsWithLikeStatus)
  } catch (error) {
    console.error('獲取用戶貼文失敗:', error)
    res.status(500).json({ message: '獲取用戶貼文時發生錯誤' })
  }
} 