Certainly! Here are short demo programs for each of the mentioned Node.js modules: `os`, `http`, `events`, `stream`, and `fs`.

### 1. `os` Module Demo

The `os` module provides operating system-related utility methods and properties.

```javascript
const os = require("os");

console.log("Operating System:", os.type());
console.log("OS Platform:", os.platform());
console.log("OS Architecture:", os.arch());
console.log("Total Memory:", os.totalmem());
console.log("Free Memory:", os.freemem());
console.log("Uptime:", os.uptime());
console.log("Home Directory:", os.homedir());
console.log("User Info:", os.userInfo());
```

### 2. `http` Module Demo

The `http` module allows you to create an HTTP server.

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello, World!\n");
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Server running at http://127.0.0.1:3000/");
});
```

### 3. `events` Module Demo

The `events` module allows you to create and handle custom events.

```javascript
const EventEmitter = require("events");

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

myEmitter.on("event", () => {
  console.log("An event occurred!");
});

console.log("Before event");
myEmitter.emit("event");
console.log("After event");
```

### 4. `stream` Module Demo

The `stream` module provides a way of handling streaming data.

```javascript
const { Readable, Writable } = require("stream");

const readable = new Readable({
  read() {
    this.push("Hello, ");
    this.push("World!\n");
    this.push(null);
  },
});

const writable = new Writable({
  write(chunk, encoding, callback) {
    console.log(chunk.toString());
    callback();
  },
});

readable.pipe(writable);
```

### 5. `fs` Module Demo

The `fs` module allows you to work with the file system.

```javascript
const fs = require("fs");

// Write to a file
fs.writeFile("example.txt", "Hello, World!", (err) => {
  if (err) throw err;
  console.log("File has been written.");

  // Read the file
  fs.readFile("example.txt", "utf8", (err, data) => {
    if (err) throw err;
    console.log("File contents:", data);

    // Append to the file
    fs.appendFile("example.txt", "\nAppended text.", (err) => {
      if (err) throw err;
      console.log("Text has been appended.");

      // Read the file again
      fs.readFile("example.txt", "utf8", (err, data) => {
        if (err) throw err;
        console.log("Updated file contents:", data);
      });
    });
  });
});
```

Each of these short programs demonstrates basic functionality of the respective Node.js modules. You can run these examples in a Node.js environment to see how they work.
