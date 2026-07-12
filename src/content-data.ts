import { schematicUrl } from "./data";
import type { CertificateDetail, TopicItem, TrainingDetail, TrainingItem } from "./models/models";

export const fallbackTopics: TopicItem[] = Array.from({ length: 25 }, (_, index) => ({
    id: index + 1,
    title: "会议标题123456789123456",
    cover: schematicUrl,
    latestText: "最新时间1月11日 共11期",
    followed: index % 3 !== 0,
    minors: [
        "标题12345678912345678...",
        "标题12345678912345678...",
        "标题12345678912345678...",
    ],
}));

export const fallbackTrainings: TrainingItem[] = Array.from({ length: 7 }, (_, index) => ({
    id: `training-${index + 1}`,
    title: "重磅！郑州市骨科医院省级限制类技术培训班，关节镜可以再多写一点字123456...",
    date: "2026-7-7",
    cover: schematicUrl,
}));

const articleParagraph =
    "随着生物医学领域临床研究快速发展，国务院令第818号《生物医学新技术临床研究和临床转化应用管理条例》已于2025年公布，并将于2026年5月1日起正式施行。新规在规范伦理审查、强化数据真实性、完善全过程管理等方面提出了更高更具体的要求，对药物与医疗器械临床试验的执行标准，尤其是一线实操人员的合规意识与专业能力提出了全新挑战。";

export const fallbackTrainingDetail: TrainingDetail = {
    ...fallbackTrainings[0],
    title: "关于举办全国2026年新版药物及医疗器械临床试验质量管理规范（GCP）培训班的通知",
    source: "柳翠",
    paragraphs: [
        `各有关单位：\n${articleParagraph} 为帮助行业从业人员准确掌握新规核心要义，对标GCP药物及医疗器械临床试验质量管理规范最新要求，进一步提升全流程执行质量与风险防控能力，中国药科大学继续教育学院特举办培训班。`,
        `${articleParagraph} 为帮助行业从业人员准确掌握新规核心要义，对标GCP药物及医疗器械临床试验质量管理规范最新要求，进一步提升全流程执行质量与风险防控能力。`,
    ],
    contentImage: schematicUrl,
    imageCaption: "图：肝愈未来主KV",
    relatedLink: "#/training-detail?id=training-1",
    relatedLinkText: "相关链接：如何获取培训服务",
};

export const fallbackCertificate: CertificateDetail = {
    id: "certificate-1",
    name: "郭靖",
    gender: "男",
    idNumber: "22010419860812131X",
    certificateName: "2026年《药物、医疗器械临床试验质量管理》（GCP）及伦理审查提升培训班",
    certificateNumber: "FDSA-GCP202605243284",
    issueDate: "2026-05-24",
    level: "无",
};
