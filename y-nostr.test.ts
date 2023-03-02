import { NostrProvider } from './y-nostr'
import { Observable } from 'lib0/observable'
import * as Y from 'yjs'
require('websocket-polyfill')

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