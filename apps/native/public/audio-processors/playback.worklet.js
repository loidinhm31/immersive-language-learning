/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
    this.port.onmessage = e => {
      if (e.data === 'interrupt') {
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

registerProcessor('pcm-processor', PCMProcessorImpl);
