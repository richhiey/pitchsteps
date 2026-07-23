import { mkdir, writeFile } from "node:fs/promises";

const workerSource = `const worker = {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};

export default worker;
`;

await mkdir(new URL("../dist/server/", import.meta.url), { recursive: true });
await writeFile(new URL("../dist/server/index.js", import.meta.url), workerSource);

