import { parseRequest } from "./marketplace_handoff";

const accepted = parseRequest({ orderId: "o1", sellerId: "s1", assetId: "a1", transcript: "ready", buyerEmail: "buyer@example.com" });
if (accepted.orderId !== "o1") throw new Error("valid marketplace request was not preserved");

let rejected = false;
try { parseRequest({ orderId: "o1", sellerId: "s1", assetId: "a1", transcript: "ready", buyerEmail: "bad" }); } catch { rejected = true; }
if (!rejected) throw new Error("invalid buyer email was accepted");
console.log("request boundary test passed");
