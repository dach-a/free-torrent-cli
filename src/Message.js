import { Buffer } from 'buffer';
import { getInfoHash } from './TorrentParser.js';
import { generatePeerId } from './util.js';

export function buildHandshake (torrent){
    const buffer = Buffer.alloc(68);

    // protocol string length (pstrlen)
    buffer.writeUInt8(19, 0);

    // protocol string (pstr)
    buffer.write('BitTorrent protocol', 1);

    // reserved bytes (reserved)
    buffer.writeUInt32BE(0, 20);
    buffer.writeUInt32BE(0, 24);

    // info hash (info_hash)
    getInfoHash(torrent).copy(buffer, 28);

    // generate peer id (peer_id)
    generatePeerId().copy(buffer, 48);
    return buffer;
}

export function buildKeepAlive () {
    return Buffer.alloc(4);
}

export function buildChoke () {
    const buffer = Buffer.alloc(5);

    // length prefix
    buffer.writeUInt32BE(1, 0);

    // message id
    buffer.writeUInt8(0, 4);
    return buffer;
}

export function buildUnchoke () {
    const buffer = Buffer.alloc(5);

    // length prefix
    buffer.writeUInt32BE(1, 0);

    // message id
    buffer.writeUInt8(2, 4);
    return buffer;
};

export function buildInterested () {
    const buffer = Buffer.alloc(5);

    // length prefix
    buffer.writeUInt32BE(1, 0);

    // message id
    buffer.writeUInt8(3, 4);
    return buffer;
};

export function buildHave (payload) {
    const buffer = Buffer.alloc(9);

    // length prefix
    buffer.writeUInt32BE(5, 0);

    // message id
    buffer.writeUInt8(4, 4);

    // piece index
    buffer.writeUInt32BE(payload, 5);
    return buffer;
};

export function buildBitField (bitfield) {
    const buffer = Buffer.alloc(14);

    // length prefix
    buffer.writeUInt32BE(payload.length + 1, 0);

    // message id
    buffer.writeUInt8(5, 4);

    // bitfield
    bitfield.copy(buffer, 5);
    return buffer;
};

export function buildRequest (payload) {
    const buffer = Buffer.alloc(13);

    // length prefix
    buffer.writeUInt32BE(13, 0);

    // message id
    buffer.writeUInt8(6, 4);

    // index
    buffer.writeUInt32BE(payload.index, 5);

    // begin
    buffer.writeUInt32BE(payload.begin, 9);

    // length
    buffer.writeUInt32BE(payload.length, 13);
    return buffer;
};

export function buildPiece (payload) {
    const buffer = Buffer.alloc(payload.block.length + 13);

    // length prefix
    buffer.writeUInt32BE(payload.block.length + 9, 0);

    // message id
    buffer.writeUInt8(7, 4);

    // index
    buffer.writeUInt32BE(payload.index, 5);

    // begin
    buffer.writeUInt32BE(payload.begin, 9);

    // block
    payload.block.copy(buffer, 13);
    return buffer;
};

export function buildCancel (payload) {
    const buffer = Buffer.alloc(17);

    // length prefix
    buffer.writeUInt32BE(13, 0);

    // message id
    buffer.writeUInt8(8, 4);

    // index
    buffer.writeUInt32BE(payload.index, 5);

    // begin
    buffer.writeUInt32BE(payload.begin, 9);

    // length
    buffer.writeUInt32BE(payload.length, 13);
    return buffer;
};

export function buildPort (payload) {
    const buffer = Buffer.alloc(7);

    // length prefix
    buffer.writeUInt32BE(3, 0);

    // message id
    buffer.writeUInt8(9, 4);

    // listen port
    buffer.writeUInt16BE(payload, 5);
    return buffer;
};

export function parseMessage (message) {
    const length = message.readInt32BE(0);

    const id = length > 0 ? message.readInt8(4) : null;
    const payload = length > 0 ? message.subarray(5) : null;

    if(id === 6 || id === 7 || id === 8){
        const rest = payload.slice(8);
        payload = {
            index: payload.readInt32BE(0),
            begin: payload.readInt32BE(4)
        };
        payload[id === 7 ? 'block' : 'length'] = rest;
    }

    return {
        length,
        id,
        payload
    }
};
