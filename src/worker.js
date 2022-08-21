const scriptCache = {};

self.builtinImportScripts = self.importScripts;
self.importScripts = function (...urls) {
  urls.forEach((url) => {
    if (url in scriptCache) self.builtinImportScripts(scriptCache[url]);
    else self.builtinImportScripts(url);
  });
};
self.importScripts.cache = async function (url) {
  const script = await fetch(url).then((response) => response.text());
  scriptCache[url] =
    "data:text/javascript;charset=UTF-8," + encodeURIComponent(script);
};

const utf8Decoder = new TextDecoder();

function addMessageListener(type, handler) {
  if (typeof addMessageListener.listeners === "undefined") {
    addMessageListener.listeners = {};
  }
  addMessageListener.listeners[type] = handler;
}

async function loadPyodideAndPackages() {
  const indexUrl = "https://cdn.jsdelivr.net/pyodide/v0.21.0/full/";
  await Promise.all([
    self.importScripts.cache(`${indexUrl}pyodide.js`),
    self.importScripts.cache(`${indexUrl}pyodide.asm.js`),
  ]);
  importScripts(`${indexUrl}pyodide.js`);

  self.pyodide = await loadPyodide({
    fullStdLib: false,
    indexURL: indexUrl,
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
      return utf8Decoder.decode(self.stdinBuffer.slice(0));
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
  addMessageListener.listeners[event.data.type](event.data);
};
