declare module 'stream-to-pull-stream' {
  import * as pull from 'pull-stream'
  import Stream from 'stream'
  interface Duplex<T> {
    source: pull.Source<T>
    sink: pull.Sink<T>
  }

  export function duplex<T>(stream: Stream): Duplex<T>
}
