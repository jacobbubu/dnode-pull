process.env.DEBUG = process.env.DEBUG + ',ex1'

import { Debug } from '@jacobbubu/debug'
import dnode from '../src'
import { link } from './utils'

const logger = Debug.create('ex1')

const s = dnode({
  x: function(f: Function, g: Function) {
    setTimeout(function() {
      f(5)
    }, 200)
    setTimeout(function() {
      g(6)
    }, 400)
  },
  y: 555
})
const c = dnode()

c.on('remote', function(remote) {
  function f(x: number) {
    logger.log('"f" has been called back with value:', x)
  }
  function g(x: number) {
    logger.log('"g" has been called back with value:', x)
  }
  remote.x(f, g)
  logger.log('remote.x: called out')
  logger.log('remote.y:', remote.y)
})

link(s, c)
