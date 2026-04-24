## BUG: Map not visible, only see UI overlays with X,Y coordinates

### Problem
On mobile, the Phaser map is not visible. User can only see UI overlays showing X,Y coordinates. The map canvas exists but is completely covered by React UI overlays.

### Root cause
The ExpeditionScreen has too many UI overlays using `absolute` positioning that cover the Phaser canvas:
- Top HUD overlay (absolute, z-20)  
- MiniMap overlay (absolute, z-20)
- Bottom panel (absolute, z-20) with context + guidance buttons
- All these overlays together leave almost no visible space for the actual game map

### What to fix
Redesign ExpeditionScreen for MOBILE PORTRAIT (430px width):

1. **Remove heavy overlays** — make the map take up MOST of the screen
2. **Slim top bar**: Just map name + divine power count + loot, max 48px height
3. **Map area**: Takes remaining vertical space (flex-1), NO overlays on top of it
4. **Slim bottom bar**: Just context text + 3 nudge buttons, max 120px height
5. **MiniMap**: Put it INSIDE the slim top bar as a tiny 40x40 dot indicator, or remove entirely on mobile
6. **Party HP**: Tiny bar in top bar
7. **ExpeditionLog**: Remove from exploration screen (save for results)
8. **X,Y coordinates**: Remove or make optional (debug only)

### Layout target
```
┌─────────────────────┐
│ 🏛️ 白骨前廳  ⚡3 💰5│  ← 48px top bar
│ HP: ████░░ ███░░    │
├─────────────────────┤
│                     │
│                     │
│    PHASER MAP       │  ← flex-1 (majority of screen)
│    (no overlays)    │
│                     │
│                     │
├─────────────────────┤
│ 隊伍在長廊中緩慢推進 │  ← 120px bottom
│ [催速] [求穩] [任務] │
└─────────────────────┘
```

### Constraints
- All text in Traditional Chinese (繁體中文)
- PhaserContainer uses `w-full flex-1 min-h-[300px]`
- No absolute positioned overlays on the map area
- Must pass `npx tsc --noEmit`
- Only modify `src/screens/ExpeditionScreen.tsx`
- Do NOT modify any other files

### Verification
Run: `cd /Users/kevinyuen/mlps && npx tsc --noEmit`
Kill vite on 5173 and restart: `kill $(lsof -ti:5173) 2>/dev/null); sleep 1; cd /Users/kevinyuen/mlps && npx vite --host 0.0.0.0 &`
