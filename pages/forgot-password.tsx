import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message)
      }

      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : '發送重置郵件時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">重置密碼</h2>
        </div>
        {success ? (
          <div className="text-center">
            <div className="mb-4 text-green-600">
              重置密碼連結已發送到您的電子郵件
            </div>
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              返回登入
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                電子郵件
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '發送中...' : '發送重置連結'}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
                返回登入
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
} 