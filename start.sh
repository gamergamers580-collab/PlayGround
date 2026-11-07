#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT

# This game is already a static app in the project root, so no compilation step is needed.
/usr/bin/time -p npm ci
/usr/bin/time -p mkdir -p /home/runner/work/_temp/omgithub-web
/usr/bin/time -p node --input-type=module -e '
  import { writeFile } from "node:fs/promises";
  const project = process.cwd();
  const output = { project, directory: project };
  await writeFile("/home/runner/work/_temp/omgithub-web/deployment-output.json", JSON.stringify(output));
'
exec /usr/bin/time -p npm start
