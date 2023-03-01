import { NostrProvider } from './y-nostr'
import { Observable } from 'lib0/observable'
import { map } from 'lib0/map'
import * as Y from 'yjs'
import type { Relay } from 'nostr-tools'

let doc: Y.Doc;
let provider: NostrProvider;

beforeEach(() => {
    doc = new Y.Doc()
    provider = new NostrProvider('wss://127.0.0.1:8008/', 'test-room', doc)
})

test('provider object is an Observable', () => {
    expect(provider).toBeInstanceOf(Observable)
});

test('can initialize provider with required configuration info', () => {
    expect(provider.relayUrl).toBe('wss://127.0.0.1:8008/')
    expect(provider.roomName).toBe('test-room')
    expect(provider.doc).toBe(doc)
});

test('can initiate connection to relay', done => {
    provider.on('status', (event: any) => {
        expect(event.status).toBe('connecting')
        done()
    })
    provider.connect()
})

test('nostr relay object created on connect', () => {
    provider.connect()
    expect(provider.relay).toBeTruthy()
})