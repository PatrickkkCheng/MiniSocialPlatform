import { PrismaClient } from '@prisma/client'

// 擴展 NodeJS.Global 接口
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// 防止開發環境下產生多個 Prisma Client 實例
const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma 