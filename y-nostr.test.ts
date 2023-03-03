import { NostrProvider } from './y-nostr'
import { Observable } from 'lib0/observable'
import * as Y from 'yjs'
require('websocket-polyfill')
import { fromUint8Array } from 'js-base64'

let doc: Y.Doc;
let provider: NostrProvider;

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
    provider.once('status', (event: any) => {
        expect(event.status).toBe('connecting')
        done()
    })
    provider.connect()
})

test('connect command with unavailable relay causes error', done => {
    provider.on('status', (event: any) => {
        if (event.status == 'relay-unreachable') {
            done()
        }
    })
    provider.connect()
})

test('connect command with available relay causes success', done => {
    provider.on('status', (event: any) => {
        if (event.status == 'connected') {
            done()
        }
    })
    provider.relay.connect = jest.fn(() => Promise.resolve())
    provider.connect()
})

describe('publish update event to nostr if doc is updated by the provider', () => {

    let publishMock: jest.Mock

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