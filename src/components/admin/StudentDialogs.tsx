import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminFetch } from "@/lib/admin-api";
import { Student } from "./types";
import { ConfirmDialog, Field, SelectField } from "./shared";
import { useAction } from "./useAction";
import { LEVEL_FILTERS, levelLabel } from "./utils";

/** Confirms and applies a role change. `post` null = closed. */
export const RoleConfirm = ({
  student,
  post,
  students,
  onClose,
  onDone,
}: {
  student: Student | null;
  post: string | null;
  students: Student[];
  onClose: () => void;
  onDone: () => void;
}) => {
  const { run } = useAction();
  if (!student || !post) return <ConfirmDialog open={false} onOpenChange={onClose} title="" description="" onConfirm={() => {}} />;

  const existing =
    (post === "HOC" || post === "Assistant HOC") && student.level
      ? students.filter((s) => s.level === student.level && s.post === post && s.id !== student.id)
      : [];

  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Set role to ${post}?`}
      confirmLabel="Change role"
      description={
        <>
          {student.full_name} ({levelLabel(student.level)}) currently has the role "{student.post || "Student"}". It will become "{post}".
          {existing.length > 0 && (
            <span className="mt-2 block text-amber-700">
              {levelLabel(student.level)} already has {post}: {existing.map((e) => e.full_name).join(", ")}. Demote them first if only one is wanted.
            </span>
          )}
        </>
      }
      onConfirm={async () => {
        const ok = await run(
          () => adminFetch(`/admin/students/${student.id}/post`, { method: "PUT", body: JSON.stringify({ post }) }),
          `${student.full_name} is now ${post}.`,
        );
        if (ok) onDone();
        onClose();
      }}
    />
  );
};

/** Manage dialog: free-text role, department/level, flag. */
export const ManageStudent = ({
  student,
  departments,
  onClose,
  onDone,
  onRolePick,
}: {
  student: Student | null;
  departments: string[];
  onClose: () => void;
  onDone: () => void;
  onRolePick: (student: Student, post: string) => void;
}) => {
  const { busy, run } = useAction();
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (student) {
      setRole("");
      setDepartment(student.department || "");
      setLevel(student.level || "");
      setReason("");
      setMessage("");
    }
  }, [student]);

  if (!student) return null;
  const deptOptions = [{ value: "", label: "Select department" }, ...departments.map((d) => ({ value: d, label: d }))];
  if (student.department && !departments.includes(student.department)) deptOptions.push({ value: student.department, label: student.department });

  const saveFields = async () => {
    const body: { department?: string; level?: string } = {};
    if (department && department !== student.department) body.department = department;
    if (level && level !== student.level) body.level = level;
    if (!Object.keys(body).length) return;
    const ok = await run(
      () => adminFetch(`/admin/students/${student.id}/fields`, { method: "PUT", body: JSON.stringify(body) }),
      "Department and level updated.",
    );
    if (ok) {
      onDone();
      onClose();
    }
  };

  const flag = async () => {
    if (!student.matric_no) return;
    const ok = await run(
      () =>
        adminFetch("/admin/students/flags", {
          method: "POST",
          body: JSON.stringify({ matric_number: student.matric_no, student_name: student.full_name, reason, message }),
        }),
      "Student flagged.",
    );
    if (ok) {
      onDone();
      onClose();
    }
  };

  const unflag = async () => {
    if (!student.activeFlag) return;
    const ok = await run(
      () => adminFetch(`/admin/students/flags/${student.activeFlag!.id}`, { method: "DELETE" }),
      "Flag resolved.",
    );
    if (ok) {
      onDone();
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{student.full_name}</DialogTitle>
          <DialogDescription>
            {student.matric_no || "No matric number"} - {levelLabel(student.level)} - current role: {student.post || "Student"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Field label="Role (executive title or custom)" hint="'HOC', 'Assistant HOC', 'Student' or a title like 'President'.">
              <div className="flex gap-2">
                <Input className="rounded-full" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Treasurer" />
                <Button className="rounded-full" disabled={!role.trim()} onClick={() => onRolePick(student, role.trim())}>
                  Set
                </Button>
              </div>
            </Field>
          </div>

          <div className="space-y-2">
            <Field label="Department">
              <SelectField className="w-full" value={department} onChange={setDepartment} options={deptOptions} />
            </Field>
            <Field label="Level">
              <SelectField className="w-full" value={level} onChange={setLevel} options={LEVEL_FILTERS.map((l) => ({ value: l, label: levelLabel(l) }))} />
            </Field>
            <Button className="rounded-full" disabled={busy} onClick={saveFields}>
              Save department and level
            </Button>
          </div>

          <div className="space-y-2 rounded-2xl bg-red-50/60 p-3">
            {student.activeFlag ? (
              <>
                <p className="text-sm font-semibold text-red-800">Flagged: {student.activeFlag.reason}</p>
                <p className="text-xs text-red-800">{student.activeFlag.message}</p>
                <Button variant="outline" className="rounded-full" disabled={busy} onClick={unflag}>
                  Resolve flag
                </Button>
              </>
            ) : student.matric_no ? (
              <>
                <p className="text-sm font-semibold">Flag this account</p>
                <Input className="rounded-full" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Textarea placeholder="Message shown on the student dashboard" value={message} onChange={(e) => setMessage(e.target.value)} />
                <Button variant="outline" className="rounded-full text-red-700" disabled={busy || !reason.trim()} onClick={flag}>
                  Flag student
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">This student has no matric number, so the account cannot be flagged.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
