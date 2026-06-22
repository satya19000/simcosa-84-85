import { jsxs, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { c as createSsrRpc, u as useAuth, B as Button } from "./router-CBd90zdT.js";
import { r as requireApproved } from "./middleware-kw9m56U6.js";
import { c as createServerFn } from "./server-BQd5bh2q.js";
import { Calendar, Clock, MapPin, Users, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { isFuture, format, formatDistanceToNow } from "date-fns";
import "@tanstack/react-router";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
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
import "@tanstack/react-router/ssr/server";
const listEvents = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("c18367e16cf8f111f4daaa26ad40eed19da06d504fa160ccb8fe783a450c11d4"));
const listMyRsvps = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("d96623ce34cfb7d798bae7bcefd4660c3ff339c9682e7ca3c56605e28ad2460f"));
const listRsvpCounts = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("f2448d31d2540ace4ac716a8e887c202de19f3cec36fb06652d3eaff1334e641"));
const setRsvp = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("7b26726927eb218882401f89a9d49cc74e6b3590180db87baaaafff30de3f1a0"));
function Countdown({
  date
}) {
  const [diff, setDiff] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  useEffect(() => {
    const calc = () => {
      const ms = new Date(date).getTime() - Date.now();
      if (ms <= 0) return;
      setDiff({
        days: Math.floor(ms / 864e5),
        hours: Math.floor(ms % 864e5 / 36e5),
        minutes: Math.floor(ms % 36e5 / 6e4),
        seconds: Math.floor(ms % 6e4 / 1e3)
      });
    };
    calc();
    const t = setInterval(calc, 1e3);
    return () => clearInterval(t);
  }, [date]);
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2 mt-3", children: [["days", diff.days], ["hrs", diff.hours], ["min", diff.minutes], ["sec", diff.seconds]].map(([l, v]) => /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-xl py-2 text-center", children: [
    /* @__PURE__ */ jsx("p", { className: "font-display text-2xl font-bold text-amber-700", children: String(v).padStart(2, "0") }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 uppercase font-semibold", children: l })
  ] }, l)) });
}
function Events() {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const {
    data: events
  } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents()
  });
  const {
    data: rsvps
  } = useQuery({
    queryKey: ["my-rsvps", user?.id],
    enabled: !!user,
    queryFn: () => listMyRsvps()
  });
  const {
    data: rawCounts
  } = useQuery({
    queryKey: ["rsvp-counts"],
    queryFn: () => listRsvpCounts()
  });
  const counts = {};
  for (const r of rawCounts ?? []) {
    const c = counts[r.event_id] ??= {
      attending: 0,
      maybe: 0,
      not_attending: 0
    };
    if (r.status === "attending" || r.status === "maybe" || r.status === "not_attending") {
      c[r.status]++;
    }
  }
  const setRsvp$1 = async (eventId, status) => {
    if (!user) return;
    try {
      await setRsvp({
        data: {
          eventId,
          status
        }
      });
      toast.success(status === "attending" ? "Great! You're attending 🎉" : "RSVP updated");
      qc.invalidateQueries({
        queryKey: ["my-rsvps"]
      });
      qc.invalidateQueries({
        queryKey: ["rsvp-counts"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to RSVP");
    }
  };
  const getMy = (eid) => rsvps?.find((r) => r.event_id === eid)?.status;
  const upcoming = events?.filter((e) => isFuture(new Date(e.event_date))) ?? [];
  const past = events?.filter((e) => !isFuture(new Date(e.event_date))) ?? [];
  const RSVP_OPTIONS = [{
    value: "attending",
    label: "Attending",
    icon: CheckCircle,
    cls: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
  }, {
    value: "maybe",
    label: "Maybe",
    icon: HelpCircle,
    cls: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
  }, {
    value: "not_attending",
    label: "Not Going",
    icon: XCircle,
    cls: "bg-gray-400 hover:bg-gray-500 text-white border-gray-400"
  }];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Batch Calendar" }),
      /* @__PURE__ */ jsx("h1", { children: "Events & Reunions" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "RSVP so we know who's joining — let's make every reunion count!" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 py-10", children: [
      upcoming.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-display text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "h-6 w-6 text-amber-500" }),
          " Upcoming Events"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-5", children: upcoming.map((e) => {
          const my = getMy(e.id);
          const c = counts?.[e.id] ?? {
            attending: 0,
            maybe: 0,
            not_attending: 0
          };
          const isNext = upcoming[0]?.id === e.id;
          return /* @__PURE__ */ jsxs("div", { className: `bg-white rounded-2xl border shadow-sm overflow-hidden ${isNext ? "border-amber-400 shadow-amber-100" : "border-amber-100"}`, children: [
            isNext && /* @__PURE__ */ jsxs("div", { className: "bg-amber-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
              " Next Upcoming Event"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start justify-between gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900", children: e.title }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-4 text-gray-500 text-sm", children: [
                    /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4 text-amber-500" }),
                      format(new Date(e.event_date), "PPP 'at' p")
                    ] }),
                    e.location && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4 text-amber-500" }),
                      e.location
                    ] })
                  ] }),
                  e.description && /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-600 leading-relaxed", children: e.description })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "shrink-0 text-sm text-gray-500 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100 text-center min-w-[120px]", children: [
                  /* @__PURE__ */ jsxs("p", { className: "flex items-center justify-center gap-1 text-emerald-600 font-bold", children: [
                    /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }),
                    " ",
                    c.attending,
                    " Going"
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-amber-600 font-semibold mt-1", children: [
                    c.maybe,
                    " Maybe"
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-gray-400 mt-0.5", children: [
                    c.not_attending,
                    " Not Going"
                  ] })
                ] })
              ] }),
              isNext && isFuture(new Date(e.event_date)) && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 font-semibold uppercase mb-2", children: "Countdown" }),
                /* @__PURE__ */ jsx(Countdown, { date: e.event_date })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-5 flex flex-wrap gap-2", children: RSVP_OPTIONS.map(({
                value,
                label,
                icon: Icon,
                cls
              }) => /* @__PURE__ */ jsxs(Button, { onClick: () => setRsvp$1(e.id, value), className: `h-11 px-5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${my === value ? cls : "bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700"}`, children: [
                /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
                " ",
                label,
                " ",
                my === value && "✓"
              ] }, value)) })
            ] })
          ] }, e.id);
        }) })
      ] }),
      past.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl font-bold text-gray-800 mb-6", children: "Past Events" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: past.reverse().map((e) => {
          const c = counts?.[e.id] ?? {
            attending: 0
          };
          return /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl border border-amber-100 p-5 opacity-75", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-700", children: e.title }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 flex flex-wrap gap-3 text-sm text-gray-400", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
                  format(new Date(e.event_date), "PPP")
                ] }),
                e.location && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
                  e.location
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-400", children: [
              c.attending,
              " attended · ",
              formatDistanceToNow(new Date(e.event_date), {
                addSuffix: true
              })
            ] })
          ] }) }, e.id);
        }) })
      ] }),
      events?.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "h-16 w-16 text-amber-200 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-gray-500 font-display", children: "No events yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-400 mt-2", children: "Check back soon for upcoming reunion announcements!" })
      ] })
    ] })
  ] });
}
export {
  Events as component
};
