importScripts("https://pe.longern.com/pyodide/v0.21.0/full/pyodide.js");

const messageDispatcher = {};
const utf8decoder = new TextDecoder();

function addMessageListener(type, handler) {
  messageDispatcher[type] = handler;
}

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide({
    stdout: (msg) => {
      if (msg === "Python initialization complete") return;
      self.postMessage({ type: "stdout", data: msg + "\n" });
    },
    stderr: (msg) => {
      self.postMessage({ type: "stderr", data: msg + "\n" });
    },
    stdin: () => {
      self.postMessage({ type: "stdin" });
      Atomics.wait(self.stdinLock, 0, 0);
      return utf8decoder.decode(self.stdinBuffer.slice(0));
    },
  });
}
let pyodideReadyPromise = loadPyodideAndPackages();

addMessageListener("run", async (data) => {
  // make sure loading is done
  await pyodideReadyPromise;
  const { id, python, stdinBuffer, stdinLock } = data;
  self.stdinLock = new Int32Array(stdinLock);
  self.stdinBuffer = new Uint8Array(stdinBuffer);
  try {
    await self.pyodide.loadPackagesFromImports(python);
    await self.pyodide.runPythonAsync(python);
    self.postMessage({ type: "exit", id });
  } catch (error) {
    self.postMessage({ type: "error", id, error: error.message });
  }
});

self.onmessage = async (event) => {
  const handler = messageDispatcher[event.data.type];
  handler(event.data);
};
