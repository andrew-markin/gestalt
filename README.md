# Gestalt

**Gestalt** is a simple open-source task manager with nested subtasks. Every task list (a *gestalt*) lives at its own unique URL, so sharing it is as easy as sending a link. All data is encrypted in the browser before it leaves your device.

**Try it:** https://gestalt.work

## Features

- **Nested tasks.** Subtasks to any depth; drag and drop to move and reorder them.
- **Three task states:** set, in progress and complete. A parent task's state is derived from its subtasks.
- **Sharing by link.** Anyone with the link can view and edit the gestalt in real time.
- **End-to-end encryption.** The server only ever sees encrypted data and never sees the key.
- **Offline-friendly.** Changes are kept in local storage and merged with remote changes once the connection is back.
- **Clone a gestalt** to reuse it as a template, or **reset all tasks** to start a checklist over.
- Light and dark themes, English and Russian interface.

## How it works

1. When you open the app, a random 256-bit key is generated and placed in the URL fragment (`https://gestalt.work/#/<key>`). Browsers never send the URL fragment to the server.
2. The gestalt is serialized to JSON, compressed with deflate and encrypted with AES (via [crypto-js](https://github.com/brix/crypto-js)) using that key.
3. The server stores and relays the encrypted data under a *reference*: an HMAC-SHA256 of the key. This lets the server identify a gestalt without learning the key.
4. Concurrent edits from multiple clients are merged on the client side. Each task and preference carries change timestamps, and the server keeps a version number for optimistic concurrency.

The sync backend is [Blobs](https://github.com/andrew-markin/blobs) (formerly Appository Sync), a small self-hosted Socket.IO server that stores opaque versioned blobs.

> **Note:** whoever has the link has full access to the gestalt. Treat the link as a password.

## Tech stack

Vue 2.7, Vuetify 2, Vuex 3, Vue Router 3, vue-i18n 8, Socket.IO client, built with Vue CLI 5 (webpack 5).

## Development

### Requirements

- Node.js 18 or newer
- A running [Blobs](https://github.com/andrew-markin/blobs) server (by default at `ws://localhost:3000`)

### Setup

```bash
npm install
```

Create `.env.development.local` and/or `.env.production.local` in the project root, using [`.env.example`](./.env.example) as a reference:

| Variable           | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `PORT`             | Port of the development server                                      |
| `VUE_APP_BACKEND`  | WebSocket URL of the Blobs server                                   |
| `VUE_APP_TOKEN`    | Bucket token (JWT) issued by the Blobs server, see below            |
| `VUE_APP_REF_SALT` | Salt for deriving gestalt references from keys                      |

To get a token, run `npm run token gestalt` in a Blobs checkout with the same `TOKEN_SECRET` as the server. The token gives access to the `gestalt` bucket only.

`VUE_APP_*` variables are embedded into the client bundle, so they are **not secrets**. They identify the application to the sync server. Data stays private because of the per-gestalt encryption key, not because of these values.

> **Warning:** changing `VUE_APP_REF_SALT` changes every gestalt reference, so all existing gestalts will appear empty.

### Scripts

| Command                    | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `npm start`                | Start the dev server with hot reload             |
| `npm run build`            | Build for production into `dist/`                |
| `npm run lint`             | Lint and auto-fix the sources                    |
| `npm run audit`            | Audit runtime dependencies for vulnerabilities   |
| `npm run vue-i18n-extract` | Report missing and unused translation keys       |

### Translations

Locale files live in [`src/locales`](./src/locales). To add a language, copy `en.json` to `<locale>.json`, translate the values and set `_LOCALE_TITLE` to the language's native name. It will show up in the menu automatically.

## Deployment

Every push and pull request is linted and built by the [CI workflow](.github/workflows/ci.yml), and pushes to `main` are deployed to GitHub Pages. The build takes the `VUE_APP_*` values from the repository secrets with the same names.

## License

Gestalt is released under the [GNU General Public License v3.0](./LICENSE).
