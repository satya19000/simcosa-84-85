import { jsxs, jsx } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { c as createSsrRpc } from "./createSsrRpc-CMrvh2uQ.js";
import { a as requireApproved } from "./middleware-DefoN1hA.js";
import { c as createServerFn } from "./server-DHvS4SOZ.js";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Wallet, Heart, IndianRupee } from "lucide-react";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
const listDonations = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("bd2839912c2000330c0c97aecda6fa233bd9307559fa681d80581a21face4d1a"));
const listExpenses = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("d637ebf3b8dc0235d054a0d54d2dfda9e06880542cae18e88788262cd25d7a8d"));
function Donations() {
  const {
    data: donations
  } = useQuery({
    queryKey: ["donations"],
    queryFn: () => listDonations()
  });
  const {
    data: expenses
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => listExpenses()
  });
  const totalIn = donations?.reduce((s, d) => s + Number(d.amount), 0) ?? 0;
  const totalOut = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const balance = totalIn - totalOut;
  const fmt = (n) => `₹ ${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2
  })}`;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Batch Fund" }),
      /* @__PURE__ */ jsx("h1", { children: "Donations & Accounts" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Fully transparent — every rupee in and out is visible to all members." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-4 mb-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 border border-emerald-200 rounded-2xl p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-emerald-100 p-2.5 rounded-xl", children: /* @__PURE__ */ jsx(TrendingUp, { className: "h-5 w-5 text-emerald-600" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 font-semibold", children: "Total Donated" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "font-display text-3xl font-bold text-emerald-700", children: fmt(totalIn) }),
          /* @__PURE__ */ jsxs("p", { className: "text-emerald-600 text-sm mt-1", children: [
            donations?.length ?? 0,
            " contributions"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-rose-50 border border-rose-200 rounded-2xl p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-rose-100 p-2.5 rounded-xl", children: /* @__PURE__ */ jsx(TrendingDown, { className: "h-5 w-5 text-rose-600" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 font-semibold", children: "Total Spent" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "font-display text-3xl font-bold text-rose-700", children: fmt(totalOut) }),
          /* @__PURE__ */ jsxs("p", { className: "text-rose-600 text-sm mt-1", children: [
            expenses?.length ?? 0,
            " expense records"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 border border-amber-300 rounded-2xl p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-amber-100 p-2.5 rounded-xl", children: /* @__PURE__ */ jsx(Wallet, { className: "h-5 w-5 text-amber-600" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 font-semibold", children: "Current Balance" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: `font-display text-3xl font-bold ${balance >= 0 ? "text-amber-700" : "text-rose-700"}`, children: fmt(balance) }),
          /* @__PURE__ */ jsx("p", { className: "text-amber-600 text-sm mt-1", children: balance >= 0 ? "Surplus" : "Deficit" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10 flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-amber-100 p-3 rounded-xl shrink-0", children: /* @__PURE__ */ jsx(Heart, { className: "h-6 w-6 text-amber-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-900 text-lg", children: "Want to contribute to the batch fund?" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Please reach out to the batch treasurer or any admin via WhatsApp. All contributions are acknowledged and recorded here for complete transparency." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "h-5 w-5 text-emerald-600" }),
            /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-bold text-gray-800", children: "Donations" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "divide-y divide-amber-50", children: [
            donations?.length === 0 && /* @__PURE__ */ jsxs("div", { className: "px-6 py-8 text-center text-gray-400", children: [
              /* @__PURE__ */ jsx(IndianRupee, { className: "h-10 w-10 text-amber-100 mx-auto mb-2" }),
              /* @__PURE__ */ jsx("p", { children: "No donations recorded yet." })
            ] }),
            donations?.map((d) => /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 flex justify-between gap-3 hover:bg-amber-50/50 transition-colors", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: d.donor_name }),
                d.purpose && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: d.purpose }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: format(new Date(d.donated_on), "PPP") })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "font-display text-xl font-bold text-emerald-600 shrink-0", children: fmt(Number(d.amount)) })
            ] }, d.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(TrendingDown, { className: "h-5 w-5 text-rose-600" }),
            /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-bold text-gray-800", children: "Expenses" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "divide-y divide-amber-50", children: [
            expenses?.length === 0 && /* @__PURE__ */ jsxs("div", { className: "px-6 py-8 text-center text-gray-400", children: [
              /* @__PURE__ */ jsx(IndianRupee, { className: "h-10 w-10 text-amber-100 mx-auto mb-2" }),
              /* @__PURE__ */ jsx("p", { children: "No expenses recorded yet." })
            ] }),
            expenses?.map((e) => /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 flex justify-between gap-3 hover:bg-amber-50/50 transition-colors", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: e.description }),
                e.category && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-0.5 capitalize", children: e.category }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: format(new Date(e.spent_on), "PPP") })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "font-display text-xl font-bold text-rose-600 shrink-0", children: fmt(Number(e.amount)) })
            ] }, e.id))
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Donations as component
};
