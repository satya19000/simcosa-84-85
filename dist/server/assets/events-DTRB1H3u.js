import { jsx, jsxs } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { c as createSsrRpc, u as useAuth, B as Button } from "./router-CnAgKkC_.js";
import { r as requireApproved } from "./middleware-DS1paCMp.js";
import { c as createServerFn } from "./server-DxzLTJPN.js";
import { I as ImageLightbox } from "./ImageLightbox-Dt94sEvv.js";
import { Calendar, Clock, MapPin, Users, CheckCircle, HelpCircle, XCircle, ExternalLink, CalendarPlus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isFuture } from "date-fns";
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
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2 mt-3", children: [["Days", diff.days], ["Hrs", diff.hours], ["Min", diff.minutes], ["Sec", diff.seconds]].map(([l, v]) => /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-xl py-2 text-center", children: [
    /* @__PURE__ */ jsx("p", { className: "font-display text-2xl font-bold text-amber-700", children: String(v).padStart(2, "0") }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 uppercase font-semibold tracking-wide", children: l })
  ] }, l)) });
}
function toGoogleCalendarUrl(e) {
  const start = new Date(e.event_date);
  const end = e.end_date ? new Date(e.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1e3);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    ...e.description ? {
      details: e.description
    } : {},
    ...e.location ? {
      location: e.location
    } : {}
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
function downloadIcs(e) {
  const start = new Date(e.event_date);
  const end = e.end_date ? new Date(e.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1e3);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const esc = (s) => s.replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SIMCOSA 84-85//EN", "BEGIN:VEVENT", `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${esc(e.title)}`, ...e.description ? [`DESCRIPTION:${esc(e.description)}`] : [], ...e.location ? [`LOCATION:${esc(e.location)}`] : [], "END:VEVENT", "END:VCALENDAR"];
  const blob = new Blob([lines.join("\r\n")], {
    type: "text/calendar;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.title.replace(/\s+/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function AddToCalendarButton({
  event
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (ev) => {
      if (ref.current && !ref.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return /* @__PURE__ */ jsxs("div", { ref, className: "relative", children: [
    /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "h-10 px-4 rounded-xl flex items-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 text-sm font-semibold", onClick: () => setOpen((o) => !o), children: [
      /* @__PURE__ */ jsx(CalendarPlus, { className: "h-4 w-4" }),
      " Add to Calendar ",
      /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3" })
    ] }),
    open && /* @__PURE__ */ jsxs("div", { className: "absolute z-30 top-12 left-0 bg-white border border-amber-100 rounded-xl shadow-xl py-1 min-w-[200px]", children: [
      /* @__PURE__ */ jsxs("a", { href: toGoogleCalendarUrl(event), target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 font-medium", onClick: () => setOpen(false), children: [
        /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4 text-amber-500" }),
        " Google Calendar"
      ] }),
      /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 font-medium", onClick: () => {
        downloadIcs(event);
        setOpen(false);
      }, children: [
        /* @__PURE__ */ jsx(CalendarPlus, { className: "h-4 w-4 text-blue-500" }),
        " Download .ics",
        /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 ml-1", children: "(Apple / Outlook)" })
      ] })
    ] })
  ] });
}
function classifyEvent(e) {
  if (e.event_type === "past") return "past";
  if (e.event_type === "upcoming") return "upcoming";
  return isFuture(new Date(e.event_date)) ? "upcoming" : "past";
}
function Events() {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const {
    data: events,
    isLoading
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
  const [lbIndex, setLbIndex] = useState(null);
  const [lbImages, setLbImages] = useState([]);
  const openLightbox = (src, alt) => {
    setLbImages([{
      src,
      alt
    }]);
    setLbIndex(0);
  };
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
  const doRsvp = async (eventId, status) => {
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
  const getMyRsvp = (eid) => rsvps?.find((r) => r.event_id === eid)?.status;
  const allEvents = events ?? [];
  const upcoming = allEvents.filter((e) => classifyEvent(e) === "upcoming").sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const past = allEvents.filter((e) => classifyEvent(e) === "past").sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  const RSVP_OPTIONS = [{
    value: "attending",
    label: "Attending",
    icon: CheckCircle,
    active: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
  }, {
    value: "maybe",
    label: "Maybe",
    icon: HelpCircle,
    active: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
  }, {
    value: "not_attending",
    label: "Not Going",
    icon: XCircle,
    active: "bg-gray-400 hover:bg-gray-500 text-white border-gray-400"
  }];
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-400", children: "Loading events…" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx(ImageLightbox, { images: lbImages, index: lbIndex, onClose: () => setLbIndex(null), onIndexChange: setLbIndex }),
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Batch Calendar" }),
      /* @__PURE__ */ jsx("h1", { children: "Events & Reunions" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "RSVP so we know who's joining — let's make every reunion count!" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-14", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-display text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "h-6 w-6 text-amber-500" }),
          " Upcoming Events"
        ] }),
        upcoming.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 rounded-2xl border border-amber-100 bg-white", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "h-12 w-12 text-amber-200 mx-auto mb-3" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-500 font-medium", children: "No upcoming events yet." }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm mt-1", children: "Check back soon for reunion announcements!" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-6", children: upcoming.map((e, idx) => {
          const my = getMyRsvp(e.id);
          const c = counts[e.id] ?? {
            attending: 0,
            maybe: 0,
            not_attending: 0
          };
          const isNext = idx === 0;
          const hasTime = new Date(e.event_date).getHours() !== 0 || new Date(e.event_date).getMinutes() !== 0;
          return /* @__PURE__ */ jsxs("article", { className: `bg-white rounded-2xl border shadow-sm overflow-hidden ${isNext ? "border-amber-400 shadow-amber-100" : "border-amber-100"}`, children: [
            isNext && /* @__PURE__ */ jsxs("div", { className: "bg-amber-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
              " Next Upcoming Event"
            ] }),
            e.cover_url && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => openLightbox(e.cover_url, e.title), "aria-label": `View full image: ${e.title}`, className: "block w-full h-52 overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400", children: /* @__PURE__ */ jsx("img", { src: e.cover_url, alt: e.title, className: "w-full h-full object-cover transition-transform duration-300 hover:scale-105", loading: "lazy" }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start justify-between gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900", children: e.title }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500", children: [
                    /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4 text-amber-500 shrink-0" }),
                      hasTime ? format(new Date(e.event_date), "PPP 'at' p") : format(new Date(e.event_date), "PPP"),
                      e.end_date && ` – ${format(new Date(e.end_date), "PPP")}`
                    ] }),
                    e.location && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4 text-amber-500 shrink-0" }),
                      e.location
                    ] })
                  ] }),
                  e.description && /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-600 leading-relaxed text-sm", children: e.description })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "shrink-0 text-sm bg-amber-50 rounded-xl px-4 py-3 border border-amber-100 text-center min-w-[110px]", children: [
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
              isNext && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2", children: "Countdown" }),
                /* @__PURE__ */ jsx(Countdown, { date: e.event_date })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-2 items-center", children: [
                e.rsvp_enabled && RSVP_OPTIONS.map(({
                  value,
                  label,
                  icon: Icon,
                  active
                }) => /* @__PURE__ */ jsxs(Button, { type: "button", onClick: () => doRsvp(e.id, value), className: `h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${my === value ? active : "bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700"}`, children: [
                  /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
                  " ",
                  label,
                  " ",
                  my === value && "✓"
                ] }, value)),
                /* @__PURE__ */ jsx(AddToCalendarButton, { event: e }),
                e.external_link && /* @__PURE__ */ jsx("a", { href: e.external_link, target: "_blank", rel: "noopener noreferrer", children: /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", className: "h-10 px-4 rounded-xl flex items-center gap-2 text-sm", children: [
                  /* @__PURE__ */ jsx(ExternalLink, { className: "h-4 w-4" }),
                  " View Details"
                ] }) })
              ] })
            ] })
          ] }, e.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-display text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-6 w-6 text-gray-400" }),
          " Past Events"
        ] }),
        past.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-10 rounded-2xl border border-gray-100 bg-white", children: /* @__PURE__ */ jsx("p", { className: "text-gray-400", children: "No past events added yet." }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: past.map((e) => {
          const c = counts[e.id] ?? {
            attending: 0
          };
          return /* @__PURE__ */ jsx("article", { className: "bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row", children: [
            e.cover_url && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => openLightbox(e.cover_url, e.title), "aria-label": `View full image: ${e.title}`, className: "sm:w-40 h-36 sm:h-auto shrink-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400", children: /* @__PURE__ */ jsx("img", { src: e.cover_url, alt: e.title, className: "w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105", loading: "lazy" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-800", children: e.title }),
                /* @__PURE__ */ jsxs("div", { className: "mt-1 flex flex-wrap gap-3 text-sm text-gray-400", children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(Calendar, { className: "h-3.5 w-3.5" }),
                    format(new Date(e.event_date), "PPP")
                  ] }),
                  e.location && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5" }),
                    e.location
                  ] })
                ] }),
                e.description && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500 line-clamp-2", children: e.description })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 shrink-0 text-sm text-gray-400 items-center", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  c.attending,
                  " attended"
                ] }),
                /* @__PURE__ */ jsx("span", { children: "·" }),
                /* @__PURE__ */ jsx("span", { children: formatDistanceToNow(new Date(e.event_date), {
                  addSuffix: true
                }) }),
                e.external_link && /* @__PURE__ */ jsx("a", { href: e.external_link, target: "_blank", rel: "noopener noreferrer", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "h-8 px-3 text-xs rounded-lg", children: [
                  /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3 mr-1" }),
                  " View"
                ] }) })
              ] })
            ] })
          ] }) }, e.id);
        }) })
      ] })
    ] })
  ] });
}
export {
  Events as component
};
