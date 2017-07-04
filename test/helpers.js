let crypto = require("crypto");

// generates pseudo-unique IDs
exports.uid = _ => {
	let id = new Date() * Math.random();
	return exports.generateHash(`${id}`);
};

exports.generateHash = str => {
	let hash = crypto.createHash("md5");
	hash.update(str);
	return hash.digest("hex");
};
