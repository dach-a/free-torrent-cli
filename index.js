import { getPeers } from './src/tracker.js';
import TorrentParser from './src/TorrentParser.js';


const torrent = TorrentParser.open('puppy.torrent');
getPeers( torrent, peers => {
    console.log('list of peers: ', peers);
})