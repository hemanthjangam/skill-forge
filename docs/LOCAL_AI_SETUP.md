# Local AI Setup

SkillForge now supports two AI providers behind the same backend abstraction:

- `gemini`: existing hosted provider flow
- `ollama`: local model inference through `http://localhost:11434/api/chat`

## What changed in the code

- Backend provider switch: `app.ai.provider`
- Local Ollama config:
  - `app.ai.ollama.base-url`
  - `app.ai.ollama.model`
  - `app.ai.ollama.timeout-ms`
- The following features use the provider abstraction:
  - AI tutor teach/doubt/feedback
  - AI mock generation
  - AI exam generation

## Recommended local models

- `qwen2.5:14b`
  - Best default for this repo
  - Good balance of structured JSON output, coding/domain reasoning, and local hardware cost
- `qwen2.5:7b`
  - Use this if your machine cannot comfortably run 14B
  - Lower quality for nuanced tutoring/exam generation
- `qwen2.5:32b`
  - Better quality, but only realistic with stronger GPU/VRAM

For this project, the practical target is `qwen2.5:14b` on a machine with a capable GPU. CPU-only is possible, but response times will be much slower.

## Setup steps

1. Install Ollama.
2. Pull the model you want:

```bash
ollama pull qwen2.5:14b
```

3. Verify the model is available:

```bash
ollama list
```

4. Start the backend with local AI enabled:

```bash
AI_PROVIDER=ollama OLLAMA_MODEL=qwen2.5:14b ./mvnw spring-boot:run
```

5. Start the frontend as usual:

```bash
cd frontend
npm run dev
```

## Production-minded guidance

Running a local model can be good enough for an internal or controlled deployment, but "prod-level" results do not come only from downloading a model. You need:

- Strong prompts with strict JSON contracts
- Course-grounded context, not generic chat
- Fallback logic when generation fails
- Persisted exam definitions instead of regenerating every request
- Monitoring for timeout/empty/invalid-model outputs
- Clear separation between tutoring, exam generation, and grading flows

This repo now has those foundations, but the following work is still needed for a harder production bar:

- add retrieval over lesson content instead of only prompt-assembling course/module text
- add evaluation datasets for tutor answer quality and exam validity
- add browser vision or native CV services for real face/object/head-motion proctoring
- add rate limiting, retries, tracing, and audit logs for AI calls
- add async job handling for long model generations

## Suggested rollout order

1. Start with `qwen2.5:14b`.
2. Validate tutor JSON stability and exam quality on your real courses.
3. If output quality is still weak, improve prompt/context first.
4. Move to a larger model only if hardware allows and prompt/context cleanup is no longer the main limiter.

## Useful commands

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5:14b",
  "messages": [{"role": "user", "content": "Return strict JSON with key answer"}],
  "format": "json",
  "stream": false
}'
```
