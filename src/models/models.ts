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

export type ApiResponse<T> = {
    code?: number;
    message?: string;
    data: T;
};
