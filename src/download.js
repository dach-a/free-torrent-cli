import net from 'net';
import { getPeers } from './tracker.js';
import { buildHandshake, buildInterested, buildRequest, parseMessage } from './Message.js';
import Pieces from './Pieces.js';

export default async function download(torrent){
    // const requestedPieces = [];
    try {
        // get peers from tracker
        const peers = await new Promise((resolve, reject) => getPeers(torrent, (peers, err) => err ?  reject(err) : resolve(peers)));
        // get the message pieces from torrent
        const pieces = new Pieces(torrent.info.pieces.length / 20);
        const MAX_CONCURRENT_CONNECTIONS = 5;

        // create connection pool
        peers.slice(0, MAX_CONCURRENT_CONNECTIONS).forEach(peer => 
            connectToPeer(peer, torrent, pieces)
        )
    } catch (error) {
        console.error('Download error:', error.message);
    }
}

function connectToPeer(peer, torrent, requestedPieces){
    // create a new socket for connection
    const socket = net.Socket();
    const requestQueue = {choked: true, requestQueue: []};

    socket.on('error', err => 
        console.error(`Peer ${peer.ip}:${peer.port} error:`, err.message)
    );

    socket.connect(peer.port, peer.ip, () => {
        // initiate handshake
        socket.write(buildHandshake(torrent));
        setupMessageHandler(socket, requestedPieces, requestQueue);
    });
    return socket;
}

function setupMessageHandler(socket, requestedPieces, requestQueue){
    let buffer = Buffer.alloc(0);
    let handshake = true;

    socket.on('data', data => {
        buffer = Buffer.concat([buffer, data]);
        processBuffer();
    });

    function processBuffer(){
        try {
            const length = handhsake ? buffer[0] + 49 : buffer.readUInt32BE(0) + 4;

            if(buffer.length >= length) {
                const message = buffer.subarray(0, length);
                buffer = buffer.subarray(length);
                handshake = false;
                handleMessage(message);
                processBuffer();
            }
        } catch (error) {
            console.error('Message processing error:', error.message);
            socket.destroy();
        }
    }

    function handleMessage(msg) {
        if (isHandshake(msg)) {
            socket.write(buildInterested());
            return
        }

        const { id, payload } = parseMessage(msg);
        switch (id) {
            case 0: handleChoke(); break;
            case 1: handleUnchoke(); break;
            case 4: handleHave(payload); break;
            case 5: handleBitfield(payload); break;
            case 7: handlePiece(payload); break;
        }
    }

    function isHandshake (msg){
        return msg.length === msg.readUInt8(0) + 49 &&
            msg.toString('utf8', 1) === 'BitTorrent protocol';
    }

    function handleChoke(){
        socket.end();
    }

    function handleUnchoke(socket, requestedPieces, requestQueue){
        requestQueue.choked = false;
        requestPiece(socket, requestedPieces, requestQueue);
    }

    function handleHave(payload, socket, requestedPieces, requestQueue){
        const requestPiecesIndex = payload.readUInt32BE(0);
        requestQueue.push(requestPiecesIndex);
        if(requestQueue.length === 1) {
            requestPiece(socket, requestedPieces, requestQueue);
        }
        requestedPieces[requestPiecesIndex] = true;
    }

    function handleBitfield (payload){
        console.log('bitfield', payload);
    }

    function handlePiece(payload, socket, requestedPieces, requestQueue){
        requestQueue.shift();
        requestPiece(socket, requestedPieces, requestQueue);
    }
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