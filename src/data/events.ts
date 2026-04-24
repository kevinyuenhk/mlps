import type { GameEvent } from '../types';

export const EVENTS: GameEvent[] = [
  // EVENT 1: Route Choice
  {
    id: 'collapsed_bridge',
    title: '坍塌的橋樑',
    description:
      '橫跨峽谷的主路部分坍塌。腐爛的木板懸掛在十呎高的深淵上方。三條路線擺在面前：小心翼翼地踩過殘餘的結構，沿着一條更長的安全小路折返，或者把木板綁在一起強行通過。',
    type: 'route_choice',
    nodeId: 'outer_graves',
    options: [
      {
        id: 'cross_carefully',
        label: '小心通過',
        description: '穩穩地踏出每一步。橋大概撐得住。',
        riskLevel: 'medium',
        baseWeight: 0.55,
        signalAlignment: { urgency: 0.6, survivalPriority: 0.4, missionFocus: 0.4 },
        traitBonuses: {
          Brave: 0.25,
          Calm: 0.2,
          Dutiful: 0.15,
          Fearful: -0.3,
          Wary: -0.2,
          Fragile: -0.15,
        },
        outcome: {
          hpChange: -8,
          stressChange: 10,
          loyaltyChange: 2,
          faithChange: 0,
          narrativeResult:
            '隊伍小心翼翼地走了過去。一塊木板斷裂，但每個人都抵達了對岸，雖然心有餘悸，好在毫髮無傷。',
          relicProgress: false,
        },
      },
      {
        id: 'safe_detour',
        label: '繞遠路',
        description: '沿外圍墓群折返。慢一些，但安全無虞。',
        riskLevel: 'low',
        baseWeight: 0.45,
        signalAlignment: { survivalPriority: 0.9, stealthPreference: 0.5 },
        traitBonuses: {
          Wary: 0.4,
          Rational: 0.3,
          Calm: 0.15,
          Stubborn: -0.2,
          Brave: -0.1,
          Dutiful: -0.1,
        },
        outcome: {
          hpChange: 0,
          stressChange: -5,
          loyaltyChange: -2,
          faithChange: 0,
          narrativeResult:
            '繞道過程平安無事。時間有所損失，士氣略有下降，但隊伍安然無恙地抵達了。',
          relicProgress: false,
        },
      },
      {
        id: 'force_through',
        label: '強行通過',
        description: '用繩子綁好木板，全速衝過去。',
        riskLevel: 'high',
        baseWeight: 0.35,
        signalAlignment: { urgency: 0.9, aggression: 0.5, missionFocus: 0.5 },
        traitBonuses: {
          Brave: 0.4,
          Stubborn: 0.35,
          Loyal: 0.1,
          Fearful: -0.5,
          Rational: -0.3,
          Fragile: -0.4,
          Wary: -0.35,
        },
        outcome: {
          hpChange: -18,
          stressChange: 20,
          loyaltyChange: 3,
          faithChange: 5,
          narrativeResult:
            '橋在重壓下發出刺耳的呻吟。兩名成員滑倒，摔出了淤青。他們成功抵達，但代價不菲。',
          relicProgress: false,
        },
      },
    ],
  },

  // EVENT 2: Moral Dilemma
  {
    id: 'wounded_gravekeeper',
    title: '受傷的守墓人',
    description:
      '一名穿着守墓人外套的老人靠在墓碑上，緊緊按着腿上深深的傷口。他抬起頭，眼中滿是絕望的懇求。「求求你們——那些怪物黃昏時就來了。我熟悉深處墓地的佈局。救我，我能為你們引路。」',
    type: 'moral_dilemma',
    nodeId: 'fork',
    options: [
      {
        id: 'help_keeper',
        label: '救助受傷者',
        description: '為他包紮傷口，聽他講述所知的一切。',
        riskLevel: 'low',
        baseWeight: 0.5,
        signalAlignment: { mercyPriority: 1.0, survivalPriority: 0.3, missionFocus: 0.3 },
        traitBonuses: {
          Compassionate: 0.55,
          Devout: 0.2,
          Loyal: 0.15,
          Greedy: -0.3,
          Skeptical: -0.15,
          Dutiful: -0.05,
        },
        outcome: {
          hpChange: 5,
          stressChange: -10,
          loyaltyChange: 8,
          faithChange: 10,
          narrativeResult:
            '守墓人的知識證明極為珍貴——他畫出了一條避開兩支亡靈巡邏隊的路線。士氣回升，信仰加深。',
          relicProgress: false,
        },
      },
      {
        id: 'ignore_keeper',
        label: '繼續前進——別理他',
        description: '任務不能為了陌生人而耽擱。',
        riskLevel: 'low',
        baseWeight: 0.35,
        signalAlignment: { missionFocus: 0.8, urgency: 0.7 },
        traitBonuses: {
          Skeptical: 0.2,
          Dutiful: 0.2,
          Rational: 0.1,
          Compassionate: -0.55,
          Devout: -0.2,
          Loyal: -0.1,
        },
        outcome: {
          hpChange: 0,
          stressChange: 15,
          loyaltyChange: -10,
          faithChange: -8,
          narrativeResult:
            '隊伍將老人拋在身後。他那低沉的懇求聲迴盪在耳邊。幾名成員變得沉默寡言；米拉的雙手因壓抑的愧疚而微微顫抖。',
          relicProgress: false,
        },
      },
      {
        id: 'interrogate_keeper',
        label: '簡短詢問',
        description: '索取有用的情報，然後繼續行動。',
        riskLevel: 'low',
        baseWeight: 0.55,
        signalAlignment: { missionFocus: 0.6, stealthPreference: 0.4, urgency: 0.4 },
        traitBonuses: {
          Clever: 0.45,
          Curious: 0.3,
          Rational: 0.25,
          Calm: 0.15,
          Compassionate: -0.1,
        },
        outcome: {
          hpChange: 0,
          stressChange: -5,
          loyaltyChange: 3,
          faithChange: 2,
          narrativeResult:
            '守墓人透露了一條有用的捷徑，隊伍隨即繼續前行。這是一個務實的妥協方案——沒有人完全滿意，但也不算太差。',
          relicProgress: false,
        },
      },
    ],
  },

  // EVENT 3: Temptation
  {
    id: 'glittering_vault',
    title: '閃耀的寶庫',
    description:
      '主路旁的一扇鐵門敞開着。裡面，火把的光芒映照着堆積如山的陪葬品——銀飾、古幣、還有一隻鑲嵌寶石的酒杯。看上去沒有被人動過的跡象。神器密室還在兩小時路程的深處。現在繞道可能會消耗寶貴的時間。',
    type: 'temptation',
    nodeId: 'chapel',
    options: [
      {
        id: 'investigate_treasure',
        label: '搜刮寶庫',
        description: '能拿多少拿多少。財富本身就是獎勵。',
        riskLevel: 'medium',
        baseWeight: 0.3,
        signalAlignment: { greedAllowance: 1.0 },
        traitBonuses: {
          Greedy: 0.65,
          Curious: 0.3,
          Brave: 0.1,
          Loyal: -0.2,
          Dutiful: -0.3,
          Devout: -0.25,
          Wary: -0.15,
        },
        outcome: {
          hpChange: -10,
          stressChange: 5,
          loyaltyChange: -5,
          faithChange: -12,
          narrativeResult:
            '寶庫被搜刮一空。一個守護靈蘇醒了——隊伍擊退了它，但也付出了代價。凱爾咧嘴笑着，滿載而歸；米拉則為自己祈求寬恕。',
          relicProgress: false,
        },
      },
      {
        id: 'stay_on_mission',
        label: '專注任務',
        description: '留下那些金子。神器更重要。',
        riskLevel: 'low',
        baseWeight: 0.5,
        signalAlignment: { missionFocus: 1.0, urgency: 0.5 },
        traitBonuses: {
          Loyal: 0.3,
          Dutiful: 0.4,
          Devout: 0.25,
          Brave: 0.05,
          Greedy: -0.4,
          Curious: -0.1,
        },
        outcome: {
          hpChange: 0,
          stressChange: -8,
          loyaltyChange: 5,
          faithChange: 8,
          narrativeResult:
            '隊伍目不斜視地走過——或者說幾乎如此。任務優先。神聖庇佑更加強大。',
          relicProgress: false,
        },
      },
      {
        id: 'quick_scout',
        label: '快速偵察後繼續',
        description: '檢查陷阱或線索——然後繼續行進。',
        riskLevel: 'low',
        baseWeight: 0.55,
        signalAlignment: {
          missionFocus: 0.5,
          greedAllowance: 0.3,
          stealthPreference: 0.6,
        },
        traitBonuses: {
          Clever: 0.4,
          Curious: 0.35,
          Calm: 0.2,
          Wary: 0.1,
          Greedy: 0.15,
          Loyal: 0.05,
        },
        outcome: {
          hpChange: 0,
          stressChange: -3,
          loyaltyChange: 2,
          faithChange: 0,
          narrativeResult:
            '快速掃視沒有發現任何危險。艾文偷偷揣走了一塊刻有銘文的石頭供日後研究。隊伍迅速繼續前行。',
          relicProgress: false,
        },
      },
    ],
  },

  // EVENT 4: Combat
  {
    id: 'restless_dead_ambush',
    title: '亡靈伏擊',
    description:
      '六具蹣跚的屍體從祭壇土丘中爬起，隊伍剛走近深處祭壇。空洞的眼眶死死盯住入侵者。他們行動緩慢，但數量令人擔憂。前方祭壇通道是唯一的前進路線。',
    type: 'combat',
    nodeId: 'deep_altar',
    options: [
      {
        id: 'fight_through',
        label: '強行突破',
        description: '正面交鋒，打通通道。不留餘力。',
        riskLevel: 'high',
        baseWeight: 0.5,
        signalAlignment: { aggression: 1.0, missionFocus: 0.5 },
        traitBonuses: {
          Brave: 0.55,
          Stubborn: 0.35,
          Loyal: 0.1,
          Fearful: -0.55,
          Fragile: -0.4,
          Wary: -0.2,
          Rational: -0.1,
        },
        outcome: {
          hpChange: -22,
          stressChange: 25,
          loyaltyChange: 5,
          faithChange: 3,
          narrativeResult:
            '亡者倒下了——但代價不菲。每個人都帶着傷痕和淤青。羅文手臂上被劃開一道口子。通道暢通了。',
          relicProgress: false,
        },
      },
      {
        id: 'withdraw',
        label: '撤退重整',
        description: '後退，尋找另一條路線。',
        riskLevel: 'low',
        baseWeight: 0.25,
        signalAlignment: { survivalPriority: 0.9, stealthPreference: 0.5 },
        traitBonuses: {
          Fearful: 0.45,
          Wary: 0.35,
          Rational: 0.15,
          Brave: -0.35,
          Stubborn: -0.45,
          Loyal: -0.15,
          Dutiful: -0.1,
        },
        outcome: {
          hpChange: -5,
          stressChange: -5,
          loyaltyChange: -8,
          faithChange: -5,
          narrativeResult:
            '隊伍退到一個側面的壁龕中。亡者失去了興趣。後來找到了一條更長的路線——時間損失了，士氣不太確定。',
          relicProgress: false,
        },
      },
      {
        id: 'defensive_formation',
        label: '防禦陣型',
        description: '盾牆。讓他們來。有條不紊地將其擊潰。',
        riskLevel: 'medium',
        baseWeight: 0.55,
        signalAlignment: { survivalPriority: 0.6, aggression: 0.3, missionFocus: 0.5 },
        traitBonuses: {
          Rational: 0.4,
          Calm: 0.35,
          Loyal: 0.25,
          Dutiful: 0.3,
          Brave: 0.1,
          Fearful: -0.1,
          Stubborn: 0.1,
        },
        outcome: {
          hpChange: -12,
          stressChange: 8,
          loyaltyChange: 8,
          faithChange: 5,
          narrativeResult:
            '盾牆穩如磐石。亡者的枯手找不到任何破綻。亡靈被系統性地逐一消滅。高效，令人團結。',
          relicProgress: false,
        },
      },
    ],
  },

  // EVENT 5: Boss
  {
    id: 'chamber_guardian',
    title: '密室守衛',
    description:
      '一座十呎高的古墓騎士矗立在神器密室的中央——被墓葬魔法驅動的鏽蝕鎧甲。神聖神器在後方的石壇上閃閃發光。守衛空洞的面甲轉向隊伍。它擋在了他們和他們此行一切的目標之間。',
    type: 'boss',
    nodeId: 'relic_chamber',
    options: [
      {
        id: 'press_attack',
        label: '全力進攻',
        description: '在它適應之前一舉擊潰。不留後路。',
        riskLevel: 'high',
        baseWeight: 0.45,
        signalAlignment: { aggression: 0.9, missionFocus: 0.9 },
        traitBonuses: {
          Brave: 0.55,
          Stubborn: 0.35,
          Loyal: 0.15,
          Fearful: -0.6,
          Fragile: -0.5,
          Wary: -0.25,
          Rational: -0.15,
        },
        outcome: {
          hpChange: -30,
          stressChange: 30,
          loyaltyChange: 10,
          faithChange: 15,
          narrativeResult:
            '守衛在鎧甲崩塌的轟響中倒下。神器被奪取了。代價慘重——每個人都負了傷，有些還很嚴重——但任務完成了。',
          relicProgress: true,
        },
      },
      {
        id: 'conserve_and_flank',
        label: '穩紮穩打',
        description: '以戰術耐心消耗它。',
        riskLevel: 'medium',
        baseWeight: 0.6,
        signalAlignment: {
          survivalPriority: 0.5,
          missionFocus: 0.8,
          urgency: 0.3,
        },
        traitBonuses: {
          Clever: 0.45,
          Rational: 0.4,
          Calm: 0.3,
          Dutiful: 0.2,
          Brave: 0.1,
          Fearful: -0.05,
        },
        outcome: {
          hpChange: -18,
          stressChange: 15,
          loyaltyChange: 8,
          faithChange: 10,
          narrativeResult:
            '團隊協作之下，隊伍找到了守衛防禦的破綻。它終於崩塌了。雖然帶着傷，但尚未崩潰——他們取回了神器。',
          relicProgress: true,
        },
      },
      {
        id: 'retreat_partial',
        label: '撤退——放棄神器',
        description: '隊伍承受不了這場戰鬥。撤退。',
        riskLevel: 'low',
        baseWeight: 0.2,
        signalAlignment: { survivalPriority: 0.95 },
        traitBonuses: {
          Fearful: 0.45,
          Wary: 0.5,
          Fragile: 0.35,
          Brave: -0.45,
          Stubborn: -0.55,
          Loyal: -0.2,
          Dutiful: -0.25,
        },
        outcome: {
          hpChange: -5,
          stressChange: 30,
          loyaltyChange: -15,
          faithChange: -20,
          narrativeResult:
            '隊伍退出了密室。守衛沒有追擊。神器留在原地。他們活下來了——但信仰的代價是什麼？',
          relicProgress: false,
        },
      },
    ],
  },

  // EVENT 6: Extraction
  {
    id: 'escape_route',
    title: '撤離之路',
    description:
      '神器在手（或任務失敗），墓地似乎察覺到了。亡者開始騷動。霧氣變得濃重。一條側面的通道提供了快速逃脫的路線，但一名隊員受了重傷，步伐艱難。黑暗深處傳來聲音，暗示着還有倖存者。你會當機立斷、抬着傷者、還是再冒一次險？',
    type: 'extraction',
    nodeId: 'escape',
    options: [
      {
        id: 'escape_immediately',
        label: '立即撤離',
        description: '趁亡者完全甦醒之前離開。',
        riskLevel: 'low',
        baseWeight: 0.5,
        signalAlignment: { survivalPriority: 0.9, urgency: 0.8 },
        traitBonuses: {
          Wary: 0.3,
          Calm: 0.25,
          Dutiful: 0.2,
          Stubborn: -0.2,
          Brave: -0.1,
          Greedy: -0.1,
        },
        outcome: {
          hpChange: 0,
          stressChange: -10,
          loyaltyChange: 2,
          faithChange: 5,
          narrativeResult:
            '隊伍毫不猶豫地朝出口奔去。迷霧在他們面前散開。他們帶着滿身傷痕，但活着走了出來。',
          relicProgress: false,
        },
      },
      {
        id: 'search_once_more',
        label: '再搜索一次',
        description: '冒險做最後一次搜索——也許還有值得帶走的東西。',
        riskLevel: 'medium',
        baseWeight: 0.3,
        signalAlignment: { greedAllowance: 0.6, missionFocus: 0.4, urgency: 0.5 },
        traitBonuses: {
          Greedy: 0.45,
          Curious: 0.35,
          Brave: 0.2,
          Loyal: 0.1,
          Fearful: -0.35,
          Wary: -0.3,
          Dutiful: -0.1,
        },
        outcome: {
          hpChange: -15,
          stressChange: 20,
          loyaltyChange: -3,
          faithChange: -5,
          narrativeResult:
            '最後的搜索找到了一片神聖經文的殘片——很有價值，但亡者已經近在咫尺。傷勢加劇。逃脫之路驚險萬分。',
          relicProgress: false,
        },
      },
      {
        id: 'carry_wounded',
        label: '救助傷者——不拋棄任何人',
        description: '一起把受傷的隊員抬出去。',
        riskLevel: 'low',
        baseWeight: 0.55,
        signalAlignment: { mercyPriority: 1.0, survivalPriority: 0.6 },
        traitBonuses: {
          Compassionate: 0.6,
          Loyal: 0.45,
          Devout: 0.2,
          Brave: 0.1,
          Greedy: -0.2,
          Dutiful: 0.15,
        },
        outcome: {
          hpChange: 5,
          stressChange: -15,
          loyaltyChange: 15,
          faithChange: 12,
          narrativeResult:
            '沒有人被拋下。隊伍一起將傷員抬入了灰濛濛的黎明，步伐緩慢但不屈不撓。信仰比以往更加熾烈。',
          relicProgress: false,
        },
      },
    ],
  },
];

export function getEventById(id: string): GameEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}
