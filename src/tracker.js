import URLParse from 'url-parse';
import dgram from 'dgram';
import { Buffer } from 'buffer';
import crypto from 'crypto';
import TorrentParser from './TorrentParser.js';
import { generateId } from './util.js';

export const getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf8');

    // send a connect request
    udpSend(socket, buildConnReq(), url);

    socket.on('message', response => {
        if (respType(response) === 'connect') {
            // receive and parse the connect response
            const connResp = parseConnResp(response);
            // send announce request
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
            udpSend(socket, announceReq, url);
        }else if (respType(response) === 'announce') {
            // parse the announce response
            const announceResp = parseAnnounceResp(response);
            // pass the peers to callback
            callback(announceResp.peers);
        }
    });
};

export const udpSend = (socket, message, rawUrl, callback = () => {}) => {
    const url = URLParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.host, callback)
}
export const respType = (resp) => {
    const action = resp.readUInt32BE(0);
    if (action === 0) return 'connect';
    if (action === 1) return 'announce';
}
export const buildConnReq = () => {
    const buf = Buffer.alloc(16);

    // get the connection id
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);

    // get the action
    buf.writeUInt32BE(0, 8);

    // get the transaction id
    crypto.randomBytes(4).copy(buf, 12);
    return buf;
}
export const parseConnResp = (resp) => {
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.splice(8)
    }
}
export const buildAnnounceReq = (connId, torrent, port=6881) => {
    const buf = Buffer.allocUnsafe(98);

    // get the connection id
    connId.copy(buf, 0);

    // get the action
    buf.writeUInt32BE(1, 8);

    // get the transaction id
    crypto.randomBytes(4).copy(buf, 12);

    // get the info hash
    TorrentParser.getInfoHash(torrent).copy(buf, 16);

    // get the peer id
    generateId().copy(buf, 36);

    // get the downloaded, left, and uploaded bytes
    Buffer.alloc(8).copy(buf, 56);
    TorrentParser.size(torrent).copy(buf, 64);
    Buffer.alloc(8).copy(buf, 72);

    // get the event
    buf.writeUInt32BE(0, 80);

    // get the ip address
    buf.writeUInt32BE(0, 80);

    // get the key
    crypto.randomBytes(4).copy(buf, 88);

    // get the num want
    buf.writeUInt32BE(-1, 92);

    // get the port
    buf.writeUInt16BE(port, 96);
    return buf;
}
export const parseAnnounceResp = (resp) => {
    function group(iterable, groupSize){
        let groups = [];
        for (let i = 0; i < iterable.length; i += groupSize) {
            groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
    }
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
            return {
                ip: address.slice(0, 4).join('.'),
                port: address.readUInt16BE(4)
            }
        })
    }
}
