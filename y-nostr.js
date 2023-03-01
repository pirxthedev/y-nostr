import { Observable } from 'lib0/observable'

export class NostrProvider extends Observable {
    constructor(doc) {
        super()
        this.doc = doc
    }
}
