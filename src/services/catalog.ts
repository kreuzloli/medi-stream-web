import type { ApiResponse, CategoryItem, DepartmentWithDiseasesDTO } from "../models/models";
import { buildApiUrl } from "./api";
import { buildAuthHeaders } from "./auth";

/**
 * 获取目录分类数据。
 */
export async function fetchCatalogCategories(): Promise<CategoryItem[]> {
    const url = buildApiUrl("/catalog/full");

    console.info("[catalog] fetch categories start", {
        url,
    });

    const response = await fetch(url, {
        credentials: "include",
        headers: buildAuthHeaders(),
    });

    if (!response.ok) {
        console.error("[catalog] fetch categories failed", {
            status: response.status,
        });

        throw new Error(`目录加载失败，HTTP ${response.status}`);
    }

    const payload = await response.json();

    const list = Array.isArray(payload)
        ? (payload as DepartmentWithDiseasesDTO[])
        : (payload as ApiResponse<DepartmentWithDiseasesDTO[]>).data;

    console.info("[catalog] fetch categories success", {
        count: list?.length ?? 0,
    });

    return (list ?? []).map((department) => ({
        dept: department.deptName,
        topics: department.diseasesPreview ?? "",
        href: `/dept/${department.deptId}`,
        children: (department.diseases ?? []).map((disease) => ({
            dept: disease.diseaseName,
            topics: disease.keywords ?? "",
            href: `/disease/${disease.id}`,
            children: [],
        })),
    }));
}
