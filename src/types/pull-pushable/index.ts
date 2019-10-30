declare module 'pull-pushable' {
  import * as pull from 'pull-stream'

  type OnClose = (err?: Error | boolean | string | null) => void

  function pushable<T>(onclose?: OnClose): pushable.Pushable<T>

  namespace pushable {
    export interface Pushable<T> extends pull.Source<T> {
      end(endOrError?: boolean | Error | string): void
      push(data: any): void
    }
  }
  export = pushable
}
