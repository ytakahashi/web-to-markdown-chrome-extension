import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Web to Markdown",
    description: "Convert the current web page to Markdown locally.",
    permissions: ["activeTab", "scripting", "clipboardWrite"],
  },
});
