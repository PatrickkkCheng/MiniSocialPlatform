import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import formidable from 'formidable'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只允許 POST 請求' })
  }

  try {
    const session = await getSession({ req })
    if (!session) {
      return res.status(401).json({ message: '請先登入' })
    }

    const form = formidable()
    const [fields, files] = await form.parse(req)
    const file = files.file?.[0]

    if (!file) {
      return res.status(400).json({ message: '未找到檔案' })
    }

    // 上傳到 Cloudinary
    const result = await cloudinary.uploader.upload(file.filepath, {
      resource_type: 'auto', // 自動檢測文件類型
    })

    // 刪除暫存文件
    fs.unlinkSync(file.filepath)

    res.status(200).json({ url: result.secure_url })
  } catch (error) {
    console.error('上傳失敗:', error)
    res.status(500).json({ message: '上傳文件時發生錯誤' })
  }
} 