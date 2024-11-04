import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Post from '@/components/Post'
import Link from 'next/link'

type User = {
  id: string
  name: string
  image: string
  email: string
  _count: {
    posts: number
  }
}

// 定義 Post 類型
type PostAuthor = {
  id: string
  name: string
  image: string
}

type Post = {
  id: string
  content: string
  images: string[]
  video?: string | null
  createdAt: string
  author: PostAuthor
  _count: {
    likes: number
    comments: number
  }
  isLiked?: boolean
}

export default function Profile() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchUserData()
      fetchUserPosts()
    }
  }, [id])

  const fetchUserData = async () => {
    try {
      const res = await fetch(`/api/users/${id}`)
      if (!res.ok) throw new Error('用戶不存在')
      const data = await res.json()
      setUser(data)
    } catch (error) {
      setError('載入用戶資料失敗')
    }
  }

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`/api/users/${id}/posts`)
      if (!res.ok) throw new Error('載入貼文失敗')
      const data = await res.json()
      setPosts(data)
    } catch (error) {
      setError('載入貼文失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId))
  }

  if (loading) {
    return <div className="text-center py-8">載入中...</div>
  }

  if (error || !user) {
    return <div className="text-center py-8 text-red-600">{error || '用戶不存在'}</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center">
          <Image
            src={user.image || '/default-avatar.png'}
            alt={user.name || '用戶'}
            width={100}
            height={100}
            className="rounded-full"
          />
          <div className="ml-6">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex space-x-4 mt-2">
              <div>
                <span className="font-bold">{user._count.posts}</span>
                <span className="text-gray-600 ml-1">貼文</span>
              </div>
            </div>
          </div>
          {session?.user.id === user.id && (
            <Link
              href="/settings"
              className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              編輯個人資料
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onDelete={handleDeletePost}
          />
        ))}
        {posts.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            還沒有發布任何貼文
          </div>
        )}
      </div>
    </div>
  )
} 