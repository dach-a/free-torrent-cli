import fs from 'fs';
import bencode from 'bencode';
import { getPeers } from './src/tracker.js';

const torrent = bencode.decode(fs.readFileSync('puppy.torrent'));

getPeers( torrent, peers => {
    console.log('list of peers: ', peers);
})