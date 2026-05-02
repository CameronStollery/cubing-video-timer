// Worker script starting
console.log("Worker script starting to load");

import { TimerBase, drawCanvasTimer } from "./shared-timer-utils.js";

console.log("Shared utilities import successful");

// Send debug messages back to main thread
function sendDebug(message) {
    self.postMessage({
        type: 'debug',
        message: message
    });
}

console.log("Worker functions defined");

self.onmessage = async (e) => {
    console.log("Worker received message");
    try {
        // Try dynamic import for WebMMuxer
        console.log("Attempting dynamic import of WebMMuxer...");
        const { Muxer, ArrayBufferTarget } = await import("https://cdn.jsdelivr.net/npm/webm-muxer@5/+esm");
        console.log("Muxer import successful");

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

        // Load the font for the worker
        try {
            const fontResponse = await fetch('./fonts/DSEG7-Classic/DSEG7Classic-Italic.woff2');
            const fontBuffer = await fontResponse.arrayBuffer();
            const fontFace = new FontFace(displaySettings.font, fontBuffer);
            await fontFace.load();
            self.fonts.add(fontFace);
            sendDebug("Font loaded successfully in worker");
        } catch (fontError) {
            sendDebug(`Font loading failed: ${fontError.message}`);
        }

        const muxer = new Muxer({
            target: new ArrayBufferTarget(),
            video: {
                codec: "V_VP8",
                width,
                height,
                frameRate: fps
            }
        });

        const encoder = new VideoEncoder({
            output: (chunk, meta) => {
                sendDebug(`VideoEncoder output: chunk type=${chunk.type}, timestamp=${chunk.timestamp}, duration=${chunk.duration}`);
                muxer.addVideoChunk(chunk, meta);
                sendDebug("Video chunk added to muxer");
            },
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
            const displayTime = frameDisplayTime(frame);
            renderingTimerBase.updateElapsedTime(displayTime);
            const digits = renderingTimerBase.getDigits();
            
            if (frame % 100 == 0) {
                sendDebug(`Rendering frame ${frame} out of ${totalFrames}`);
            }

            drawCanvasTimer(renderingCtx, digits, renderingTimerBase.visibility, displaySettings);

            const videoFrame = new VideoFrame(renderingCanvas, {
                timestamp: frame * frameDurationUs,
                duration: frameDurationUs
            });

            sendDebug(`Encoding frame ${frame}`);
            encoder.encode(videoFrame);
            sendDebug(`Frame ${frame} encoded`);
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
        sendDebug("Encoder flushed");
        encoder.close();
        sendDebug("Encoder closed");

        const finalizedResult = await muxer.finalize();
        sendDebug(`Muxer finalize result: ${finalizedResult}`);

        // Try to get buffer from the target
        const targetBuffer = muxer.target?.finalize?.() || muxer.target?.buffer;
        sendDebug(`Target buffer: ${targetBuffer}`);

        let buffer;
        if (targetBuffer instanceof ArrayBuffer) {
            buffer = targetBuffer;
            sendDebug("Using target buffer as ArrayBuffer");
        } else if (finalizedResult instanceof ArrayBuffer) {
            buffer = finalizedResult;
            sendDebug("Using finalized result as ArrayBuffer");
        } else {
            throw new Error(`Cannot get buffer. Finalize result: ${finalizedResult}, Target: ${muxer.target}`);
        }

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