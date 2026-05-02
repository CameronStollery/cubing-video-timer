import { WebMMuxer } from "https://cdn.jsdelivr.net/npm/webm-muxer@5/+esm";

self.onmessage = async (e) => {
    const {
        displaySettings,
        timeFormat,
        fps,
        speedMultiplier,
        stopTime,
        preDelayTime,
        postDelayTime
    } = e.data;

    console.log("Message received by worker node. Initialising video rendering.")

    const duration = preDelayTime + (stopTime / speedMultiplier) + postDelay
    const totalFrames = fps * duration;
    const frameDurationUs = Math.round(1_000_000 / fps);

    const renderingTimerBase = new TimerBase(timeFormat);

    const renderingCanvas = new OffscreenCanvas(width, height);
    const renderingCtx = renderingCanvas.getContext("2d");

    const muxer = new WebMMuxer({
        target: "buffer",
        video: {
            codec: "V_VP8",
            width,
            height,
            frameRate: fps
        }
    });

    const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: e => console.error(e)
    });

    encoder.configure({
        codec: "vp8",
        width,
        height,
        bitrate: 3_000_000,
        framerate: fps
    });

    // Get the time to be displayed on the timer based on the frame number
    function frameDisplayTime(frame) {
        const delayFrames = Math.round(preDelayTime * fps);
        if (frame < delayFrames) return 0;

        const timerRunning = (frame / fps) - preDelayTime;      // how long the timer has been running in the video
        return Math.min(timerRunning * speedMultiplier, stopTime);
    }

    // TODO put in delays before/after timer start
    for (let frame = 0; frame < totalFrames; frame++) {
        const t = frame / fps;

        // TODO don't update if timer not running
        renderingTimerBase.updateElapsedTime(frameDisplayTime(frame))
        drawCanvasTimer(renderingCtx, renderingTimerBase.getDigits(), renderingTimerBase.visibility, displaySettings);

        const videoFrame = new VideoFrame(renderingCanvas, {
            timestamp: frame * frameDurationUs,
            duration: frameDurationUs
        });

        encoder.encode(videoFrame);
        videoFrame.close();

        // Yield occasionally (prevents worker lockup)
        if (frame % 2000 === 0) {
            await new Promise(r => setTimeout(r, 0));
        }

        if (frame % 100 == 0) {
            console.log(`Rendering frame ${frame} out of ${totalFrames}`)
        }
    }

    await encoder.flush();
    encoder.close();

    const { buffer } = muxer.finalize();

    const blob = new Blob([buffer], { type: "video/webm" });

    self.postMessage(blob);
};