import asyncio
import fractions
import os

import aiortc
import av
from getstream.video.rtc.audio_track import AudioStreamTrack
from getstream.video.rtc.track_util import AudioFormat, AudioFormatType, PcmData


class JitterBufferedAudioStreamTrack(AudioStreamTrack):
    """Add a small playout cushion between the realtime provider and Stream.

    The upstream and downstream WebRTC connections have independent clocks.
    Without prebuffering, a single late 20 ms frame makes the Stream track emit
    silence in the middle of speech, which is perceived as a click or crackle.
    """

    def __init__(
        self,
        sample_rate: int = 48_000,
        channels: int = 1,
        format: AudioFormatType = AudioFormat.S16,
        audio_buffer_size_ms: int = 300_000,
    ):
        super().__init__(
            sample_rate=sample_rate,
            channels=channels,
            format=format,
            audio_buffer_size_ms=audio_buffer_size_ms,
        )
        jitter_buffer_ms = max(
            40,
            int(os.getenv("AGENT_AUDIO_JITTER_BUFFER_MS", "100")),
        )
        self._prebuffer_samples = int(sample_rate * jitter_buffer_ms / 1_000)
        self._playout_started = False
        self._input_finished = False

    async def write(self, pcm: PcmData, final: bool = False) -> None:
        await super().write(pcm, final=final)
        if final:
            self._input_finished = True

    async def flush(self) -> None:
        await super().flush()
        self._playout_started = False
        self._input_finished = False

    async def recv(self) -> av.AudioFrame:
        if self.readyState != "live":
            raise aiortc.mediastreams.MediaStreamError

        pts = await self._pacer.next_pts()

        async with self._frame_lock:
            can_start = (
                self._buffered_samples >= self._prebuffer_samples
                or (self._input_finished and self._buffered_samples > 0)
            )
            if not self._playout_started and can_start:
                self._playout_started = True

            if self._playout_started and self._frame_buffer:
                frame = self._frame_buffer.popleft()
                self._buffered_samples -= frame.samples
            else:
                frame = av.AudioFrame.from_ndarray(
                    self._silence,
                    format="s16",
                    layout=self._layout,
                )

            if self._playout_started and not self._frame_buffer:
                self._playout_started = False
                self._input_finished = False

        if frame.samples < self._samples_per_frame:
            frame = self._pad_to_full_frame(frame)

        frame.pts = pts
        frame.sample_rate = self.sample_rate
        frame.time_base = fractions.Fraction(1, self.sample_rate)
        return frame
