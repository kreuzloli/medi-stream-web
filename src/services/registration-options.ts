import { buildApiUrl } from "./api";

export type HospitalOption = { id: number; hospitalName: string };
export type DepartmentOption = { deptId: number; deptName: string };

/** 加载扫码注册需要的启用医院和科室选项。 */
export async function fetchRegistrationOptions(): Promise<{
    hospitals: HospitalOption[];
    departments: DepartmentOption[];
}> {
    const [hospitalResponse, departmentResponse] = await Promise.all([
        fetch(buildApiUrl("/hospitals?page=1&size=200&status=1"), { credentials: "include" }),
        fetch(buildApiUrl("/catalog/departments"), { credentials: "include" }),
    ]);
    if (!hospitalResponse.ok || !departmentResponse.ok) {
        throw new Error("医院或科室选项加载失败，请稍后重试");
    }
    const hospitalPage = await hospitalResponse.json() as { records?: HospitalOption[] };
    const departments = await departmentResponse.json() as DepartmentOption[];
    console.info("[wechat-register] options loaded", {
        hospitalCount: hospitalPage.records?.length ?? 0,
        departmentCount: departments.length,
    });
    return {
        hospitals: hospitalPage.records ?? [],
        departments,
    };
}
