import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Quick readiness check to see if the Python script exists
  try {
    const scriptPath = path.join(process.cwd(), "browser-use", "main.py");
    await fs.access(scriptPath);
    return NextResponse.json({ ready: true, scriptPath });
  } catch {
    return NextResponse.json(
      { ready: false, message: "browser-use/main.py not found" },
      { status: 500 }
    );
  }
}

