import * as path from "node:path";
import * as fs from "node:fs";
import { execFileSync } from "node:child_process";
import * as v from "valibot";

import { LucideIconSchema } from "./schemas.ts";

const args = process.argv.slice(2);

const noGit = args.includes("--no-git");
const ifMissing = args.includes("--if-missing");
const isStarted = args.includes("run");
const isHelp = args.includes("help") || args.includes("h") || args.length === 0;
const refArg = args.find((it) => it.startsWith("--ref="))?.slice("--ref=".length);

if (isHelp || !isStarted) {
  console.log(
    `
PROGRAM:
generate-icons.ts [COMMANDS] {OPTIONS}

COMMANDS:
    show this instruction:
        help (h)
    run this script
        run

OPTIONS:
    Don't clone/update the Lucide repository, use the existing checkout
    (node_modules/.cache/lucide):
        --no-git
    Only generate when the index doesn't exist yet:
        --if-missing
    Use a specific Lucide git tag/branch instead of the latest release:
        --ref=<tag>

DESCRIPTION:
Prepares the icon index (src/lib/lucide.json) from the Lucide repository.

EXAMPLES:
- pnpm generate-icons help             # show this instruction
- pnpm generate-icons run              # latest Lucide release
- pnpm generate-icons run --ref=1.57.0 # specific Lucide release
- pnpm generate-icons run --no-git     # reuse already cloned repository
        `.trim(),
  );

  process.exit(0);
}

const LUCIDE_REPO = "https://github.com/lucide-icons/lucide.git";
const rootPath = path.join(import.meta.dirname, "..");
const repoPath = path.join(rootPath, "node_modules", ".cache", "lucide");
const destination = path.join(rootPath, "src", "lib", "lucide.json");

if (ifMissing && fs.existsSync(destination)) {
  process.exit(0);
}

function git(...gitArgs: string[]) {
  return execFileSync("git", gitArgs, { encoding: "utf-8" }).trim();
}

/** Latest stable Lucide release tag, e.g. "1.57.0". */
function latestReleaseTag() {
  const tags = git("ls-remote", "--tags", "--refs", LUCIDE_REPO)
    .split("\n")
    .map((line) => line.split("refs/tags/")[1])
    .filter((tag): tag is string => !!tag && /^v?\d+\.\d+\.\d+$/.test(tag));

  const toNumbers = (tag: string) => tag.replace(/^v/, "").split(".").map(Number);

  tags.sort((a, b) => {
    const [x, y] = [toNumbers(a), toNumbers(b)];
    return y[0] - x[0] || y[1] - x[1] || y[2] - x[2];
  });

  if (tags.length === 0) {
    throw new Error("Couldn't find any Lucide release tag");
  }

  return tags[0];
}

if (!noGit) {
  const ref = refArg ?? latestReleaseTag();
  console.log(`~ Fetching Lucide ${ref}`);

  fs.rmSync(repoPath, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(repoPath), { recursive: true });
  git("-c", "advice.detachedHead=false", "clone", "--quiet", "--depth=1", `--branch=${ref}`, LUCIDE_REPO, repoPath);
} else if (!fs.existsSync(repoPath)) {
  console.log(`${repoPath} doesn't exist, run without --no-git first`);
  process.exit(1);
}

const version = git("-C", repoPath, "describe", "--tags", "--always").replace(/^v/, "");
const iconsPath = path.join(repoPath, "icons");

export interface IndexTableRecord {
  name: string;
  svg: string;
  aliases: string[];
  tags: string[];
  categories: string[];
}

/** Strip formatting whitespace so the bundle stays small. */
function minifySvg(svg: string) {
  return svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s*(\/?>)/g, "$1")
    .trim();
}

const icons: IndexTableRecord[] = [];
const failed: string[] = [];

const jsonFiles = fs
  .readdirSync(iconsPath)
  .filter((file) => file.endsWith(".json"))
  .sort();

for (const file of jsonFiles) {
  const name = path.basename(file, ".json");
  const svgPath = path.join(iconsPath, `${name}.svg`);

  try {
    const info = v.parse(
      LucideIconSchema,
      JSON.parse(fs.readFileSync(path.join(iconsPath, file), "utf-8")),
    );

    if (info.deprecated) continue;

    if (!fs.existsSync(svgPath)) {
      failed.push(`${name} (missing svg)`);
      continue;
    }

    icons.push({
      name,
      svg: minifySvg(fs.readFileSync(svgPath, "utf-8")),
      // Deprecated aliases are kept on purpose: they are the old names of
      // renamed icons, which people still search for.
      aliases: (info.aliases ?? []).map((alias) =>
        typeof alias === "string" ? alias : alias.name,
      ),
      tags: info.tags,
      categories: info.categories,
    });
  } catch (error) {
    failed.push(`${name} (${error instanceof Error ? error.message : error})`);
  }
}

if (failed.length > 0) {
  console.log(`[warn] skipped ${failed.length} icons:\n  ${failed.join("\n  ")}`);
}

fs.writeFileSync(destination, JSON.stringify({ version, icons }));

console.log(`~ Wrote ${icons.length} icons (Lucide ${version}) to ${path.relative(rootPath, destination)}`);
