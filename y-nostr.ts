import { Observable } from 'lib0/observable'
import { getEventHash, relayInit } from 'nostr-tools'
import * as Y from 'yjs'
import type { Relay, UnsignedEvent, Event } from 'nostr-tools'
import { generatePrivateKey, getPublicKey, signEvent } from 'nostr-tools'
import { fromUint8Array } from 'js-base64'

const eventKind = 1

export class NostrProvider extends Observable<any> {
    relayUrl: string
    roomName: string
    doc: Y.Doc
    relay: Relay

    constructor(relayUrl: string, roomName: string, doc: Y.Doc) {
        super()
        this.relayUrl = relayUrl
        this.roomName = roomName
        this.doc = doc
        this.relay = relayInit(this.relayUrl)

        this.doc.on('update', (update: any) => {
            let event = generateNostrEvent(update, this.roomName)
            this.relay.publish(event)
        })

    }

    connect() {
        this.emit('status', [{status: 'connecting'}])
        this.relay.connect().then(() => {
            this.emit('status', [{status: 'connected'}])
            let sub = this.relay.sub([{kinds: [eventKind], '#r': [this.roomName]}])
        }).catch((err: any) => {
            this.emit('status', [{status: 'relay-unreachable'}])
        })
    }
}

export function generateNostrEvent(message: Uint8Array, roomName: string): Event {
    let sk = generatePrivateKey()
    let pk = getPublicKey(sk)
    let unsignedEvent: UnsignedEvent = {
        kind: eventKind,
        content: fromUint8Array(message),
        tags: [['r', roomName]],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: pk,
    }
    let event: Event = {
        ...unsignedEvent,
        id: getEventHash(unsignedEvent),
        sig: signEvent(unsignedEvent, sk)
    }
    return event
}