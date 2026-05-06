// Shared timer utilities for both main thread and worker

export const digitKeys = [
    'hour1',
    'hour2',
    'min1',
    'min2',
    'sec1',
    'sec2',
    'ds',
    'cs',
    'ms'
];

export const separatorKeys = [
    'hmSep',
    'msSep',
    'secDecimalSep'
];

export const timerDisplayKeys = [
    'hour1',
    'hour2',
    'hmSep',
    'min1',
    'min2',
    'msSep',
    'sec1',
    'sec2',
    'secDecimalSep',
    'ds',
    'cs',
    'ms'
];

export function drawCanvasTimer(ctx, digits, visibility, settings) {
    ctx.fillStyle = settings.bgColor;
    ctx.fillRect(0, 0, settings.width, settings.height);

    const style = `${settings.isItalic ? "italic " : ""}${settings.isBold ? "bold " : ""}`;
    ctx.font = `${style}${settings.fontSize}px "${settings.font}", monospace`;

    ctx.fillStyle = settings.textColor;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    const digitWidth = ctx.measureText("0").width;
    const colonWidth = ctx.measureText(":").width;
    const dotWidth = ctx.measureText(".").width;

    const totalWidth = digitWidth * digitKeys.length + colonWidth * 2 + dotWidth;
    let x = (settings.width - totalWidth) / 2;
    const y = settings.height / 2;

    for (const key of timerDisplayKeys) {
        const char = digits[key];
        const charClassWidth = separatorKeys.includes(key) ? (char == ':' ? colonWidth : dotWidth) : digitWidth;
        if (visibility[key]) {
            const charWidth = ctx.measureText(char).width;
            const offset = (charClassWidth - charWidth) / 2;

            ctx.fillText(char, x + offset, y);
        }

        x += charClassWidth;
    }
}

// Logical 'timer' class that be used for both DOM elements (for on-screen timer) and canvas (for rendered video)
// This does NOT encapsulate the full functionality of a timer (as this differs between instances)
// Instead, it stores variables about the timer state and allows retrieving the current timer digits and visibility
// The elapsedTime (and similar) variable(s) are updated from outside via a class method
// The global formatString variable is used to update the visibility map when needed - changing it will trigger the visibility to update
export class TimerBase {
    static defaultVisibility = {
        hour1: false,
        hour2: false,
        hmSep: false,
        min1: false,
        min2: false,
        msSep: false,
        sec1: false,
        sec2: true,     // one digit of seconds is always shown in all formats
        secDecimalSep: false,
        ds: false,
        cs: false,
        ms: false
    };

    constructor(timerFormatString) {
        this.elapsedTime = 0;       // recorded in ms
        this.visibility = {...TimerBase.defaultVisibility};
        this.formatString = timerFormatString

        // after this many milliseconds, more digits will be needed to show full time
        this.updateVisibilityThreshold = 10 * 1000;

        // flag if visibility has changed to avoid updating every DOM element's visibility repeatedly
        this.visibilityChanged = false;
    }

    updateElapsedTime(time) {
        this.visibilityChanged = false;
        this.elapsedTime = time;
        if (this.elapsedTime > this.updateVisibilityThreshold) {
            this.updateVisibility();
        }
        if (time == 0) {    // resetting timer
            this.updateVisibilityThreshold = 10 * 1000;
            this.updateVisibility();
        }
    }

    // digits aren't stored as instance variable because they are updated every time they are accessed
    getDigits() {
        const hours = Math.floor(this.elapsedTime / (1000 * 60 * 60));
        const minutes = Math.floor((this.elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((this.elapsedTime % (1000 * 60)) / 1000);
        const ms = Math.floor(this.elapsedTime % 1000);

        return {
            hour1: Math.floor(hours / 10),
            hour2: hours % 10,
            min1: Math.floor(minutes / 10),
            min2: minutes % 10,
            sec1: Math.floor(seconds / 10),
            sec2: seconds % 10,
            ds: Math.floor(ms / 100),
            cs: Math.floor((ms % 100) / 10),
            ms: ms % 10,

            // also return separators for convenience when rendering canvas
            hmSep: ":",
            msSep: ":",
            secDecimalSep: "."
        };
    }

    updateVisibility() {
        // reset to default
        this.visibility = {...TimerBase.defaultVisibility};

        if (this.formatString.includes("HH")) {
            this.visibility.hour1 = true;
        }

        if (this.formatString.includes("H")) {
            this.visibility.hour2 = true;
            this.visibility.hmSep = true;
        }
        
        if (this.formatString.includes("MM")) {
            this.visibility.min1 = true;
        }

        if (this.formatString.includes("M")) {
            this.visibility.min2 = true;
            this.visibility.msSep = true;
        }

        if (this.formatString.includes("SS")) {
            this.visibility.sec1 = true;
        }

        if (this.formatString.includes("X")) {
            this.visibility.secDecimalSep = true;
            this.visibility.ds = true;
        }

        if (this.formatString.includes("XX")) {
            this.visibility.cs = true;
        }

        if (this.formatString.includes("XXX")) {
            this.visibility.ms = true;
        }

        // show more digits if needed to show full time, regardless of format
        if (this.elapsedTime >= 10 * 1000) {
            this.visibility.sec1 = true;
            this.updateVisibilityThreshold = 60 * 1000
            if (this.elapsedTime >= 60 * 1000) {
                this.visibility.msSep = true;
                this.visibility.min2 = true;
                this.updateVisibilityThreshold = 10 * 60 * 1000
                if (this.elapsedTime >= 10 * 60 * 1000) {
                    this.visibility.min1 = true;
                    this.updateVisibilityThreshold = 60 * 60 * 1000
                    if (this.elapsedTime >= 60 * 60 * 1000) {
                        this.visibility.hmSep = true;
                        this.visibility.hour2 = true;
                        this.updateVisibilityThreshold = 10 * 60 * 60 * 1000
                        if (this.elapsedTime >= 10 * 60 * 60 * 1000) {
                            this.visibility.hour1 = true;
                        }
                    }
                }
            }
        }

        this.visibilityChanged = true;
    }

    updateFormat(timerFormatString) {
        this.formatString = timerFormatString;
        this.updateVisibility;
    }
}
