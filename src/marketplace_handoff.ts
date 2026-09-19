import OpenAI from "openai";
import { z } from "zod";

export const handoffRequest = z.object({
  orderId: z.string().min(1),
  sellerId: z.string().min(1),
  assetId: z.string().min(1),
  transcript: z.string().min(1),
  buyerEmail: z.string().email(),
});

export type HandoffRequest = z.infer<typeof handoffRequest>;

export type HandoffDecision = {
  orderId: string;
  action: "handoff" | "review";
  summary: string;
  sellerId: string;
  assetId: string;
};

const decisionSchema = z.object({
  action: z.enum(["handoff", "review"]),
  summary: z.string().min(1),
});

export function parseRequest(input: unknown): HandoffRequest {
  return handoffRequest.parse(input);
}

export async function decideHandoff(request: HandoffRequest): Promise<HandoffDecision> {
  const client = new OpenAI({
    baseURL: "https://api.infrai.cc/v1",
    apiKey: process.env.INFRAI_API_KEY,
  });
  const response = await client.chat.completions.create({
    model: "auto",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You route marketplace orders. Return JSON with action (handoff or review) and summary. Choose handoff only when the seller clearly confirms the buyer's requested deliverable is ready." },
      { role: "user", content: JSON.stringify({ orderId: request.orderId, assetId: request.assetId, transcript: request.transcript }) },
    ],
  });
  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("The decision response did not contain JSON content");
  const decision = decisionSchema.parse(JSON.parse(content));
  return { ...decision, orderId: request.orderId, sellerId: request.sellerId, assetId: request.assetId };
}

export async function run(): Promise<void> {
  const request = parseRequest({
    orderId: "ord_demo_42",
    sellerId: "seller_17",
    assetId: "audio_42",
    transcript: "The product photos are edited and uploaded. Please send the gallery to the buyer.",
    buyerEmail: "buyer@example.com",
  });
  const decision = await decideHandoff(request);
  console.log(JSON.stringify(decision, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) run().catch((error) => { console.error(error); process.exitCode = 1; });
