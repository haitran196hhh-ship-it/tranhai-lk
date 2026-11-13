'use strict';

const fs = require("node:fs");
const path = require("node:path");

exports.install = (app, root) => {
  const catalog = JSON.parse(
    fs.readFileSync(
      path.join(root,"data","cms_catalog.json"),"utf8"
    )
  );

  if (
    catalog.schemaVersion !== 1 ||
    !Array.isArray(catalog.items)
  ) throw Error("Invalid CMS catalog");

  const map = new Map();
  const base = fs.realpathSync(
    path.join(root,"assets")
  ) + path.sep;

  for (const item of catalog.items) {
    if (!item || item.enabled === false) continue;

    if (
      !/^[a-z0-9][a-z0-9_-]{1,59}$/.test(item.id) ||
      map.has(item.id) ||
      !["frame","ptb","sticker","caption","color","ai"]
        .includes(item.type)
    ) throw Error("Invalid CMS id/type");

    if (["frame","ptb","sticker"].includes(item.type)) {
      if (
        !/^\/assets\/(?:frames|stickers)\/[a-zA-Z0-9_-]+\.(?:png|jpg|webp)$/
          .test(item.assetUrl || "")
      ) throw Error("Invalid CMS asset");

      const p = path.join(
        root,item.assetUrl.slice(1)
      );

      if (
        !fs.existsSync(p) ||
        !fs.realpathSync(p).startsWith(base)
      ) throw Error("Missing or unsafe CMS asset");

      item._asset = p;
    }

    if (item.type === "ptb") {
      const l = item.layout;

      if (
        !l ||
        l.width !== 1080 ||
        l.height !== 1080 ||
        ![2,3,4].includes(l.slots?.length)
      ) throw Error("Invalid CMS layout");

      for (const s of l.slots) {
        if (
          !["left","top","width","height"]
            .every(k => Number.isInteger(s[k])) ||
          s.left < 0 || s.top < 0 ||
          s.width < 1 || s.height < 1 ||
          s.left + s.width > 1080 ||
          s.top + s.height > 1080
        ) throw Error("CMS slot out of bounds");
      }
    }

    map.set(item.id,item);
  }

  const get = id =>
    map.get(String(id || "").toLowerCase());

  const publicItems = [...map.values()].map(i => ({
    id:i.id,
    type:i.type,
    name:i.name,
    assetUrl:i.assetUrl || undefined,
    layout:i.type === "ptb" ? i.layout : undefined,
    color:i.type === "color" ? i.color : undefined,
    value:i.type === "caption" ? i.value : undefined
  }));

  app.get("/api/akirrai/catalog",(req,res) => {
    res.setHeader(
      "Cache-Control","public, max-age=60"
    );
    res.json({
      schemaVersion:1,
      count:publicItems.length,
      items:publicItems
    });
  });

  app.get("/api/akirrai/cms-health",(req,res) => {
    res.json({ok:true,count:map.size});
  });

  return {
    has:(id,type) => get(id)?.type === type,

    layout:id => {
      const x=get(id);
      return x?.type === "ptb" ? x.layout : null;
    },

    prompt:id => {
      const x=get(id);
      return x?.type === "ai"
        ? String(x.prompt || "") : "";
    },

    asset:id => {
      const x=get(id);
      return ["frame","ptb","sticker"]
        .includes(x?.type) ? x._asset : null;
    },

    count:map.size
  };
};