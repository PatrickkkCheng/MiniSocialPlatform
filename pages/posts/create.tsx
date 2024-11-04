import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

export default function CreatePost() {
  const { data: session } = useSession()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!session) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 先上傳圖片和視頻
      const imageUrls = []
      let videoUrl = null

      if (images.length > 0) {
        for (const image of images) {
          const formData = new FormData()
          formData.append('file', image)
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
          const data = await res.json()
          imageUrls.push(data.url)
        }
      }

      if (video) {
        const formData = new FormData()
        formData.append('file', video)
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        videoUrl = data.url
      }

      // 創建貼文
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          images: imageUrls,
          video: videoUrl,
        }),
      })

      if (!res.ok) {
        throw new Error('發布貼文失敗')
      }

      router.push('/')
    } catch (error) {
      setError(error instanceof Error ? error.message : '發布貼文時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">發布新貼文</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
        )}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的想法..."
            required
            className="w-full p-3 border rounded-lg min-h-[150px]"
          />
        </div>
        <div>
          <label className="block mb-2">
            上傳圖片（可多選）
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files || []))}
              className="mt-1"
            />
          </label>
        </div>
        <div>
          <label className="block mb-2">
            上傳影片
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideo(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '發布中...' : '發布'}
        </button>
      </form>
    </div>
  )
} 