import { open } from './src/TorrentParser.js';
import downloadTorrent from './src/download.js';

async function main() {
    try {
        const torrent = await open(process.argv[2]);
        downloadTorrent(torrent);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}
main();