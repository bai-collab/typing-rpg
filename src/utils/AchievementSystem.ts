export interface AchievementIds {
    BEGINNER: string;
    COMBO_MASTER: string;
    PERFECTIONIST: string;
    SCHOLAR: string;
    IMMORTAL: string;
    WORD_MASTER: string;
    SPEED_KING: string;
    COLLECTOR_R: string;
    COLLECTOR_SR: string;
    COLLECTOR_SSR: string;
    ULTIMATE_CHALLENGE: string;
    WARRIOR_NO_DAMAGE: string;
    COMBO_KING: string;
    CRIT_EXPERT: string;
    ECONOMY_MASTER: string;
}

export const ACHIEVEMENTS: AchievementIds = {
    BEGINNER: 'beginner',
    COMBO_MASTER: 'combo_master',
    PERFECTIONIST: 'perfectionist',
    SCHOLAR: 'scholar',
    IMMORTAL: 'immortal',
    WORD_MASTER: 'word_master',
    SPEED_KING: 'speed_king',
    COLLECTOR_R: 'collector_r',
    COLLECTOR_SR: 'collector_sr',
    COLLECTOR_SSR: 'collector_ssr',
    ULTIMATE_CHALLENGE: 'ultimate_challenge',
    WARRIOR_NO_DAMAGE: 'warrior_no_damage',
    COMBO_KING: 'combo_king',
    CRIT_EXPERT: 'crit_expert',
    ECONOMY_MASTER: 'economy_master'
};

export interface AchievementDef {
    id: string;
    title: string;
    icon: string;
    description: string;
    rewardDesc: string;
    maxProgress: number;
    getProgress: (stats: PlayerLifetimeStats) => number;
}

export interface PlayerLifetimeStats {
    totalLevels: number;
    maxCombo: number;
    totalPerfectClears: number;
    uniqueWordsTyped: string[];
    noReviveStreak: number;
    unlockedAchievements: { [id: string]: number }; // id -> timestamp completed
    totalGold: number;
    totalCrits: number;
    noDamageStreak: number;
    totalTypedChars: number;
    totalTimeMs: number;
    collectedItemIds: string[];
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
    {
        id: ACHIEVEMENTS.BEGINNER,
        title: "打字新手 🥉",
        icon: "🥉",
        description: "完成 10 關",
        rewardDesc: "解鎖新角色外觀顏色",
        maxProgress: 10,
        getProgress: (s) => s.totalLevels
    },
    {
        id: ACHIEVEMENTS.COMBO_MASTER,
        title: "連擊大師 🥈",
        icon: "🥈",
        description: "達成 50 連擊",
        rewardDesc: "永久攻擊力 +5%",
        maxProgress: 50,
        getProgress: (s) => s.maxCombo
    },
    {
        id: ACHIEVEMENTS.PERFECTIONIST,
        title: "完美主義者 🥇",
        icon: "🥇",
        description: "累計 10 次 100% 正確率通關",
        rewardDesc: "專屬稱號「完美打字員」",
        maxProgress: 10,
        getProgress: (s) => s.totalPerfectClears
    },
    {
        id: ACHIEVEMENTS.SCHOLAR,
        title: "單字學者 💎",
        icon: "💎",
        description: "累計輸入 100 個不同單字 (高階模式)",
        rewardDesc: "解鎖特殊道具「學者之書」(永久 +10% 經驗值/分數)",
        maxProgress: 100,
        getProgress: (s) => s.uniqueWordsTyped.length
    },
    {
        id: ACHIEVEMENTS.IMMORTAL,
        title: "不死勇者 🔥",
        icon: "🔥",
        description: "不使用復活道具通關 20 關",
        rewardDesc: "神秘獎勵 (永久最大生命 +20%)",
        maxProgress: 20,
        getProgress: (s) => s.noReviveStreak
    },
    {
        id: ACHIEVEMENTS.WORD_MASTER,
        title: "單字大師 📖",
        icon: "📖",
        description: "輸入超過 500 個不同單字",
        rewardDesc: "永久攻擊力 +10%",
        maxProgress: 500,
        getProgress: (s) => s.uniqueWordsTyped.length
    },
    {
        id: ACHIEVEMENTS.SPEED_KING,
        title: "速度之王 ⚡",
        icon: "⚡",
        description: "平均每分鐘打字超過 80 字",
        rewardDesc: "每回合額外時間 +1秒",
        maxProgress: 80,
        getProgress: (s) => {
            if (s.totalTimeMs === 0) return 0;
            const mins = s.totalTimeMs / 60000;
            const words = s.totalTypedChars / 5; // Standard 5 chars = 1 word
            return Math.floor(words / mins);
        }
    },
    {
        id: ACHIEVEMENTS.COLLECTOR_R,
        title: "收藏家 📦",
        icon: "📦",
        description: "收集所有 R 稀有度道具",
        rewardDesc: "初始血量 +50",
        maxProgress: 7, // Fixed number based on items/data.ts
        getProgress: (s) => {
            const rItems = ['atk_r', 'def_r', 'hp_r', 'heal_r', 'time_r', 'combo_r', 'charm_r'];
            return rItems.filter(id => s.collectedItemIds.includes(id)).length;
        }
    },
    {
        id: ACHIEVEMENTS.COLLECTOR_SR,
        title: "精英收藏家 💎",
        icon: "💎",
        description: "收集所有 SR 稀有度道具",
        rewardDesc: "初始攻擊力 +5",
        maxProgress: 7,
        getProgress: (s) => {
            const srItems = ['atk_sr', 'def_sr', 'hp_sr', 'heal_sr', 'time_sr', 'combo_sr', 'charm_sr'];
            return srItems.filter(id => s.collectedItemIds.includes(id)).length;
        }
    },
    {
        id: ACHIEVEMENTS.COLLECTOR_SSR,
        title: "傳奇收藏家 👑",
        icon: "👑",
        description: "收集所有 SSR 稀有度道具",
        rewardDesc: "暴擊率永久 +10%",
        maxProgress: 7,
        getProgress: (s) => {
            const ssrItems = ['atk_ssr', 'def_ssr', 'hp_ssr', 'heal_ssr', 'time_ssr', 'combo_ssr', 'charm_ssr'];
            return ssrItems.filter(id => s.collectedItemIds.includes(id)).length;
        }
    },
    {
        id: ACHIEVEMENTS.ULTIMATE_CHALLENGE,
        title: "終極挑戰 🏆",
        icon: "🏆",
        description: "通關 50 關卡",
        rewardDesc: "專屬金閃閃角色皮膚",
        maxProgress: 50,
        getProgress: (s) => s.totalLevels
    },
    {
        id: ACHIEVEMENTS.WARRIOR_NO_DAMAGE,
        title: "無傷勇士 🛡️",
        icon: "🛡️",
        description: "連續 5 關不受傷",
        rewardDesc: "生命值永久 +5% (可與其他加成疊加)",
        maxProgress: 5,
        getProgress: (s) => s.noDamageStreak
    },
    {
        id: ACHIEVEMENTS.COMBO_KING,
        title: "連擊王者 👑",
        icon: "👑",
        description: "達成 100 連擊",
        rewardDesc: "爆擊傷害加倍",
        maxProgress: 100,
        getProgress: (s) => s.maxCombo
    },
    {
        id: ACHIEVEMENTS.CRIT_EXPERT,
        title: "爆擊專家 💥",
        icon: "💥",
        description: "觸發爆擊 50 次",
        rewardDesc: "爆擊率 +5%",
        maxProgress: 50,
        getProgress: (s) => s.totalCrits
    },
    {
        id: ACHIEVEMENTS.ECONOMY_MASTER,
        title: "經濟大師 💰",
        icon: "💰",
        description: "累積 10,000 金幣",
        rewardDesc: "每關結束額外獲得 10% 金幣",
        maxProgress: 10000,
        getProgress: (s) => s.totalGold
    }
];

export class AchievementSystem {
    private static statsKey = 'typingRpgLifetimeStats';

    public static loadStats(): PlayerLifetimeStats {
        const data = localStorage.getItem(this.statsKey);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                // Ensure uniqueWordsTyped is an array (JSON parses Set to empty obj if not careful, so we store as Array)
                return {
                    totalLevels: parsed.totalLevels || 0,
                    maxCombo: parsed.maxCombo || 0,
                    totalPerfectClears: parsed.totalPerfectClears || 0,
                    uniqueWordsTyped: Array.isArray(parsed.uniqueWordsTyped) ? parsed.uniqueWordsTyped : [],
                    noReviveStreak: parsed.noReviveStreak || 0,
                    unlockedAchievements: parsed.unlockedAchievements || {},
                    totalGold: parsed.totalGold || 0,
                    totalCrits: parsed.totalCrits || 0,
                    noDamageStreak: parsed.noDamageStreak || 0,
                    totalTypedChars: parsed.totalTypedChars || 0,
                    totalTimeMs: parsed.totalTimeMs || 0,
                    collectedItemIds: Array.isArray(parsed.collectedItemIds) ? parsed.collectedItemIds : []
                };
            } catch (e) {
                console.error("Failed to parse lifetime stats", e);
            }
        }
        return {
            totalLevels: 0,
            maxCombo: 0,
            totalPerfectClears: 0,
            uniqueWordsTyped: [],
            noReviveStreak: 0,
            unlockedAchievements: {},
            totalGold: 0,
            totalCrits: 0,
            noDamageStreak: 0,
            totalTypedChars: 0,
            totalTimeMs: 0,
            collectedItemIds: []
        };
    }

    public static saveStats(stats: PlayerLifetimeStats) {
        localStorage.setItem(this.statsKey, JSON.stringify(stats));
    }

    // Call this after any stat update to check for new unlocks
    public static checkUnlocks(stats: PlayerLifetimeStats, onUnlock: (ach: AchievementDef) => void) {
        let changed = false;

        for (const def of ACHIEVEMENT_DEFINITIONS) {
            if (!stats.unlockedAchievements[def.id]) {
                const progress = def.getProgress(stats);
                if (progress >= def.maxProgress) {
                    stats.unlockedAchievements[def.id] = Date.now();
                    changed = true;
                    onUnlock(def);
                }
            }
        }

        if (changed) {
            this.saveStats(stats);
        }
    }

    // Handlers for combat events
    public static onLevelComplete(mode: string, accuracy: number, usedRevive: boolean, tookDamage: boolean, onUnlock: (a: AchievementDef) => void) {
        if (mode === 'Beginner') return; // Beginner mode doesn't count towards achievements
        const stats = this.loadStats();

        stats.totalLevels++;

        if (accuracy >= 1.0) {
            stats.totalPerfectClears++;
        }

        if (usedRevive) {
            stats.noReviveStreak = 0;
        } else {
            stats.noReviveStreak++;
        }

        if (tookDamage) {
            stats.noDamageStreak = 0;
        } else {
            stats.noDamageStreak++;
        }

        this.saveStats(stats);
        this.checkUnlocks(stats, onUnlock);
    }

    public static onGoldEarned(amount: number, onUnlock: (a: AchievementDef) => void) {
        const stats = this.loadStats();
        stats.totalGold += amount;
        this.saveStats(stats);
        this.checkUnlocks(stats, onUnlock);
    }

    public static onCritTriggered(onUnlock: (a: AchievementDef) => void) {
        const stats = this.loadStats();
        stats.totalCrits++;
        this.saveStats(stats);
        this.checkUnlocks(stats, onUnlock);
    }

    public static onItemCollected(itemId: string, onUnlock: (a: AchievementDef) => void) {
        const stats = this.loadStats();
        if (!stats.collectedItemIds.includes(itemId)) {
            stats.collectedItemIds.push(itemId);
            this.saveStats(stats);
            this.checkUnlocks(stats, onUnlock);
        }
    }

    public static onStatsUpdate(chars: number, timeMs: number, onUnlock: (a: AchievementDef) => void) {
        const stats = this.loadStats();
        stats.totalTypedChars += chars;
        stats.totalTimeMs += timeMs;
        this.saveStats(stats);
        this.checkUnlocks(stats, onUnlock);
    }

    public static onComboUpdate(combo: number, onUnlock: (a: AchievementDef) => void, mode?: string) {
        if (mode === 'Beginner') return;
        const stats = this.loadStats();
        if (combo > stats.maxCombo) {
            stats.maxCombo = combo;
            this.saveStats(stats);
            this.checkUnlocks(stats, onUnlock);
        }
    }

    public static onWordTyped(word: string, onUnlock: (a: AchievementDef) => void, mode?: string) {
        if (mode === 'Beginner') return;

        const stats = this.loadStats();
        const lower = word.toLowerCase();
        if (!stats.uniqueWordsTyped.includes(lower)) {
            stats.uniqueWordsTyped.push(lower);
            this.saveStats(stats);
            this.checkUnlocks(stats, onUnlock);
        }
    }
}
