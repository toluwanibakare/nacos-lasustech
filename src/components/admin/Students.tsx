import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Student, FeeSettings } from "./types";
import { AsyncBody, Card, FilterBar, Pager, PageHeader, Pill, SearchInput, SelectField, TableWrap, Td, Th } from "./shared";
import { ClassLeaders } from "./ClassLeaders";
import { ManageStudent, RoleConfirm } from "./StudentDialogs";
import { LEVEL_FILTERS, levelLabel, useAdminData, useDebouncedValue } from "./utils";

const PAGE_SIZE = 25;
const PLAIN_ROLES = ["", "student", "fresher"];

const roleOf = (s: Student) => s.post || "Student";
const isExecutive = (s: Student) => {
  const p = (s.post || "").trim();
  return !PLAIN_ROLES.includes(p.toLowerCase()) && p !== "HOC" && p !== "Assistant HOC";
};

const rolePill = (s: Student) => {
  const p = roleOf(s);
  if (p === "HOC") return <Pill tone="green">HOC</Pill>;
  if (p === "Assistant HOC") return <Pill tone="blue">Asst. HOC</Pill>;
  if (isExecutive(s)) return <Pill tone="amber">{p}</Pill>;
  return <span className="text-xs text-muted-foreground">Student</span>;
};

const Students = () => {
  const { data: students, loading, error, reload } = useAdminData<Student[]>("/admin/students", []);
  const { data: fees } = useAdminData<FeeSettings | null>("/admin/settings/fees", null);
  const departments = fees?.departments || [];

  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [page, setPage] = useState(1);
  const [manage, setManage] = useState<Student | null>(null);
  const [rolePick, setRolePick] = useState<{ student: Student; post: string } | null>(null);
  const q = useDebouncedValue(search.trim().toLowerCase());

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (q && !`${s.full_name} ${s.matric_no || ""} ${s.email || ""}`.toLowerCase().includes(q)) return false;
      if (level && s.level !== level) return false;
      if (department && s.department !== department) return false;
      if (role === "HOC" && s.post !== "HOC") return false;
      if (role === "Assistant HOC" && s.post !== "Assistant HOC") return false;
      if (role === "executive" && !isExecutive(s)) return false;
      if (role === "Student" && (s.post === "HOC" || s.post === "Assistant HOC" || isExecutive(s))) return false;
      if (email === "yes" && !s.email) return false;
      if (email === "no" && s.email) return false;
      return true;
    });
  }, [students, q, level, department, role, email]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const setF = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Students" description="Search, tag class leaders, move students between levels and departments." />
      <ClassLeaders students={students} />

      <Card>
        <FilterBar>
          <SearchInput value={search} onChange={setF(setSearch)} placeholder="Search name, matric or email" />
          <SelectField label="Level" value={level} onChange={setF(setLevel)} options={[{ value: "", label: "All levels" }, ...LEVEL_FILTERS.map((l) => ({ value: l, label: levelLabel(l) }))]} />
          <SelectField label="Department" value={department} onChange={setF(setDepartment)} options={[{ value: "", label: "All departments" }, ...departments.map((d) => ({ value: d, label: d }))]} />
          <SelectField label="Role" value={role} onChange={setF(setRole)} options={[{ value: "", label: "All roles" }, { value: "HOC", label: "HOC" }, { value: "Assistant HOC", label: "Assistant HOC" }, { value: "executive", label: "Executives" }, { value: "Student", label: "Student" }]} />
          <SelectField label="Email" value={email} onChange={setF(setEmail)} options={[{ value: "", label: "Any email status" }, { value: "yes", label: "Has email" }, { value: "no", label: "No email" }]} />
        </FilterBar>

        <div className="mt-4">
          <AsyncBody loading={loading} error={error} empty={filtered.length === 0} emptyTitle="No students match" emptyDescription="Try clearing a filter." onRetry={reload}>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Matric</Th>
                  <Th>Level</Th>
                  <Th>Department</Th>
                  <Th>Role</Th>
                  <Th>Email</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((s) => (
                  <tr key={s.id}>
                    <Td>
                      <p className="font-semibold">{s.full_name}</p>
                      {s.activeFlag && <Pill tone="red">Flagged</Pill>}
                    </Td>
                    <Td className="text-xs">{s.matric_no || "-"}</Td>
                    <Td>{levelLabel(s.level)}</Td>
                    <Td className="text-xs">{s.department || "-"}</Td>
                    <Td>{rolePill(s)}</Td>
                    <Td className="max-w-[180px] truncate text-xs">{s.email || <span className="text-muted-foreground">none</span>}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant={s.post === "HOC" ? "default" : "outline"} className="h-8 rounded-full px-3 text-xs" disabled={s.post === "HOC"} onClick={() => setRolePick({ student: s, post: "HOC" })}>
                          HOC
                        </Button>
                        <Button size="sm" variant={s.post === "Assistant HOC" ? "default" : "outline"} className="h-8 rounded-full px-3 text-xs" disabled={s.post === "Assistant HOC"} onClick={() => setRolePick({ student: s, post: "Assistant HOC" })}>
                          Asst
                        </Button>
                        {(s.post === "HOC" || s.post === "Assistant HOC" || isExecutive(s)) && (
                          <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => setRolePick({ student: s, post: "Student" })}>
                            Remove role
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => setManage(s)}>
                          Manage
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pager page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
          </AsyncBody>
        </div>
      </Card>

      <ManageStudent
        student={manage}
        departments={departments}
        onClose={() => setManage(null)}
        onDone={reload}
        onRolePick={(student, post) => setRolePick({ student, post })}
      />
      <RoleConfirm
        student={rolePick?.student || null}
        post={rolePick?.post || null}
        students={students}
        onClose={() => setRolePick(null)}
        onDone={() => {
          setManage(null);
          reload();
        }}
      />
    </div>
  );
};

export default Students;
