export interface GameStats {
    mode: string;
    level: number;
    score?: number;
    maxCombo?: number;
    wordsTyped?: number;
    durationSeconds?: number;
    won: boolean;
}

export interface PlayerSaveData {
    level: number;
    mode: string;
    currentHp: number;
    hpBase: number;
    score: number;
    highestCombo: number;
    inventory: string[];
}

export class CloudSave {
    private static getCredentials() {
        return {
            classId: localStorage.getItem('typingRpgClassId'),
            pin: localStorage.getItem('typingRpgPin'),
            gasUrl: localStorage.getItem('typingRpgGasUrl')
        };
    }

    /**
     * Sends match analytics (win/loss). Does not expect a readable response.
     */
    public static async reportMatchResult(stats: GameStats) {
        const { classId, pin, gasUrl } = this.getCredentials();
        if (!classId || !pin || !gasUrl) return;

        const payload = { action: 'RECORD_MATCH', classId, pin, timestamp: new Date().toISOString(), ...stats };

        try {
            fetch(gasUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) })
                .catch(e => console.error("CloudSave: Analytics error:", e));
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Saves full character progress to the cloud.
     */
    public static async saveProgress(data: PlayerSaveData) {
        const { classId, pin, gasUrl } = this.getCredentials();
        if (!classId || !pin || !gasUrl) return;

        const payload = { action: 'SAVE_PROGRESS', classId, pin, ...data };

        try {
            // Note: We use 'cors' here because even if we can't read the response reliably, 
            // a SUCCESS status is useful.
            await fetch(gasUrl, {
                method: 'POST',
                mode: 'no-cors', // Still using no-cors because GAS redirects are painful with standard fetch
                body: JSON.stringify(payload)
            });
            console.log("CloudSave: Progress saved to cloud for level", data.level);
        } catch (e) {
            console.error("CloudSave: Save error:", e);
        }
    }

    /**
     * Fetches character progress from the cloud.
     */
    public static async loadProgress(): Promise<PlayerSaveData | null> {
        const { classId, pin, gasUrl } = this.getCredentials();
        if (!classId || !pin || !gasUrl) return null;

        const payload = { action: 'LOAD_PROGRESS', classId, pin };

        try {
            // To LOAD, we MUST be able to read the response. 
            // GAS web apps allow CORS if you return JSON, but the browser follows a redirect.
            // Native fetch with 'follow' should work.
            const response = await fetch(gasUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.status === 'success' && result.saveData) {
                return result.saveData as PlayerSaveData;
            }
        } catch (e) {
            console.error("CloudSave: Load error (possibly CORS or missing data):", e);
        }
        return null;
    }

    /**
     * Fetches top 20 players from the global leaderboard (Google Sheets).
     */
    public static async fetchGlobalLeaderboard(): Promise<Record<string, any[]> | null> {
        const { classId, pin, gasUrl } = this.getCredentials();
        if (!gasUrl) return null;

        const payload = { action: 'GET_LEADERBOARD', classId, pin };

        try {
            const response = await fetch(gasUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.status === 'success' && result.leaderboard) {
                return result.leaderboard;
            }
        } catch (e) {
            console.error("CloudSave: Leaderboard fetch error:", e);
        }
        return null;
    }
}
