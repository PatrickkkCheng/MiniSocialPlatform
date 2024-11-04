import type { NextApiResponse } from 'next'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

declare module 'next' {
  // 擴展 NextApiResponse
  export interface NextApiResponse<T = any> {
    status(code: number): NextApiResponse<T>
    json(body: T): void
    socket: {
      server: NetServer & {
        io?: SocketIOServer
      }
    }
  }
} 