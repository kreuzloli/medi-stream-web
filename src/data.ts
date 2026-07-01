import schematicUrl from "./assets/images/schematic.jpg";

import type { Banner, CategoryItem, ChoicenessItem, ExcellentItem, LiveItem } from "./models";

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
        id: "a",
        label: "今天",
        time: "10:00",
        isToday: true,
        title: "会议标题123456789123456",
        status: "LIVE",
    },
    {
        id: "b",
        label: "15日",
        time: "20:00",
        isToday: false,
        title: "会议标题123456789123456",
        status: "WAIT",
        waitText: "2小时",
    },
    {
        id: "c",
        label: "16日",
        time: "21:00",
        isToday: false,
        title: "会议标题123456789123456",
        status: "WAIT",
        waitText: "27小时",
    },
];

export const homeChoicenessItems: ChoicenessItem[] = [
    {
        id: 1,
        title: "会议标题A123456789123456",
        latestText: "最新时间1月21日 共20期",
        minors: ["会议标题123456789123456", "会议标题123456789123456", "会议标题123456789123456"],
    },
    {
        id: 2,
        title: "会议标题B123456789123456",
        latestText: "最新时间1月18日 共12期",
        minors: ["会议标题123456789123456", "会议标题123456789123456", "会议标题123456789123456"],
    },
    {
        id: 3,
        title: "会议标题C123456789123456",
        latestText: "最新时间1月21日 共20期",
        minors: ["会议标题123456789123456", "会议标题123456789123456", "会议标题123456789123456"],
    },
];

export const defaultExcellentItems: ExcellentItem[] = Array.from({ length: 8 }, (_, index) => ({
    id: index + 1,
    title: "会议标题12345678912345611243466",
    cover: schematicUrl,
    badge: "回放",
}));

export { schematicUrl };
