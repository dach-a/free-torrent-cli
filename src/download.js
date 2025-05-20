import net from 'net';
import { Buffer } from 'buffer';
import { getPeers } from './tracker.js';
import { buildHandshake, buildInterested, parse } from './Message.js';

export default (torrent) => {
    getPeers(torrent, peers => {
        // peers is an array of objects with ip and port properties
        peers.forEach(peer => download(peer, torrent));
    })
}
const download = (peer, torrent) => {
    const socket = net.Socket();
    socket.on('error', console.log)
    socket.connect(peer.port, peer.ip, () => {
        // send handshake
        socket.write(buildHandshake(torrent));
    })
    // listen for messages
    onWholeMsg(socket, msg => msgHandler(msg, socket));
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
const msgHandler = (msg, socket) => {
    if(isHandshake(msg)) {
        // send interested message
        socket.write(buildInterested());
    }else {
        const m = parse(msg);

        if(m.id === 0) chokeHandler();
        if(m.id === 1) unChokeHandler();
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
    console.log('choke');
}
const unChokeHandler = () => {
    console.log('unChoke');
}
const haveHandler = payload => {
    console.log('have', payload);
}
const bitfieldHandler = payload => {
    console.log('bitfield', payload);
}
const pieceHandler = payload => {
    console.log('piece', payload);
}