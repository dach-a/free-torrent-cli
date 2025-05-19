import fs from 'fs';
import bencode from 'bencode';

const readTorrent = (filePath) => {
    try {
        const torrentData = fs.readFileSync(filePath);
        return bencode.decode(torrentData);
    } catch (error) {
        console.error('Error reading or decoding torrent file:', error.message);
        process.exit(1);
    }
}

const torrent = readTorrent('puppy.torrent');
console.log('Announce URL:', torrent.announce.toString('utf8'));


