import { NostrProvider, generateNostrEvent } from './y-nostr'
import { Observable } from 'lib0/observable'
import * as Y from 'yjs'
require('websocket-polyfill')
import { fromUint8Array } from 'js-base64'
import WS from 'jest-websocket-mock'


let doc;
let provider;
let relayMock = new WS('wss://127.0.0.1:1337/', { jsonProtocol: true })

beforeEach(() => {
    doc = new Y.Doc()
    provider = new NostrProvider('wss://127.0.0.1:1337/', 'test-room', doc)
})

test('provider object is an Observable', () => {
    expect(provider).toBeInstanceOf(Observable)
});

test('can initialize provider with required configuration info', () => {
    expect(provider.relayUrl).toBe('wss://127.0.0.1:1337/')
    expect(provider.roomName).toBe('test-room')
    expect(provider.doc).toBe(doc)
});

test('can initiate connection to relay', done => {
    provider.once('status', (event) => {
        expect(event.status).toBe('connecting')
        done()
    })
    provider.connect()
})

test('connect command with unavailable relay causes error', done => {
    provider = new NostrProvider('wss://127.0.0.1:1338/', 'test-room', doc)
    provider.on('status', (event) => {
        if (event.status == 'relay-unreachable') {
            done()
        }
    })
    provider.connect()
})

test('connect command with available relay causes success', done => {
    provider.on('status', (event) => {
        if (event.status == 'connected') {
            done()
        }
    })
    provider.connect()
})

describe('publish update event to nostr', () => {

    let publishMock

    beforeEach(() => {
        publishMock = jest.fn()
        provider.relay.publish = publishMock
        doc.transact(() => {
            doc.getText('test-room').insert(0, 'Hello')
        })
    })

    test('publish method on relay is called', () => {
        expect(provider.relay.publish).toHaveBeenCalled()
    })

    test('content field of nostr event has recommended yjs protocol encoding', () => {
        const documentState = Y.encodeStateAsUpdate(doc)
        const base64Encoded = fromUint8Array(documentState)
        expect(publishMock.mock.calls[0][0]).toHaveProperty(
            'content',
            base64Encoded
        )
    })

    test('tags field of nostr event references room name', () => {
        expect(publishMock.mock.calls[0][0]).toHaveProperty(
            'tags',
            [['r', 'test-room']]
        )
    })

})

test('subscribe to updates for room name after relay is connected', async () => {
    const connectMock = jest.fn(() => Promise.resolve())
    provider.relay.connect = connectMock

    const subMock = jest.fn()
    provider.relay.sub = subMock

    await provider.connect()

    expect(subMock.mock.calls[0][0][0]).toHaveProperty(
        '#r', ['test-room']
    )
})

test('subscription message is sent to relay after connect', async () => {
    await provider.connect()
    relayMock.nextMessage.then((message) => {
        expect(message[0]).toBe('REQ')
        expect(message[2]).toStrictEqual({kinds: [1], '#r': ['test-room']})
    })
})

test('nostr update message is applied to doc', async () => {
    await provider.connect()
    let remoteDoc = new Y.Doc()
    remoteDoc.transact(() => {
        remoteDoc.getText('test-room').insert(0, 'Hello')
    })
    const documentState = Y.encodeStateAsUpdate(remoteDoc)
    let event = generateNostrEvent(documentState, 'test-room')
    relayMock.send(['EVENT', event])
    doc.on('update', (updateMessage, origin, ydoc) => {
        expect(origin).toBe(provider)
        expect(updateMessage).toBe(documentState)
        expect(ydoc.getText('test-room').toString()).toBe('Hello')
    })
})

test('do not publish event to nostr if doc is updated by an incoming nostr message', () => {
    // mock the publish method on the relay
    const publishMock = jest.fn()
    provider.relay.publish = publishMock

    // Apply update to local doc with origin set to provider
    doc.emit('update', ['test', provider])

    // The publish method should not be called
    expect(publishMock).not.toHaveBeenCalled()
})