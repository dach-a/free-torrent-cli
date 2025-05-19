import crypto from 'crypto';

let id = null;

export const generateId = () => {
    if(!id) {
        id = crypto.randomBytes(20);
        Buffer.from('-TR2930-').copy(id, 0);
    }
    return id;
}
