import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { errMessage } from "./utils";

/** Runs a mutation with a busy flag and success / failure toasts. Returns true on success. */
export const useAction = () => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (task: () => Promise<unknown>, success: string) => {
      setBusy(true);
      try {
        await task();
        toast({ title: "Done", description: success });
        return true;
      } catch (err) {
        toast({ title: "Action failed", description: errMessage(err), variant: "destructive" });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  return { busy, run };
};
