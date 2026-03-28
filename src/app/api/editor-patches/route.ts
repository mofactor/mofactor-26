import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { PatchFile } from "@/editor/types";

const PATCH_FILE = join(process.cwd(), "patches.json");

const EMPTY: PatchFile = { version: 1, patches: [] };

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(EMPTY, { status: 403 });
  }
  try {
    const raw = await readFile(PATCH_FILE, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(EMPTY);
  }
}

export async function PUT(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }
  try {
    const body: PatchFile = await request.json();
    await writeFile(PATCH_FILE, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const patchId = searchParams.get("id");

    if (patchId) {
      const raw = await readFile(PATCH_FILE, "utf-8").catch(() =>
        JSON.stringify(EMPTY)
      );
      const data: PatchFile = JSON.parse(raw);
      data.patches = data.patches.filter((p) => p.id !== patchId);
      await writeFile(PATCH_FILE, JSON.stringify(data, null, 2), "utf-8");
    } else {
      await writeFile(PATCH_FILE, JSON.stringify(EMPTY, null, 2), "utf-8");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
