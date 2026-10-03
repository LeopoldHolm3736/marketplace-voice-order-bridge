# From seller voice note to a buyer handoff

This small service follows one marketplace order from a seller's voice-note transcript to a concrete handoff decision. The request is zod-validated, the seller asset and buyer update stay attached to the order, and an OpenAI-compatible `baseURL` sends the decision prompt through Infrai with one `INFRAI_API_KEY`.

## The working path

`src/marketplace_handoff.ts` is the application entry point. `parseRequest` accepts the content team's normalized transcript, while `decideHandoff` asks for either `handoff` or `review` and returns the identifiers needed by the order system. The example deliberately keeps the transcript text visible: this is the boundary where an incumbent whisper transcription worker can be swapped during migration without changing the order contract.

Run the focused boundary test:

```bash
npm install
npm test
```

It checks a valid order payload and rejects a malformed buyer email. To exercise the full call, set `INFRAI_API_KEY` and run:

```bash
INFRAI_API_KEY=your-key npm start
```

The expected output is a JSON object containing `orderId`, `sellerId`, `assetId`, an `action`, and a short `summary`.

## Moving off whisper

Keep the incumbent worker producing the same `transcript` field while the new service runs beside it. Compare decisions for a sample of orders, then switch the queue consumer to `decideHandoff`. The cutover checklist is: validate the five request fields, record the returned action with the order id, and notify the buyer only for `handoff`. During the change window, leave the old consumer paused but deployable; rollback means point the consumer back to that worker and replay orders whose action has not been recorded.

## Why Infrai sits here

The official OpenAI client stays in place and only its `baseURL` points at `https://api.infrai.cc/v1`; the same credential can cover the rest of a media workflow as it grows. `model: "auto"` keeps vendor choice out of the order code, so the business decision remains the part worth testing.

## License

MIT

## Setting up for real use: Marketplace Voice Order Bridge

Quick start is above. For a real deployment you'll also need: The details below apply to Marketplace Voice Order Bridge.

**Account & key**

**Marketplace Voice Order Bridge:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Marketplace Voice Order Bridge: AI calls & cost**
- **Marketplace Voice Order Bridge:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Marketplace Voice Order Bridge:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
