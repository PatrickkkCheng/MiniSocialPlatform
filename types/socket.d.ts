import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

declare module 'http' {
  interface Server extends NetServer {
    io?: SocketIOServer
  }
}

declare module 'next' {
  interface NextApiResponse {
    socket: {
      server: NetServer & {
        io?: SocketIOServer
      }
    }
  }
} 