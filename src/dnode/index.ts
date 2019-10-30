import protocol = require('dnode-protocol')
import Proto from 'dnode-protocol'
import { EventEmitter } from 'events'
import * as pull from 'pull-stream'
import { Debug } from '@jacobbubu/debug'
import Pushable = require('pull-pushable')

const defaultLogger = Debug.create('dnode')

type Payload = Buffer

export type Cons = (() => Record<string, any>) | Record<string, any>

const getId = (() => {
  let counter = 0
  return () => counter++
})()

class DNode extends EventEmitter {
  private _source: Pushable.Pushable<Payload> | undefined
  private _ended = false
  private _bufs: Buffer[] = []
  private _line: string = ''
  private _cons: Function
  private _id = getId()
  private _logger = defaultLogger.ns(this._id.toString())

  public proto: Proto.Proto

  constructor(cons: Cons = {}) {
    super()
    this._cons = typeof cons === 'function' ? cons : () => cons || {}

    this.proto = this._createProto()
    this.proto.start()
  }

  get source() {
    if (!this._source) {
      this._source = Pushable()
    }
    return this._source
  }

  get id() {
    return this._id
  }

  sink: pull.Sink<Payload> = read => {
    const self = this
    read(null, function next(endOrError, data) {
      if (true === endOrError) {
        self._logger.debug('upstream ended')
        self.abort()
        return
      }
      if (endOrError) {
        self._logger.debug('upstream errors %o', endOrError)
        self.abort(endOrError)
        return
      }

      self._logger.debug('got data: %B', data)
      let row: string
      if (Buffer.isBuffer(data)) {
        if (!self._bufs) self._bufs = []

        let j = 0
        for (let i = 0; i < data.length; i++) {
          // 换行
          if (data[i] === 0x0a) {
            self._bufs.push(data.slice(j, i))

            let line = ''
            for (let k = 0; k < self._bufs.length; k++) {
              line += self._bufs[k].toString()
            }

            try {
              row = JSON.parse(line)
            } catch (err) {
              return self.abort()
            }
            j = i + 1

            // 让 proto 去处理一个 json 请求
            self.handle(row)
            self._bufs = []
          }
        }

        // will handle it when next \n appear
        if (j < data.length) {
          self._bufs.push(data.slice(j, data.length))
        }
      } else if (data && typeof data === 'object') {
        self.handle(data)
      } else {
        const buf = typeof data !== 'string' ? String(data) : data
        if (!self._line) self._line = ''

        for (let i = 0; i < buf.length; i++) {
          if (buf.charCodeAt(i) === 0x0a) {
            try {
              row = JSON.parse(self._line)
            } catch (err) {
              return self.abort()
            }
            self._line = ''
            self.handle(row)
          } else self._line += buf.charAt(i)
        }
      }

      // read again
      read(self._ended || null, next)
    })
    return undefined
  }

  abort(err?: Error | string) {
    this._ended = true
  }

  private handle(row: string | Object) {
    this._logger.log('handle, %o:', row)
    this.proto.handle(row)
  }

  private _createProto() {
    const self = this
    const proto = protocol(function(remote) {
      if (self._ended) return

      // 今后注意改一下参数，self 应该没用
      let ref = self._cons.call(this, remote, self)
      if (typeof ref !== 'object') ref = this

      self.emit('local', ref, self)

      return ref
    })

    proto.on('remote', function(remote) {
      self._logger.log('remote: %o', remote)
      self.emit('remote', remote, self)
    })

    proto.on('request', function(req) {
      self._logger.log('request: %o', req, self._ended)
      if (self._ended) return
      self.source.push(JSON.stringify(req) + '\n')
    })

    proto.on('fail', function(err) {
      self._logger.error('fail', err)
      // errors that the remote end was responsible for
      self.emit('fail', err)
    })

    proto.on('error', function(err) {
      self._logger.error('error', err)
      // errors that the local code was responsible for
      self.emit('error', err)
    })

    return proto
  }
}

export { DNode }
