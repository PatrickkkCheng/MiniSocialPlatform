import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ message: '請先登入' })
  }

  const postId = req.query.id as string

  if (req.method === 'POST') {
    try {
      const like = await prisma.like.create({
        data: {
          postId,
          userId: session.user.id,
        },
      })
      res.status(201).json(like)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          res.status(400).json({ message: '已經點過讚了' })
          return
        }
      }
      console.error('點讚錯誤:', error)
      res.status(500).json({ message: '點讚時發生錯誤' })
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId: session.user.id,
          },
        },
      })
      res.status(204).end()
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          res.status(404).json({ message: '找不到點讚記錄' })
          return
        }
      }
      console.error('取消點讚錯誤:', error)
      res.status(500).json({ message: '取消點讚時發生錯誤' })
    }
  } else {
    res.status(405).json({ message: '不支援的請求方法' })
  }
} 