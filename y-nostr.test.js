import { NostrProvider } from 'y-nostr'
import { Observable } from 'lib0/observable'
import * as Y from 'yjs'


test('provider object is an Observable', () => {
    expect(new NostrProvider()).toBeInstanceOf(Observable)
});

test('can register yjs doc to provider', () => {
    const doc = new Y.Doc()
    const provider = new NostrProvider(doc)
    expect(provider.doc).toBe(doc)
});