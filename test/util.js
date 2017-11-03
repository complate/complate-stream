export class BufferedLogger {
	constructor() {
		this.reset();

		// support element generators' expectation of a stand-alone function
		this.log = this.log.bind(this);
	}

	log(type, message) {
		this.messages.push({ type, message });
	}

	reset() {
		this.messages = [];
	}

	get all() {
		return this.messages.slice(0);
	}
}

export class WritableStream {
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
