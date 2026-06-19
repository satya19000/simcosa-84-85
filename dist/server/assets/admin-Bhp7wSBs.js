import { jsx, jsxs } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { c as createSsrRpc } from "./createSsrRpc-DMgyZxXN.js";
import { b as requireAdmin } from "./middleware-CxRhXho4.js";
import { c as createServerFn } from "./server-BjolCwuX.js";
import { c as cn, u as useAuth, B as Button } from "./router-Bg3xvDD5.js";
import { I as Input } from "./input-CH64Bp8O.js";
import { L as Label } from "./label-DQRLhQ-R.js";
import { T as Textarea } from "./textarea-CNKd965y.js";
import * as React from "react";
import { useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-9moeX29d.js";
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
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("f80659a73751ebe7d04281a87f2f81f2bd5ef623a0fc426d8c876685328309eb"));
const adminApproveMember = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("c3bfe3a2c096ba26f815ef6a60a40d11dd40e783f0724c9d46c49d60b5f8c11c"));
const adminRejectMember = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("082af6fd188e6980fd70c85137ee735c7be7609c7d1ef620ceaf681f60e7e6d7"));
const adminMarkNeedsClarification = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("80b4e7e75233e7d4dda47d7ca8ddb91e40ba48a371055282e64e9505dffad743"));
const adminDeleteMember = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("91d2db02a8ed0bba0d95f0aeec58a5f16f944e7dc3bec7869e59b8c0a2425a5e"));
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("63d780fa105295476f24c9c2d3c6854052558ff652953184f0cd511c8a3fd20f"));
const adminAddMember = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("355c4dd76ac358bb48a8c6612b77e35c12200da079e0f804bbf0b7aa390db15a"));
const adminImportMembers = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("f2f1d73450c75fe616ce151985c651bf867749190fc8631a984145afda6f2dca"));
const adminListAdmins = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("4e5184038c95b9b4be4d8017fa92ccb1a2349a33c1868ee58f0926ec7703fe71"));
const adminPromoteToAdmin = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("1464523d4f52a12c9ac7f98dd7c201ac82c0cbbf561fcd35919c29ee1ca6e3e1"));
const adminAddAdminByEmail = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("92937af1bb33b1ff012316154c953adc2659a5bc7004a69a2e8d3b84b5ef1675"));
const adminDemoteAdmin = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("b532af46b30b817c147fe52eef03bcf074cd63c53edbd132b514d8626fc89a39"));
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
const adminListBlogs = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("b3475189735a5d0577d4b5cd2a9cdd4c8691cca4bc4dbbff9a1e5a110e87d4c3"));
const adminDeleteBlog = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("7e82e53e8f34aa823898e00db77bd962618e9c2f9c206e5238d43ff48e2fdb62"));
const adminListGallery = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("0ce3d98f5711328660c7d28527ee34ab887eea0ab1aa2ed0b6c6c24a156c3051"));
const adminDeleteGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("8768c7aebfc80c8128938a9e719cf96eef7b3aa3c4b05da5e14bd5fbdc9d29c1"));
const adminListMemories = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("359b2c1e148fe803d9a93be4df51b0d7de21e435eab157368113289fc72b0f55"));
const adminDeleteMemory = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("15bd09a4335e8cf086e8a324bea31db008b60dee7d4c1522d56fac28c3c1de36"));
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
    user,
    isAdmin,
    loading
  } = useAuth();
  if (loading) return /* @__PURE__ */ jsx("div", { className: "px-4 py-20 text-center", children: "Loading…" });
  if (!user) {
    if (typeof window !== "undefined") window.location.replace("/auth");
    return /* @__PURE__ */ jsx("div", { className: "px-4 py-20 text-center", children: "Redirecting to login…" });
  }
  if (!isAdmin) return /* @__PURE__ */ jsxs("div", { className: "px-4 py-20 text-center", children: [
    /* @__PURE__ */ jsx("h2", { children: "Access Denied" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "You don't have admin access." })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 py-10", children: [
    /* @__PURE__ */ jsx("h1", { children: "Admin Dashboard" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "Manage members, events, announcements, finances and requests." }),
    /* @__PURE__ */ jsx(AddMembersPanel, {}),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "pending", className: "mt-8", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "flex flex-wrap h-auto justify-start", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "pending", children: "Pending Members" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "approved", children: "Approved Members" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "rejected", children: "Rejected Members" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "admins", children: "Admins" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "blogs", children: "Blogs" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "gallery", children: "Gallery" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "memories", children: "Memories" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "events", children: "Events" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "announcements", children: "Announcements" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "donations", children: "Donations" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "expenses", children: "Expenses" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "support", children: "Support" })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "pending", className: "mt-6", children: /* @__PURE__ */ jsx(PendingMembersTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "approved", className: "mt-6", children: /* @__PURE__ */ jsx(ApprovedMembersTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "rejected", className: "mt-6", children: /* @__PURE__ */ jsx(RejectedMembersTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "admins", className: "mt-6", children: /* @__PURE__ */ jsx(AdminsTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "blogs", className: "mt-6", children: /* @__PURE__ */ jsx(BlogsTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "gallery", className: "mt-6", children: /* @__PURE__ */ jsx(GalleryTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "memories", className: "mt-6", children: /* @__PURE__ */ jsx(MemoriesTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "events", className: "mt-6", children: /* @__PURE__ */ jsx(EventsTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "announcements", className: "mt-6", children: /* @__PURE__ */ jsx(AnnouncementsTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "donations", className: "mt-6", children: /* @__PURE__ */ jsx(DonationsTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "expenses", className: "mt-6", children: /* @__PURE__ */ jsx(ExpensesTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "support", className: "mt-6", children: /* @__PURE__ */ jsx(SupportTab, {}) })
    ] })
  ] });
}
function useAdminMembers() {
  return useQuery({
    queryKey: ["admin-members"],
    queryFn: () => adminListMembers()
  });
}
function parseCsv(text) {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const parseLine = (line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') inQuotes = false;
        else cur += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        cells.push(cur);
        cur = "";
      } else cur += ch;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };
  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row = {};
    header.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
}
function AddMembersPanel() {
  const qc = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [addingManual, setAddingManual] = useState(false);
  const [importStatus, setImportStatus] = useState("pending");
  const [manualStatus, setManualStatus] = useState("pending");
  const invalidate = () => qc.invalidateQueries({
    queryKey: ["admin-members"]
  });
  const addManual = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setAddingManual(true);
    try {
      await adminAddMember({
        data: {
          full_name: String(fd.get("full_name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          location: String(fd.get("location") || ""),
          profession: String(fd.get("profession") || ""),
          approval_status: manualStatus
        }
      });
      form.reset();
      setManualStatus("pending");
      toast.success("Member added");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingManual(false);
    }
  };
  const onCsvSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      const rows = parsed.map((r) => ({
        full_name: r.name || r.full_name || "",
        email: r.email || "",
        phone: r.mobile || r.phone || "",
        location: r.city || r.location || "",
        profession: r.profession || "",
        approval_status: r.approval_status?.trim().toLowerCase() || void 0
      }));
      if (rows.length === 0) {
        toast.error("No rows found. Expected columns: name, email, mobile, city, profession, approval_status");
        return;
      }
      const res = await adminImportMembers({
        data: {
          rows,
          approval_status: importStatus
        }
      });
      toast.success(`Imported ${res.imported} member(s)${res.skipped ? `, skipped ${res.skipped}` : ""}`);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl border border-border bg-card p-5 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Add Member Manually" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: addManual, className: "mt-3 grid sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Full name" }),
          /* @__PURE__ */ jsx(Input, { name: "full_name", required: true, className: "h-11" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Email" }),
          /* @__PURE__ */ jsx(Input, { name: "email", type: "email", required: true, className: "h-11" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Mobile" }),
          /* @__PURE__ */ jsx(Input, { name: "phone", className: "h-11" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "City" }),
          /* @__PURE__ */ jsx(Input, { name: "location", className: "h-11" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Profession" }),
          /* @__PURE__ */ jsx(Input, { name: "profession", className: "h-11" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Approval status" }),
          /* @__PURE__ */ jsxs(Select, { value: manualStatus, onValueChange: (v) => setManualStatus(v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-11", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Pending" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "approved", children: "Approved" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: addingManual, className: "sm:col-span-2 h-11", children: addingManual ? "Adding…" : "Add member" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-t border-border pt-5", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Bulk Import (CSV)" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Columns: name, email, mobile, city, profession, approval_status (optional, defaults to the dropdown below if missing). Existing emails are updated, not duplicated." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-3 items-center", children: [
        /* @__PURE__ */ jsxs(Select, { value: importStatus, onValueChange: (v) => setImportStatus(v), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-11 w-44", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Import as Pending" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "approved", children: "Import as Approved" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Input, { type: "file", accept: ".csv,text/csv", onChange: onCsvSelected, disabled: importing, className: "h-11 max-w-xs" }),
        importing && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Importing…" })
      ] })
    ] })
  ] });
}
function PendingMembersTab() {
  const qc = useQueryClient();
  const {
    data
  } = useAdminMembers();
  const [reasonFor, setReasonFor] = useState(null);
  const [reason, setReason] = useState("");
  const pending = data?.filter((m) => m.approval_status === "pending" || m.approval_status === "needs_clarification") ?? [];
  const invalidate = () => qc.invalidateQueries({
    queryKey: ["admin-members"]
  });
  const approve = async (id) => {
    try {
      await adminApproveMember({
        data: {
          id
        }
      });
      toast.success("Member approved!");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const reject = async (id) => {
    try {
      await adminRejectMember({
        data: {
          id,
          reason
        }
      });
      toast.success("Member rejected");
      setReasonFor(null);
      setReason("");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const clarify = async (id) => {
    try {
      await adminMarkNeedsClarification({
        data: {
          id,
          reason
        }
      });
      toast.success("Marked as needs clarification");
      setReasonFor(null);
      setReason("");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const remove = async (id) => {
    try {
      await adminDeleteMember({
        data: {
          id
        }
      });
      toast.success("Signup request deleted");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  if (pending.length === 0) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No pending members. All caught up! 🎉" });
  }
  return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: pending.map((m) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-between gap-3 items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 items-center", children: [
        m.photo_url && /* @__PURE__ */ jsx("img", { src: m.photo_url, alt: m.full_name ?? "", className: "h-12 w-12 rounded-full object-cover" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
            m.full_name,
            " ",
            m.approval_status === "needs_clarification" && /* @__PURE__ */ jsx("span", { className: "text-xs text-amber-600 ml-1", children: "[needs clarification]" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: m.email }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            m.phone || m.whatsapp || "no phone",
            " · ",
            m.location || "no city",
            " · ",
            m.profession || "no profession"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Signed up ",
            format(new Date(m.created_at), "PPP")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(Button, { onClick: () => approve(m.id), className: "h-10", children: "Approve" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => setReasonFor(reasonFor === m.id ? null : m.id), variant: "outline", className: "h-10", children: "Reject" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => remove(m.id), variant: "ghost", className: "h-10 text-destructive", children: "Delete" })
      ] })
    ] }),
    reasonFor === m.id && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2 items-center", children: [
      /* @__PURE__ */ jsx(Input, { value: reason, onChange: (e) => setReason(e.target.value), placeholder: "Reason (optional)", className: "h-10 max-w-xs" }),
      /* @__PURE__ */ jsx(Button, { onClick: () => reject(m.id), variant: "destructive", className: "h-10", children: "Confirm reject" }),
      /* @__PURE__ */ jsx(Button, { onClick: () => clarify(m.id), variant: "outline", className: "h-10", children: "Ask for clarification" })
    ] })
  ] }, m.id)) });
}
function ApprovedMembersTab() {
  const qc = useQueryClient();
  const {
    data
  } = useAdminMembers();
  const [search, setSearch] = useState("");
  const {
    data: adminData
  } = useQuery({
    queryKey: ["admin-admins"],
    queryFn: () => adminListAdmins()
  });
  const approved = (data?.filter((m) => m.approval_status === "approved") ?? []).filter((m) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (m.full_name ?? "").toLowerCase().includes(q) || (m.location ?? "").toLowerCase().includes(q) || (m.profession ?? "").toLowerCase().includes(q);
  });
  const adminIds = new Set((adminData ?? []).map((a) => a.id));
  const invalidate = () => {
    qc.invalidateQueries({
      queryKey: ["admin-members"]
    });
    qc.invalidateQueries({
      queryKey: ["admin-admins"]
    });
  };
  const promote = async (id) => {
    try {
      await adminPromoteToAdmin({
        data: {
          id
        }
      });
      toast.success("Promoted to admin");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const disable = async (id) => {
    try {
      await adminRejectMember({
        data: {
          id,
          reason: "Disabled by admin"
        }
      });
      toast.success("Member disabled");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by name, city or profession…", className: "h-11 mb-4 max-w-md" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      approved.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No approved members found." }),
      approved.map((m) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
            m.full_name,
            " ",
            adminIds.has(m.id) && /* @__PURE__ */ jsx("span", { className: "text-xs text-gold ml-2", children: "★ Admin" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: m.email }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            m.location || "—",
            " · ",
            m.profession || "—"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          !adminIds.has(m.id) && /* @__PURE__ */ jsx(Button, { onClick: () => promote(m.id), variant: "outline", className: "h-10", children: "Make Admin" }),
          /* @__PURE__ */ jsx(Button, { onClick: () => disable(m.id), variant: "outline", className: "h-10 text-destructive", children: "Disable" })
        ] })
      ] }, m.id))
    ] })
  ] });
}
function RejectedMembersTab() {
  const qc = useQueryClient();
  const {
    data
  } = useAdminMembers();
  const rejected = data?.filter((m) => m.approval_status === "rejected") ?? [];
  const reconsider = async (id) => {
    try {
      await adminApproveMember({
        data: {
          id
        }
      });
      toast.success("Member approved");
      qc.invalidateQueries({
        queryKey: ["admin-members"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  if (rejected.length === 0) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No rejected members." });
  }
  return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: rejected.map((m) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "font-semibold", children: m.full_name }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: m.email }),
      m.rejection_reason && /* @__PURE__ */ jsxs("p", { className: "text-sm text-destructive mt-1", children: [
        "Reason: ",
        m.rejection_reason
      ] })
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: () => reconsider(m.id), variant: "outline", className: "h-10", children: "Reconsider & approve" })
  ] }, m.id)) });
}
function AdminsTab() {
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-admins"],
    queryFn: () => adminListAdmins()
  });
  const [email, setEmail] = useState("");
  const invalidate = () => qc.invalidateQueries({
    queryKey: ["admin-admins"]
  });
  const add = async (e) => {
    e.preventDefault();
    try {
      await adminAddAdminByEmail({
        data: {
          email
        }
      });
      toast.success("Admin added");
      setEmail("");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const remove = async (id) => {
    try {
      await adminDemoteAdmin({
        data: {
          id
        }
      });
      toast.success("Admin removed");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("form", { onSubmit: add, className: "flex flex-wrap gap-2 mb-6", children: [
      /* @__PURE__ */ jsx(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "member@email.com", required: true, className: "h-11 max-w-xs" }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "h-11", children: "Add admin by email" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data?.map((a) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: a.full_name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: a.email })
      ] }),
      /* @__PURE__ */ jsx(Button, { onClick: () => remove(a.id), variant: "outline", className: "h-10 text-destructive", children: "Remove admin" })
    ] }, a.id)) })
  ] });
}
function BlogsTab() {
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: () => adminListBlogs()
  });
  const del = async (id) => {
    try {
      await adminDeleteBlog({
        data: {
          id
        }
      });
      toast.success("Blog deleted");
      qc.invalidateQueries({
        queryKey: ["admin-blogs"]
      });
      qc.invalidateQueries({
        queryKey: ["blogs"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  if (data?.length === 0) return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No blogs yet." });
  return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data?.map((b) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
        b.title,
        " ",
        b.is_featured && /* @__PURE__ */ jsx("span", { className: "text-xs text-gold ml-1", children: "★ featured" }),
        " ",
        !b.is_published && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground ml-1", children: "[unpublished]" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "By ",
        b.profiles?.full_name ?? "Unknown",
        " · ",
        format(new Date(b.created_at), "PPP")
      ] })
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: () => del(b.id), variant: "outline", className: "h-10 text-destructive", children: "Delete" })
  ] }, b.id)) });
}
function GalleryTab() {
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => adminListGallery()
  });
  const del = async (id) => {
    try {
      await adminDeleteGalleryItem({
        data: {
          id
        }
      });
      toast.success("Item deleted");
      qc.invalidateQueries({
        queryKey: ["admin-gallery"]
      });
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  if (data?.length === 0) return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No gallery items yet." });
  return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data?.map((g) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
        g.title || g.caption || g.storage_path,
        " ",
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground ml-1 capitalize", children: [
          "[",
          g.media_type,
          "]"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "By ",
        g.profiles?.full_name ?? "Unknown",
        " · ",
        format(new Date(g.created_at), "PPP")
      ] })
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: () => del(g.id), variant: "outline", className: "h-10 text-destructive", children: "Delete" })
  ] }, g.id)) });
}
function MemoriesTab() {
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-memories"],
    queryFn: () => adminListMemories()
  });
  const del = async (id) => {
    try {
      await adminDeleteMemory({
        data: {
          id
        }
      });
      toast.success("Memory deleted");
      qc.invalidateQueries({
        queryKey: ["admin-memories"]
      });
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  if (data?.length === 0) return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No memories yet." });
  return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data?.map((m) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "font-semibold", children: m.title || "Untitled" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-1", children: m.body }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "By ",
        m.profiles?.full_name ?? "Unknown",
        " · ",
        format(new Date(m.created_at), "PPP")
      ] })
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: () => del(m.id), variant: "outline", className: "h-10 text-destructive", children: "Delete" })
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
