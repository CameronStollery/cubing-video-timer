// Variables for DOM elements
// Timer display
const timer = document.getElementById('timer');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const resetButton = document.getElementById('reset');

// Controls
const delayInput = document.getElementById('delay');
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

const computed = getComputedStyle(timer);

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

const domTimerElements = {}
timerDisplayKeys.forEach(key => {
    domTimerElements[key] = document.getElementById(key);
})

// Functions for updating DOM timer
function updateDomTimerDigits(digitsMap) {
    Object.entries(digitsMap).forEach(([key, value]) => {
        domTimerElements[key].textContent = value;
    });
}

function updateDomTimerVisibility(visibilityMap) {
    Object.entries(domTimerElements).forEach(([key, value]) => {
        value.style.visibility = visibilityMap[key] ? 'visible' : 'hidden';
    });
}

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
function drawCanvasTimer(ctx, digits, visibility, settings) {
    // console.log('Settings passed to drawCanvasTimer:');
    // console.log(settings);

    ctx.fillStyle = settings.bgColor;
    ctx.fillRect(0, 0, settings.width, settings.height);

    const style = `${settings.isItalic ? "italic " : ""}${settings.isBold ? "bold " : ""}`;
    ctx.font = `${style}${settings.fontSize}px "${settings.font}", monospace`;
    // console.log(ctx.font);

    ctx.fillStyle = settings.textColor;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    const digitWidth = ctx.measureText("0").width;
    const sepWidth = ctx.measureText(":").width;

    const totalWidth = digitWidth * digitKeys.length + sepWidth * separatorKeys.length;
    let x = (settings.width - totalWidth) / 2;
    const y = settings.height / 2;

    for (const key of timerDisplayKeys) {
        const char = digits[key];
        const charClassWidth = separatorKeys.includes(key) ? sepWidth : digitWidth;
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
    updateDomTimerVisibility(interactiveTimerBase.visibility);
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

let delayTime;
function updateDelay(){
    resetTimer();
    delayTime = delayInput.value * 1000;
}
updateDelay();     // set initial delay time from input value

// function startDelay(){
//     startDelayTime = Date.now();

//     delayTimerInterval = setInterval( ()=> {
//         elapsedDelayTime = Date.now() - startDelayTime;
//         if (elapsedDelayTime > delayTime) {
//             clearInterval(delayTimerInterval);
//             startTimer();
//         }
//     }, 10);
// }

// Completely refresh onscreen canvas - necessary? suggested by chatgpt
// function redrawOnScreenCanvas() {
//     drawTimer(onScreenCtx, interactiveTimerBase.getDigits(), interactiveTimerBase.visibility, displaySettings);
// }

// Functions for controlling interactive timer
function updateTimer(elapsedTime) {
    interactiveTimerBase.updateElapsedTime(elapsedTime)
    const digits = interactiveTimerBase.getDigits();
    const visibility = interactiveTimerBase.visibility

    // Update DOM display
    updateDomTimerDigits(digits);
    if (interactiveTimerBase.visibilityChanged) {
        updateDomTimerVisibility(visibility);
    }

    // Update canvas display
    // console.log('Updating canvas timer, called from updateTimer.');
    // console.log('Current display settings:');
    // console.log(displaySettings);
    redrawOnScreenCanvasTimer();
    // drawCanvasTimer(onScreenCtx, digits, visibility, displaySettings);
}

// Draw initial canvas timer
// console.log('Calling updateTimer(0) to initialise timer');
// updateTimer(0);

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
    // console.log('Calling updateTimer(0) to reset timer');
    updateTimer(0);

    startButton.disabled = false;
    stopButton.disabled = false;
}

startButton.addEventListener('click', startTimer);
stopButton.addEventListener('click', stopTimer);
resetButton.addEventListener('click', resetTimer);
delayInput.addEventListener('change', updateDelay);
stopInputHours.addEventListener('change', updateStopTime);
stopInputMinutes.addEventListener('change', updateStopTime);
stopInputSeconds.addEventListener('change', updateStopTime);
speedInput.addEventListener('change', updateSpeed);
formatSelector.addEventListener('change', updateTimeFormat);

// If the time format selector is changed to a TomSelect dropdown, the updateTimeFormat function will need to be updated to get the selected index/value from TomSelect instead of a regular select element. The event listener for the format selector will also need to be updated to listen for the 'change' event from TomSelect.
// new TomSelect('#timeformat', {});

textColorInput.addEventListener('input', () => {
    timer.style.color = displaySettings.textColor = textColorInput.value;
    redrawOnScreenCanvasTimer();
});
bgColorInput.addEventListener('input', () => {
    timer.style.backgroundColor = displaySettings.bgColor = bgColorInput.value;
    redrawOnScreenCanvasTimer();
});
timerFontInput.addEventListener('input', async () => {
    const font = timerFontInput.value;
    displaySettings.font = font;
    timer.style.fontFamily = `"${font}"`;
    await document.fonts.load(`100px "${font}"`);
    // console.log('Chosen font loaded. Refreshing canvas timer.');
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
    timer.style.fontWeight = displaySettings.isBold ? 'bold' : 'normal';
    timer.style.fontStyle = displaySettings.isItalic ? 'italic' : 'normal';
    redrawOnScreenCanvasTimer();
}

// Refresh canvas when all fonts loaded
document.fonts.addEventListener("loadingdone", () => {
    // console.log('All font loaded. Refreshing canvas timer.');
    // console.log('Current display settings:');
    // console.log(displaySettings);
    redrawOnScreenCanvasTimer();
});