import type { ApiResponse, CategoryItem, DepartmentWithDiseasesDTO } from "../models/models";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export async function fetchCatalogCategories(): Promise<CategoryItem[]> {
    const response = await fetch(`${API_BASE}/catalog/full`, {
        credentials: "include",
        headers: buildHeaders(),
    });

    if (!response.ok) {
        throw new Error(`目录加载失败，HTTP ${response.status}`);
    }

    const payload = await response.json();
    const list = Array.isArray(payload)
        ? (payload as DepartmentWithDiseasesDTO[])
        : (payload as ApiResponse<DepartmentWithDiseasesDTO[]>).data;

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

function buildHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}
