let shapes = [];
let song;
let amplitude;
let bubbles = [];
let particles = [];
let points = [[-3, 5], [3, 7], [1, 5],[2,4],[4,3],[5,2],[6,2],[8,4],[8,-1],[6,0],[0,-3],[2,-6],[-2,-3],[-4,-2],[-5,-1],[-6,1],[-6,2]]

function preload() {
  // 載入音樂檔案，請將相應的 mp3 放在同一目錄下
  song = loadSound('midnight-quirk-255361.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  amplitude = new p5.Amplitude();

  // 不在 setup 自動播放音樂 — 等待使用者手勢以啟動 AudioContext
  // `song.loop()` 會在 user gesture 後啟動（見下方的 mousePressed/touchStarted）

  // 使用新的點陣列，建立多個小色塊（以 image/GFX 繪製），並隨機分佈與移動
  shapes = [];
  const count = 16;
  // 計算原始點的包圍盒，用於把點中心化
  let xs = points.map(p => p[0]);
  let ys = points.map(p => p[1]);
  let minX = Math.min(...xs), maxX = Math.max(...xs);
  let minY = Math.min(...ys), maxY = Math.max(...ys);
  let centerPx = (minX + maxX) / 2;
  let centerPy = (minY + maxY) / 2;

  for (let i = 0; i < count; i++) {
    // 每個影像的大小改為接近「拳頭」相對大小（依視窗最小邊長計算）
    let maxFist = Math.min(windowWidth, windowHeight) * 0.18;
    let baseSize = int(random(maxFist * 0.6, maxFist));
    let gfx = createGraphics(baseSize, baseSize);
    gfx.clear();
    gfx.push();
    gfx.translate(baseSize / 2, baseSize / 2);
    // 縮放點陣到圖像大小的 70% 範圍
    let span = Math.max(maxX - minX, maxY - minY);
    let s = span > 0 ? (baseSize * 0.7) / span : 1;
    gfx.scale(s);
    gfx.noStroke();
    gfx.fill(random(50, 255), random(50, 255), random(50, 255), 220);
    gfx.beginShape();
    for (let [px, py] of points) {
      gfx.vertex(px - centerPx, py - centerPy);
    }
    gfx.endShape(CLOSE);
    gfx.pop();

    shapes.push({
      gfx: gfx,
      w: baseSize,
      h: baseSize,
      x: random(0, windowWidth),
      y: random(0, windowHeight),
      dx: random(-2, 2),
      dy: random(-2, 2),
      angle: random(TWO_PI),
      dang: random(-0.02, 0.02),
      scale: random(0.9, 2.0)
    });
  }

  // 初始化水泡與粒子陣列
  bubbles = [];
  particles = [];
}

function draw() {
  background('#e2eafc');
  strokeWeight(2);

  // 取得目前音量等級並映射
  let level = amplitude.getLevel();
  // 音量放大倍率，讓變化較溫和
  let sizeFactor = map(level, 0, 1, 0.5, 1.5);

  // 隨機生成新水泡
  if (random() < 0.15) {
    bubbles.push({
      x: random(0, windowWidth),
      y: windowHeight,
      r: random(8, 25),
      vy: -random(1, 3),
      alpha: 255,
      wobble: random(TWO_PI)
    });
  }

  // 更新與繪製水泡
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let bub = bubbles[i];
    bub.y += bub.vy;
    bub.wobble += 0.05;
    bub.x += cos(bub.wobble) * 0.5;
    bub.alpha -= 2;

    if (bub.alpha <= 0 || bub.y < -50) {
      bubbles.splice(i, 1);
      continue;
    }

    // 碰撞檢測：與色塊碰撞
    let burst = false;
    for (let shape of shapes) {
      let distance = dist(bub.x, bub.y, shape.x, shape.y);
      if (distance < bub.r + shape.w * 0.4 * sizeFactor * shape.scale) {
        burst = true;
        bubbles.splice(i, 1);
        break;
      }
    }

    if (burst) {
      // 爆破特效：生成粒子
      for (let j = 0; j < 12; j++) {
        let ang = (j / 12) * TWO_PI + random(-0.3, 0.3);
        particles.push({
          x: bub.x,
          y: bub.y,
          vx: cos(ang) * random(2, 5),
          vy: sin(ang) * random(2, 5),
          life: 30,
          maxLife: 30,
          size: random(3, 8)
        });
      }
    } else {
      // 繪製水泡
      push();
      noFill();
      stroke(100, 200, 255, bub.alpha);
      strokeWeight(2);
      circle(bub.x, bub.y, bub.r * 2);
      pop();
    }
  }

  // 更新與繪製粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15; // 重力
    p.life -= 1;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    let alpha = map(p.life, 0, p.maxLife, 0, 255);
    push();
    fill(255, 150, 100, alpha);
    noStroke();
    circle(p.x, p.y, p.size);
    pop();
  }

  for (let shape of shapes) {
    // 更新位置與角度
    shape.x += shape.dx;
    shape.y += shape.dy;
    shape.angle += shape.dang;

    // 包裹邊界（讓色塊能在整個畫面間移動）
    if (shape.x < -shape.w) shape.x = windowWidth + shape.w;
    if (shape.x > windowWidth + shape.w) shape.x = -shape.w;
    if (shape.y < -shape.h) shape.y = windowHeight + shape.h;
    if (shape.y > windowHeight + shape.h) shape.y = -shape.h;

    push();
    translate(shape.x, shape.y);
    rotate(shape.angle);
    scale(sizeFactor * shape.scale);
    imageMode(CENTER);
    image(shape.gfx, 0, 0, shape.w, shape.h);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 在使用者手勢後啟動或恢復 AudioContext 並開始播放音樂
function startAudioIfNeeded() {
  try {
    if (typeof userStartAudio === 'function') {
      userStartAudio().then(() => {
        if (song && !song.isPlaying()) song.loop();
      }).catch(() => {});
      return;
    }

    if (typeof getAudioContext === 'function') {
      let ctx = getAudioContext();
      if (ctx && ctx.state !== 'running' && ctx.resume) {
        ctx.resume().then(() => {
          if (song && !song.isPlaying()) song.loop();
        }).catch(() => {});
        return;
      }
    }

    // fallback: 直接播放（瀏覽器可能會阻擋，視情況而定）
    if (song && !song.isPlaying()) song.loop();
  } catch (e) {
    // 忽略任何錯誤
  }
}

function toggleMusicOnHit() {
  if (!song) return;

  let hit = false;
  // 取得當前的音量縮放比例，以準確計算點擊範圍
  let level = amplitude.getLevel();
  let sizeFactor = map(level, 0, 1, 0.5, 1.5);

  for (let s of shapes) {
    let d = dist(mouseX, mouseY, s.x, s.y);
    // 判斷是否點擊在圖案範圍內
    if (d < (s.w / 2) * s.scale * sizeFactor) {
      hit = true;
      break;
    }
  }

  if (hit && song.isPlaying()) {
    song.stop();
  } else {
    startAudioIfNeeded();
  }
}

function mousePressed() {
  toggleMusicOnHit();
}

function touchStarted() {
  toggleMusicOnHit();
}
