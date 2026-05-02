import { WebMMuxer } from "https://cdn.jsdelivr.net/npm/webm-muxer@5/+esm";
import { TimerBase, drawCanvasTimer } from "./shared-timer-utils.js";

// Send debug messages back to main thread
function sendDebug(message) {
    self.postMessage({
        type: 'debug',
        message: message
    });
}

self.onmessage = async (e) => {
    try {
        const {
            displaySettings,
            timeFormat,
            fps,
            speedMultiplier,
            stopTime,
            preDelayTime,
            postDelayTime
        } = e.data;

        sendDebug("Message received by worker. Initializing video rendering.");

        const width = displaySettings.width;
        const height = displaySettings.height;

        const duration = preDelayTime + (stopTime / speedMultiplier) + postDelayTime;
        const totalFrames = fps * duration;
        const frameDurationUs = Math.round(1_000_000 / fps);

        sendDebug(`Duration: ${duration}s, Total Frames: ${totalFrames}, FPS: ${fps}`);

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
            error: err => sendDebug(`VideoEncoder error: ${err}`)
        });

        encoder.configure({
            codec: "vp8",
            width,
            height,
            bitrate: 3_000_000,
            framerate: fps
        });

        sendDebug("Encoder configured. Starting frame rendering...");

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
                sendDebug(`Rendering frame ${frame} out of ${totalFrames}`);
            }
        }

        sendDebug("Frame rendering complete. Finalizing video...");

        await encoder.flush();
        encoder.close();

        const { buffer } = muxer.finalize();

        const blob = new Blob([buffer], { type: "video/webm" });

        sendDebug("Video rendering complete. Sending blob to main thread.");

        self.postMessage({
            type: 'complete',
            blob: blob
        });
    } catch (error) {
        sendDebug(`ERROR in worker: ${error.message}\n${error.stack}`);
    }
};