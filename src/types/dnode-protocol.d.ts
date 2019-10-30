declare module 'dnode-protocol' {
  import { EventEmitter } from 'events'

  namespace Proto {
    export class Proto extends EventEmitter {
      constructor(cons: any, opts: any)

      start(): void
      cull(id: number): void
      request(method: string, args: any[]): void
      handle(req: string | Object): void
      handleMethods(methods: Record<string, any>): void
      apply(f: Function, args: any[]): void
    }

    type Callback = (this: Proto.Proto, remote: any, self?: Proto.Proto) => void
  }

  function Proto(cons: Proto.Callback, opts?: any): Proto.Proto
  export = Proto
}
