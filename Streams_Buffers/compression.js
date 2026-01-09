const fs = require("fs");
const zlib = require("zlib");

// readable stream (input file)
const readable = fs.createReadStream("input.txt");

// writable stream (compressed output file)
const writable = fs.createWriteStream("input.txt.gz");

// Pipe through a transform stream (gzip compression)
readable.pipe(zlib.createGzip()).pipe(writable);

console.log("File successfully compressed!");
