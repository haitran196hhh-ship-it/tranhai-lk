const sharp = require("sharp");
const fs = require("fs");

async function analyzeAndPrepareFrame(filePath, itemType) {
  const img = sharp(filePath);
  const meta = await img.metadata();
  const width = meta.width || 1024;
  const height = meta.height || 1024;

  const { data, info } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;

  // Kiem tra xem anh da co vung trong suot (alpha < 50) chua
  let transparentPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 50) transparentPixels++;
  }

  const totalPixels = w * h;
  const hasNativeTransparency = (transparentPixels / totalPixels) > 0.08;

  // Neu anh khung co cac o mau trang duc o giua (nhu anh Y2K 2-cut), tu dong tim cac khoi hinh chu nhat mau trang va khoet trong suot
  if (!hasNativeTransparency) {
    const visited = new Uint8Array(totalPixels);
    const boxes = [];

    const isWhitePixel = (idx) => {
      const p = idx * 4;
      return data[p] >= 240 && data[p + 1] >= 240 && data[p + 2] >= 240 && data[p + 3] > 200;
    };

    for (let y = Math.floor(h * 0.04); y < Math.floor(h * 0.96); y += 2) {
      for (let x = Math.floor(w * 0.04); x < Math.floor(w * 0.96); x += 2) {
        const startIdx = y * w + x;
        if (visited[startIdx] || !isWhitePixel(startIdx)) continue;

        // BFS loang tim vung trang lien thong
        let minX = x, maxX = x, minY = y, maxY = y, count = 0;
        const queue = [startIdx];
        visited[startIdx] = 1;
        const regionPixels = [];

        while (queue.length > 0) {
          const curr = queue.pop();
          const cy = Math.floor(curr / w);
          const cx = curr % w;
          count++;
          regionPixels.push(curr);
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          const neighbors = [curr - 1, curr + 1, curr - w, curr + w];
          for (const nb of neighbors) {
            if (nb >= 0 && nb < totalPixels && !visited[nb] && isWhitePixel(nb)) {
              visited[nb] = 1;
              queue.push(nb);
            }
          }
        }

        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        const boxArea = bw * bh;
        // Chi lay cac o hinh chu nhat du lon (chiem tu 6% den 85% dien tich anh va do lap day > 75%)
        if (
          boxArea > totalPixels * 0.06 &&
          boxArea < totalPixels * 0.85 &&
          count / boxArea > 0.72 &&
          minX > 5 && minY > 5 && maxX < w - 5 && maxY < h - 5
        ) {
          boxes.push({ left: minX, top: minY, width: bw, height: bh, pixels: regionPixels });
        }
      }
    }

    if (boxes.length > 0) {
      // Khoet trong suot cac o trang tim duoc de khi ghep anh nguoi dung se nam duoi lop khung
      for (const b of boxes) {
        for (const pIdx of b.pixels) {
          data[pIdx * 4 + 3] = 0;
        }
      }
      const outBuf = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
      fs.writeFileSync(filePath, outBuf);

      boxes.sort((a, b) => (a.top - b.top) || (a.left - b.left));
      return {
        canvasWidth: w,
        canvasHeight: h,
        slots: boxes.map(b => ({
          top: b.top,
          left: b.left,
          width: b.width,
          height: b.height
        }))
      };
    }
  }

  // Neu anh da trong suot san, tim cac vung trong suot lien thong de dat slots
  if (hasNativeTransparency) {
    const visited = new Uint8Array(totalPixels);
    const boxes = [];
    const isTrans = (idx) => data[idx * 4 + 3] < 50;

    for (let y = 10; y < h - 10; y += 4) {
      for (let x = 10; x < w - 10; x += 4) {
        const sIdx = y * w + x;
        if (visited[sIdx] || !isTrans(sIdx)) continue;
        let minX = x, maxX = x, minY = y, maxY = y, count = 0;
        const q = [sIdx];
        visited[sIdx] = 1;
        while (q.length > 0) {
          const curr = q.pop();
          const cy = Math.floor(curr / w);
          const cx = curr % w;
          count++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          const nbs = [curr - 1, curr + 1, curr - w, curr + w];
          for (const nb of nbs) {
            if (nb >= 0 && nb < totalPixels && !visited[nb] && isTrans(nb)) {
              visited[nb] = 1;
              q.push(nb);
            }
          }
        }
        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        const area = bw * bh;
        if (area > totalPixels * 0.05 && area < totalPixels * 0.90) {
          boxes.push({ top: minY, left: minX, width: bw, height: bh });
        }
      }
    }
    if (boxes.length > 0) {
      boxes.sort((a, b) => (a.top - b.top) || (a.left - b.left));
      return { canvasWidth: w, canvasHeight: h, slots: boxes.slice(0, 8) };
    }
  }

  // Fallback mac dinh
  return {
    canvasWidth: w,
    canvasHeight: h,
    slots: itemType === "frame"
      ? [{ top: 0, left: 0, width: w, height: h }]
      : [
          { top: Math.round(h * 0.06), left: Math.round(w * 0.06), width: Math.round(w * 0.42), height: Math.round(h * 0.42) },
          { top: Math.round(h * 0.06), left: Math.round(w * 0.52), width: Math.round(w * 0.42), height: Math.round(h * 0.42) },
          { top: Math.round(h * 0.52), left: Math.round(w * 0.06), width: Math.round(w * 0.42), height: Math.round(h * 0.42) },
          { top: Math.round(h * 0.52), left: Math.round(w * 0.52), width: Math.round(w * 0.42), height: Math.round(h * 0.42) }
        ]
  };
}

module.exports = { analyzeAndPrepareFrame };
