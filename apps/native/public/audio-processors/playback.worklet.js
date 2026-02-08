/**
 * Audio Worklet Processor for playing PCM audio
 */

// In a real implementation this would hold the queue and handle messages.
// This is a simplified placeholder as the real logic often involves a RingBuffer.
// We'll update this to a functional basic implementation.

/*
 * Re-implementing with message port handling
 */
class PCMProcessorImpl extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = [];
        this.port.onmessage = (e) => {
            if (e.data === "interrupt") {
                this.buffer = [];
            } else if (e.data instanceof Float32Array) {
                // Push new data to buffer
                for (let i = 0; i < e.data.length; i++) {
                    this.buffer.push(e.data[i]);
                }
            }
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];

        if (!channel) return true;

        // Fill output buffer
        for (let i = 0; i < channel.length; i++) {
            if (this.buffer.length > 0) {
                channel[i] = this.buffer.shift();
            } else {
                channel[i] = 0;
            }
        }

        return true;
    }
}

registerProcessor("pcm-processor", PCMProcessorImpl);
