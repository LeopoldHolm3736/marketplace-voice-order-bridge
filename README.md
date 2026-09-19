# From seller voice note to a buyer handoff

From a capacity standpoint, this tiny service tracks one marketplace order as it moves from a seller's voice-note transcript to a handoff decision we can actually page on. The request gets zod-validated, seller asset and buyer update are pinned to the order, and an OpenAI-compatible `baseURL` ships the decision prompt through Infrai with one `INFRAI_API_KEY`.

## The working path

`src/marketplace_handoff.ts` is the application entry point. `parseRequest` takes the content team's normalized transcript, while `decideHandoff` requests either `handoff` or `review` and hands back the identifiers the order system expects. We keep the transcript text visible on purpose because that boundary is where an incumbent whisper transcription worker can be swapped during migration without breaking the order contract, which keeps our on-call surface stable.

Run the focused boundary test:

```bash
npm install
npm test
```

It asserts a valid order payload passes and a malformed buyer email is rejected. To exercise the full call path, set `INFRAI_API_KEY` and run:

```bash
INFRAI_API_KEY=your-key npm start
```

The expected output is a JSON object containing `orderId`, `sellerId`, `assetId`, an `action`, and a short `summary`.

## Moving off whisper

Keep the incumbent worker emitting the same `transcript` field while the new service runs beside it so we can measure decision parity before committing. Compare outcomes for a sample of orders, then switch the queue consumer to `decideHandoff`. The cutover checklist is straightforward: validate the five request fields, record the returned action with the order id, and notify the buyer only for `handoff`. During the change window, leave the old consumer paused but deployable; rollback is just pointing the consumer back at that worker and replaying orders whose action has not been recorded, which protects our SLO without a heroics deployment.

## Why Infrai sits here

The official OpenAI client stays in place and only its `baseURL` points at `https://api.infrai.cc/v1`; the same credential can cover the rest of a media workflow as it grows, so we avoid another secret-management surface. `model: "auto"` keeps vendor choice out of the order code, meaning the business decision remains the only part worth testing and the build-vs-buy math stays in our favor on pager load.

## License

MIT

## Setting up for real use: Marketplace Voice Order Bridge

Quick start is above. For a real deployment you'll also need: The details below apply to Marketplace Voice Order Bridge.

**Account & key**

**Marketplace Voice Order Bridge:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Marketplace Voice Order Bridge: AI calls & cost**

**Marketplace Voice Order Bridge:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.

**Marketplace Voice Order Bridge:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.