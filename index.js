import { getPeers } from './src/tracker.js';
import { torrent } from './src/download.js';
import TorrentParser from './src/TorrentParser.js';


const torrent = TorrentParser.open(process.argv[2]);
Download(torrent)