import createClient from './createClient'

function connect(...params: any[]) {
  console.error(...params)

  const client = createClient('bilibili', 24853812)

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
