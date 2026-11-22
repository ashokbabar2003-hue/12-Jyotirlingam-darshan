import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPujaSchedules, savePujaSchedule, deletePujaSchedule, type PujaScheduleRow } from "@/lib/darshan.functions";
import { jyotirlingas } from "@/data/jyotirlingas";

type Draft = { id?: string; slug: string; name: string; time_ist: string; source_url: string; enabled: boolean; verified: boolean };
const initial: Draft = { slug: "somnath", name: "", time_ist: "07:00", source_url: "", enabled: false, verified: false };
export function PujaScheduleManager() {
  const listFn = useServerFn(getPujaSchedules);
  const saveFn = useServerFn(savePujaSchedule);
  const deleteFn = useServerFn(deletePujaSchedule);
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery({ queryKey: ["puja-schedules"], queryFn: () => listFn(), retry: false });
  const [draft, setDraft] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const update = (v: Partial<Draft>) => setDraft((d) => ({ ...d, ...v }));
  async function save() {
    setBusy(true);
    try {
      await saveFn({ data: draft });
      toast.success("Puja timing saved (scheduler remains inactive).");
      setDraft(initial);
      await qc.invalidateQueries({ queryKey: ["puja-schedules"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Unable to save timing"); }
    finally { setBusy(false); }
  }
  async function remove(row: PujaScheduleRow) {
    if (!window.confirm(`Delete ${row.name} for ${row.slug}?`)) return;
    setBusy(true);
    try {
      await deleteFn({ data: { id: row.id } });
      await qc.invalidateQueries({ queryKey: ["puja-schedules"] });
      toast.success("Timing deleted");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Unable to delete"); }
    finally { setBusy(false); }
  }
  return <section className="mt-10 rounded-xl border border-border/60 bg-card p-4 space-y-4">
    <div>
      <h3 className="font-display text-xl text-foreground">Puja timing configuration</h3>
      <p className="text-sm text-muted-foreground">Times are IST (24-hour). Verify each time with an official source. Editing does not activate automatic refresh.</p>
    </div>
    {error && <p className="text-sm text-destructive">Schedule storage unavailable: {String(error.message)}. Database migration must be applied first.</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Shrine
        <select className="mt-1 w-full rounded-md border border-border bg-background p-2" value={draft.slug} onChange={e=>update({slug:e.target.value})}>
          {jyotirlingas.map(j=><option key={j.slug} value={j.slug}>{j.name}</option>)}
        </select>
      </label>
      <label className="text-sm">Puja name<Input className="mt-1" maxLength={120} value={draft.name} onChange={e=>update({name:e.target.value})} placeholder="e.g. Evening Aarti"/></label>
      <label className="text-sm">Time (IST)<Input className="mt-1" type="time" value={draft.time_ist} onChange={e=>update({time_ist:e.target.value})}/></label>
      <label className="text-sm">Official source URL<Input className="mt-1" type="url" value={draft.source_url} onChange={e=>update({source_url:e.target.value})} placeholder="https://..."/></label>
    </div>
    <div className="flex flex-wrap gap-5 text-sm">
      <label className="flex items-center gap-2"><input type="checkbox" checked={draft.verified} onChange={e=>update({verified:e.target.checked})}/> Official timing verified</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={draft.enabled} onChange={e=>update({enabled:e.target.checked})}/> Eligible when scheduler is activated</label>
    </div>
    <div className="flex gap-2">
      <Button disabled={busy || !draft.name.trim() || (draft.verified && !draft.source_url)} onClick={save}>{draft.id ? "Update timing" : "Save timing"}</Button>
      <Button variant="outline" onClick={()=>setDraft(initial)}>Clear</Button>
    </div>
    <div className="space-y-2">
      {isLoading && <p className="text-sm text-muted-foreground">Loading schedules…</p>}
      {(data ?? []).map(row=><div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 p-3">
        <div className="text-sm"><strong>{jyotirlingas.find(j=>j.slug===row.slug)?.name ?? row.slug}</strong> · {row.name} · {row.time_ist.slice(0,5)} IST
          <p className="text-xs text-muted-foreground">{row.verified ? "Verified" : "Unverified"} · {row.enabled ? "Enabled for future scheduler" : "Disabled"} {row.source_url && <>· <a href={row.source_url} target="_blank" rel="noreferrer" className="underline">Source</a></>}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={()=>setDraft({id:row.id,slug:row.slug,name:row.name,time_ist:row.time_ist.slice(0,5),source_url:row.source_url??"",enabled:row.enabled,verified:row.verified})}>Edit</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={()=>remove(row)}>Delete</Button>
        </div>
      </div>)}
    </div>
  </section>;
}
