// Variables for DOM elements
// Timer buttons
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const resetButton = document.getElementById('reset');

// Controls
const stopInputHours = document.getElementById('stopTimerHours');
const stopInputMinutes = document.getElementById('stopTimerMinutes');
const stopInputSeconds = document.getElementById('stopTimerSeconds');
const speedInput = document.getElementById('speedmult');
const formatSelector = document.getElementById('timeformat');

const textColorInput = document.getElementById('textcolour');
const bgColorInput = document.getElementById('bgcolour');
const timerFontInput = document.getElementById('font-picker');
const boldToggle = document.getElementById('bold-toggle');
const italicToggle = document.getElementById('italic-toggle');

const preDelayInput = document.getElementById('pre-delay');
const postDelayInput = document.getElementById('post-delay');

const digitKeys = [
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

const separatorKeys = [
    'hmSep',
    'msSep',
    'secDecimalSep'
];

const timerDisplayKeys = [
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

// On-screen canvas timer
const onScreenCanvas = document.getElementById('onscreen-timer-canvas');
const onScreenCtx = onScreenCanvas.getContext('2d');

// Timer display settings
const displaySettings = {
    width: onScreenCanvas.width,
    height: onScreenCanvas.height,
    textColor: textColorInput.value,
    bgColor: bgColorInput.value,
    font: timerFontInput.value,
    fontSize: 120,      // fixed for now
    isBold: false,
    isItalic: true
}

// Function to update a canvas timer
// TODO move things outside this so that font doesn't need to be reset each time
function drawCanvasTimer(ctx, digits, visibility, settings) {
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
class TimerBase {
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

    constructor() {
        this.elapsedTime = 0;
        this.visibility = {...TimerBase.defaultVisibility};

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

        if (formatString.includes("HH")) {
            this.visibility.hour1 = true;
        }

        if (formatString.includes("H")) {
            this.visibility.hour2 = true;
            this.visibility.hmSep = true;
        }
        
        if (formatString.includes("MM")) {
            this.visibility.min1 = true;
        }

        if (formatString.includes("M")) {
            this.visibility.min2 = true;
            this.visibility.msSep = true;
        }

        if (formatString.includes("SS")) {
            this.visibility.sec1 = true;
        }

        if (formatString.includes("X")) {
            this.visibility.secDecimalSep = true;
            this.visibility.ds = true;
        }

        if (formatString.includes("XX")) {
            this.visibility.cs = true;
        }

        if (formatString.includes("XXX")) {
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
};

// Interactive on-screen timer controlled with buttons
const interactiveTimerBase = new TimerBase;

// Redraw the on-screen canvas timer
function redrawOnScreenCanvasTimer() {
    drawCanvasTimer(onScreenCtx, interactiveTimerBase.getDigits(), interactiveTimerBase.visibility, displaySettings);
}

// Logical variables for interactive timer
let timerInterval;
let startTime = 0;
let elapsedTime = 0;

// Invisible timer used to render video
const renderingTimerBase = new TimerBase;

// Variables for controls and methods to update them 
let formatString;
// update the global time format the applies to all timers (DOM or canvas)
function updateTimeFormat(){
    formatString = formatSelector.value;

    interactiveTimerBase.updateVisibility();
    redrawOnScreenCanvasTimer();

    renderingTimerBase.updateVisibility();
}
updateTimeFormat();     // set initial format from selector value

let stopTime;
function updateStopTime(){
    resetTimer();
    stopTime = 
        stopInputHours.value * 60 * 60 * 1000 +
        stopInputMinutes.value * 60 * 1000 +
        stopInputSeconds.value * 1000;
}
updateStopTime();     // set initial stop time from input values

let speedMultiplier;
function updateSpeed(){
    resetTimer();
    speedMultiplier = speedInput.value;
}
updateSpeed();     // set initial speed multiplier from input value

let preDelayTime;
function updatePreDelay(){
    resetTimer();
    preDelayTime = preDelayInput.value * 1000;
}
updatePreDelay();     // set initial delay before timer starts from input value

let postDelayTime;
function updatePostDelay(){
    resetTimer();
    postDelayTime = postDelayInput.value * 1000;
}
updatePostDelay();     // set initial delay before video ends after timer stops from input value

// Completely refresh onscreen canvas - necessary? suggested by chatgpt
// function redrawOnScreenCanvas() {
//     drawTimer(onScreenCtx, interactiveTimerBase.getDigits(), interactiveTimerBase.visibility, displaySettings);
// }

// Functions for controlling interactive timer
function updateTimer(elapsedTime) {
    interactiveTimerBase.updateElapsedTime(elapsedTime)
    const digits = interactiveTimerBase.getDigits();
    const visibility = interactiveTimerBase.visibility

    // Update canvas display
    redrawOnScreenCanvasTimer();
    // drawCanvasTimer(onScreenCtx, digits, visibility, displaySettings);
}

function startTimer(){
    startTime = Date.now() - elapsedTime;
    
    timerInterval = setInterval( ()=> {
        elapsedTime = (Date.now() - startTime) * speedMultiplier; 
        if (elapsedTime >= stopTime) {
            stopTimer();
            updateTimer(stopTime);
        } else {
            updateTimer(elapsedTime);
        }
    }, 1);
    
    startButton.disabled = true;
    stopButton.disabled = false;
}

function stopTimer(){
    clearInterval(timerInterval);
    startButton.disabled = false;
    stopButton.disabled = true;
}

function resetTimer(){
    clearInterval(timerInterval);

    elapsedTime = 0;
    updateTimer(0);

    startButton.disabled = false;
    stopButton.disabled = false;
}

startButton.addEventListener('click', startTimer);
stopButton.addEventListener('click', stopTimer);
resetButton.addEventListener('click', resetTimer);
stopInputHours.addEventListener('change', updateStopTime);
stopInputMinutes.addEventListener('change', updateStopTime);
stopInputSeconds.addEventListener('change', updateStopTime);
speedInput.addEventListener('change', updateSpeed);
formatSelector.addEventListener('change', updateTimeFormat);
preDelayInput.addEventListener('change', updatePreDelay);
postDelayInput.addEventListener('change', updatePostDelay);

// If the time format selector is changed to a TomSelect dropdown, the updateTimeFormat function will need to be updated to get the selected index/value from TomSelect instead of a regular select element. The event listener for the format selector will also need to be updated to listen for the 'change' event from TomSelect.
// new TomSelect('#timeformat', {});

textColorInput.addEventListener('input', () => {
    displaySettings.textColor = textColorInput.value;
    redrawOnScreenCanvasTimer();
});
bgColorInput.addEventListener('input', () => {
    displaySettings.bgColor = bgColorInput.value;
    redrawOnScreenCanvasTimer();
});
timerFontInput.addEventListener('input', async () => {
    const font = timerFontInput.value;
    displaySettings.font = font;
    await document.fonts.load(`100px "${font}"`);
    redrawOnScreenCanvasTimer();     // redraw onscreen timer when fonts loaded
});

new TomSelect('#font-picker', {
    render: {
        option: function(data, escape) {
            return `
                <div style="display:flex; justify-content:space-between;">
                    <span>${escape(data.text)}</span>
                    <span style="font-family: '${escape(data.font)}';">12:34:56.7890</span>
                </div>
            `;
        },
        item: function(data, escape) {
            return `
                <div>
                ${escape(data.text)}
                </div>
            `;
        }
    }
});

// Font style toggles (bold/italic)

boldToggle.addEventListener('click', () => {
    displaySettings.isBold = !displaySettings.isBold;
    boldToggle.classList.toggle('active');
    updateFontStyle();
});

italicToggle.addEventListener('click', () => {
    displaySettings.isItalic = !displaySettings.isItalic;
    italicToggle.classList.toggle('active');
    updateFontStyle();
});

function updateFontStyle() {
    redrawOnScreenCanvasTimer();
}

// Refresh canvas when all fonts loaded
document.fonts.addEventListener("loadingdone", () => {
    redrawOnScreenCanvasTimer();
});


// // Video rendering code (initially copied straight from chatgpt)
// const btn = document.getElementById("render");

// btn.onclick = () => {
//     const worker = new Worker("./worker.js", { type: "module" });

//     // TODO fix this
//     worker.postMessage({
//         width: 800,
//         height: 300,
//         fps: 30,
//         duration: 10,
//         playbackSpeed: 10,
//         stopAt: 120,
//         preDelay: 0,    // TODO configurable
//         postDelay: 0
//     });

//     worker.onmessage = (e) => {
//         const blob = e.data;

//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "timer.webm";
//         a.click();

//         worker.terminate();
//     };
// };