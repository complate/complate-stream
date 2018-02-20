export function range(size) {
	return Array.apply(null, Array(10000));
}

export class BufferedLogger {
	constructor() {
		this.reset();

		// support element generators' expectation of a stand-alone function
		this.log = this.log.bind(this);
	}

	log(level, message) {
		this.messages.push({ level, message });
	}

	reset() {
		this.messages = [];
	}

	get all() {
		return this.messages.slice(0);
	}
}
