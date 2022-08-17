<script setup lang="ts">
import { basicSetup, EditorView } from "codemirror";
import { python } from "@codemirror/lang-python";
import { onMounted, ref } from "vue";

import { runPython } from "./pyworker";

const editorElement = ref<HTMLElement | null>(null);
let editor: EditorView | null = null;

onMounted(() => {
  editor = new EditorView({
    extensions: [basicSetup, python()],
    parent: editorElement.value as HTMLElement,
  });
});

async function run() {
  if (!editor) return;
  runPython(editor.state.doc.toString(), {});
}
</script>

<template>
  <div ref="editorElement" class="editor"></div>
  <div class="mobile-toolbar">
    <button @click="run">Run</button>
  </div>
</template>

<style>
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
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
</style>
