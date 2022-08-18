const utf8encoder = new TextEncoder();

export class PythonProcess {
  id: string;
  script: string;
  onstdin: (() => Promise<string>) | undefined;
  onstdout: ((data: string) => void) | undefined;
  onstderr: ((data: string) => void) | undefined;
  worker: Worker;
  stdoutBuffer: string = "";
  stderrBuffer: string = "";
  stdinLock: Int32Array;
  stdinBuffer: Uint8Array;

  constructor(script: string) {
    this.id = crypto.randomUUID();
    this.script = script;

    this.worker = new Worker(new URL("./worker.js", import.meta.url), {
      credentials: "same-origin",
    });
    this.stdinLock = new Int32Array(new SharedArrayBuffer(4));
    this.stdinBuffer = new Uint8Array(new SharedArrayBuffer(1024));

    this.worker.postMessage({
      type: "run",
      id: this.id,
      python: script,
      stdinLock: this.stdinLock.buffer,
      stdinBuffer: this.stdinBuffer.buffer,
    });

    this.worker.onmessage = (event) => {
      switch (event.data.type) {
        case "stdout":
          if (this.onstdout) {
            this.onstdout(event.data.data);
          }
          break;
        case "stderr":
          if (this.onstderr) {
            this.onstderr(event.data.data);
          }
          break;
        case "stdin":
          if (this.onstdin) {
            this.onstdin().then((data) => {
              this.stdinBuffer.set(utf8encoder.encode(data));
              Atomics.store(this.stdinLock, 0, data.length);
              Atomics.notify(this.stdinLock, 0);
            });
          }
          break;
        case "exit":
          this.worker.terminate();
          break;
        case "error":
          if (this.onstderr) {
            this.onstderr(event.data.error);
          }
          this.worker.terminate();
          break;
      }
    };
  }
}
