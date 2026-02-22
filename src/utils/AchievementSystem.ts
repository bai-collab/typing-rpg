export interface AchievementIds {
    BEGINNER: string;
    COMBO_MASTER: string;
    PERFECTIONIST: string;
    SCHOLAR: string;
    IMMORTAL: string;
}

export const ACHIEVEMENTS: AchievementIds = {
    BEGINNER: 'beginner',
    COMBO_MASTER: 'combo_master',
    PERFECTIONIST: 'perfectionist',
    SCHOLAR: 'scholar',
    IMMORTAL: 'immortal'
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
                    unlockedAchievements: parsed.unlockedAchievements || {}
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
            unlockedAchievements: {}
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
    public static onLevelComplete(_mode: string, accuracy: number, usedRevive: boolean, onUnlock: (a: AchievementDef) => void) {
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

        this.saveStats(stats);
        this.checkUnlocks(stats, onUnlock);
    }

    public static onComboUpdate(combo: number, onUnlock: (a: AchievementDef) => void) {
        const stats = this.loadStats();
        if (combo > stats.maxCombo) {
            stats.maxCombo = combo;
            this.saveStats(stats);
            this.checkUnlocks(stats, onUnlock);
        }
    }

    public static onWordTyped(word: string, onUnlock: (a: AchievementDef) => void) { // We track words generically or just for advanced, specs said Advanced but Intermediate uses words too. Let's allow both or stick to spec. Spec says "高階模式", but intermediate is basically same now. Let's strictly check mode if we want, or allow both. Let's allow both.

        const stats = this.loadStats();
        const lower = word.toLowerCase();
        if (!stats.uniqueWordsTyped.includes(lower)) {
            stats.uniqueWordsTyped.push(lower);
            this.saveStats(stats);
            this.checkUnlocks(stats, onUnlock);
        }
    }
}
