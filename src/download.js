import net from 'net';
import { Buffer } from 'buffer';
import { getPeers } from './tracker.js';
import { buildHandshake, buildInterested, buildRequest, parse } from './Message.js';
import Pieces from './Pieces.js';

export default (torrent) => {
    // const requestedPieces = [];
    getPeers(torrent, peers => {
        // peers is an array of objects with ip and port properties
        const requestedPieces = new Pieces(torrent.info.pieces.length / 20);
        peers.forEach(peer => download(peer, torrent, requestedPieces));
    })
}
const download = (peer, torrent, requestedPieces) => {
    const socket = net.Socket();
    socket.on('error', console.log)
    socket.connect(peer.port, peer.ip, () => {
        // send handshake
        socket.write(buildHandshake(torrent));
    })
    // request queue
    const requestQueue = {choked: true, requestQueue: []};
    // listen for messages
    onWholeMsg(socket, msg => msgHandler(msg, socket, requestedPieces, requestQueue));
    socket.on('data', data => {

    })
}
const onWholeMsg = (socket, callback) => {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    socket.on('data', receivedBuf => {
        // message length (msgLen) function to calculate the length of a whole message
        const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readUInt32BE(0) + 4;
        savedBuf = Buffer.concat([savedBuf, receivedBuf]);

        while(savedBuf.length >= 4 && savedBuf.length >= msgLen()){
            callback(savedBuf.prototype.slice(0, msgLen()));
            savedBuf = savedBuf.prototype.slice(msgLen());
            handshake = false;
        }
    });
}
const msgHandler = (msg, socket, requestedPieces, requestQueue) => {
    if(isHandshake(msg)) {
        // send interested message
        socket.write(buildInterested());
    }else {
        const m = parse(msg);

        if(m.id === 0) chokeHandler(socket);
        if(m.id === 1) unChokeHandler(socket, requestedPieces, requestQueue);
        if(m.id === 4) haveHandler(m.payload);
        if(m.id === 5) bitfieldHandler(m.payload);
        if(m.id === 7) pieceHandler(m.payload);
    }
}
const isHandshake = msg => {
    return msg.length === msg.readUInt8(0) + 49 &&
        msg.toString('utf8', 1) === 'BitTorrent protocol';
}
const chokeHandler = () => {
    socket.end();
}
const unChokeHandler = (socket, requestedPieces, requestQueue) => {
    requestQueue.choked = false;
    requestPiece(socket, requestedPieces, requestQueue);
}
const haveHandler = (payload, socket, requestedPieces, requestQueue) => {
    const requestPiecesIndex = payload.readUInt32BE(0);
    requestQueue.push(requestPiecesIndex);
    if(requestQueue.length === 1) {
        requestPiece(socket, requestedPieces, requestQueue);
    }
    requestedPieces[requestPiecesIndex] = true;
}
const bitfieldHandler = payload => {
    console.log('bitfield', payload);
}
const pieceHandler = (payload, socket, requestedPieces, requestQueue) => {
    requestQueue.shift();
    requestPiece(socket, requestedPieces, requestQueue);
}
const requestPiece = (socket, requestedPieces, requestQueue) => {
    // check if the requestQueue is choked
    if(requestQueue.choked) return null;

    while(requestQueue.requestQueue.length) {
        const pieceIndex = requestQueue.shift();
        if(requestedPieces.needed(pieceIndex)) {
            // send a fix request
            socket.write(buildRequest(pieceIndex));
            requestedPieces.addRequested(pieceIndex);
            break;
        }
    }
}