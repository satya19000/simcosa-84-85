import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/donations")({
  head: () => ({ meta: [{ title: "Donations & Accounts" }] }),
  component: Donations,
});

function Donations() {
  const { data: donations } = useQuery({
    queryKey: ["donations"],
    queryFn: async () => (await supabase.from("donations").select("*").order("donated_on", { ascending: false })).data ?? [],
  });
  const { data: expenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => (await supabase.from("expenses").select("*").order("spent_on", { ascending: false })).data ?? [],
  });

  const totalIn = donations?.reduce((s, d) => s + Number(d.amount), 0) ?? 0;
  const totalOut = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const balance = totalIn - totalOut;

  const fmt = (n: number) => `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <h1>Donations & Accounts</h1>
      <p className="text-muted-foreground mt-2">Fully transparent — every rupee in and out.</p>

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5"><p className="text-muted-foreground">Total Donated</p><p className="font-display text-3xl text-primary mt-1">{fmt(totalIn)}</p></div>
        <div className="rounded-xl border border-border bg-card p-5"><p className="text-muted-foreground">Total Spent</p><p className="font-display text-3xl text-destructive mt-1">{fmt(totalOut)}</p></div>
        <div className="rounded-xl border border-gold bg-gold/10 p-5"><p className="text-muted-foreground">Balance</p><p className="font-display text-3xl text-primary mt-1">{fmt(balance)}</p></div>
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2>Donations</h2>
          <div className="mt-3 divide-y">
            {donations?.length === 0 && <p className="text-muted-foreground">No donations recorded yet.</p>}
            {donations?.map((d) => (
              <div key={d.id} className="py-3 flex justify-between gap-3">
                <div>
                  <p className="font-medium">{d.donor_name}</p>
                  {d.purpose && <p className="text-sm text-muted-foreground">{d.purpose}</p>}
                  <p className="text-xs text-muted-foreground">{format(new Date(d.donated_on), "PPP")}</p>
                </div>
                <p className="font-display text-lg text-primary">{fmt(Number(d.amount))}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2>Expenses</h2>
          <div className="mt-3 divide-y">
            {expenses?.length === 0 && <p className="text-muted-foreground">No expenses recorded yet.</p>}
            {expenses?.map((e) => (
              <div key={e.id} className="py-3 flex justify-between gap-3">
                <div>
                  <p className="font-medium">{e.description}</p>
                  {e.category && <p className="text-sm text-muted-foreground">{e.category}</p>}
                  <p className="text-xs text-muted-foreground">{format(new Date(e.spent_on), "PPP")}</p>
                </div>
                <p className="font-display text-lg text-destructive">{fmt(Number(e.amount))}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
