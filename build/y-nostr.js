"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNostrEvent = exports.NostrProvider = void 0;
const observable_1 = require("lib0/observable");
const nostr_tools_1 = require("nostr-tools");
const Y = __importStar(require("yjs"));
const nostr_tools_2 = require("nostr-tools");
const js_base64_1 = require("js-base64");
const eventKind = 1;
class NostrProvider extends observable_1.Observable {
    constructor(relayUrl, roomName, doc) {
        super();
        this.relayUrl = relayUrl;
        this.roomName = roomName;
        this.doc = doc;
        this.relay = (0, nostr_tools_1.relayInit)(this.relayUrl);
        this.sub = null;
        this.doc.on('update', (update) => {
            let event = generateNostrEvent(update, this.roomName);
            this.relay.publish(event);
        });
    }
    connect() {
        this.emit('status', [{ status: 'connecting' }]);
        this.relay.connect().then(() => {
            this.emit('status', [{ status: 'connected' }]);
            this.sub = this.relay.sub([{ kinds: [eventKind], '#r': [this.roomName] }]);
            this.sub.on('event', (event) => {
                let update = (0, js_base64_1.toUint8Array)(event.content);
                Y.applyUpdate(this.doc, update, this);
            });
        }).catch((err) => {
            this.emit('status', [{ status: 'relay-unreachable' }]);
        });
    }
}
exports.NostrProvider = NostrProvider;
function generateNostrEvent(message, roomName) {
    let sk = (0, nostr_tools_2.generatePrivateKey)();
    let pk = (0, nostr_tools_2.getPublicKey)(sk);
    let unsignedEvent = {
        kind: eventKind,
        content: (0, js_base64_1.fromUint8Array)(message),
        tags: [['r', roomName]],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: pk,
    };
    let event = Object.assign(Object.assign({}, unsignedEvent), { id: (0, nostr_tools_1.getEventHash)(unsignedEvent), sig: (0, nostr_tools_2.signEvent)(unsignedEvent, sk) });
    return event;
}
exports.generateNostrEvent = generateNostrEvent;
