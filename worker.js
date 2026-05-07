// Worker script starting
console.log("Worker script starting to load");

import { TimerBase, drawCanvasTimer } from "./shared-timer-utils.js";

console.log("Shared utilities import successful");

// Dynamic import marker for MediaBunny
const MEDIABUNNY_CDN = "https://cdn.jsdelivr.net/npm/mediabunny@1/+esm";

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
        // Try dynamic import for MediaBunny
        console.log("Attempting dynamic import of MediaBunny...");
        sendDebug("Starting MediaBunny import from CDN...");
        let Output, WebMOutputFormat, StreamTarget, EncodedVideoPacketSource, EncodedPacket;
        try {
            const mediabunny = await import(MEDIABUNNY_CDN);
            Output = mediabunny.Output;
            WebMOutputFormat = mediabunny.WebMOutputFormat;
            StreamTarget = mediabunny.StreamTarget;
            EncodedVideoPacketSource = mediabunny.EncodedVideoPacketSource;
            EncodedPacket = mediabunny.EncodedPacket;
            console.log("MediaBunny import successful");
            sendDebug("MediaBunny import successful");
        } catch (importError) {
            sendDebug(`MediaBunny import failed: ${importError.message}`);
            throw new Error(`Failed to import MediaBunny: ${importError.message}`);
        }

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
            // TODO make this load all fonts
            const fontResponse = await fetch('./fonts/DSEG7-Classic/DSEG7Classic-Italic.woff2');
            const fontBuffer = await fontResponse.arrayBuffer();
            const fontFace = new FontFace(displaySettings.font, fontBuffer);
            await fontFace.load();
            self.fonts.add(fontFace);
            sendDebug("Font loaded successfully in worker");
        } catch (fontError) {
            sendDebug(`Font loading failed: ${fontError.message}`);
        }

        // Create a WritableStream that sends chunks back to main thread
        let totalFileSize = 0;
        const writable = new WritableStream({
            write(chunk) {
                // chunk is a StreamTargetChunk: { data: Uint8Array, position: number }
                totalFileSize = Math.max(totalFileSize, chunk.position + chunk.data.length);
                self.postMessage({
                    type: 'chunk',
                    position: chunk.position,
                    data: chunk.data
                });
            }
        });

        // Create MediaBunny Output with streaming
        const output = new Output({
            format: new WebMOutputFormat({
                appendOnly: true  // Ensures monotonic writes, simplifies reassembly
            }),
            target: new StreamTarget(writable)
        });

        // Create video packet source for VP8
        const videoPacketSource = new EncodedVideoPacketSource('vp8');
        output.addVideoTrack(videoPacketSource, { frameRate: fps });

        // Start output
        await output.start();
        sendDebug("Output started. Creating encoder...");

        let isFirstChunk = true;
        const encoder = new VideoEncoder({
            output: async (chunk, meta) => {
                try {
                    const packetOptions = {};
                    if (isFirstChunk && meta?.decoderConfig) {
                        packetOptions.decoderConfig = meta.decoderConfig;
                        isFirstChunk = false;
                    }

                    const packet = EncodedPacket.fromEncodedChunk(chunk, packetOptions);
                    await videoPacketSource.add(packet);
                } catch (err) {
                    sendDebug(`Error creating/adding video packet: ${err.message}`);
                }
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

        for (let frame = 0; frame < totalFrames; frame++) {
            const t = frame / fps;
            const displayTime = frameDisplayTime(frame);
            renderingTimerBase.updateElapsedTime(displayTime * 1000);       // convert to ms
            const digits = renderingTimerBase.getDigits();
            
            if (frame % 100 == 0) {
                sendDebug(`Rendering frame ${frame} out of ${totalFrames}. Timer should display time ${displayTime}`);
                sendDebug(`renderingTimerBase has elapsedTime = ${renderingTimerBase.elapsedTime}`);
                sendDebug(`Time shown by digits: ${digits.sec1}${digits.sec2}.${digits.ds}${digits.cs}`);
            }

            drawCanvasTimer(renderingCtx, digits, renderingTimerBase.visibility, displaySettings);

            const videoFrame = new VideoFrame(renderingCanvas, {
                timestamp: frame * frameDurationUs,
                duration: frameDurationUs
            });

            if (frame % 100 == 0) {
                sendDebug(`Encoding frame ${frame}`);
            }
            encoder.encode(videoFrame);
            if (frame % 100 == 0) {
                sendDebug(`Frame ${frame} encoded`);
            }
            videoFrame.close();

            // Yield occasionally (prevents worker lockup)
            if (frame % 2000 === 0) {
                await new Promise(r => setTimeout(r, 0));
            }
        }

        sendDebug("Frame rendering complete. Finalizing video...");

        await encoder.flush();
        sendDebug("Encoder flushed");
        encoder.close();
        sendDebug("Encoder closed");

        // Close the video packet source
        videoPacketSource.close();
        sendDebug("Video packet source closed");

        // Finalize the output - this will close the WritableStream
        await output.finalize();
        sendDebug("Output finalized");

        // Send completion message with total file size
        self.postMessage({
            type: 'complete',
            fileSize: totalFileSize
        });
        sendDebug(`Video rendering complete. Total file size: ${totalFileSize} bytes`);
    } catch (error) {
        sendDebug(`ERROR in worker: ${error.message}\n${error.stack}`);
    }
};