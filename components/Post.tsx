import { useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

type PostProps = {
  post: {
    id: string
    content: string
    images: string[]
    video?: string | null
    createdAt: string
    author: {
      id: string
      name: string
      image: string
    }
    _count: {
      likes: number
      comments: number
    }
    isLiked?: boolean
  }
  onDelete?: (id: string) => void
  showActions?: boolean
}

export default function Post({ post, onDelete, showActions = true }: PostProps) {
  const { data: session } = useSession()
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post._count.likes)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')

  const handleLike = async () => {
    if (!session) return
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      })
      if (res.ok) {
        setIsLiked(!isLiked)
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
      }
    } catch (error) {
      console.error('點讚失敗:', error)
    }
  }

  const handleDelete = async () => {
    if (!session || session.user.id !== post.author.id) return
    if (window.confirm('確定要刪除這則貼文嗎？')) {
      try {
        const res = await fetch(`/api/posts/${post.id}`, {
          method: 'DELETE',
        })
        if (res.ok && onDelete) {
          onDelete(post.id)
        }
      } catch (error) {
        console.error('刪除失敗:', error)
      }
    }
  }

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`)
      const data = await res.json()
      setComments(data)
    } catch (error) {
      console.error('載入評論失敗:', error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !newComment.trim()) return

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })
      
      if (res.ok) {
        const comment = await res.json()
        setComments(prev => [comment, ...prev])
        setNewComment('')
      }
    } catch (error) {
      console.error('發表評論失敗:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <div className="flex items-center mb-4">
        <Image
          src={post.author.image || '/default-avatar.png'}
          alt={post.author.name || '用戶'}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div className="ml-3">
          <Link href={`/profile/${post.author.id}`} className="font-semibold hover:underline">
            {post.author.name}
          </Link>
          <div className="text-gray-500 text-sm">
            {formatDistanceToNow(new Date(post.createdAt), { locale: zhTW, addSuffix: true })}
          </div>
        </div>
        {showActions && session?.user.id === post.author.id && (
          <div className="ml-auto">
            <Link href={`/posts/edit/${post.id}`} className="text-blue-600 hover:text-blue-700 mr-3">
              編輯
            </Link>
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              刪除
            </button>
          </div>
        )}
      </div>

      <p className="mb-4">{post.content}</p>

      {post.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {post.images.map((image, index) => (
            <Image
              key={index}
              src={image}
              alt={`圖片 ${index + 1}`}
              width={300}
              height={300}
              className="rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {post.video && (
        <video
          src={post.video}
          controls
          className="w-full rounded-lg mb-4"
        />
      )}

      {showActions && (
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 ${isLiked ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <span>{isLiked ? '已讚' : '讚'}</span>
            <span>{likesCount}</span>
          </button>
          <button
            onClick={() => {
              setShowComments(!showComments)
              if (!showComments) loadComments()
            }}
            className="flex items-center space-x-1 text-gray-600"
          >
            <span>評論</span>
            <span>{post._count.comments}</span>
          </button>
        </div>
      )}

      {showComments && (
        <div className="mt-4">
          {session && (
            <form onSubmit={handleComment} className="mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="發表評論..."
                className="w-full p-2 border rounded-lg"
              />
            </form>
          )}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <Image
                  src={comment.author.image || '/default-avatar.png'}
                  alt={comment.author.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/profile/${comment.author.id}`} className="font-semibold hover:underline">
                      {comment.author.name}
                    </Link>
                    <span className="text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(comment.createdAt), { locale: zhTW, addSuffix: true })}
                    </span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 