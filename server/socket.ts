import { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import webpush from 'web-push'

// 配置 Web Push
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const users = new Map()
const subscriptions = new Map()

export default function initSocket(server: HttpServer) {
  const io = new SocketIOServer(server)

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string
    users.set(userId, socket.id)

    socket.on('subscribe', (subscription) => {
      subscriptions.set(userId, subscription)
    })

    socket.on('disconnect', () => {
      users.delete(userId)
    })
  })

  return io
}

export async function emitMessage(io: SocketIOServer, receiverId: string, message: any) {
  const socketId = users.get(receiverId)
  
  if (socketId) {
    // 用戶在線，通過 Socket.IO 發送消息
    io.to(socketId).emit('message', message)
  } else {
    // 用戶離線，發送推送通知
    const subscription = subscriptions.get(receiverId)
    if (subscription) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify({
          title: `來自 ${message.sender.name} 的新訊息`,
          body: message.content,
          data: {
            userId: message.sender.id,
          },
        }))
      } catch (error) {
        console.error('發送推送通知失敗:', error)
      }
    }
  }
} 