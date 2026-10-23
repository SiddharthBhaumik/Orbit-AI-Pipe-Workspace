# Orbit — AI Pipe Workspace

A polished, responsive OpenAI-model chat workspace built with React, TypeScript, and Vite. Connect through AI Pipe sign-in or paste an AI Pipe token, discover supported chat models live, and compare model responses in one conversation.

## Features

- **AI Pipe sign-in** using the official `getProfile()` helper and redirect flow, plus manual token entry.
- **OpenAI-only model catalogue** loaded from AI Pipe's OpenAI-compatible endpoint, filtered to chat-capable text models.
- **OpenAI chat completions** with Markdown, GitHub-flavoured Markdown, code blocks, tables, and copy response.
- **Compare mode** to run the same prompt through two models.
- **Conversation history** stored in browser local storage.
- **System instructions** and response-style preferences.
- **Responsive dark workspace** for desktop and mobile.
- **GitHub Pages deployment** via GitHub Actions.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL Vite prints. In the app, open **Settings → Continue with AI Pipe**, or paste a token you already have from [AI Pipe](https://aipipe.org/).

Useful checks:

```bash
npm run typecheck
npm run build
npm run preview
```

## AI Pipe endpoints

Orbit uses only the OpenAI-compatible base URL `https://aipipe.org/openai/v1`.

- `GET /models` — fetches the OpenAI model catalogue; Orbit filters out non-chat model families and any model with a non-null announced shutdown date, including models scheduled for future retirement.
- `POST /chat/completions` — sends non-streaming OpenAI chat-completion requests. Model IDs are sent exactly as returned by the OpenAI catalogue; there is no OpenRouter fallback.
- Sign-in redirect: `https://aipipe.org/login?redirect=<current-url>`

The app uses the token only in browser requests to AI Pipe. It does not use a custom backend or send credentials to an Orbit server. If a request returns an authentication error, Orbit flags the token as rejected/possibly expired and asks you to reconnect; token changes made elsewhere are detected on the next API request, not by a background watcher.

## Token handling and security

- Tokens are stored in this browser's **localStorage** so sign-in can survive browser restarts. Disconnecting removes Orbit's saved token.
- AI Pipe's sign-in callback token is consumed on page load and removed from the visible URL with `history.replaceState`. The official helper is also asked to restore the AI Pipe profile on later visits.
- Chat history and authentication are stored in local storage. Do not use this on a shared computer if your conversations or token are sensitive.
- Never commit a real API token, put one in a public environment variable, or paste one into an issue or screenshot.
- Browser-side apps cannot make a secret embedded in client code truly private. For personal use, use a token you can rotate and understand the provider's usage limits.

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy.yml`.

1. Push the project to the `main` branch.
2. Open **Settings → Pages** in GitHub.
3. Set the build and deployment source to **GitHub Actions**.
4. Open the **Actions** tab and wait for the Pages workflow to complete.
5. Your site will be published at `https://SiddharthBhaumik.github.io/Orbit-AI-Pipe-Workspace/`.

The Vite base path is configured for the repository's GitHub Pages URL during Actions builds.

## Stack

React · TypeScript · Vite · CSS · lucide-react · react-markdown · remark-gfm · AI Pipe

## License

MIT. See [LICENSE](LICENSE).


## OpenAI model health checks

The `.github/workflows/model-health.yml` workflow can be run manually from **Actions → Check OpenAI model availability → Run workflow** and runs weekly on a schedule. It calls the AI Pipe OpenAI-compatible `/models` endpoint, sends a small chat-completion probe to each eligible non-retired chat model, and writes the sanitized per-model results to `public/model-health.json`. Orbit reads that report and shows models whose probe returned text.

Before running it, add an Actions repository secret named `AI_PIPE_TOKEN` containing your AI Pipe token:

1. Open **Settings → Secrets and variables → Actions** in the repository.
2. Choose **New repository secret**.
3. Set the name to `AI_PIPE_TOKEN` and paste the token as its value.
4. Open **Actions → Check OpenAI model availability → Run workflow** to run the first test.

The token is only passed to the workflow as an environment secret; it is never written into the generated catalogue. The probe uses your token/account, so results reflect access through that account and may consume a small amount of usage for each model. A successful probe confirms a short text response worked at test time; it does not guarantee long-context, tool, image, or other capabilities. The workflow records non-working outcomes and updates the published model-health file, then dispatches the Pages deployment when that file changes.
