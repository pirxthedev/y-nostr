import { NostrProvider } from 'y-nostr'
import { Observable } from 'lib0/observable'
import * as Y from 'yjs'


test('provider object is an Observable', () => {
    expect(new NostrProvider()).toBeInstanceOf(Observable)
});

test('can initialize provider with required configuration info', () => {
    const doc = new Y.Doc()
    const provider = new NostrProvider('wss://127.0.0.1:8008/', 'test-room', doc)
    expect(provider.relayUrl).toBe('wss://127.0.0.1:8008/')
    expect(provider.roomName).toBe('test-room')
    expect(provider.doc).toBe(doc)
});
