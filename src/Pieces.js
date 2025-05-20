export default class Pieces {
	constructor(totalPieces) {
        this.requested = new Set();
        this.received = new Set();
        this.total = totalPieces;
    }

    // create an array of requested and received pieces
    need(pieceIndex) {
        return !this.requested.has(pieceIndex) && !this.received.has(pieceIndex);
    }

    // add requested pieces
    addRequested(pieceIndex) {
        this.requested.add(pieceIndex);
    }
    // add received pieces
    addReceived(pieceIndex) {
        this.received.add(pieceIndex);
        this.requested.delete(pieceIndex);
    }

    // get remaining pieces
    get remaining() {
        return this.total - this.received.size;
    }

    // check if all pieces are received
    isDone() {
        return this.received.every(i => i === true);
    }
}