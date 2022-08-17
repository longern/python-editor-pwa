<script setup lang="ts">
import { basicSetup, EditorView } from "codemirror";
import { python } from "@codemirror/lang-python";

new EditorView({
  extensions: [basicSetup, python()],
  parent: document.getElementById("app") as HTMLElement,
});
</script>

<template></template>

<style>
.cm-editor {
  width: 100%;
  height: 100vh;
}
</style>
