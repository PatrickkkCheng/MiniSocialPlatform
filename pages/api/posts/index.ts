import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req })

  if (req.method === 'GET') {
    try {
      const posts = await prisma.post.findMany({
        orderBy: {
          createdAt: 'desc',
        },
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

      // 添加 isLiked 字段
      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        isLiked: post.likes?.length > 0,
        likes: undefined, // 移除原始 likes 數據
      }))

      res.status(200).json(postsWithLikeStatus)
    } catch (error) {
      console.error('獲取貼文失敗:', error)
      res.status(500).json({ message: '獲取貼文時發生錯誤' })
    }
  } else if (req.method === 'POST') {
    if (!session) {
      return res.status(401).json({ message: '請先登入' })
    }

    try {
      const { content, images, video } = req.body

      const post = await prisma.post.create({
        data: {
          content,
          images,
          video,
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      })

      res.status(201).json(post)
    } catch (error) {
      console.error('創建貼文失敗:', error)
      res.status(500).json({ message: '創建貼文時發生錯誤' })
    }
  } else {
    res.status(405).json({ message: '不支援的請求方法' })
  }
} 