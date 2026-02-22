export type EasingFunction = (t: number) => number;

export const Easing = {
    linear: (t: number) => t,
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOutElastic: (t: number) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeOutBack: (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
};

interface TweenConfig {
    target: any;
    props: Record<string, number>;
    duration: number; // in milliseconds
    easing?: EasingFunction;
    onUpdate?: () => void;
    onComplete?: () => void;
}

class TweenInstance {
    private target: any;
    private startProps: Record<string, number> = {};
    private endProps: Record<string, number>;
    private duration: number;
    private easing: EasingFunction;
    private onUpdate?: () => void;
    private onComplete?: () => void;

    private elapsed: number = 0;
    public isComplete: boolean = false;

    constructor(config: TweenConfig) {
        this.target = config.target;
        this.endProps = config.props;
        this.duration = config.duration;
        this.easing = config.easing || Easing.linear;
        this.onUpdate = config.onUpdate;
        this.onComplete = config.onComplete;

        // Record start properties
        for (const key in this.endProps) {
            this.startProps[key] = this.target[key] || 0;
        }
    }

    public update(deltaMs: number) {
        if (this.isComplete) return;

        this.elapsed += deltaMs;
        let progress = this.duration > 0 ? this.elapsed / this.duration : 1;
        if (progress > 1) progress = 1;

        const easedProgress = this.easing(progress);

        for (const key in this.endProps) {
            const startVal = this.startProps[key];
            const endVal = this.endProps[key];
            this.target[key] = startVal + (endVal - startVal) * easedProgress;
        }

        if (this.onUpdate) this.onUpdate();

        if (progress === 1) {
            this.isComplete = true;
            if (this.onComplete) this.onComplete();
        }
    }
}

export class TweenManager {
    private tweens: TweenInstance[] = [];

    public to(config: TweenConfig): TweenInstance {
        const tween = new TweenInstance(config);
        this.tweens.push(tween);
        return tween;
    }

    public wait(duration: number, onComplete: () => void) {
        this.to({ target: {}, props: {}, duration, onComplete });
    }

    public update(deltaMs: number) {
        for (let i = this.tweens.length - 1; i >= 0; i--) {
            const tween = this.tweens[i];
            if (!tween) continue;

            tween.update(deltaMs);

            // Re-check in case the array was completely modified during update (e.g. clear() called)
            if (this.tweens[i] === tween && tween.isComplete) {
                this.tweens.splice(i, 1);
            }
        }
    }

    public clear() {
        this.tweens = [];
    }
}

export const tweenManager = new TweenManager();
