import { Observable } from 'lib0/observable'
import { relayInit } from 'nostr-tools'
import * as Y from 'yjs'
import type { Relay } from 'nostr-tools'

export class NostrProvider extends Observable<any> {
    relayUrl: string
    roomName: string
    doc: Y.Doc
    relay: any

    constructor(relayUrl: string, roomName: string, doc: Y.Doc) {
        super()
        this.relayUrl = relayUrl
        this.roomName = roomName
        this.doc = doc
        this.relay = null

    }

    connect() {
        this.emit('status', [{status: 'connecting'}])
        this.relay = relayInit(this.relayUrl)
    }
}
