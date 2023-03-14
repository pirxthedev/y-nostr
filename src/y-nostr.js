import { Observable } from 'lib0/observable'
import { getEventHash, relayInit } from 'nostr-tools'
import * as Y from 'yjs'
import { generatePrivateKey, getPublicKey, signEvent } from 'nostr-tools'
import { fromUint8Array, toUint8Array } from 'js-base64'

const eventKind = 1

export class NostrProvider extends Observable {

    constructor(relayUrl, roomName, doc) {
        super()
        this.relayUrl = relayUrl
        this.roomName = roomName
        this.doc = doc
        this.relay = relayInit(this.relayUrl)
        this.sub = null

        this._updateHandler = (update, origin) => {
            if (origin !== this && this.relay.status === 1) {
                let event = generateNostrEvent(update, this.roomName)
                this.relay.publish(event)
            }
        }

        this.doc.on('update', this._updateHandler)

    }

    async connect() {
        this.emit('status', [{status: 'connecting'}])
        await this.relay.connect().then(() => {
            this.emit('status', [{status: 'connected'}])
            this.sub = this.relay.sub([{kinds: [eventKind], '#r': [this.roomName]}])
            this.sub.on('event', (event) => {
                let update = toUint8Array(event.content)
                Y.applyUpdate(this.doc, update, this)
            })
        }).catch((err) => {
            this.emit('status', [{status: 'relay-unreachable'}])
        })
    }
}

export function generateNostrEvent(message, roomName) {
    let sk = generatePrivateKey()
    let pk = getPublicKey(sk)
    let unsignedEvent = {
        kind: eventKind,
        content: fromUint8Array(message),
        tags: [['r', roomName]],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: pk,
    }
    let event = {
        ...unsignedEvent,
        id: getEventHash(unsignedEvent),
        sig: signEvent(unsignedEvent, sk)
    }
    return event
}
