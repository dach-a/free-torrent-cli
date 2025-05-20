import { readFile } from 'fs/promises';
import bencode from 'bencode';
import crypto from 'crypto';


export async function open (filePath){
    const data = await readFile(filePath);
    return bencode.decode(data);
}

export function size (torrent){
    const total = torrent.info.files?.reduce((sum, file) => sum + file.length, 0) || torrent.info.length;
    return Buffer.alloc(8, total.toString(16), 'hex');
}

export function getInfoHash (torrent){
    const info = bencode.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
} 

export default {
    open,
    size,
    getInfoHash
}