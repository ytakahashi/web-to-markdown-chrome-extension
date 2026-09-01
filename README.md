# Web to Markdown

A Chrome extension that extracts the current page and copies clean Markdown.
Extraction and conversion happen locally; the extension does not send page
content to an external service.

## Requirements

- Node.js 24 or later
- pnpm

## Development

Install the exact dependency versions recorded in the lockfile:

```sh
pnpm install --frozen-lockfile
```

Start WXT in development mode:

```sh
pnpm dev
```

For a production build, run:

```sh
pnpm build
```

Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**,
and select `.output/chrome-mv3`.

To create the Chrome Web Store archive:

```sh
pnpm zip # Writes the archive under `.output`.
```

## Usage

1. Open a regular web page.
2. Select **Web to Markdown** in the Chrome toolbar.
3. Keep the default **Article** mode for the main content, or select **Full page**
   to convert the entire document.
4. Review the read-only Markdown output.
5. Select **Copy** and paste the result into an editor.
6. If article extraction is unavailable, select **Convert entire page**. This
   selects the same **Full page** mode shown in the header.

Chrome internal pages, the Chrome Web Store, local `file:` URLs, and PDF viewer
pages do not allow this extension to inject its extractor. The popup reports
those pages as unsupported.

## Quality checks

Run the same checks used before packaging:

```sh
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm build
pnpm zip
```
