import fs from 'fs';
import bencode from 'bencode';
import BigNum from 'bignum';

const open = (filePath) => {
    return bencode.decode(fs.readFileSync(filePath));
} 
const size = (torrent) => {
    const size = torrent.info.files ?
        torrent.info.files.map(file => file.length).reduce((a,b) => a + b) : torrent.info.length;

        return BigNum.toBuffer(size, { size: 8 });
}
const getInfoHash = (torrent) => {
    const info = bencode.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
} 

export default {
    open,
    size,
    getInfoHash
}