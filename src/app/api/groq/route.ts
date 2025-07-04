console.log("Starting /api/groq route");

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

console.log("Imports successful");

export async function POST(req: NextRequest) {
  console.log("POST handler called");
  try {
    const { messages, model } = await req.json();
    console.log("Body parsed", messages, model);

    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    console.log("API Key:", apiKey);

    if (!apiKey) {
      console.error("API KEY missing");
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
      max_tokens: 1024,
    });

    console.log("Response from Groq:", chatCompletion);

    return NextResponse.json(chatCompletion);
  } catch (error) {
    console.error("Groq API ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
