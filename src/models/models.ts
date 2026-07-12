export type DiseaseDTO = {
    id: number;
    diseaseName: string;
    diseaseCode?: string;
    keywords?: string;
    sort?: number;
    status?: number;
};

export type DepartmentWithDiseasesDTO = {
    deptId: number;
    deptName: string;
    deptCode?: string;
    sort?: number;
    diseasesPreview?: string;
    diseases?: DiseaseDTO[];
};

export type CategoryItem = {
    dept: string;
    topics: string;
    href: string;
    children: CategoryItem[];
};

export type Banner = {
    id: string;
    img: string;
    alt?: string;
    href?: string;
};

export type LiveItem = {
    id: string;
    label: string;
    time: string;
    isToday: boolean;
    title: string;
    cover?: string;
    status?: "LIVE" | "WAIT";
    waitText?: string;
};

export type ChoicenessItem = {
    id: number;
    title: string;
    cover?: string;
    latestText: string;
    minors: string[];
};

export type ExcellentItem = {
    id: number;
    title: string;
    cover?: string;
    badge?: string;
    href?: string;
};

export type HomeContent = {
    liveItems: LiveItem[];
    choicenessItems: ChoicenessItem[];
    excellentItems: ExcellentItem[];
};

export type TopicItem = {
    id: number;
    title: string;
    cover?: string;
    latestText: string;
    followed: boolean;
    minors: string[];
};

export type TrainingItem = {
    id: string;
    title: string;
    date: string;
    cover?: string;
};

export type TrainingDetail = TrainingItem & {
    source: string;
    paragraphs: string[];
    contentImage?: string;
    imageCaption?: string;
    relatedLink?: string;
    relatedLinkText?: string;
};

export type CertificateQuery = {
    name: string;
    idNumber: string;
    phone: string;
};

export type CertificateQueryResult = {
    certificateId: string;
};

export type CertificateDetail = {
    id: string;
    name: string;
    gender: string;
    idNumber: string;
    certificateName: string;
    certificateNumber: string;
    issueDate: string;
    level: string;
};

export type ApiResponse<T> = {
    code?: number;
    message?: string;
    data: T;
};
