const fs = require("fs");
const path = require("path");

function bakeCmsIntoScripts(repoRoot) {
  const relPath = path.join(repoRoot, "cms_release.json");
  if (!fs.existsSync(relPath)) return { baked: false, reason: "Missing cms_release.json" };

  const relData = JSON.parse(fs.readFileSync(relPath, "utf8"));
  const cmsItems = Array.isArray(relData?.published?.items)
    ? relData.published.items
    : (Array.isArray(relData?.items) ? relData.items : []);
  const cmsCaptions = Array.isArray(relData?.published?.captions)
    ? relData.published.captions
    : (Array.isArray(relData?.captions) ? relData.captions : []);

  const activeItems = cmsItems.filter(it => it && it.id && it.enabled !== false);
  const activeCaptions = cmsCaptions.filter(c => c && c.enabled !== false);

  // Chuyen doi cac muc CMS sang dinh dang chuẩn cua Locket Remote Config (pickerFilters + overlay_items)
  const runtimeInjectCode = `
// === [AKIRRAI AUTO-BAKED CMS ITEMS INTO LOCKET REMOTE CONFIG] ===
(function applyAkirraiCmsToEntries(entriesObj) {
  if (!entriesObj || typeof entriesObj !== "object") return;
  const cmsItems = ${JSON.stringify(activeItems)};
  const cmsCaptions = ${JSON.stringify(activeCaptions)};

  // 1. Ghep vao camera_filter_config (pickerFilters + sections)
  try {
    let camCfg = entriesObj.camera_filter_config ? JSON.parse(entriesObj.camera_filter_config) : {};
    let innerCfg = camCfg.config ? (typeof camCfg.config === "string" ? JSON.parse(camCfg.config) : camCfg.config) : camCfg;
    if (!Array.isArray(innerCfg.pickerFilters)) innerCfg.pickerFilters = [];

    for (let i = cmsItems.length - 1; i >= 0; i--) {
      const it = cmsItems[i];
      const filterId = String(it.id).trim();
      if (!innerCfg.pickerFilters.includes(filterId)) {
        innerCfg.pickerFilters.unshift(filterId);
      }
      // Them vao danh sach filters chi tiet neu co
      if (Array.isArray(innerCfg.filters)) {
        const existIdx = innerCfg.filters.findIndex(x => x && (x.id === filterId || x.filter_id === filterId));
        const filterEntry = {
          id: filterId,
          filter_id: filterId,
          name: it.name || it.title || filterId,
          title: it.name || it.title || filterId,
          type: it.type || "ptb",
          category: it.category || "photobooth",
          asset_url: it.fullAssetUrl || ("https://tranhai-lk.onrender.com" + (String(it.assetUrl || "").startsWith("/") ? "" : "/") + String(it.assetUrl || "")),
          enabled: true
        };
        if (existIdx >= 0) innerCfg.filters[existIdx] = Object.assign({}, innerCfg.filters[existIdx], filterEntry);
        else innerCfg.filters.unshift(filterEntry);
      }
    }

    if (camCfg.config && typeof camCfg.config === "string") {
      camCfg.config = JSON.stringify(innerCfg);
      entriesObj.camera_filter_config = JSON.stringify(camCfg);
    } else if (camCfg.config && typeof camCfg.config === "object") {
      camCfg.config = innerCfg;
      entriesObj.camera_filter_config = JSON.stringify(camCfg);
    } else {
      entriesObj.camera_filter_config = JSON.stringify(innerCfg);
    }
  } catch (e) {}

  // 2. Ghep Caption va Overlay items vao overlay_items
  try {
    let overlays = entriesObj.overlay_items ? JSON.parse(entriesObj.overlay_items) : [];
    if (Array.isArray(overlays)) {
      const cmsSectionItems = [];
      for (const it of cmsItems) {
        const fid = String(it.id).trim();
        cmsSectionItems.push({
          overlay_id: fid,
          id: fid,
          source: "remote",
          type: "caption",
          caption: {
            text: it.name || it.title || fid,
            type: "static_content",
            max_lines: 1,
            text_color: "#FFFFFFE6",
            icon: { data: it.type === "ai" ? "✨" : "📸", type: "emoji" }
          }
        });
      }
      for (const cap of cmsCaptions) {
        const cid = String(cap.id || ("cap_" + Math.random().toString(16).slice(2, 8))).trim();
        cmsSectionItems.push({
          overlay_id: cid,
          id: cid,
          source: "remote",
          type: "caption",
          caption: {
            text: cap.text || cap.title || cap.name || cid,
            type: "static_content",
            max_lines: 1,
            text_color: "#FFFFFFE6",
            icon: { data: cap.icon || "💬", type: "emoji" }
          }
        });
      }
      if (cmsSectionItems.length > 0) {
        overlays = overlays.filter(sec => sec && sec.section !== "AKIRRAI CMS");
        overlays.unshift({
          section: "AKIRRAI CMS",
          items: cmsSectionItems
        });
        entriesObj.overlay_items = JSON.stringify(overlays);
      }
    }
  } catch (e) {}
})(obj.entries);
// === [END AKIRRAI AUTO-BAKED CMS ITEMS] ===
`;

  const targetScripts = ["js/Locket_Unlocked.js", "js/Locket_minhhiep08.js", "js/Locket_TranHai307.js"];
  const bakedFiles = [];

  for (const relScript of targetScripts) {
    const fullP = path.join(repoRoot, relScript);
    if (!fs.existsSync(fullP)) continue;
    let code = fs.readFileSync(fullP, "utf8");
    // Xoa khoi auto-baked cu neu co
    code = code.replace(/\/\/ === \[AKIRRAI AUTO-BAKED CMS ITEMS INTO LOCKET REMOTE CONFIG\] ===[\s\S]*?\/\/ === \[END AKIRRAI AUTO-BAKED CMS ITEMS\] ===\s*/g, "");
    if (code.includes("$done({ body: JSON.stringify(obj) });")) {
      code = code.replace("$done({ body: JSON.stringify(obj) });", runtimeInjectCode + "\n$done({ body: JSON.stringify(obj) });");
      fs.writeFileSync(fullP, code, "utf8");
      bakedFiles.push(relScript);
    }
  }

  return { baked: true, count: activeItems.length, captionsCount: activeCaptions.length, bakedFiles };
}

module.exports = { bakeCmsIntoScripts };
