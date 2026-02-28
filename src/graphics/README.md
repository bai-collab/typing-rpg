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

### 引擎模組

| 模組 | 說明 | 用途 |
|------|------|------|
| `PixelRenderer` | 像素矩陣渲染器 | 將 2D 數字陣列 + 色盤轉為 PixiJS Graphics |
| `ParticleSystem` | 粒子系統 | 爆炸、攻擊火花、命中效果 |
| `VFXLibrary` | 視覺特效庫 | 衝擊波、十字光、投射物、傷害數字、斬擊弧線 |
| `SpriteAnimator` | 精靈動畫器 | 呼吸效果、果凍搖晃、武器發光、護盾光環 |

### 精靈圖庫 (`sprites/`)

| 檔案 | 內容 | 數量 |
|------|------|------|
| `HeroSprites.ts` | 英雄像素圖 (idle/attack/hit/death) | 5 職業 × 4 姿勢 = **20 幀** |
| `MonsterSprites.ts` | 怪物像素圖 + 等級選擇器 | **6 種怪物** |
| `NPCSprites.ts` | NPC 像素圖 | **4 種 NPC** |
| `ItemIcons.ts` | 道具像素圖示 (8×8) | **7 戰鬥 + 15 商店 = 22 個** |

#### 英雄（HeroSprites）

| 職業 | idle | attack | hit | death |
|------|------|--------|-----|-------|
| 🗡️ 戰士 (warrior) | ✅ | ✅ 揮劍 | ✅ 受擊後仰 | ✅ 倒地 |
| 🔮 法師 (mage)     | ✅ | ✅ 施法 | ✅ 受擊後仰 | ✅ 倒地 |
| 🏹 遊俠 (ranger)   | ✅ | ✅ 射箭 | ✅ 受擊後仰 | ✅ 倒地 |
| 🛡️ 坦克 (tank)     | ✅ | ✅ 盾擊 | ✅ 受擊後仰 | ✅ 倒地 |
| ⚔️ 聖騎士 (paladin) | ✅ | ✅ 聖擊 | ✅ 受擊後仰 | ✅ 倒地 |

#### 怪物（MonsterSprites）

| 名稱 | 等級範圍 | 描述 |
|------|----------|------|
| 🟢 Slime | Lv 1-5 | 經典果凍怪 |
| 🦇 Bat | Lv 3-10 | 紫色蝙蝠 |
| 💀 Skeleton | Lv 6-15 | 骷髏戰士 |
| 👺 Goblin | Lv 8-20 | 綠皮哥布林 |
| ⚔️ Dark Knight | Lv 15-30 | 黑騎士 |
| 🐉 Dragon | Lv 25+ | 火龍 BOSS |

#### NPC（NPCSprites）

| 名稱 | 用途 |
|------|------|
| 🏪 商人 (shopkeeper) | 商店系統 |
| 💊 治療師 (healer) | 回復系統 |
| 🔨 鐵匠 (blacksmith) | 洗鍊/強化系統 |
| 📖 賢者 (sage) | 教學/任務系統 |

#### 道具圖示（ItemIcons，8×8）

**戰鬥道具** — 按類型分，稀有度用色彩區分

| 圖示 | 類型 | 造型 |
|------|------|------|
| ⚔️ Attack | 攻擊 | 斜劍 |
| 🛡️ Defense | 防禦 | 盾牌 |
| ❤️ HP | 血量 | 愛心 |
| 💊 Heal | 補血 | 綠藥水瓶 |
| ⏱️ Time | 時間 | 沙漏 |
| 🔥 Combo | 連擊 | 火焰 |
| 🔮 Charm | 護符 | 水晶寶石 |

**商店道具** — 15 個獨立圖示

| 圖示 | ID | 造型 |
|------|------|------|
| 🧪 紅 | shop_potion_hp | 紅色藥水 |
| 🧪 橙 | shop_potion_atk | 橙色藥水 |
| 🧪 藍 | shop_potion_def | 藍色藥水 |
| 🧪 青 | shop_potion_time | 青色藥水 |
| 💎 | shop_revive | 藍鑽石 |
| 🪙 | shop_gold_boost | 金幣 |
| 📖 | shop_xp_boost | 書本 |
| 🍀 | shop_lucky | 四葉草 |
| 💥 | shop_crit_perm | 暴擊星 |
| 🔥 | shop_skin_flame | 火焰光環 |
| ❄️ | shop_skin_ice | 冰霜雪花 |

## 使用範例

### 建立角色精靈

```typescript
import { PixelRenderer, SpriteAnimator, HERO_SPRITES } from '../graphics';

const hero = HERO_SPRITES.warrior;
const sprite = PixelRenderer.render(hero.idle, hero.colors, 3);
PixelRenderer.addShadow(sprite, hero.idle, 3);
SpriteAnimator.breathing(sprite, 3, hero.idle.length, 400);
container.addChild(sprite);
```

### 按等級取怪物

```typescript
import { PixelRenderer, getMonsterForLevel } from '../graphics';

const monster = getMonsterForLevel(12); // 可能是 Skeleton 或 Goblin
const sprite = PixelRenderer.render(monster.art, monster.colors, 3);
container.addChild(sprite);
```

### 使用 NPC 精靈

```typescript
import { PixelRenderer, NPC_SPRITES } from '../graphics';

const shopkeeper = NPC_SPRITES.shopkeeper;
const sprite = PixelRenderer.render(shopkeeper.art, shopkeeper.colors, 3);
container.addChild(sprite);
```

### 發射粒子特效

```typescript
import { ParticleSystem } from '../graphics';

const particles = new ParticleSystem(container);
particles.burst(200, 300, 0xff0000, 20);
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
