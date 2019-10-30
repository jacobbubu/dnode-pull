import dnode from '../src'
import pull = require('pull-stream')

const link = (p1: any, p2: any) => {
  pull(p1.source, p2.sink)
  pull(p2.source, p1.sink)
}

describe('dnode', () => {
  it('simple', done => {
    const s = dnode({
      x: function(f: Function, g: Function) {
        setTimeout(function() {
          f(5)
        }, 100)
        setTimeout(function() {
          g(6)
        }, 200)
      },
      y: 555
    })
    const c = dnode()

    c.on('remote', function(remote) {
      function f(x: number) {
        expect(x).toBe(5)
      }
      function g(x: number) {
        expect(x).toBe(6)
        done()
      }
      remote.x(f, g)
    })

    link(s, c)
  })
})
