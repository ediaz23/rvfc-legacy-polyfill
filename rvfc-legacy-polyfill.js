(function() {
    if (typeof HTMLVideoElement !== 'undefined' &&
        !('requestVideoFrameCallback' in HTMLVideoElement.prototype) &&
        typeof requestAnimationFrame === 'function') {

        /** @type {Map<number, Set>} */
        const rvfcHandles = new Map()

        function getPresentedFrames(video) {
            if (typeof video.getVideoPlaybackQuality === 'function') {
                try {
                    const q = video.getVideoPlaybackQuality()
                    const total = (q && q.totalVideoFrames != null) ? q.totalVideoFrames : 0
                    const dropped = (q && q.droppedVideoFrames != null) ? q.droppedVideoFrames : 0
                    return total - dropped
                } catch (e) { }
            }
            return (
                video.mozPresentedFrames ||
                video.mozPaintedFrames ||
                ((video.webkitDecodedFrameCount || 0) - (video.webkitDroppedFrameCount || 0)) ||
                0
            )
        }

        /**
         * @this {HTMLVideoElement}
         */
        HTMLVideoElement.prototype.requestVideoFrameCallback = function(cb) {
            let lastTime = this.currentTime
            let lastPresented = getPresentedFrames(this)
            let rafId = 0
            const dependents = new Set()

            const tick = (now) => {
                if (this.readyState >= 2 && !this.paused && !this.ended) {
                    const ct = this.currentTime
                    const pf = getPresentedFrames(this)

                    if (pf > lastPresented || ct !== lastTime) {
                        const timediff = now - (this._lastNow || now);
                        this._lastNow = now

                        lastTime = ct
                        lastPresented = pf

                        cb(now, {
                            expectedDisplayTime: now + timediff,
                            width: this.videoWidth || 0,
                            height: this.videoHeight || 0,
                            mediaTime: Math.max(0, ct),
                            presentedFrames: pf
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
