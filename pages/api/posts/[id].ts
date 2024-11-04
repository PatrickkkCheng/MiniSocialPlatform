import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req })
  const postId = req.query.id as string

  if (req.method === 'GET') {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
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
          } : false,
        },
      })

      if (!post) {
        return res.status(404).json({ message: '找不到貼文' })
      }

      const postWithLikeStatus = {
        ...post,
        isLiked: post.likes?.length > 0,
        likes: undefined,
      }

      res.status(200).json(postWithLikeStatus)
    } catch (error) {
      res.status(500).json({ message: '獲取貼文時發生錯誤' })
    }
  } else if (req.method === 'PUT') {
    if (!session) {
      return res.status(401).json({ message: '請先登入' })
    }

    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      })

      if (!post) {
        return res.status(404).json({ message: '找不到貼文' })
      }

      if (post.authorId !== session.user.id) {
        return res.status(403).json({ message: '沒有權限編輯此貼文' })
      }

      const { content, images, video } = req.body
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { content, images, video },
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

      res.status(200).json(updatedPost)
    } catch (error) {
      res.status(500).json({ message: '更新貼文時發生錯誤' })
    }
  } else if (req.method === 'DELETE') {
    if (!session) {
      return res.status(401).json({ message: '請先登入' })
    }

    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      })

      if (!post) {
        return res.status(404).json({ message: '找不到貼文' })
      }

      if (post.authorId !== session.user.id) {
        return res.status(403).json({ message: '沒有權限刪除此貼文' })
      }

      await prisma.post.delete({
        where: { id: postId },
      })

      res.status(204).end()
    } catch (error) {
      res.status(500).json({ message: '刪除貼文時發生錯誤' })
    }
  } else {
    res.status(405).json({ message: '不支援的請求方法' })
  }
} 