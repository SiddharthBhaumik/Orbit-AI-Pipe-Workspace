# Orbit — AI Workspace

Orbit is a browser-based AI chat workspace for exploring ideas, writing and debugging code, analyzing data, and comparing responses from supported language models.

**Live website:** https://siddharthbhaumik.github.io/Orbit-AI-Pipe-Workspace/

## Get started

1. Open the [Orbit website](https://siddharthbhaumik.github.io/Orbit-AI-Pipe-Workspace/).
2. Open **Preferences** (the settings control) and find **Connect AI Pipe**.
3. Visit the full URL https://aipipe.org/login
4. Sign in to AI Pipe and create an API token in your AI Pipe account.
5. Copy the token, return to Orbit, paste it into the **AI Pipe token** field, and choose **Connect token**.
6. Open a conversation, choose an available model, and start chatting. Use **Compare** to send the same prompt to a second model when that option is available.

Orbit uses the token you provide to make requests to AI Pipe. It does not require a separate Orbit account. Model availability depends on the AI Pipe account and current provider access.

## What you can do

- Chat with supported text models through AI Pipe's OpenAI-compatible API.
- Compare responses from two models.
- Review and copy formatted responses, including code, tables, and Markdown.
- Keep conversation history in the current browser.
- Adjust system instructions and response preferences.
- Choose between three visual themes: **Astral Indigo**, **Gothic Observatory**, and **Infernal Eclipse**.
- Use the responsive interface on desktop or mobile.

## Privacy and token safety

- Orbit stores the AI Pipe token and conversation history in this browser's local storage so they can persist between visits.
- Your token is sent to AI Pipe to authenticate model requests. Orbit's static website does not operate its own chat backend.
- Use a personal device where possible. On a shared device, disconnect from Orbit and clear browser data when finished.
- Never share your token, commit it to a repository, or include it in screenshots, support requests, or public issues. If a token is exposed, revoke or rotate it through AI Pipe.
- Responses and model availability depend on AI Pipe and the selected model's current capabilities, limits, and access rules.

## Troubleshooting

**The token is rejected:** Check that it was copied completely and is still active. Create a new token at https://aipipe.org/login if necessary, then replace the saved token in Orbit's Preferences.

**A model is missing or fails:** Refresh the model catalogue and try another available model. The catalogue and automated availability checks can change as provider access and model support change.

**The site looks out of date:** Hard-refresh the page (Ctrl + Shift + R on Windows/Linux) after a deployment.

## For contributors

Orbit is built with React, TypeScript, Vite, CSS, and lucide-react. It is deployed to GitHub Pages using GitHub Actions.

### Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Use the local URL printed by Vite. Useful checks:

```bash
npm run typecheck
npm run build
npm run preview
```

### API integration

Orbit uses the AI Pipe OpenAI-compatible base URL `https://aipipe.org/openai/v1`:
- `GET /models` loads the available model catalogue.
- `POST /chat/completions` sends chat requests.

Orbit does not use OpenRouter. Authentication is by manually supplied AI Pipe token; there is no redirect-based sign-in flow.

### Deployment

The `.github/workflows/deploy.yml` workflow builds and deploys the site to GitHub Pages. The Vite base path is configured for this repository's Pages URL.

### Model availability workflow

Maintainers can optionally run **Actions → Check OpenAI model availability**. It probes eligible models using an Actions secret named `AI_PIPE_TOKEN` and updates `public/model-health.json`. Probes use the configured AI Pipe account and may consume usage. This maintenance workflow is separate from a visitor connecting their token in Orbit.

## License

MIT. See [LICENSE](LICENSE).
