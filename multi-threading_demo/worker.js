const { parentPort } = require("worker_threads");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async function iife() {
  while (true) {
    let lifespan = 5000;
    for (let i = lifespan; i >= 1; i--) {
      console.log({ i });
      await sleep(1);
    }
    parentPort?.postMessage({
      from: "node_1",
      message: "died - time to start election",
    });

    
  }
})();
