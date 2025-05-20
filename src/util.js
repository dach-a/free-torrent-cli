import crypto from 'crypto';

const id = null;

export function generatePeerId() {
    if(!id) {
        id = crypto.randomBytes(20);
        Buffer.from('-TR2930-').copy(id, 0);
    }
    return id;
}
