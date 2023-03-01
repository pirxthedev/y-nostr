import { NostrProvider } from 'y-nostr'
import { Observable } from 'lib0/observable'

test('provider object is an Observable', () => {
    expect(new NostrProvider()).toBeInstanceOf(Observable)
});