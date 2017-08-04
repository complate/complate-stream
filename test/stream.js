"use strict";

module.exports = class WritableStream {
	constructor() {
		this._buffer = [];
	}

	writeln(msg) {
		this.write(`${msg}\n`);
	}

	write(msg) {
		this._buffer.push(msg);
	}

	flush() {
		// no-op
	}

	read() {
		return this._buffer.join("");
	}
};
