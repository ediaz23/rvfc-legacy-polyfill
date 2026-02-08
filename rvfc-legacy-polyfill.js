(function() {
    if (typeof HTMLVideoElement !== 'undefined' &&
        !('requestVideoFrameCallback' in HTMLVideoElement.prototype) &&
        !('getVideoPlaybackQuality' in HTMLVideoElement.prototype)) {

        /** @type {Map<number, Set>} */
        const rvfcHandles = new Map()

        /**
         * @this {HTMLVideoElement}
         */
        HTMLVideoElement.prototype.requestVideoFrameCallback = function(cb) {
            let lastTime = this.currentTime
            let rafId = 0
            const dependents = new Set()

            const tick = (now) => {
                if (this.readyState >= 2 && !this.paused && !this.ended) { // is playing
                    const ct = this.currentTime
                    if (ct !== lastTime) { // is new frame
                        const timediff = now - (this._lastNow || now);

                        lastTime = ct
                        cb(now, {
                            expectedDisplayTime: now + timediff,
                            width: this.videoWidth || 0,
                            height: this.videoHeight || 0,
                            mediaTime: Math.max(0, ct),
                        })
                        rvfcHandles.delete(rafId)
                    }
                }
                if (rafId !== 0 && rvfcHandles.has(rafId)) {
                    dependents.add(requestAnimationFrame(tick))
                }
            }

            rafId = requestAnimationFrame(tick)
            rvfcHandles.set(rafId, dependents)
            dependents.add(rafId)
            return rafId
        }

        /**
         * @this {HTMLVideoElement}
         */
        HTMLVideoElement.prototype.cancelVideoFrameCallback = function(handle) {
            if (rvfcHandles.has(handle)) {
                const deps = rvfcHandles.get(handle)
                deps.forEach(id => cancelAnimationFrame(id))
                rvfcHandles.delete(handle)
            }
            cancelAnimationFrame(handle)
        }

        /**
         * @this {HTMLVideoElement}
         */
        HTMLVideoElement.prototype.cancelAnimationFramePolyfill = function() {
            for (const [rootId, _deps] of rvfcHandles) {
                this.cancelVideoFrameCallback(rootId)
            }
        }
    }
})()

export default {}
