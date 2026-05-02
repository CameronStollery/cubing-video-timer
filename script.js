import { TimerBase, drawCanvasTimer, digitKeys, separatorKeys, timerDisplayKeys } from './shared-timer-utils.js';

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

// Redraw the on-screen canvas timer
function redrawOnScreenCanvasTimer() {
    drawCanvasTimer(onScreenCtx, interactiveTimerBase.getDigits(), interactiveTimerBase.visibility, displaySettings);
}

// Logical variables for interactive timer
let timerInterval;
let startTime = 0;
let elapsedTime = 0;

// Variables for controls and methods to update them 

let formatString = formatSelector.value;

// Interactive on-screen timer controlled with buttons
const interactiveTimerBase = new TimerBase(formatString);

// update the global time format the applies to both timers (on-screen interactive and off-screen rendering)
function updateTimeFormat(){
    formatString = formatSelector.value;
    interactiveTimerBase.updateTimeFormat(formatString);
    redrawOnScreenCanvasTimer();
}

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
    speedMultiplier = speedInput.value > 0 ? speedInput.value : 1;  // force value to be positive
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

// Video rendering code (initially copied straight from chatgpt)
const renderButton = document.getElementById("render");

renderButton.onclick = () => {
    console.log("Sending details of video to worker node for rendering.")

    try {
        const worker = new Worker("./worker.js", { type: "module" });
        console.log("Worker created successfully");

        worker.onerror = (error) => {
            console.error("Worker error:", error);
            console.error("Error details:", {
                message: error.message,
                filename: error.filename,
                lineno: error.lineno,
                colno: error.colno
            });
        };

        worker.onmessageerror = (error) => {
            console.error("Worker message error:", error);
        };

        worker.postMessage({
            displaySettings: displaySettings,
            timeFormat: formatString,
            fps: 60,    // TODO make configurable
            speedMultiplier: speedMultiplier,
            stopTime: stopTime / 1000,         // variables are in ms, convert to s for rendering
            preDelayTime: preDelayTime / 1000,
            postDelayTime: postDelayTime / 1000
        });

        console.log("Message posted to worker");

        worker.onmessage = (e) => {
            if (e.data.type === 'debug') {
                console.log("[Worker Debug]", e.data.message);
            } else if (e.data.type === 'complete') {
                console.log("Rendering complete. Video is ready to download.")

                const blob = e.data.blob;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "timer.webm";
                a.click();

                worker.terminate();
            }
        };
    } catch (error) {
        console.error("Error creating worker:", error);
    }
};