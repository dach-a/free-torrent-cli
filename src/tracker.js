import URLParse from 'url-parse';
import dgram from 'dgram';
import { Buffer } from 'buffer';
import crypto from 'crypto';

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
            const announceReq = buildAnnounceReq(connResp.connectionId);
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
export const respType = (resp) => {}
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
export const buildAnnounceReq = (connId) => {}
export const parseAnnounceResp = (resp) => {}
