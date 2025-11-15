import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn, spawnSync } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // allow long-running automation

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const applicantInfoStr = form.get("applicantInfo");
    const resumeFile = form.get("resume");

    if (!applicantInfoStr || typeof applicantInfoStr !== "string") {
      return NextResponse.json(
        { error: "Missing applicantInfo (as JSON string)" },
        { status: 400 }
      );
    }

    if (!resumeFile || !(resumeFile instanceof File)) {
      return NextResponse.json(
        { error: "Missing resume file in 'resume' field" },
        { status: 400 }
      );
    }

    // Parse and sanity check applicant info JSON
    let applicantInfo: any;
    try {
      applicantInfo = JSON.parse(applicantInfoStr);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid applicantInfo JSON" },
        { status: 400 }
      );
    }

    // Persist files to temp directory
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "commonapp-"));
    const dataPath = path.join(tmpDir, "applicant.json");
    const resumePath = path.join(tmpDir, (resumeFile as File).name || "resume.pdf");

    const resumeBuffer = Buffer.from(await (resumeFile as File).arrayBuffer());
    await fs.writeFile(dataPath, JSON.stringify(applicantInfo, null, 2), "utf8");
    await fs.writeFile(resumePath, resumeBuffer);

    // Cross-platform Python resolution and dependency bootstrap (macOS + Windows)
    const projectRoot = process.cwd();
    const venvBase = path.join(projectRoot, "browser-use", "venv");
    const venvBin = path.join(
      venvBase,
      process.platform === "win32" ? "Scripts" : "bin"
    );
    const venvPython = path.join(
      venvBin,
      process.platform === "win32" ? "python.exe" : "python3"
    );
    const requirements = path.join(projectRoot, "browser-use", "requirements.txt");

    const hasVenv = await fs
      .access(venvPython)
      .then(() => true)
      .catch(() => false);

    const resolvePython = (): string => {
      if (hasVenv) return venvPython;
      if (process.env.PYTHON) return process.env.PYTHON;
      const candidates = [
        process.platform === "win32" ? "python" : "python3",
        process.platform === "win32" ? "py" : "python",
      ];
      for (const cand of candidates) {
        try {
          const r = spawnSync(cand, ["-V"], { stdio: "ignore" });
          if (r.status === 0) return cand;
        } catch {}
      }
      return process.platform === "win32" ? "python" : "python3";
    };

    const importOk = (py: string) =>
      spawnSync(py, ["-c", "import browser_use"], { cwd: projectRoot }).status === 0;

    let python = resolvePython();
    let depsReady = importOk(python);
    let bootstrapLog = "";

    if (!depsReady) {
      // Create venv if missing and switch to it
      if (!hasVenv) {
        try {
          const mk = spawnSync(python, ["-m", "venv", venvBase], { cwd: projectRoot });
          if (mk.status === 0) {
            python = venvPython;
            bootstrapLog += `Created venv at ${venvBase}.\n`;
          } else {
            bootstrapLog += `Failed to create venv (status ${mk.status}).\n`;
          }
        } catch (e: any) {
          bootstrapLog += `Venv creation error: ${e?.message}\n`;
        }
      } else {
        python = venvPython; // prefer venv python
      }

      // Install requirements via python -m pip
      try {
        const pip = spawnSync(python, ["-m", "pip", "install", "-r", requirements], {
          cwd: projectRoot,
        });
        bootstrapLog += `pip install exit ${pip.status}.\n`;
      } catch (e: any) {
        bootstrapLog += `pip install error: ${e?.message}\n`;
      }

      depsReady = importOk(python);
    }

    const scriptPath = path.join(process.cwd(), "browser-use", "main.py");
    const args = [scriptPath, "--data", dataPath, "--resume", resumePath];

    const child = spawn(python, args, { cwd: process.cwd() });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    const exitCode: number = await new Promise((resolve) => {
      child.on("close", (code) => resolve(code ?? 1));
    });

    const success = exitCode === 0;
    return NextResponse.json({
      success,
      exitCode,
      stdout,
      stderr,
      python,
      depsReady,
      bootstrapLog,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}
