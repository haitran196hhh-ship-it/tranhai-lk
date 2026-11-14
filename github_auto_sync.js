const https = require("https");
const fs = require("fs");
const path = require("path");

const GH_REPO = process.env.GITHUB_REPO || "haitran196hhh-ship-it/tranhai-lk";
const GH_BRANCH = process.env.GITHUB_BRANCH || "main";

function ghRequest(method, apiPath, token, bodyObj) {
  return new Promise((resolve, reject) => {
    const payload = bodyObj ? Buffer.from(JSON.stringify(bodyObj), "utf8") : null;
    const req = https.request({
      hostname: "api.github.com",
      path: apiPath,
      method,
      headers: {
        "User-Agent": "Akirrai-CMS-AutoSync",
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": payload.length } : {})
      }
    }, (res) => {
      let data = "";
      res.on("data", (d) => data += d);
      res.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(new Error("GitHub HTTP " + res.statusCode + ": " + (parsed.message || data.slice(0, 120))));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function pushFileToGitHub(repoRelPath, contentBuffer, commitMessage) {
  const token = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim();
  if (!token) {
    return { pushed: false, reason: "Chua cau hinh GITHUB_TOKEN tren Render Environment" };
  }
  const cleanRel = repoRelPath.replace(/^\\+|^\/+/, "").replace(/\\/g, "/");
  const apiPath = `/repos/${GH_REPO}/contents/${encodeURI(cleanRel)}`;
  let sha = undefined;
  try {
    const existing = await ghRequest("GET", `${apiPath}?ref=${GH_BRANCH}`, token);
    if (existing && existing.sha) sha = existing.sha;
  } catch (_) {}

  const body = {
    message: commitMessage || `chore(cms): auto-sync ${cleanRel}`,
    content: Buffer.isBuffer(contentBuffer)
      ? contentBuffer.toString("base64")
      : Buffer.from(String(contentBuffer), "utf8").toString("base64"),
    branch: GH_BRANCH
  };
  if (sha) body.sha = sha;

  const res = await ghRequest("PUT", apiPath, token, body);
  return { pushed: true, path: cleanRel, commitSha: res?.commit?.sha || null };
}

module.exports = { pushFileToGitHub };
