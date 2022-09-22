<script setup lang="ts">
import { basicSetup, EditorView } from "codemirror";
import { python } from "@codemirror/lang-python";
import { onMounted, ref } from "vue";

import { PythonProcess } from "./pyworker";

const editorElement = ref<HTMLElement | null>(null);
let editor: EditorView | null = null;
const showTerminal = ref(false);
const terminal = ref("");
const askForInput = ref(false);

onMounted(() => {
  editor = new EditorView({
    extensions: [basicSetup, python()],
    parent: editorElement.value as HTMLElement,
  });
});

async function run() {
  if (!editor) return;
  terminal.value = "";
  showTerminal.value = true;
  const process = new PythonProcess(editor.state.doc.toString());
  process.onstdin = async () => {
    askForInput.value = true;
    return "test";
  };
  process.onstdout = process.onstderr = (data: string) => {
    terminal.value += data;
  };
}
</script>

<template>
  <div ref="editorElement" class="editor"></div>
  <div class="mobile-toolbar">
    <button class="run-btn" @click="run">Run</button>
  </div>
  <div
    v-if="showTerminal"
    v-text="terminal"
    class="terminal"
    @click="showTerminal = false"
  ></div>
</template>

<style>
#app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor {
  flex-grow: 1;
}

.cm-editor {
  height: 100%;
}

.mobile-toolbar {
  height: 48px;
  flex-shrink: 0;
}

.run-btn {
  width: 100%;
  height: 100%;
}

.terminal {
  position: fixed;
  background-color: black;
  color: white;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 8px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  overflow-y: auto;
  font-family: Consolas, monospace;
}
</style>
