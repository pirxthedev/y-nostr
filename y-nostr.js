import { Observable } from 'lib0/observable'

export class NostrProvider extends Observable {
    constructor(relayUrl, roomName, doc) {
        super()
        this.relayUrl = relayUrl
        this.roomName = roomName
        this.doc = doc
    }
}
