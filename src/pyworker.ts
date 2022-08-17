const worker = new Worker(new URL("./worker.js", import.meta.url));

const callbacks: Record<number, (data: any) => void> = {};

worker.onmessage = (event) => {
  const { id, ...data } = event.data;
  const onSuccess = callbacks[id];
  delete callbacks[id];
  onSuccess(data);
};

export const runPython = (() => {
  let id = 0; // identify a Promise
  return (script: string, context: any) => {
    // the id could be generated more carefully
    id = (id + 1) % Number.MAX_SAFE_INTEGER;
    return new Promise((onSuccess) => {
      callbacks[id] = onSuccess;
      worker.postMessage({
        ...context,
        python: script,
        id,
      });
    });
  };
})();
