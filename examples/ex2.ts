process.env.DEBUG = 'ex2*'

import * as net from 'net'
import { Debug } from '@jacobbubu/debug'
import toPull = require('stream-to-pull-stream')
import dnode from '../src'
import { link } from './utils'

const logger = Debug.create('ex2')
const hostLogger = logger.ns('host')
const guestLogger = logger.ns('guest')

const PORT = 9988

const server = net
  .createServer(socket => {
    logger.log("You've got a guest!")

    const pullSocket = toPull.duplex(socket)
    const host = dnode({
      x: function(f: Function, g: Function) {
        hostLogger.log('"x" has been called')
        setTimeout(function() {
          f(5)
        }, 200)
        setTimeout(function() {
          g(6)
        }, 400)
      },
      y: 555
    })
    link(pullSocket, host)
  })
  .listen(PORT, () => {
    logger.log('Server is listening on', PORT)

    const client = net.createConnection(PORT, '127.0.0.1', () => {
      const pullSocket = toPull.duplex(client)
      const guest = dnode()

      guest.on('remote', function(remote) {
        function f(x: number) {
          guestLogger.log('"f" has been called back with value:', x)
        }
        function g(x: number) {
          guestLogger.log('"g" has been called back with value:', x)
        }
        remote.x(f, g)
        guestLogger.log('remote.x: called out')
        guestLogger.log('remote.y:', remote.y)
      })
      link(pullSocket, guest)
    })
  })
