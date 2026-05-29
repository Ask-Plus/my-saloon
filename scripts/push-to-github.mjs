import { ReplitConnectors } from "@replit/connectors-sdk";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";

const connectors = new ReplitConnectors();
const OWNER = "Ask-Plus";
const REPO = "my-saloon";
const ROOT = "/home/runner/workspace";

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", ".local", ".agents",
  "attached_assets", ".cache", ".npm", "coverage", ".expo"
]);
const SKIP_FILES = new Set(["pnpm-lock.yaml"]);
const SKIP_EXT = new Set([".tsbuildinfo", ".map"]);

function collectFiles(dir, files = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return files; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      collectFiles(full, files);
    } else {
      const rel = relative(ROOT, full);
      const ext = entry.includes(".") ? "." + entry.split(".").pop() : "";
      if (SKIP_FILES.has(entry)) continue;
      if (SKIP_EXT.has(ext)) continue;
      if (stat.size > 500_000) { console.log("Skipping large file:", rel, `(${(stat.size/1024).toFixed(0)}KB)`); continue; }
      files.push({ path: rel, full });
    }
  }
  return files;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function ghApi(endpoint, method = "GET", body, retries = 4) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await connectors.proxy("github", endpoint, opts);
      if (resp.status === 502 || resp.status === 503 || resp.status === 504) {
        const wait = 2000 * (attempt + 1);
        console.log(`  [retry ${attempt+1}] ${resp.status} on ${endpoint}, waiting ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`GitHub API ${method} ${endpoint} => ${resp.status}: ${text.substring(0, 200)}`);
      }
      return resp.json();
    } catch (e) {
      if (attempt === retries) throw e;
      await sleep(1500 * (attempt + 1));
    }
  }
  throw new Error(`Max retries exceeded for ${endpoint}`);
}

async function ghApiRaw(endpoint, method = "GET", body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const resp = await connectors.proxy("github", endpoint, opts);
  return { status: resp.status, data: await resp.json() };
}

async function main() {
  console.log("Collecting files...");
  const files = collectFiles(ROOT);
  console.log(`Found ${files.length} files`);

  // Get or create the base commit SHA
  let initCommitSha;
  console.log("Getting repo HEAD...");
  const headResp = await ghApiRaw(`/repos/${OWNER}/${REPO}/git/ref/heads/main`);
  if (headResp.status === 200) {
    initCommitSha = headResp.data.object.sha;
    console.log("Existing HEAD:", initCommitSha);
  } else {
    // Repo truly empty — initialize it
    console.log("Initializing empty repo...");
    const initResp = await ghApiRaw(`/repos/${OWNER}/${REPO}/contents/.gitkeep`, "PUT", {
      message: "init",
      content: Buffer.from("").toString("base64"),
    });
    if (initResp.status !== 201) {
      throw new Error(`Init failed: ${JSON.stringify(initResp.data).substring(0, 200)}`);
    }
    initCommitSha = initResp.data.commit.sha;
    console.log("Repo initialized, base commit:", initCommitSha);
  }

  // Create blobs in parallel batches of 5
  const CONCURRENCY = 5;
  const treeItems = [];
  let done = 0;

  async function uploadFile({ path, full }) {
    let content;
    try { content = readFileSync(full); } catch { return; }
    const isText = isTextFile(full, content);
    const blob = await ghApi(`/repos/${OWNER}/${REPO}/git/blobs`, "POST", {
      content: isText ? content.toString("utf8") : content.toString("base64"),
      encoding: isText ? "utf-8" : "base64",
    });
    done++;
    if (done % 10 === 0) console.log(`  ${done}/${files.length}: ${path}`);
    return { path, mode: "100644", type: "blob", sha: blob.sha };
  }

  // Process in batches
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(f => uploadFile(f)));
    for (const r of results) { if (r) treeItems.push(r); }
    await sleep(100);
  }

  console.log(`\nCreating tree with ${treeItems.length} files...`);
  const tree = await ghApi(`/repos/${OWNER}/${REPO}/git/trees`, "POST", {
    tree: treeItems,
  });

  console.log("Creating commit...");
  const commit = await ghApi(`/repos/${OWNER}/${REPO}/git/commits`, "POST", {
    message: "Initial commit: My Saloon booking app\n\nLadies salon booking mobile app (Expo + Express + PostgreSQL)\n- Customer and Salon Owner roles\n- Bank transfer payment flow\n- In-app notification system\n- Owner registration with business verification",
    tree: tree.sha,
    parents: [initCommitSha],
  });

  // Try to create or update the main branch ref
  try {
    await ghApi(`/repos/${OWNER}/${REPO}/git/refs`, "POST", {
      ref: "refs/heads/main",
      sha: commit.sha,
    });
    console.log("Created main branch");
  } catch (e) {
    if (e.message.includes("422") || e.message.includes("Reference already exists")) {
      await ghApi(`/repos/${OWNER}/${REPO}/git/refs/heads/main`, "PATCH", {
        sha: commit.sha,
        force: true,
      });
      console.log("Updated main branch");
    } else {
      throw e;
    }
  }

  console.log("\n✅ Done! Repo pushed to: https://github.com/Ask-Plus/my-saloon");
}

function isTextFile(full, buf) {
  const textExt = new Set([
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".json", ".yaml", ".yml", ".toml", ".md", ".txt",
    ".env", ".gitignore", ".eslintrc", ".prettierrc",
    ".css", ".html", ".svg", ".sh", ".mjs"
  ]);
  const ext = "." + full.split(".").pop();
  if (textExt.has(ext)) return true;
  // Heuristic: check for null bytes
  for (let i = 0; i < Math.min(buf.length, 512); i++) {
    if (buf[i] === 0) return false;
  }
  return true;
}

main().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
