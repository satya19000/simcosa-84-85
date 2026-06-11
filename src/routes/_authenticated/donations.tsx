import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Heart, TrendingUp, TrendingDown, Wallet, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/_authenticated/donations")({
  head: () => ({ meta: [{ title: "Donations & Accounts — SIMCOSA 84–85" }] }),
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Batch Fund</p>
          <h1>Donations & Accounts</h1>
          <p className="text-gray-500 mt-2 text-lg">Fully transparent — every rupee in and out is visible to all members.</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {/* Summary cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-emerald-100 p-2.5 rounded-xl"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
              <p className="text-gray-600 font-semibold">Total Donated</p>
            </div>
            <p className="font-display text-3xl font-bold text-emerald-700">{fmt(totalIn)}</p>
            <p className="text-emerald-600 text-sm mt-1">{donations?.length ?? 0} contributions</p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-rose-100 p-2.5 rounded-xl"><TrendingDown className="h-5 w-5 text-rose-600" /></div>
              <p className="text-gray-600 font-semibold">Total Spent</p>
            </div>
            <p className="font-display text-3xl font-bold text-rose-700">{fmt(totalOut)}</p>
            <p className="text-rose-600 text-sm mt-1">{expenses?.length ?? 0} expense records</p>
          </div>

          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-amber-100 p-2.5 rounded-xl"><Wallet className="h-5 w-5 text-amber-600" /></div>
              <p className="text-gray-600 font-semibold">Current Balance</p>
            </div>
            <p className={`font-display text-3xl font-bold ${balance >= 0 ? "text-amber-700" : "text-rose-700"}`}>{fmt(balance)}</p>
            <p className="text-amber-600 text-sm mt-1">{balance >= 0 ? "Surplus" : "Deficit"}</p>
          </div>
        </div>

        {/* How to donate */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10 flex items-start gap-4">
          <div className="bg-amber-100 p-3 rounded-xl shrink-0"><Heart className="h-6 w-6 text-amber-600" /></div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Want to contribute to the batch fund?</h3>
            <p className="text-gray-600 mt-1">Please reach out to the batch treasurer or any admin via WhatsApp. All contributions are acknowledged and recorded here for complete transparency.</p>
          </div>
        </div>

        {/* Tables */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Donations */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h2 className="font-display text-xl font-bold text-gray-800">Donations</h2>
            </div>
            <div className="divide-y divide-amber-50">
              {donations?.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400">
                  <IndianRupee className="h-10 w-10 text-amber-100 mx-auto mb-2" />
                  <p>No donations recorded yet.</p>
                </div>
              )}
              {donations?.map((d) => (
                <div key={d.id} className="px-6 py-4 flex justify-between gap-3 hover:bg-amber-50/50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{d.donor_name}</p>
                    {d.purpose && <p className="text-sm text-gray-500 mt-0.5">{d.purpose}</p>}
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(d.donated_on), "PPP")}</p>
                  </div>
                  <p className="font-display text-xl font-bold text-emerald-600 shrink-0">{fmt(Number(d.amount))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-rose-600" />
              <h2 className="font-display text-xl font-bold text-gray-800">Expenses</h2>
            </div>
            <div className="divide-y divide-amber-50">
              {expenses?.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400">
                  <IndianRupee className="h-10 w-10 text-amber-100 mx-auto mb-2" />
                  <p>No expenses recorded yet.</p>
                </div>
              )}
              {expenses?.map((e) => (
                <div key={e.id} className="px-6 py-4 flex justify-between gap-3 hover:bg-amber-50/50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{e.description}</p>
                    {e.category && <p className="text-sm text-gray-500 mt-0.5 capitalize">{e.category}</p>}
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(e.spent_on), "PPP")}</p>
                  </div>
                  <p className="font-display text-xl font-bold text-rose-600 shrink-0">{fmt(Number(e.amount))}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
