import { useState } from "react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-api";
import { HocItem } from "./types";
import { AsyncBody, Card, Pill, SelectField, TableWrap, Td, Th } from "./shared";
import { useAction } from "./useAction";
import { formatNaira, LEVELS, levelLabel, useAdminData } from "./utils";

const HocMaterials = () => {
  const [level, setLevel] = useState<string>("100");
  const { data, loading, error, reload } = useAdminData<HocItem[]>(`/admin/hoc-items?level=${level}`, []);
  const { busy, run } = useAction();

  const toggle = (item: HocItem) => {
    const next = item.status === "archived" ? "active" : "archived";
    return run(async () => {
      await adminFetch(`/admin/hoc-items/${item.id}/status`, { method: "PUT", body: JSON.stringify({ status: next }) });
      await reload();
    }, `${item.title} is now ${next}.`);
  };

  return (
    <Card
      title="HOC materials"
      description="Items each class's HOC has put up for sale."
      actions={<SelectField label="Level" value={level} onChange={setLevel} options={LEVELS.map((l) => ({ value: l, label: levelLabel(l) }))} />}
    >
      <AsyncBody loading={loading} error={error} empty={data.length === 0} emptyTitle={`No items for ${levelLabel(level)}`} onRetry={reload}>
        <TableWrap>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th>Price</Th>
              <Th>Buyers</Th>
              <Th>Revenue</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <Td>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{[item.course_code, item.department, item.session].filter(Boolean).join(" - ")}</p>
                </Td>
                <Td>{formatNaira(item.price)}</Td>
                <Td>{item.buyers}</Td>
                <Td>{formatNaira(item.revenue)}</Td>
                <Td><Pill tone={item.status === "archived" ? "slate" : "green"}>{item.status}</Pill></Td>
                <Td className="text-right">
                  <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" disabled={busy} onClick={() => toggle(item)}>
                    {item.status === "archived" ? "Restore" : "Archive"}
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </AsyncBody>
    </Card>
  );
};

export default HocMaterials;
