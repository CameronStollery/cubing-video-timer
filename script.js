const timer = document.getElementById('timer');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const resetButton = document.getElementById('reset');
const delayInput = document.getElementById('delay');
const stopInputHours = document.getElementById('stopTimerHours');
const stopInputMinutes = document.getElementById('stopTimerMinutes');
const stopInputSeconds = document.getElementById('stopTimerSeconds');
const speedInput = document.getElementById('speedmult');
const formatSelector = document.getElementById('timeformat');

// timer digits/separators
const hour1 = document.getElementById('hour1');
const hour2 = document.getElementById('hour2');
const hmSep = document.getElementById('hmSep');
const min1 = document.getElementById('min1');
const min2 = document.getElementById('min2');
const msSep = document.getElementById('msSep');
const sec1 = document.getElementById('sec1');
const sec2 = document.getElementById('sec2');
const secDecimalSep = document.getElementById('secDecimalSep');
const ds = document.getElementById('ds');
const cs = document.getElementById('cs');
const ms = document.getElementById('ms');

let delayTimerInterval;
let timerInterval;

let hours = 0;
let minutes = 0;
let seconds = 0;
let mseconds = 0;

let startDelayTime = 0;
let elapsedDelayTime = 0;
let startTime = 0;
let elapsedTime = 0;

// milliseconds at which more timer digits will need to be shown, given current format chosen
let increaseDigitThreshold = 60 * 1000;

let format;
updateTimeFormat();     // set initial format from selector value

let delayTime;
updateDelay();     // set initial delay time from input value

let stopTime;
updateStopTime();     // set initial stop time from input values

let speedMultiplier;
updateSpeed();     // set initial speed multiplier from input value

function updateDelay(){
    resetTimer();
    delayTime = delayInput.value * 1000;
}

function updateStopTime(){
    resetTimer();
    stopTime = 
        stopInputHours.value * 60 * 60 * 1000 +
        stopInputMinutes.value * 60 * 1000 +
        stopInputSeconds.value * 1000;
}

function updateSpeed(){
    resetTimer();
    speedMultiplier = speedInput.value;
}

function updateTimeFormat(){
    format = formatSelector.selectedIndex;

    switch (format) {
        case 0:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "hidden";
            msSep.style.visibility = "hidden";
            sec1.style.visibility = "hidden";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "hidden";
            ds.style.visibility = "hidden";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 10 * 1000;
            break;
        
        case 1:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "hidden";
            msSep.style.visibility = "hidden";
            sec1.style.visibility = "hidden";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 10 * 1000;
            break;
        
        case 2:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "hidden";
            msSep.style.visibility = "hidden";
            sec1.style.visibility = "hidden";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 10 * 1000;
            break;
        
        case 3:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "hidden";
            msSep.style.visibility = "hidden";
            sec1.style.visibility = "hidden";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "visible";

            increaseDigitThreshold = 10 * 1000;
            break;
        
        case 4:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "hidden";
            msSep.style.visibility = "hidden";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "hidden";
            ds.style.visibility = "hidden";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 60 * 1000;
            break;
        
        case 5:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "hidden";
            msSep.style.visibility = "hidden";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 60 * 1000;
            break;
        
        case 6:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "hidden";
            msSep.style.visibility = "hidden";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 60 * 1000;
            break;
        
        case 7:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "hidden";
            msSep.style.visibility = "hidden";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "visible";

            increaseDigitThreshold = 60 * 1000;
            break;

        case 8:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "hidden";
            ds.style.visibility = "hidden";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 10 * 60 * 1000;
            break;
        
        case 9:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 10 * 60 * 1000;
            break;
        
        case 10:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 10 * 60 * 1000;
            break;
        
        case 11:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "hidden";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "visible";

            increaseDigitThreshold = 10 * 60 * 1000;
            break;

        case 12:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "hidden";
            ds.style.visibility = "hidden";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 60 * 60 * 1000;
            break;
        
        case 13:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 60 * 60 * 1000;
            break;
        
        case 14:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 60 * 60 * 1000;
            break;
        
        case 15:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "hidden";
            hmSep.style.visibility = "hidden";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "visible";

            increaseDigitThreshold = 60 * 60 * 1000;
            break;

        case 16:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "visible";
            hmSep.style.visibility = "visible";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "hidden";
            ds.style.visibility = "hidden";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 10 * 60 * 60 * 1000;
            break;
        
        case 17:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "visible";
            hmSep.style.visibility = "visible";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 10 * 60 * 60 * 1000;
            break;
        
        case 18:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "visible";
            hmSep.style.visibility = "visible";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = 10 * 60 * 60 * 1000;
            break;
        
        case 19:
            hour1.style.visibility = "hidden";
            hour2.style.visibility = "visible";
            hmSep.style.visibility = "visible";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "visible";

            increaseDigitThreshold = 10 * 60 * 60 * 1000;
            break;

        case 20:
            hour1.style.visibility = "visible";
            hour2.style.visibility = "visible";
            hmSep.style.visibility = "visible";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "hidden";
            ds.style.visibility = "hidden";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = Infinity;
            break;
        
        case 21:
            hour1.style.visibility = "visible";
            hour2.style.visibility = "visible";
            hmSep.style.visibility = "visible";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "hidden";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = Infinity;
            break;
        
        case 22:
            hour1.style.visibility = "visible";
            hour2.style.visibility = "visible";
            hmSep.style.visibility = "visible";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "hidden";

            increaseDigitThreshold = Infinity;
            break;
        
        case 23:
            hour1.style.visibility = "visible";
            hour2.style.visibility = "visible";
            hmSep.style.visibility = "visible";
            min1.style.visibility = "visible";
            min2.style.visibility = "visible";
            msSep.style.visibility = "visible";
            sec1.style.visibility = "visible";
            sec2.style.visibility = "visible";
            secDecimalSep.style.visibility = "visible";
            ds.style.visibility = "visible";
            cs.style.visibility = "visible";
            ms.style.visibility = "visible";

            increaseDigitThreshold = Infinity;
            break;
    }
}

function startDelay(){
    startDelayTime = Date.now();

    delayTimerInterval = setInterval( ()=> {
        elapsedDelayTime = Date.now() - startDelayTime;
        if (elapsedDelayTime > delayTime) {
            clearInterval(delayTimerInterval);
            startTimer();
        }
    }, 10);

}

function startTimer(){
    startTime = Date.now() - elapsedTime;

    timerInterval = setInterval( ()=> {
        elapsedTime = (Date.now() - startTime) * speedMultiplier; 
        if (elapsedTime >= stopTime) {
            stopTimer();
            updateTimer(stopTime);
            startButton.disabled = true;
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

    hour1.textContent = "0";
    hour2.textContent = "0";
    min1.textContent = "0";
    min2.textContent = "0";
    sec1.textContent = "0";
    sec2.textContent = "0";
    ds.textContent = "0";
    cs.textContent = "0";
    ms.textContent = "0";

    startButton.disabled = false;
    stopButton.disabled = false;

    updateTimeFormat();     // reset format in the case that extra digits have appeared as time increases
}

function updateTimer(elapsedTime){
    hours = Math.floor(elapsedTime / (1000 * 60 * 60));
    minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
    seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
    mseconds = Math.floor((elapsedTime % 1000));

    // update values of each digit
    hour1.textContent = Math.floor(hours / 10);
    hour2.textContent = hours % 10;
    min1.textContent = Math.floor(minutes / 10);
    min2.textContent = minutes % 10;
    sec1.textContent = Math.floor(seconds / 10);
    sec2.textContent = seconds % 10;
    ds.textContent = Math.floor(mseconds / 100);
    cs.textContent = Math.floor((mseconds % 100) / 10);
    ms.textContent = mseconds % 10;

    // display extra digits/separators if certain thresholds passed
    if (elapsedTime >= increaseDigitThreshold) {
        switch (increaseDigitThreshold) {
            case 10 * 1000:
                increaseDigitThreshold = 60 * 1000;
                sec1.style.visibility = "visible";
                break;

            case 60 * 1000:
                increaseDigitThreshold = 10 * 60 * 1000;
                msSep.style.visibility = "visible";
                min2.style.visibility = "visible";
                break;
            
            case 10 * 60 * 1000:
                increaseDigitThreshold = 60 * 60 * 1000;
                min1.style.visibility = "visible";
                break;

            case 60 * 60 * 1000:
                increaseDigitThreshold = 10 * 60 * 60 * 1000;
                hmSep.style.visibility = "visible";
                hour2.style.visibility = "visible";
                break;
            
            case 10 * 60 * 60 * 1000:
                increaseDigitThreshold = Infinity;
                hour1.style.visibility = "visible";
                break;
        }
    }
}

startButton.addEventListener('click', startDelay);
stopButton.addEventListener('click', stopTimer);
resetButton.addEventListener('click', resetTimer);
delayInput.addEventListener('change', updateDelay);
stopInputHours.addEventListener('change', updateStopTime);
stopInputMinutes.addEventListener('change', updateStopTime);
stopInputSeconds.addEventListener('change', updateStopTime);
speedInput.addEventListener('change', updateSpeed);
formatSelector.addEventListener('change', updateTimeFormat);

// @bycapwan