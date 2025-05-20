import net from 'net';
import { Buffer } from 'buffer';
import { getPeers } from './tracker.js';

export default (torrent) => {
    getPeers(torrent, peers => {
        peers.forEach(download)
    })
}
const download = (peer) => {
    const socket = net.Socket();
    socket.on('error', console.log)
    socket.connect(peer.port, peer.ip, () => {

    })
    onWholeMsg(socket, data => {

    });
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