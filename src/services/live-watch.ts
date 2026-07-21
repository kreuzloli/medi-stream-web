import { buildApiUrl } from "./api";
import { buildAuthHeaders } from "./auth";

export type LiveWatchInfo = {
    room: {
        id: number;
        roomCode: string;
        title: string;
        description?: string;
        coverFileId?: number;
    };
    stream: {
        id: number;
        streamCode: string;
        streamName: string;
        title?: string;
    };
    urls: {
        playWebrtc: string;
        playFlv: string;
        playHls: string;
    };
};

/** 按房间号读取当前登录用户可播放的直播信息。 */
export async function fetchLiveWatch(roomCode: string): Promise<LiveWatchInfo> {
    const response = await fetch(buildApiUrl(`/live/watch/${encodeURIComponent(roomCode)}`), {
        headers: buildAuthHeaders(),
        credentials: "include",
    });
    if (!response.ok) {
        let message = `直播间加载失败，HTTP ${response.status}`;
        try {
            const body = await response.json() as { message?: string };
            message = body.message || message;
        } catch {}
        throw new Error(message);
    }
    const result = await response.json() as LiveWatchInfo;
    console.info("[live-watch] room loaded", {
        roomId: result.room.id,
        roomCode: result.room.roomCode,
        streamId: result.stream.id,
        streamName: result.stream.streamName,
    });
    return result;
}
