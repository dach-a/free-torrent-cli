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
    socket.on('data', data => {
        
    })
}