import { jsx, jsxs } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { u as useAuth, s as supabase, B as Button } from "./router-CIkP24eF.js";
import { I as Input } from "./input-YO8m5oZO.js";
import { L as Label } from "./label-CMrJaZtA.js";
import { T as Textarea } from "./textarea-DFuG4s5I.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BkU43xYN.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DAj7DbBY.js";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "lucide-react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@radix-ui/react-tabs";
import "@radix-ui/react-select";
function Admin() {
  const {
    isAdmin,
    loading
  } = useAuth();
  if (loading) return /* @__PURE__ */ jsx("div", { className: "px-4 py-20 text-center", children: "Loading…" });
  if (!isAdmin) return /* @__PURE__ */ jsxs("div", { className: "px-4 py-20 text-center", children: [
    /* @__PURE__ */ jsx("h2", { children: "Admin only" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "You don't have admin access." })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 py-10", children: [
    /* @__PURE__ */ jsx("h1", { children: "Admin Dashboard" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "Manage members, events, announcements, finances and requests." }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "members", className: "mt-8", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "flex flex-wrap h-auto justify-start", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "members", children: "Members" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "events", children: "Events" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "announcements", children: "Announcements" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "donations", children: "Donations" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "expenses", children: "Expenses" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "support", children: "Support" })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "members", className: "mt-6", children: /* @__PURE__ */ jsx(MembersTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "events", className: "mt-6", children: /* @__PURE__ */ jsx(EventsTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "announcements", className: "mt-6", children: /* @__PURE__ */ jsx(AnnouncementsTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "donations", className: "mt-6", children: /* @__PURE__ */ jsx(DonationsTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "expenses", className: "mt-6", children: /* @__PURE__ */ jsx(ExpensesTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "support", className: "mt-6", children: /* @__PURE__ */ jsx(SupportTab, {}) })
    ] })
  ] });
}
function MembersTab() {
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", {
      ascending: false
    })).data ?? []
  });
  const toggle = async (id, approved) => {
    const {
      error
    } = await supabase.from("profiles").update({
      approved
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(approved ? "Approved" : "Revoked");
    qc.invalidateQueries({
      queryKey: ["admin-members"]
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data?.map((m) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
        m.full_name,
        " ",
        m.approved && /* @__PURE__ */ jsx("span", { className: "text-xs text-gold ml-2", children: "✓ Approved" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: m.email })
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: () => toggle(m.id, !m.approved), variant: m.approved ? "outline" : "default", children: m.approved ? "Revoke access" : "Approve member" })
  ] }, m.id)) });
}
function EventsTab() {
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => (await supabase.from("events").select("*").order("event_date", {
      ascending: false
    })).data ?? []
  });
  const create = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const {
      error
    } = await supabase.from("events").insert({
      title: String(fd.get("title")),
      description: String(fd.get("description") || ""),
      location: String(fd.get("location") || ""),
      event_date: new Date(String(fd.get("event_date"))).toISOString()
    });
    if (error) return toast.error(error.message);
    form.reset();
    toast.success("Event created");
    qc.invalidateQueries({
      queryKey: ["admin-events"]
    });
    qc.invalidateQueries({
      queryKey: ["events"]
    });
  };
  const del = async (id) => {
    await supabase.from("events").delete().eq("id", id);
    qc.invalidateQueries({
      queryKey: ["admin-events"]
    });
    qc.invalidateQueries({
      queryKey: ["events"]
    });
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("form", { onSubmit: create, className: "rounded-xl border border-border bg-card p-5 grid sm:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Title" }),
        /* @__PURE__ */ jsx(Input, { name: "title", required: true, className: "h-11" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Date & time" }),
        /* @__PURE__ */ jsx(Input, { name: "event_date", type: "datetime-local", required: true, className: "h-11" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Location" }),
        /* @__PURE__ */ jsx(Input, { name: "location", className: "h-11" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Description" }),
        /* @__PURE__ */ jsx(Textarea, { name: "description", rows: 3 })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "sm:col-span-2 h-11", children: "Create event" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 space-y-3", children: data?.map((e) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: e.title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: format(new Date(e.event_date), "PPP p") })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => del(e.id), children: "Delete" })
    ] }, e.id)) })
  ] });
}
function AnnouncementsTab() {
  const qc = useQueryClient();
  const [kind, setKind] = useState("notice");
  const {
    data
  } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", {
      ascending: false
    })).data ?? []
  });
  const create = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const {
      error
    } = await supabase.from("announcements").insert({
      kind,
      title: String(fd.get("title")),
      body: String(fd.get("body") || "")
    });
    if (error) return toast.error(error.message);
    form.reset();
    qc.invalidateQueries({
      queryKey: ["admin-announcements"]
    });
    qc.invalidateQueries({
      queryKey: ["announcements"]
    });
  };
  const del = async (id) => {
    await supabase.from("announcements").delete().eq("id", id);
    qc.invalidateQueries({
      queryKey: ["admin-announcements"]
    });
    qc.invalidateQueries({
      queryKey: ["announcements"]
    });
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("form", { onSubmit: create, className: "rounded-xl border border-border bg-card p-5 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Kind" }),
        /* @__PURE__ */ jsxs(Select, { value: kind, onValueChange: setKind, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-11", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "birthday", children: "Birthday" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "achievement", children: "Achievement" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "condolence", children: "Condolence" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "notice", children: "Notice" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Title" }),
        /* @__PURE__ */ jsx(Input, { name: "title", required: true, className: "h-11" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Body" }),
        /* @__PURE__ */ jsx(Textarea, { name: "body", rows: 3 })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "h-11", children: "Post announcement" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 space-y-3", children: data?.map((a) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: a.title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground capitalize", children: a.kind })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => del(a.id), children: "Delete" })
    ] }, a.id)) })
  ] });
}
function DonationsTab() {
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => (await supabase.from("donations").select("*").order("donated_on", {
      ascending: false
    })).data ?? []
  });
  const create = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const {
      error
    } = await supabase.from("donations").insert({
      donor_name: String(fd.get("donor_name")),
      amount: Number(fd.get("amount")),
      purpose: String(fd.get("purpose") || "")
    });
    if (error) return toast.error(error.message);
    form.reset();
    qc.invalidateQueries({
      queryKey: ["admin-donations"]
    });
    qc.invalidateQueries({
      queryKey: ["donations"]
    });
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("form", { onSubmit: create, className: "rounded-xl border border-border bg-card p-5 grid sm:grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Donor name" }),
        /* @__PURE__ */ jsx(Input, { name: "donor_name", required: true, className: "h-11" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Amount (₹)" }),
        /* @__PURE__ */ jsx(Input, { name: "amount", type: "number", step: "0.01", required: true, className: "h-11" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Purpose" }),
        /* @__PURE__ */ jsx(Input, { name: "purpose", className: "h-11" })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "sm:col-span-3 h-11", children: "Add donation" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 space-y-2", children: data?.map((d) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: d.donor_name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: d.purpose })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "font-display text-lg", children: [
        "₹",
        Number(d.amount).toLocaleString("en-IN")
      ] })
    ] }, d.id)) })
  ] });
}
function ExpensesTab() {
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-expenses"],
    queryFn: async () => (await supabase.from("expenses").select("*").order("spent_on", {
      ascending: false
    })).data ?? []
  });
  const create = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const {
      error
    } = await supabase.from("expenses").insert({
      description: String(fd.get("description")),
      amount: Number(fd.get("amount")),
      category: String(fd.get("category") || "")
    });
    if (error) return toast.error(error.message);
    form.reset();
    qc.invalidateQueries({
      queryKey: ["admin-expenses"]
    });
    qc.invalidateQueries({
      queryKey: ["expenses"]
    });
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("form", { onSubmit: create, className: "rounded-xl border border-border bg-card p-5 grid sm:grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Description" }),
        /* @__PURE__ */ jsx(Input, { name: "description", required: true, className: "h-11" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Amount (₹)" }),
        /* @__PURE__ */ jsx(Input, { name: "amount", type: "number", step: "0.01", required: true, className: "h-11" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Category" }),
        /* @__PURE__ */ jsx(Input, { name: "category", className: "h-11" })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "sm:col-span-3 h-11", children: "Add expense" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 space-y-2", children: data?.map((e) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: e.description }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: e.category })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "font-display text-lg text-destructive", children: [
        "₹",
        Number(e.amount).toLocaleString("en-IN")
      ] })
    ] }, e.id)) })
  ] });
}
function SupportTab() {
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-support"],
    queryFn: async () => (await supabase.from("support_requests").select("*, profiles(full_name, phone)").order("created_at", {
      ascending: false
    })).data ?? []
  });
  const resolve = async (id) => {
    await supabase.from("support_requests").update({
      status: "resolved"
    }).eq("id", id);
    qc.invalidateQueries({
      queryKey: ["admin-support"]
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    data?.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No requests yet." }),
    data?.map((r) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
            r.subject,
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-xs ml-2 capitalize text-muted-foreground", children: [
              "[",
              r.category,
              "]"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "From: ",
            r.profiles?.full_name,
            " · ",
            r.profiles?.phone ?? "no phone"
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-sm capitalize", children: r.status })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: r.message }),
      r.status !== "resolved" && /* @__PURE__ */ jsx(Button, { onClick: () => resolve(r.id), variant: "outline", className: "mt-3", children: "Mark resolved" })
    ] }, r.id))
  ] });
}
export {
  Admin as component
};
