import pull = require('pull-stream')

const link = (p1: any, p2: any) => {
  pull(p1.source, p2.sink)
  pull(p2.source, p1.sink)
}

export { link }
