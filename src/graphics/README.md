# Graphics Library

Typing RPG 的核心圖形引擎，使用 **程序化像素藝術 (Procedural Pixel Art)** 技術渲染遊戲中所有視覺元素。

## 繪圖技術

本遊戲**不使用任何外部圖片或精靈圖 (Sprite Sheet)**。所有角色、怪物、特效都是透過程式碼即時生成的。

### 渲染管線

```
數字矩陣 (20×20 Grid)  →  色盤映射 (Color Palette)  →  PixiJS Graphics.rect()  →  畫面
```

1. **數字矩陣 (Pixel Grid)**: 每個角色/怪物是一個 20×20 的二維數字陣列
2. **色盤映射 (Color Palette)**: 陣列中的數字對應到一個顏色陣列（0 = 透明）
3. **逐像素繪製**: 遍歷矩陣，每個非零格子呼叫 `Graphics.rect()` 繪製一個 `3×3px` 方塊
4. **動態動畫**: 使用 PixiJS `Ticker` 驅動呼吸、搖晃、發光等效果

## 模組結構

| 模組 | 說明 | 用途 |
|------|------|------|
| `PixelRenderer` | 像素矩陣渲染器 | 將 2D 數字陣列 + 色盤轉為 PixiJS Graphics |
| `ParticleSystem` | 粒子系統 | 爆炸、攻擊火花、命中效果 |
| `VFXLibrary` | 視覺特效庫 | 衝擊波、十字光、投射物、傷害數字、斬擊弧線 |
| `SpriteAnimator` | 精靈動畫器 | 呼吸效果、果凍搖晃、武器發光、護盾光環 |

## 使用範例

### 建立角色精靈

```typescript
import { PixelRenderer, SpriteAnimator } from '../graphics';

const COLORS = [0x000000, 0xffccaa, 0x888888, 0x555555, 0xcc3333];
const ART = [
    [0, 0, 3, 3, 0, 0],
    [0, 3, 1, 1, 3, 0],
    [3, 1, 4, 4, 1, 3],
    [3, 2, 2, 2, 2, 3],
    [0, 3, 3, 3, 3, 0],
];

const sprite = PixelRenderer.render(ART, COLORS, 3);
PixelRenderer.addShadow(sprite, ART, 3);
SpriteAnimator.breathing(sprite, 3, ART.length, 400);
container.addChild(sprite);
```

### 發射粒子特效

```typescript
import { ParticleSystem } from '../graphics';

const particles = new ParticleSystem(container);
particles.burst(200, 300, 0xff0000, 20); // 紅色爆炸
// 在更新迴圈中：
particles.update(delta);
```

### 播放 VFX

```typescript
import { VFXLibrary } from '../graphics';

VFXLibrary.shockwave(container, x, y, 0x4477bb, 50);
VFXLibrary.damageNumber(container, x, y, 42, '#ff0000');
VFXLibrary.projectile(container, heroX, heroY, targetX, targetY, 0x00ccff);
```

## 設計哲學

- **零外部資源依賴**: 不需要載入圖片，渲染速度極快
- **完全可控**: 顏色、大小、動畫全部由程式碼控制
- **高度可重用**: 所有模組都是純功能性的，可用於任何 PixiJS 專案
- **自動清理**: VFX 和粒子動畫結束後自動銷毀，不會記憶體洩漏
