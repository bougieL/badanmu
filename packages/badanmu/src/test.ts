import createClient from './createClient'



function connect(...params: any[]) {
  console.error(...params)
  /**
   * bilibili
   * 谷歌 139
   * C酱 256
   * me 250002
   */
  const client = createClient('bilibili', 256)

  client.on('open', () => console.log('connected'))

  // client.on('message', console.log)

  client.on('close', (code, reason) => {
    if (code === 0) {
      return
    }
    setTimeout(connect, 5000)
  })

  client.on('error', (...params) => {
    setTimeout(connect, 5000)
  })
}

connect()
