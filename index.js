import fs from 'fs';

const readTorrent = (filePath) => {
    try {
        const torrentData = fs.readFileSync(filePath);
        return torrentData.toString('utf8');
    } catch (error) {
        console.error('Error reading torrent file:', error.message);
        process.exit(1);
    }
}

const torrent = readTorrent('puppy.torrent');
console.log(torrent)

