import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import io, { Socket } from 'socket.io-client'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { requestNotificationPermission, showNotification } from '@/utils/notification'

type Message = {
  id: string
  content: string
  createdAt: string
  isRead: boolean
  sender: {
    id: string
    name: string
    image: string
  }
  receiver: {
    id: string
    name: string
    image: string
  }
}

type User = {
  id: string
  name: string
  image: string
}

type UserWithUnread = User & {
  unreadCount: number
}

export default function Chat() {
  const { data: session } = useSession()
  const router = useRouter()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [users, setUsers] = useState<UserWithUnread[]>([])
  const [selectedUser, setSelectedUser] = useState<UserWithUnread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [notificationEnabled, setNotificationEnabled] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    // 請求通知權限
    requestNotificationPermission().then(setNotificationEnabled)

    // 連接 Socket.IO
    const socketIo = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      query: { userId: session.user.id }
    })

    socketIo.on('connect', () => {
      console.log('Connected to Socket.IO')
    })

    socketIo.on('message', (message: Message) => {
      if (
        message.sender.id === selectedUser?.id ||
        message.receiver.id === selectedUser?.id
      ) {
        setMessages(prev => [...prev, message])
      }

      if (
        message.sender.id !== selectedUser?.id &&
        message.sender.id !== session.user.id &&
        notificationEnabled
      ) {
        showNotification(`來自 ${message.sender.name} 的新訊息`, {
          body: message.content,
          data: { userId: message.sender.id },
        })
      }

      if (message.sender.id !== session.user.id) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === message.sender.id
              ? { ...user, unreadCount: user.unreadCount + 1 }
              : user
          )
        )
      }
    })

    setSocket(socketIo)

    // 載入用戶列表
    fetchUsers()

    return () => {
      socketIo.disconnect()
    }
  }, [session])

  useEffect(() => {
    if (selectedUser) {
      fetchMessages()
    }
  }, [selectedUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleNotificationClick = (event: any) => {
      const userId = event.notification.data?.userId
      if (userId) {
        const user = users.find(u => u.id === userId)
        if (user) {
          handleSelectUser(user)
        }
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleNotificationClick)
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleNotificationClick)
      }
    }
  }, [users])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      const usersWithUnread = await Promise.all(
        data
          .filter((user: User) => user.id !== session?.user.id)
          .map(async (user: User) => {
            const unreadRes = await fetch(`/api/messages/unread/${user.id}`)
            const { count } = await unreadRes.json()
            return { ...user, unreadCount: count }
          })
      )
      setUsers(usersWithUnread)
    } catch (error) {
      console.error('載入用戶列表失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/messages/${selectedUser.id}`)
      const data = await res.json()
      setMessages(data)
    } catch (error) {
      console.error('載入訊息失敗:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!socket || !selectedUser || !newMessage.trim()) return

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          receiverId: selectedUser.id,
        }),
      })

      if (res.ok) {
        setNewMessage('')
      }
    } catch (error) {
      console.error('發送訊息失敗:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const markAsRead = async (senderId: string) => {
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId }),
      })
      
      // 更新用戶列表中的未讀計數
      setUsers(users.map(user => 
        user.id === senderId ? { ...user, unreadCount: 0 } : user
      ))
    } catch (error) {
      console.error('標記已讀失敗:', error)
    }
  }

  const handleSelectUser = async (user: UserWithUnread) => {
    setSelectedUser(user)
    if (user.unreadCount > 0) {
      await markAsRead(user.id)
    }
  }

  if (!session) return null

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 用戶列表 */}
      <div className="w-1/4 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">聊天室</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className={`w-full p-4 flex items-center hover:bg-gray-50 ${
                selectedUser?.id === user.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="relative">
                <Image
                  src={user.image || '/default-avatar.png'}
                  alt={user.name || '用戶'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                {user.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {user.unreadCount}
                  </span>
                )}
              </div>
              <span className="ml-3">{user.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 聊天區域 */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 bg-white border-b">
              <div className="flex items-center">
                <Image
                  src={selectedUser.image || '/default-avatar.png'}
                  alt={selectedUser.name || '用戶'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="ml-3 font-semibold">{selectedUser.name}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${
                    message.sender.id === session.user.id
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] ${
                      message.sender.id === session.user.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200'
                    } rounded-lg p-3`}
                  >
                    <p>{message.content}</p>
                    <div className="flex items-center justify-between text-xs mt-1 opacity-70">
                      <span>
                        {formatDistanceToNow(new Date(message.createdAt), {
                          locale: zhTW,
                          addSuffix: true,
                        })}
                      </span>
                      {message.sender.id === session.user.id && (
                        <span className="ml-2">
                          {message.isRead ? '已讀' : '未讀'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="輸入訊息..."
                  className="flex-1 p-2 border rounded-lg"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  發送
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            選擇一個用戶開始聊天
          </div>
        )}
      </div>
    </div>
  )
} 