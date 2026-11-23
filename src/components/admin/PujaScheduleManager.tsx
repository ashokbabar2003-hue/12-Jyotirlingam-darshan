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
  const [message, setMessage] = useState<string | null>(null);
  const [selectedShrine, setSelectedShrine] = useState("somnath");
  const update = (v: Partial<Draft>) => setDraft((d) => ({ ...d, ...v }));
  async function save() {
    setBusy(true);
    try {
      setMessage(null);
      const result = await saveFn({ data: draft });
      if (!result?.ok || !result.id) throw new Error("Database did not confirm the saved entry.");
      toast.success("Puja timing saved. Verified and visible entries appear on the shrine page.");
      setDraft({ ...initial, slug: selectedShrine });
      await qc.invalidateQueries({ queryKey: ["puja-schedules"] });
      await qc.refetchQueries({ queryKey: ["puja-schedules"] });
    } catch (e) { const msg = e instanceof Error ? e.message : "Unable to save timing"; setMessage(msg); toast.error(msg); }
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
  const shrineEntries = (data ?? []).filter(row => row.slug === selectedShrine);
  return <section className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 space-y-5">
    <div>
      <h3 className="font-display text-2xl text-foreground">Puja schedule management</h3>
      <p className="text-sm text-muted-foreground">Times are IST (24-hour). Verified and visible pujas appear on the corresponding shrine page. These timings do not control the hourly live refresh.</p>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">Schedule storage unavailable: {String(error.message)}. Check the production database migration and service-role configuration.</p>}
    {message && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{message}</p>}
    <label className="block text-sm font-medium">Manage shrine
      <select className="mt-2 w-full rounded-md border border-border bg-background p-3" value={selectedShrine} onChange={e=>{setSelectedShrine(e.target.value);setDraft({...initial,slug:e.target.value});setMessage(null);}}>
        {jyotirlingas.map(j=><option key={j.slug} value={j.slug}>{j.name} · {(data??[]).filter(r=>r.slug===j.slug).length} pujas</option>)}
      </select>
    </label>
    <div className="rounded-lg border border-border/50 p-3 space-y-3"><h4 className="font-medium">{draft.id ? "Edit puja timing" : "Add another puja timing"}</h4>
    <div className="grid gap-3 sm:grid-cols-2">

      <label className="text-sm">Puja name<Input className="mt-1" maxLength={120} value={draft.name} onChange={e=>update({name:e.target.value})} placeholder="e.g. Evening Aarti"/></label>
      <label className="text-sm">Time (IST)<Input className="mt-1" type="time" value={draft.time_ist} onChange={e=>update({time_ist:e.target.value})}/></label>
      <label className="text-sm">Official source URL<Input className="mt-1" type="url" value={draft.source_url} onChange={e=>update({source_url:e.target.value})} placeholder="https://..."/></label>
    </div>
    <div className="flex flex-wrap gap-5 text-sm">
      <label className="flex items-center gap-2"><input type="checkbox" checked={draft.verified} onChange={e=>update({verified:e.target.checked})}/> Official timing verified</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={draft.enabled} onChange={e=>update({enabled:e.target.checked})}/> Show on shrine page</label>
    </div>
    <div className="flex gap-2">
      <Button disabled={busy || !draft.name.trim() || (draft.verified && !draft.source_url) || !!error} onClick={save}>{draft.id ? "Update timing" : "Save timing"}</Button>
      <Button variant="outline" onClick={()=>setDraft({...initial,slug:selectedShrine})}>Clear</Button>
    </div>
    </div>
    <div className="space-y-3">
      <h4 className="font-medium">Saved pujas for {jyotirlingas.find(j=>j.slug===selectedShrine)?.name} ({shrineEntries.length})</h4>
      {!isLoading && !error && shrineEntries.length===0 && <p className="text-sm text-muted-foreground">No timings saved yet. Add the first puja above; each shrine can have multiple separate entries.</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading schedules…</p>}
      {shrineEntries.map(row=><div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 p-3">
        <div className="text-sm"><strong>{jyotirlingas.find(j=>j.slug===row.slug)?.name ?? row.slug}</strong> · {row.name} · {row.time_ist.slice(0,5)} IST
          <p className="text-xs text-muted-foreground">{row.verified ? "Verified" : "Unverified"} · {row.enabled ? "Visible on shrine page" : "Hidden"} {row.source_url && <>· <a href={row.source_url} target="_blank" rel="noreferrer" className="underline">Source</a></>}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={()=>{setDraft({id:row.id,slug:row.slug,name:row.name,time_ist:row.time_ist.slice(0,5),source_url:row.source_url??"",enabled:row.enabled,verified:row.verified});window.scrollTo({top:0,behavior:"smooth"});}}>Edit</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={()=>remove(row)}>Delete</Button>
        </div>
      </div>)}
    </div>
  </section>;
}
