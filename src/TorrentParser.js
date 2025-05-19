import fs from 'fs';
import bencode from 'bencode';

const open = (filePath) => {
    return bencode.decode(fs.readFileSync(filePath));
} 
const size = (torrent) => {}
const getInfoHash = (torrent) => {} 

export default {
    open,
    size,
    getInfoHash
}