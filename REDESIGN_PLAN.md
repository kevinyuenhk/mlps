# 神遠征 — RO 風格多地圖探索重構

## 概念
好似 Ragnarok Online / 魔力寶貝咁：
- 每個「房間」係一張大型可探索地圖（~2000x2000px 世界）
- 隊伍喺地圖入面自動行走（有 waypoints 路線）
- 地圖邊緣有「出口點」，走到嗰度自動轉去下一張地圖
- 行行吓有機會觸發隨機戰鬥（同 RO 咁踩草叢遇敵）
- 視覺上每張地圖有唔同主題（墓窟、橋樑、寶庫、神殿…）

## 核心改動

### 1. 每張地圖獨立一個 Phaser Scene
唔再用一個超大地圖。改為 12 張獨立地圖，每張有自己嘅 Phaser Scene（或同一個 Scene 換 world）。

每張地圖包含：
- **地形背景**：用 Graphics 畫草地/石地/水（placeholder），唔需要真 art
- **障礙物**：石塊、柱、牆壁（隊伍會繞過）
- **行走路線**：幾條隊伍可以行嘅路
- **出口點**：地圖邊緣 1-3 個出口（有其他地圖嘅名稱）
- **遭遇區域**：某些草地/陰暗區域有遇敵機率
- **互動點**：寶箱、神壇、NPC（走到觸發事件）

### 2. 隊伍移動
- 隊伍自動沿預設路線行走（速度 ~50-80px/s，慢慢行）
- 走到路口會隨機揀一條路（受神力引導影響）
- 走到出口點 → 淡出 → 載入下一張地圖 → 淡入
- 走到遭遇區域 → 有機率觸發戰鬥
- 走到互動點 → 觸發事件

### 3. 隨機遭遇戰
- 每張地圖有若干「遭遇區域」（用顏色/紋理區分）
- 隊伍走入時擲骰：
  - hazard 地圖：40-70% 遇敵
  - 普通地圖：15-30% 遇敵
  - shrine/treasure：5% 遇敵
- 遇敵 → 螢幕閃一下 → 切去 BattleScreen
- 打完 → 返回同一張地圖同一位置繼續行

### 4. 12 張地圖主題
| # | 名稱 | 主題色調 | 遇敵率 | 特殊 |
|---|------|---------|--------|------|
| 1 | 遠征入口 | 灰石 #1a1d24 | 10% | 安全區 |
| 2 | 白骨前廳 | 暗紅 #1d1616 | 60% | 必戰 |
| 3 | 斷橋區 | 深棕 #16140f | 40% | 有陷阱區 |
| 4 | 傷者岔廳 | 暗綠 #121a16 | 15% | 有 NPC |
| 5 | 回聲長廊 | 冷灰 #141820 | 25% | 長走廊 |
| 6 | 閃光寶庫 | 金棕 #1a1610 | 10% | 寶箱 |
| 7 | 回聲神殿 | 聖白 #161a1e | 5% | 恢復 |
| 8 | 守望墓室 | 暗紫 #181420 | 55% | 強敵 |
| 9 | 裂痕交匯 | 腐綠 #141810 | 65% | 陷阱多 |
| 10 | 神龕前廊 | 深藍 #101420 | 20% | 靜謐 |
| 11 | 守護者墓廳 | 血紅 #1e1010 | 100% | Boss |
| 12 | 撤離石門 | 灰藍 #14161e | 0% | 出口 |

### 5. 地圖內部設計
每張地圖 ~2000x1500px，包含：
- 一條主路（隊伍主要行嘅路）
- 1-2 條分支路（有寶箱/隱藏嘢）
- 若干草地/碎石區（遭遇區域）
- 出口點（用發光門/箭頭標記）
- 裝飾物（石柱、火把、骸骨 — placeholder 矩形）

### 6. UI 改動
- **頂部 HUD**：目前地圖名、下一張地圖方向、迷你地圖
- **右上角迷你地圖**：顯示整個迷宮結構（12 個點 + 連線），已探索嘅會亮
- **中間**：Phaser 地圖（佔滿屏幕）
- **底部**：薄薄一行（語境文字 + 神力按鈕）
- **戰鬥**：維持 React BattleScreen

## 技術方案

### 檔案結構
```
src/phaser/
├── DungeonScene.ts      — 重寫：管理地圖切換、隊伍移動、遭遇檢測
├── mapRenderer.ts       — 新增：渲染單張地圖（背景、路、障礙、出口、裝飾）
├── mapData.ts           — 新增：12 張地圖嘅靜態資料（路線、出口、遭遇區）
├── partyController.ts   — 新增：隊伍自動行走邏輯（沿路移動、遇路口決策）
├── fogOfWar.ts          — 新增：迷霧系統（已探索區域揭開）
└── config.ts            — 更新
```

### PhaserScene 流程
```
create(mapId)
  → renderMap(mapId)           // 畫地圖
  → placeParty(spawnPoint)     // 放隊伍
  → startWalking()             // 開始行

update(delta)
  → movePartyAlongPath()       // 沿路移動
  → checkEncounterZone()       // 檢查是否踩中遭遇區
  → checkExitPoint()           // 檢查是否到出口
  → updateFog()                // 更新迷霧
  → updateCamera()             // camera 跟隊伍

onEncounter()
  → pauseWalking()
  → callback.onEncounter(mapId, enemyType)
  // React 切去 BattleScreen

onExit(nextMapId)
  → fadeOut()
  → destroyMap()
  → create(nextMapId)
  → fadeIn()
```

### 地圖資料結構
```typescript
interface MapData {
  id: string;
  name: string;
  description: string;
  width: number;     // e.g. 2000
  height: number;    // e.g. 1500
  bgColor: number;   // Phaser color
  paths: PathData[]; // 可行走嘅路
  encounters: EncounterZone[];
  exits: ExitPoint[];
  interactables: Interactable[];
  spawnPoint: Vec2;
}

interface PathData {
  id: string;
  points: Vec2[];      // 路線嘅 waypoints
  width: number;       // 路寬
}

interface EncounterZone {
  id: string;
  x: number; y: number;
  radius: number;
  chance: number;      // 0-1
  enemyPool: string[]; // 可能遇到嘅敵人
  cooldown: number;    // 遇完敵後幾秒內唔會再遇
}

interface ExitPoint {
  id: string;
  x: number; y: number;
  radius: number;
  targetMapId: string;
  targetSpawnPoint: Vec2;
  label: string;       // "前往 白骨前廳 →"
  visible: boolean;    // 是否已發現
}
```

## 不改嘅嘢
- TitleScreen、PartySelectionScreen、OracleSetupScreen — 不改
- BattleScreen、PostBattleScreen — 不改
- ResultScreen — 不改
- decision engine、oracle parser — 不改
- 所有 UI 繁體中文

## 改動檔案
1. `src/phaser/DungeonScene.ts` — 完全重寫
2. `src/phaser/mapData.ts` — 新增 12 張地圖資料
3. `src/phaser/mapRenderer.ts` — 新增地圖渲染
4. `src/phaser/partyController.ts` — 新增隊伍行走
5. `src/phaser/fogOfWar.ts` — 新增迷霧
6. `src/phaser/config.ts` — 更新
7. `src/components/PhaserContainer.tsx` — 更新 props
8. `src/components/MiniMap.tsx` — 更新顯示地圖結構
9. `src/screens/ExpeditionScreen.tsx` — UI 改為全屏地圖 + 薄底部
10. `src/types/index.ts` — 新增 MapData 相關 types
11. `src/game/expeditionManager.ts` — 更新探索邏輯
12. `src/utils/helpers.ts` — 如需

## 驗證
- `npx tsc --noEmit` 通過
- `npm run dev` 正常
- title → party → oracle → exploration 完整流程
- 隊伍喺地圖入面慢慢行，視覺上有 RO 咁嘅感覺
- 踩到遭遇區有機率觸發戰鬥
- 走到出口自動轉去下一張地圖
- 迷你地圖顯示已探索進度
- 全程繁體中文
