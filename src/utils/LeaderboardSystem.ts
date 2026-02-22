export interface LeaderboardEntry {
    date: string;
    level: number;
    accuracy: number;
    mode: string;
    playTime: number;
    typedCount: number;
}

export class LeaderboardSystem {
    private static key = 'typingRpgLeaderboard';

    public static getTopRuns(): LeaderboardEntry[] {
        const data = localStorage.getItem(this.key);
        if (data) {
            try {
                return JSON.parse(data) as LeaderboardEntry[];
            } catch (e) {
                console.error("Leaderboard load failed", e);
            }
        }
        return [];
    }

    public static saveRun(entry: LeaderboardEntry) {
        let runs = this.getTopRuns();
        runs.push(entry);

        // Sort by level descending, then accuracy descending
        runs.sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
            return a.playTime - b.playTime; // Faster time is better tiebreaker
        });

        // Keep top 10
        if (runs.length > 10) runs = runs.slice(0, 10);

        localStorage.setItem(this.key, JSON.stringify(runs));
    }

    public static clearRuns() {
        localStorage.removeItem(this.key);
    }
}
