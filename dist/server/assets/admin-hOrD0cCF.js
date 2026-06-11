import { jsx, jsxs } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { c as createSsrRpc } from "./createSsrRpc-CE7SUKBh.js";
import { a as requireAdmin } from "./middleware-ClELS4qx.js";
import { c as createServerFn } from "./server-DsnJAsmI.js";
import { c as cn, u as useAuth, B as Button } from "./router-Dm0y2l4O.js";
import { I as Input } from "./input-BBbtggdb.js";
import { L as Label } from "./label-Cl7w1jiJ.js";
import { T as Textarea } from "./textarea-DY6AKQ66.js";
import * as React from "react";
import { useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-K70EzlTo.js";
import { toast } from "sonner";
import { format } from "date-fns";
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
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
import "firebase/auth";
import "firebase/app";
import "lucide-react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
const adminListMembers = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("723462ba637fa9a23d146986de338ec29ea06959725eaa4830b633bef075a2c0"));
const adminSetApproved = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("f80659a73751ebe7d04281a87f2f81f2bd5ef623a0fc426d8c876685328309eb"));
const adminListEvents = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("7a3225d66cddcae21d467888a23a4528fa85dd5a98749511d8c12ba896128b24"));
const adminCreateEvent = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("82f5cb86f35bd9178a9443e3554cebbe7004025c1adfe674ae323573312dd9b0"));
const adminDeleteEvent = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("f2caf8b24de957da6e25136743bf9dbde0f9be442974708ae907776e3f70c0b2"));
const adminListAnnouncements = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("abbd89f6fc101c9170ede0022a5ab4e6213a064bf7b28b7a70418e2b65dae7dd"));
const adminCreateAnnouncement = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("142a3fbf7b6f1ed14faef1e10f07896028aff765190abb08643bb78b00bf49a2"));
const adminDeleteAnnouncement = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("58d13b952375517eb870ded588f0ef84eb561f293212c25c9a2da841e9473471"));
const adminListDonations = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("1a7d7c65412cdca16eb0de2a11e593b822c23a9389d2262d883f4bc87205f8e0"));
const adminCreateDonation = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("7fca82a78e7d10055176dfaa23ed9cd3772f61e8de62163d7417073db2b883fb"));
const adminListExpenses = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("9e3244a06d76ac1db210e3898f660fd60c95392e7c26c94bfcf1223eea278ffd"));
const adminCreateExpense = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("5dbd2849812ad432b79463e1b89a40a82d64e1b06c0d2a385851fdc94292d655"));
const adminListSupport = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("d72c5c06d2bc3f5b12e7b288633d2aa9af2bba3381b5fe173823cad877d7b23b"));
const adminResolveSupport = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("113d6f5745a16c6fb7fbb95bfcfb5f0ad98fbf61ed247242c7e006aad734c2e6"));
const Tabs = TabsPrimitive.Root;
const TabsList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.List,
  {
    ref,
    className: cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props
  }
));
TabsList.displayName = TabsPrimitive.List.displayName;
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Trigger,
  {
    ref,
    className: cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
const TabsContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Content,
  {
    ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props
  }
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
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
    queryFn: () => adminListMembers()
  });
  const toggle = async (id, approved) => {
    try {
      await adminSetApproved({
        data: {
          id,
          approved
        }
      });
      toast.success(approved ? "Approved" : "Revoked");
      qc.invalidateQueries({
        queryKey: ["admin-members"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
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
    queryFn: () => adminListEvents()
  });
  const create = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await adminCreateEvent({
        data: {
          title: String(fd.get("title")),
          description: String(fd.get("description") || ""),
          location: String(fd.get("location") || ""),
          event_date: new Date(String(fd.get("event_date"))).toISOString()
        }
      });
      form.reset();
      toast.success("Event created");
      qc.invalidateQueries({
        queryKey: ["admin-events"]
      });
      qc.invalidateQueries({
        queryKey: ["events"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const del = async (id) => {
    await adminDeleteEvent({
      data: {
        id
      }
    });
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
    queryFn: () => adminListAnnouncements()
  });
  const create = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await adminCreateAnnouncement({
        data: {
          kind,
          title: String(fd.get("title")),
          body: String(fd.get("body") || "")
        }
      });
      form.reset();
      qc.invalidateQueries({
        queryKey: ["admin-announcements"]
      });
      qc.invalidateQueries({
        queryKey: ["announcements"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const del = async (id) => {
    await adminDeleteAnnouncement({
      data: {
        id
      }
    });
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
    queryFn: () => adminListDonations()
  });
  const create = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await adminCreateDonation({
        data: {
          donor_name: String(fd.get("donor_name")),
          amount: Number(fd.get("amount")),
          purpose: String(fd.get("purpose") || "")
        }
      });
      form.reset();
      qc.invalidateQueries({
        queryKey: ["admin-donations"]
      });
      qc.invalidateQueries({
        queryKey: ["donations"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
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
    queryFn: () => adminListExpenses()
  });
  const create = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await adminCreateExpense({
        data: {
          description: String(fd.get("description")),
          amount: Number(fd.get("amount")),
          category: String(fd.get("category") || "")
        }
      });
      form.reset();
      qc.invalidateQueries({
        queryKey: ["admin-expenses"]
      });
      qc.invalidateQueries({
        queryKey: ["expenses"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
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
    queryFn: () => adminListSupport()
  });
  const resolve = async (id) => {
    await adminResolveSupport({
      data: {
        id
      }
    });
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
