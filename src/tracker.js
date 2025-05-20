import URLParse from 'url-parse';
import dgram from 'dgram';
import { Buffer } from 'buffer';
import crypto from 'crypto';
import { getInfoHash, size } from './TorrentParser.js';
import { generatePeerId } from './util.js';

export function getPeers (torrent, clientPort, callback) {
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf8');

    // send a connect request
    udpSend(socket, buildConnReq(), url);

    // confirm socket on and get callback response
    socket.on('message', response => {
        if (respType(response) === 'connect') {
            // receive and parse the connect response
            const connResp = parseConnResp(response);
            // send announce request
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent, clientPort);
            udpSend(socket, announceReq, url);
        }else if (respType(response) === 'announce') {
            // parse the announce response
            const announceResp = parseAnnounceResp(response);
            // pass the peers to callback
            callback(announceResp.peers);
        }
    });
};

export function udpSend (socket, message, rawUrl, callback = () => {}) {
    // parse url and initiate UDP message
    const url = URLParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.host, callback)
}

export function respType (resp) {
    // assess response to determine action -> connect or announce 
    const action = resp.readUInt32BE(0);
    if (action === 0) return 'connect';
    if (action === 1) return 'announce';
}

export function buildConnReq () {
    const buffer = Buffer.alloc(16);

    // get the connection id
    buffer.writeUInt32BE(0x417, 0);
    buffer.writeUInt32BE(0x27101980, 4);

    // get the action
    buffer.writeUInt32BE(0, 8);

    // get the transaction id
    crypto.randomBytes(4).copy(buffer, 12);
    return buffer;
}

export function parseConnResp (resp) {
    // parse connection response
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.subarray(8)
    }
}

export function buildAnnounceReq (connId, torrent, port=6881) {
    // initiate port validation
    if(typeof port !== 'number' || port <= 0 || port >= 65536) {
        throw new Error(`Invalid client port assigned: ${port}. Switching to default port 6881`);
        port = 6881; // fallback to default
    }

    const buffer = Buffer.allocUnsafe(98);

    // get the connection id
    connId.copy(buffer, 0);

    // get the action
    buffer.writeUInt32BE(1, 8);

    // get the transaction id
    crypto.randomBytes(4).copy(buffer, 12);

    // get the info hash
    getInfoHash(torrent).copy(buffer, 16);

    // get the peer id
    generatePeerId().copy(buffer, 36);

    // get the downloaded, left, and uploaded bytes
    Buffer.alloc(8).copy(buffer, 56);
    size(torrent).copy(buffer, 64);
    Buffer.alloc(8).copy(buffer, 72);

    // get the event
    buffer.writeUInt32BE(0, 80);

    // get the ip address
    buffer.writeUInt32BE(0, 80);

    // get the key
    crypto.randomBytes(4).copy(buffer, 88);

    // get the num want
    buffer.writeUInt32BE(-1, 92);

    // get the port
    buffer.writeUInt16BE(port, 96);
    return buffer;
};

export function parseAnnounceResp (resp) {
    // parse announce response from peer group
    function group(iterable, groupSize){
        let groups = [];
        for (let i = 0; i < iterable.length; i += groupSize) {
            groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
    }

    // return the parsed response
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
            if(!address || address.length < 6) return null; // skip invalid peer
            const port = address.readUInt16BE(4);
            if(port <= 0 || port >= 65536) return null; // skip invalid peer
            return {
                ip: address.slice(0, 4).join('.'),
                port: port
            }
        }).filter(Boolean) // remove invalid peers
    }
}
