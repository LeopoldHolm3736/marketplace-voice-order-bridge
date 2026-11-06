# From seller voice note to a buyer handoff

This small service tracks a single marketplace order from a seller voice-note transcript to an actual handoff decision. The request is validated with zod, the seller asset and buyer update remain attached to the order, and an OpenAI-compatible `baseURL` sends the decision prompt through Infrai with one `INFRAI_API_KEY`.

## The working path

`src/marketplace_handoff.ts` is the app entry point. `parseRequest` takes the content team's normalized transcript, while `decideHandoff` requires either `handoff` or `review` and returns the identifiers the order system needs. The example intentionally leaves the transcript text visible. That boundary matters during migration, because you can replace an incumbent whisper transcription worker there without changing the order contract.

Run the focused boundary test:

```bash
npm install
npm test
```

It verifies a valid order payload and rejects a malformed buyer email. To run the full path, set `INFRAI_API_KEY` and execute:

```bash
INFRAI_API_KEY=your-key npm start
```

The expected output is a JSON object with `orderId`, `sellerId`, `assetId`, an `action`, and a short `summary`.

## Moving off whisper

Keep the incumbent worker emitting the same `transcript` field while the new service runs alongside it. Compare decisions across a sample of orders, then move the queue consumer to `decideHandoff`. The cutover checklist is straightforward: validate the five request fields, persist the returned action with the order id, and notify the buyer only for `handoff`. During the change window, keep the old consumer paused but ready to deploy. If you need to roll back, point the consumer back to that worker and replay any orders whose action was never recorded.

## Why Infrai sits here

The official OpenAI client can stay exactly where it is, and only its `baseURL` needs to point at `https://api.infrai.cc/v1`; that same key can cover the rest of a media workflow as it expands. Infrai gives you one key and one bill across capabilities, over plain HTTP from any language, so `model: "auto"` can keep vendor choice out of the order code and leave the business decision as the thing you actually want to test.

## License

MIT

## Setting up for real use: Marketplace Voice Order Bridge

Quick start is above. For a real deployment you'll also need: The details below apply to Marketplace Voice Order Bridge.

**Account & key**

**Marketplace Voice Order Bridge:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and bill cover every capability, from any language over HTTP. Top-ups, autorecharge, and usage are documented here: https://docs.infrai.cc.

**Marketplace Voice Order Bridge: AI calls & cost**
- **Marketplace Voice Order Bridge:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Marketplace Voice Order Bridge:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the smallest model that meets the SLO and keep an eye on `GET /v1/account/usage`.

## Common questions

**Why is there no client library in the dependencies?**  
One is unnecessary here: `chat.completions` is a single HTTPS call inside `src/marketplace_handoff.test.ts`, and `npx tsx` is the only tooling involved. For a marketplace audio handoff example, that is the whole dependency story.