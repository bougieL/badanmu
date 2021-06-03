import WebSocket from 'ws'
import fetch from 'node-fetch'

import { DanmuPacket, decode, encode, parseComment, parseGift } from './helper'
import Client from '../client'

const apiURL = 'https://api.live.bilibili.com/room/v1/Room/room_init'

type ID = string | number

type Info = {
  room_id: string
}

const getRoomInfo = (roomID: ID): Promise<Info> => {
  return new Promise((resolve, reject) => {
    return fetch(`${apiURL}?id=${roomID}`)
      .then((t) => t.json() as { data?: Info })
      .then((info) => {
        const { data } = info
        if (data) {
          return resolve(data)
        }
        return reject(info)
      })
  })
}

type Parameters = {
  info: Info
  onOpen?: () => void
  onClose?: (code: number, reason: string) => void
  onMessage?: (msg: DanmuPacket) => void
  onError?: (error: Error) => void
}

const createClient = ({ info, onOpen, onClose, onMessage, onError }: Parameters) => {
  const ws = new WebSocket('wss://broadcastlv.chat.bilibili.com/sub')

  ws.on('message', (data) => {
    if (data) {
      try {
        onMessage?.(decode(data as ArrayBuffer))
      } catch (e) {
        if (e instanceof Error) {
          onError?.(e)
        } else {
          throw e
        }
      }
    }
  })

  if (onClose) ws.on('close', onClose)

  ws.on('open', () => {
    const msg = JSON.stringify({
      uid: 0,
      roomid: info.room_id,
      protover: 1,
      platform: 'web',
      clientver: '1.4.0',
    })
    ws.send(encode(msg, 7))

    setInterval(function () {
      ws.send(encode('', 2))
    }, 30000)

    onOpen?.()
  })

  return ws
}

export default class Bilibili extends Client {
  public client?: WebSocket

  constructor(roomID: ID) {
    super(roomID)

    const onOpen = () => {
      this.emit('open')
    }
    const onClose = (code: number, reason: string) => {
      this.emit('close', code, reason)
    }
    const onMessage = (packet: DanmuPacket) => {
      packet.body.messages.forEach((msg) => {
        const cmd = msg.cmd.split(':').shift()
        if (cmd === 'DANMU_MSG') {
          this.emit('message', parseComment(msg.info))
        } else if (cmd === 'SEND_GIFT') {
          this.emit('message', parseGift(msg.data))
        }
      })
    }
    const onError = (error: Error) => {
      this.emit('error', error)
    }

    getRoomInfo(roomID)
      .then((info) => createClient({ info, onOpen, onMessage, onClose, onError }))
      .then((client) => (this.client = client))
  }
}
