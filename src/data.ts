import schematicUrl from "./assets/images/schematic.jpg";

import type { Banner, CategoryItem, ChoicenessItem, ExcellentItem, LiveItem } from "./models/models";

const defaultChildren: CategoryItem[] = [
    { dept: "心血管内科1", topics: "心血管内科1", href: "/1", children: [] },
    { dept: "心血管内科2", topics: "心血管内科2", href: "/2", children: [] },
    { dept: "心血管内科3", topics: "心血管内科3", href: "/3", children: [] },
    { dept: "心血管内科4", topics: "心血管内科4", href: "/4", children: [] },
];

export const defaultCategories: CategoryItem[] = [
    { dept: "心血管内科", topics: "血脂异常(高...) · 冠脉疾病(C...", href: "", children: defaultChildren },
    { dept: "肿瘤科", topics: "结直肠癌 · 非小细胞肺癌", href: "", children: defaultChildren },
    { dept: "肿瘤科", topics: "结直肠癌 · 非小细胞肺癌", href: "", children: defaultChildren },
    { dept: "肿瘤科", topics: "结直肠癌 · 非小细胞肺癌", href: "", children: defaultChildren },
    { dept: "肿瘤科", topics: "结直肠癌 · 非小细胞肺癌", href: "", children: defaultChildren },
    { dept: "肿瘤科", topics: "结直肠癌 · 非小细胞肺癌", href: "", children: defaultChildren },
    { dept: "肿瘤科", topics: "结直肠癌 · 非小细胞肺癌", href: "", children: defaultChildren },
    { dept: "肿瘤科1", topics: "结直肠癌 · 非小细胞肺癌", href: "", children: defaultChildren },
    { dept: "肿瘤科1", topics: "结直肠癌 · 非小细胞肺癌", href: "", children: defaultChildren },
];

export const defaultBanners: Banner[] = [
    { id: "1", img: schematicUrl, href: "/topics/1", alt: "banner-1" },
    { id: "2", img: schematicUrl, href: "/topics/2", alt: "banner-2" },
];

export const homeLiveItems: LiveItem[] = [
    {
        id: "live-1",
        label: "今天",
        time: "13:20",
        isToday: true,
        title: "会议标题123456789123456",
        status: "LIVE",
    },
    {
        id: "live-2",
        label: "今天",
        time: "13:20",
        isToday: true,
        title: "会议标题123456789123456",
        status: "LIVE",
    },
    ...Array.from({ length: 8 }, (_, index) => ({
        id: `live-${index + 3}`,
        label: "14日",
        time: "13:20",
        isToday: false,
        title: "会议标题123456789123456",
        status: "WAIT" as const,
        waitText: "100小时",
    })),
];

export const homeChoicenessItems: ChoicenessItem[] = Array.from({ length: 5 }, (_, index) => ({
    id: index + 1,
    title: "会议标题123456789123456",
    cover: schematicUrl,
    latestText: "最新时间1月11日 共11期",
    minors: [],
}));

export const defaultExcellentItems: ExcellentItem[] = Array.from({ length: 4 }, (_, index) => ({
    id: index + 1,
    title: "视频标题123456789...",
    cover: schematicUrl,
    badge: "回放",
}));

export { schematicUrl };
