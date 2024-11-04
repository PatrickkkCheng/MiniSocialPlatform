import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Post from '@/components/Post'
import Link from 'next/link'

export default function Home() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts')
      const data = await res.json()
      setPosts(data)
    } catch (error) {
      console.error('載入貼文失敗:', error)
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      {session && (
        <Link
          href="/posts/create"
          className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg mb-6 hover:bg-blue-700"
        >
          發布新貼文
        </Link>
      )}
      
      <div className="space-y-6">
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onDelete={handleDeletePost}
          />
        ))}
      </div>
    </div>
  )
} 