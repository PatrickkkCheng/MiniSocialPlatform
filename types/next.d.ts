import { NextApiResponse as OriginalNextApiResponse } from 'next'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

declare module 'next' {
  interface NextApiResponse<T = any> extends OriginalNextApiResponse<T> {
    socket: {
      server: NetServer & {
        io?: SocketIOServer
      }
    }
  }
} 