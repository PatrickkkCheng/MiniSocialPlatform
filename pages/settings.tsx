import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Image from 'next/image'

export default function Settings() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    // 載入當前用戶資料
    setFormData(prev => ({
      ...prev,
      name: session.user.name || '',
      email: session.user.email || '',
    }))
    setAvatarPreview(session.user.image || '')
  }, [session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // 如果有新頭像，先上傳
      let imageUrl = session?.user.image
      if (avatar) {
        const formData = new FormData()
        formData.append('file', avatar)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        if (!uploadRes.ok) throw new Error('上傳頭像失敗')
        const { url } = await uploadRes.json()
        imageUrl = url
      }

      // 更新用戶資料
      const updateData: any = {
        name: formData.name,
        image: imageUrl,
      }

      // 如果要更改密碼
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('新密碼與確認密碼不符')
        }
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const res = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setSuccess('個人資料已更新')
      // 清除密碼欄位
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
    } catch (error) {
      setError(error instanceof Error ? error.message : '更新失敗')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">個人資料設定</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded">{success}</div>
        )}

        <div className="flex items-center space-x-6">
          <Image
            src={avatarPreview || '/default-avatar.png'}
            alt="頭像"
            width={100}
            height={100}
            className="rounded-full"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">
              更改頭像
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="mt-1"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            用戶名稱
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            電子郵件
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 bg-gray-50"
            />
          </label>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">更改密碼</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                目前密碼
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                新密碼
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  minLength={6}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                確認新密碼
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength={6}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '儲存中...' : '儲存變更'}
        </button>
      </form>
    </div>
  )
} 