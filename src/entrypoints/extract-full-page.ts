import { extractFullPage } from "@/page/extract-full-page";

export default defineUnlistedScript({
  // Function injection drops imported dependencies, so this logic must ship as
  // a file. WXT defaults to an anonymous IIFE; without the generated global and
  // footer, main() is not the completion value and executeScript receives undefined.
  globalName: true,
  main: () => extractFullPage(document),
});
