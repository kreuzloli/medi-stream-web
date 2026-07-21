type LiveWatchReservation = {
    kind: "qr" | "chat";
    title: string;
    description: string;
    icon: string;
};

const RESERVATIONS: LiveWatchReservation[] = [
    {
        kind: "qr",
        title: "直播二维码",
        description: "扫码观看与分享能力正在规划中",
        icon: `<svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M7 7h13v13H7zM28 7h13v13H28zM7 28h13v13H7z" />
            <path d="M31 28h4v4h-4zM37 28h4v8h-4zM27 35h8v6h-8zM37 39h4v2h-4z" />
        </svg>`,
    },
    {
        kind: "chat",
        title: "直播聊天室",
        description: "实时交流与互动能力正在规划中",
        icon: `<svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M8 9h32v24H23l-9 7v-7H8z" />
            <circle cx="17" cy="21" r="2" />
            <circle cx="24" cy="21" r="2" />
            <circle cx="31" cy="21" r="2" />
        </svg>`,
    },
];

/** 渲染直播页右侧的规划功能卡片；当前仅用于展示，不绑定任何交互。 */
export function renderLiveWatchReservations(): string {
    return `<aside class="live-watch-reservations" aria-label="直播扩展功能">
        ${RESERVATIONS.map(reservation => `<section class="live-watch-reservation-card" data-live-reservation="${reservation.kind}">
            <div class="live-watch-reservation-icon">${reservation.icon}</div>
            <div class="live-watch-reservation-content">
                <span class="live-watch-reservation-kicker">COMING SOON</span>
                <h2>${reservation.title}</h2>
                <p>${reservation.description}</p>
                <span class="live-watch-reservation-status">功能规划中</span>
            </div>
        </section>`).join("")}
    </aside>`;
}
