export function transformDepartmentResponse(department: any) {
  return {
    id: department.id,
    name: department.name,
    head: department.head
      ? {
          user_id: department.head.user_id,
          name: department.head.name,
        }
      : null,
    employees: department.employees.map((e) => ({
      user_id: e.user_id,
      name: e.name,
      designation: {
        id: e.designation?.id,
        title: e.designation?.title,
      },
    })),
    okrs: department.okrs.map((okr) => ({
      id: okr.id,
      title: okr.title,
      due_date: okr.due_date,
      start_date: okr.start_date,
      key_results: okr.key_results.map((kr) => ({
        id: kr.id,
        title: kr.title,
        progress: kr.progress,
      })),
    })),
    progressBreakdown: department.progressBreakdown,
  };
}
