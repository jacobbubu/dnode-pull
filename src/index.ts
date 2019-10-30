import { DNode, Cons } from './dnode'

export { DNode }

export default function(cons?: Cons) {
  return new DNode(cons)
}
