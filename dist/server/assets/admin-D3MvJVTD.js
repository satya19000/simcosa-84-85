import { jsx, jsxs } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { c as createSsrRpc, a as cn, u as useAuth, B as Button } from "./router-CnAgKkC_.js";
import { a as requireAdmin, c as requireOwner } from "./middleware-DS1paCMp.js";
import { c as createServerFn } from "./server-DxzLTJPN.js";
import { u as useUploadQueue, D as DropzoneUpload, f as formatFileSize, c as compressImage, a as uploadToFirebaseStorageResumable, d as deleteFromFirebaseStorage } from "./useUploadQueue-CmzpWIBt.js";
import { r as replaceGalleryItemFile, u as uploadGalleryItem } from "./gallery-yLtpzdbN.js";
import { p as postMemory, a as addMemoryImages } from "./memories-TUcLyhll.js";
import { I as Input } from "./input-Elxupjq-.js";
import { L as Label } from "./label-DS-7kKQq.js";
import { T as Textarea } from "./textarea-Ddwbwcsp.js";
import * as React from "react";
import { useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BNQ-kPDL.js";
import { toast } from "sonner";
import { format } from "date-fns";
import { ChevronsUp, ArrowUp, ArrowDown, ChevronsDown } from "lucide-react";
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
import "firebase/storage";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
const adminGetMediaStats = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("06c6bfc964b46ea4d7471e20ad111b755c9ea8f01827ee99ef2e4a0122039da5"));
const adminListMedia = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("86d83da26af885f7cde64ade422bade184331af0202e079247dfb2d821848eb2"));
const adminDeleteMediaItem = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("20ab4de2c70843cbfb81148c5e963e7bb777821a78676cdbb65c22607cc1fdb4"));
const ownerExportMembers = createServerFn({
  method: "GET"
}).middleware([requireOwner]).handler(createSsrRpc("a37bbb59df565528442e4fd811fab24f95cc73f850505ed328116174d606c697"));
const ownerExportMediaList = createServerFn({
  method: "GET"
}).middleware([requireOwner]).handler(createSsrRpc("077a1084a869d2d924a5b90e4cfeb9ec557666f93a1e105cafcfe2f772f60812"));
const ownerExportFullBackup = createServerFn({
  method: "GET"
}).middleware([requireOwner]).handler(createSsrRpc("823ded122bc2bbcabc674f42fdb452b2c4af21d6a346b0c5c3a3b2188d7d4286"));
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
const adminEditMember = createServerFn({
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
const adminEditEvent = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("31bde2814aa706dc87e59e5796eb96296cd1b9b8cd53b725218efc27c9ce74f9"));
const adminDeleteEvent = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("f2caf8b24de957da6e25136743bf9dbde0f9be442974708ae907776e3f70c0b2"));
const adminToggleEventPublished = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("43bb1b2eb266a0be6a5cffc68cd272e450fee8a245b3fb23726d463417f5b9fa"));
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
const adminReorderGallery = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("a553de435f7206474ae1eee729506b39ba7c4d923a1be2069e453139db5bc68d"));
const adminListMemories = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("359b2c1e148fe803d9a93be4df51b0d7de21e435eab157368113289fc72b0f55"));
const adminEditMemoryAuthor = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("868909a35faf0ae1a8048570274ae302287533126b7d78e38915e01be0eaa980"));
const adminDeleteMemory = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("15bd09a4335e8cf086e8a324bea31db008b60dee7d4c1522d56fac28c3c1de36"));
const adminFindDuplicateMemories = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("94c610dc6dc8a18b0614c96496a75b481dbd4fcbc7615ea6ddffd12ac6c0d884"));
const adminMergeMemories = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("bfcff4d5245e6629dcb6468f93e302b08157b47db246d579fb46f1ce43c9d241"));
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
    isOwner,
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
        /* @__PURE__ */ jsx(TabsTrigger, { value: "support", children: "Support" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "media", children: "Media" }),
        isOwner && /* @__PURE__ */ jsx(TabsTrigger, { value: "backup", children: "Backup" })
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
      /* @__PURE__ */ jsx(TabsContent, { value: "support", className: "mt-6", children: /* @__PURE__ */ jsx(SupportTab, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "media", className: "mt-6", children: /* @__PURE__ */ jsx(MediaTab, {}) }),
      isOwner && /* @__PURE__ */ jsx(TabsContent, { value: "backup", className: "mt-6", children: /* @__PURE__ */ jsx(BackupTab, {}) })
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
function EditMemberPanel({
  member,
  onClose,
  onSaved
}) {
  const [form, setForm] = useState({
    full_name: member.full_name ?? "",
    phone: member.phone ?? "",
    whatsapp: member.whatsapp ?? "",
    location: member.location ?? "",
    profession: member.profession ?? "",
    bio: member.bio ?? "",
    spouse_name: member.spouse_name ?? "",
    clinic_or_hospital: member.clinic_or_hospital ?? "",
    country_state: member.country_state ?? ""
  });
  const [saving, setSaving] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      await adminEditMember({
        data: {
          id: member.id,
          ...form
        }
      });
      toast.success("Member updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6", children: [
    /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-lg mb-4", children: [
      "Edit Member — ",
      member.full_name
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: save, className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Full name *" }),
        /* @__PURE__ */ jsx(Input, { value: form.full_name, onChange: (e) => setForm((f) => ({
          ...f,
          full_name: e.target.value
        })), required: true, className: "h-11 mt-1" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Mobile" }),
          /* @__PURE__ */ jsx(Input, { value: form.phone, onChange: (e) => setForm((f) => ({
            ...f,
            phone: e.target.value
          })), className: "h-11 mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "WhatsApp" }),
          /* @__PURE__ */ jsx(Input, { value: form.whatsapp, onChange: (e) => setForm((f) => ({
            ...f,
            whatsapp: e.target.value
          })), className: "h-11 mt-1" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "City / Location" }),
          /* @__PURE__ */ jsx(Input, { value: form.location, onChange: (e) => setForm((f) => ({
            ...f,
            location: e.target.value
          })), className: "h-11 mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Profession" }),
          /* @__PURE__ */ jsx(Input, { value: form.profession, onChange: (e) => setForm((f) => ({
            ...f,
            profession: e.target.value
          })), className: "h-11 mt-1" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Country / State" }),
        /* @__PURE__ */ jsx(Input, { value: form.country_state, onChange: (e) => setForm((f) => ({
          ...f,
          country_state: e.target.value
        })), className: "h-11 mt-1" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Spouse name" }),
          /* @__PURE__ */ jsx(Input, { value: form.spouse_name, onChange: (e) => setForm((f) => ({
            ...f,
            spouse_name: e.target.value
          })), className: "h-11 mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Clinic / Hospital" }),
          /* @__PURE__ */ jsx(Input, { value: form.clinic_or_hospital, onChange: (e) => setForm((f) => ({
            ...f,
            clinic_or_hospital: e.target.value
          })), className: "h-11 mt-1" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Bio" }),
        /* @__PURE__ */ jsx(Textarea, { value: form.bio, onChange: (e) => setForm((f) => ({
          ...f,
          bio: e.target.value
        })), rows: 3, className: "mt-1" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, className: "h-10", children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: saving, className: "h-10", children: saving ? "Saving…" : "Save changes" })
      ] })
    ] })
  ] }) });
}
function ApprovedMembersTab() {
  const qc = useQueryClient();
  const {
    data
  } = useAdminMembers();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
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
    if (!confirm("Disable this member?")) return;
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
    editing && /* @__PURE__ */ jsx(EditMemberPanel, { member: editing, onClose: () => setEditing(null), onSaved: invalidate }),
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
          /* @__PURE__ */ jsx(Button, { onClick: () => setEditing(m), variant: "outline", className: "h-10", children: "Edit" }),
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
    if (!confirm("Are you sure you want to delete this item?")) return;
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
const MAX_ADMIN_UPLOAD_BYTES = 15 * 1024 * 1024;
function normalizeFileName(value) {
  return value.trim().toLowerCase();
}
function GalleryTab() {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => adminListGallery()
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const uploadQueue = useUploadQueue();
  const [replacingId, setReplacingId] = useState(null);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const bulkQueue = useUploadQueue();
  const [bulkSummary, setBulkSummary] = useState(null);
  const [unmatchedUploading, setUnmatchedUploading] = useState(false);
  const unmatchedQueue = useUploadQueue();
  const replaceFile = async (id, file) => {
    if (!user) return;
    setReplacingId(id);
    try {
      const compressed = file.type.startsWith("image/") ? await compressImage(file) : file;
      const {
        url,
        path
      } = await uploadToFirebaseStorageResumable(compressed, "gallery", user.id);
      await replaceGalleryItemFile({
        data: {
          id,
          url,
          storagePath: path,
          fileName: compressed.name,
          mimeType: compressed.type,
          fileSize: compressed.size
        }
      });
      toast.success("File replaced");
      qc.invalidateQueries({
        queryKey: ["admin-gallery"]
      });
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Replace failed");
    } finally {
      setReplacingId(null);
    }
  };
  const del = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await adminDeleteGalleryItem({
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
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) => console.error("[admin/gallery] failed to delete storage object:", err));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const moveGalleryItem = async (id, kind) => {
    if (!data) return;
    const ids = data.map((g) => g.id);
    const idx = ids.indexOf(id);
    if (idx === -1) return;
    let newIdx;
    if (kind === "up") newIdx = idx - 1;
    else if (kind === "down") newIdx = idx + 1;
    else if (kind === "top") newIdx = 0;
    else newIdx = ids.length - 1;
    if (newIdx < 0 || newIdx >= ids.length || newIdx === idx) return;
    const reordered = [...ids];
    reordered.splice(idx, 1);
    reordered.splice(newIdx, 0, id);
    try {
      await adminReorderGallery({
        data: {
          orderedItemIds: reordered
        }
      });
      qc.invalidateQueries({
        queryKey: ["admin-gallery"]
      });
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
      toast.success("Photo order updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update order");
    }
  };
  const upload = async () => {
    if (files.length === 0 || !user) return;
    for (const file of files) {
      if (file.size > MAX_ADMIN_UPLOAD_BYTES) {
        toast.error(`"${file.name}" is too large. Please upload a smaller image or compressed version.`);
        return;
      }
    }
    setUploading(true);
    uploadQueue.init(files);
    let succeeded = 0;
    let failed = 0;
    for (const original of files) {
      let file = original;
      uploadQueue.setStatus(original, "uploading", 0);
      try {
        if (file.type.startsWith("image/")) {
          file = await compressImage(file);
        }
        const {
          url,
          path
        } = await uploadToFirebaseStorageResumable(file, "gallery", user.id, (pct) => uploadQueue.setPct(original, pct));
        await uploadGalleryItem({
          data: {
            url,
            storagePath: path,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size
          }
        });
        uploadQueue.setStatus(original, "completed", 100);
        succeeded++;
      } catch (err) {
        uploadQueue.setStatus(original, "error");
        failed++;
        console.error("[admin/gallery] upload failed:", err);
      }
    }
    if (failed === 0) {
      toast.success("Upload completed successfully.");
      setFiles([]);
      uploadQueue.reset();
    } else {
      toast.error(`Upload failed. Please try again. (Uploaded: ${succeeded}, Failed: ${failed})`);
    }
    qc.invalidateQueries({
      queryKey: ["admin-gallery"]
    });
    qc.invalidateQueries({
      queryKey: ["gallery"]
    });
    setUploading(false);
  };
  const runBulkReplace = async () => {
    if (bulkFiles.length === 0 || !user || !data) return;
    setBulkRunning(true);
    bulkQueue.init(bulkFiles);
    const eligible = data.filter((g) => !g.file_url && !g.fb_storage_path);
    const usedRowIds = /* @__PURE__ */ new Set();
    const matches = [];
    const unmatched = [];
    for (const file of bulkFiles) {
      const row = eligible.find((g) => !usedRowIds.has(g.id) && normalizeFileName(g.storage_path) === normalizeFileName(file.name));
      if (row) {
        usedRowIds.add(row.id);
        matches.push({
          file,
          row
        });
      } else {
        unmatched.push(file);
        bulkQueue.setStatus(file, "error");
      }
    }
    let uploaded = 0;
    let failed = 0;
    for (const {
      file,
      row
    } of matches) {
      bulkQueue.setStatus(file, "uploading", 0);
      try {
        const compressed = file.type.startsWith("image/") ? await compressImage(file) : file;
        const {
          url,
          path
        } = await uploadToFirebaseStorageResumable(compressed, "gallery", user.id, (pct) => bulkQueue.setPct(file, pct));
        await replaceGalleryItemFile({
          data: {
            id: row.id,
            url,
            storagePath: path,
            fileName: compressed.name,
            mimeType: compressed.type,
            fileSize: compressed.size
          }
        });
        bulkQueue.setStatus(file, "completed", 100);
        uploaded++;
      } catch (err) {
        bulkQueue.setStatus(file, "error");
        failed++;
        console.error("[admin/gallery] bulk replace failed:", err);
      }
    }
    setBulkSummary({
      matched: matches.length,
      uploaded,
      failed,
      unmatched
    });
    if (uploaded > 0) {
      toast.success(`Bulk replace: ${uploaded} file(s) restored.`);
    }
    if (failed > 0) {
      toast.error(`Bulk replace: ${failed} file(s) failed to upload.`);
    }
    qc.invalidateQueries({
      queryKey: ["admin-gallery"]
    });
    qc.invalidateQueries({
      queryKey: ["gallery"]
    });
    setBulkRunning(false);
  };
  const uploadUnmatchedAsNew = async () => {
    const unmatched = bulkSummary?.unmatched ?? [];
    if (unmatched.length === 0 || !user) return;
    setUnmatchedUploading(true);
    unmatchedQueue.init(unmatched);
    let succeeded = 0;
    let failed = 0;
    for (const original of unmatched) {
      let file = original;
      unmatchedQueue.setStatus(original, "uploading", 0);
      try {
        if (file.type.startsWith("image/")) {
          file = await compressImage(file);
        }
        const {
          url,
          path
        } = await uploadToFirebaseStorageResumable(file, "gallery", user.id, (pct) => unmatchedQueue.setPct(original, pct));
        await uploadGalleryItem({
          data: {
            url,
            storagePath: path,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size
          }
        });
        unmatchedQueue.setStatus(original, "completed", 100);
        succeeded++;
      } catch (err) {
        unmatchedQueue.setStatus(original, "error");
        failed++;
        console.error("[admin/gallery] unmatched upload failed:", err);
      }
    }
    if (failed === 0) {
      toast.success("Unmatched files uploaded as new gallery items.");
      setBulkSummary((s) => s ? {
        ...s,
        unmatched: []
      } : s);
      setBulkFiles([]);
      bulkQueue.reset();
      unmatchedQueue.reset();
    } else {
      toast.error(`Some uploads failed. (Uploaded: ${succeeded}, Failed: ${failed})`);
    }
    qc.invalidateQueries({
      queryKey: ["admin-gallery"]
    });
    qc.invalidateQueries({
      queryKey: ["gallery"]
    });
    setUnmatchedUploading(false);
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-amber-200 bg-amber-50/60 p-5 mb-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-1", children: "Bulk Replace Missing Files" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-3", children: "Use this only for old missing photos. File names should match the old photo names." }),
      /* @__PURE__ */ jsx(DropzoneUpload, { files: bulkFiles, onFilesChange: setBulkFiles, accept: "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx", disabled: bulkRunning, progress: bulkQueue.progress, label: "Drag and drop the matching old photos here, or click to browse" }),
      bulkFiles.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-4 flex-wrap", children: [
        /* @__PURE__ */ jsx(Button, { onClick: runBulkReplace, disabled: bulkRunning, className: "h-11", children: bulkRunning ? "Replacing…" : `Replace from ${bulkFiles.length} file(s)` }),
        bulkRunning && /* @__PURE__ */ jsxs("span", { className: "text-sm text-amber-700 font-semibold", children: [
          "Processing ",
          Math.min(bulkQueue.completedCount + bulkQueue.failedCount + 1, bulkQueue.total),
          " of ",
          bulkQueue.total,
          " files… please wait"
        ] })
      ] }),
      bulkSummary && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-amber-200 bg-white p-3 text-sm space-y-2", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "Total selected: ",
          /* @__PURE__ */ jsx("strong", { children: bulkFiles.length }),
          " · Matched: ",
          /* @__PURE__ */ jsx("strong", { children: bulkSummary.matched }),
          " ·",
          " ",
          "Replaced: ",
          /* @__PURE__ */ jsx("strong", { className: "text-emerald-600", children: bulkSummary.uploaded }),
          " ·",
          " ",
          "Failed: ",
          /* @__PURE__ */ jsx("strong", { className: "text-destructive", children: bulkSummary.failed }),
          " ·",
          " ",
          "Unmatched: ",
          /* @__PURE__ */ jsx("strong", { children: bulkSummary.unmatched.length })
        ] }),
        bulkSummary.unmatched.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Unmatched files (no old gallery row found for this filename):" }),
          /* @__PURE__ */ jsx("ul", { className: "list-disc list-inside text-muted-foreground", children: bulkSummary.unmatched.map((f) => /* @__PURE__ */ jsx("li", { children: f.name }, f.name)) }),
          /* @__PURE__ */ jsx(Button, { onClick: uploadUnmatchedAsNew, disabled: unmatchedUploading, variant: "outline", className: "h-9 mt-2 text-sm", children: unmatchedUploading ? "Uploading…" : "Upload unmatched files as new gallery items" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-5 mb-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-3", children: "Upload photos/files" }),
      /* @__PURE__ */ jsx(DropzoneUpload, { files, onFilesChange: setFiles, accept: "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx", disabled: uploading, progress: uploadQueue.progress }),
      files.some((f) => f.type.startsWith("video/")) && /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-600 mt-1.5 font-medium", children: "Videos may take longer depending on file size and internet speed." }),
      files.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(Button, { onClick: upload, disabled: uploading, className: "h-11", children: uploading ? "Uploading…" : `Upload ${files.length} item(s)` }),
        uploading && /* @__PURE__ */ jsxs("span", { className: "text-sm text-amber-700 font-semibold", children: [
          "Uploading ",
          Math.min(uploadQueue.completedCount + uploadQueue.failedCount + 1, uploadQueue.total),
          " of ",
          uploadQueue.total,
          " files… please wait"
        ] })
      ] })
    ] }),
    data?.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No gallery items yet." }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data?.map((g, gi) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5 shrink-0", children: [
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Move to top", disabled: gi === 0, onClick: () => moveGalleryItem(g.id, "top"), className: "h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30", children: /* @__PURE__ */ jsx(ChevronsUp, { className: "h-3.5 w-3.5" }) }),
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Move up", disabled: gi === 0, onClick: () => moveGalleryItem(g.id, "up"), className: "h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30", children: /* @__PURE__ */ jsx(ArrowUp, { className: "h-3.5 w-3.5" }) }),
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Move down", disabled: gi === (data?.length ?? 0) - 1, onClick: () => moveGalleryItem(g.id, "down"), className: "h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30", children: /* @__PURE__ */ jsx(ArrowDown, { className: "h-3.5 w-3.5" }) }),
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Move to bottom", disabled: gi === (data?.length ?? 0) - 1, onClick: () => moveGalleryItem(g.id, "bottom"), className: "h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30", children: /* @__PURE__ */ jsx(ChevronsDown, { className: "h-3.5 w-3.5" }) })
        ] }),
        g.file_available && g.media_type === "image" ? /* @__PURE__ */ jsx("img", { src: g.file_url, alt: g.caption ?? g.title ?? "Photo", className: "h-14 w-14 rounded-lg object-cover shrink-0", loading: "lazy" }) : g.file_available ? /* @__PURE__ */ jsx("div", { className: "h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0", children: "Video" }) : /* @__PURE__ */ jsx("div", { className: "h-14 w-14 rounded-lg bg-destructive/10 flex items-center justify-center text-[10px] text-destructive text-center px-1 shrink-0", children: "File missing" }),
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
          ] }),
          !g.file_available && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive font-medium mt-0.5", children: "Old photo file missing. Please re-upload this image." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center h-10 px-3 rounded-md border border-border text-sm font-medium cursor-pointer hover:bg-accent", children: [
          replacingId === g.id ? "Uploading…" : "Replace file",
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*,video/*", className: "hidden", disabled: replacingId === g.id, onChange: (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) replaceFile(g.id, file);
          } })
        ] }),
        /* @__PURE__ */ jsx(Button, { onClick: () => del(g.id), variant: "outline", className: "h-10 text-destructive", children: "Delete" })
      ] })
    ] }, g.id)) })
  ] });
}
function MemoriesTab() {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["admin-memories"],
    queryFn: () => adminListMemories()
  });
  const [files, setFiles] = useState([]);
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [posting, setPosting] = useState(false);
  const uploadQueue = useUploadQueue();
  const [editingAuthorId, setEditingAuthorId] = useState(null);
  const [editingAuthorValue, setEditingAuthorValue] = useState("");
  const [savingAuthor, setSavingAuthor] = useState(false);
  const startEditAuthor = (id, current) => {
    setEditingAuthorId(id);
    setEditingAuthorValue(current ?? "");
  };
  const saveAuthor = async (id) => {
    setSavingAuthor(true);
    try {
      await adminEditMemoryAuthor({
        data: {
          id,
          authorName: editingAuthorValue || void 0
        }
      });
      toast.success("Author name updated");
      setEditingAuthorId(null);
      qc.invalidateQueries({
        queryKey: ["admin-memories"]
      });
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingAuthor(false);
    }
  };
  const del = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await adminDeleteMemory({
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
      for (const path of res.fbStoragePaths) {
        deleteFromFirebaseStorage(path).catch((err) => console.error("[admin/memories] failed to delete storage object:", err));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const post = async () => {
    if (!body.trim() || !user) return;
    const oversized = files.find((f) => f.size > MAX_ADMIN_UPLOAD_BYTES);
    if (oversized) {
      toast.error(`"${oversized.name}" is too large. Please upload a smaller image or compressed version.`);
      return;
    }
    setPosting(true);
    if (files.length > 0) uploadQueue.init(files);
    try {
      const {
        id: memoryId
      } = await postMemory({
        data: {
          body,
          authorName: authorName || void 0
        }
      });
      const uploadedImages = [];
      for (const original of files) {
        try {
          uploadQueue.setStatus(original, "uploading", 0);
          const compressed = await compressImage(original);
          const uploaded = await uploadToFirebaseStorageResumable(compressed, "memories", user.id, (pct) => uploadQueue.setPct(original, pct));
          uploadedImages.push({
            url: uploaded.url,
            storagePath: uploaded.path,
            fileName: compressed.name,
            mimeType: compressed.type,
            fileSize: compressed.size
          });
          uploadQueue.setStatus(original, "completed", 100);
        } catch (err) {
          uploadQueue.setStatus(original, "error");
          throw err;
        }
      }
      if (uploadedImages.length > 0) {
        await addMemoryImages({
          data: {
            memoryId,
            images: uploadedImages
          }
        });
      }
      setBody("");
      setAuthorName("");
      setFiles([]);
      uploadQueue.reset();
      toast.success("Upload completed successfully. Memory posted.");
      qc.invalidateQueries({
        queryKey: ["admin-memories"]
      });
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setPosting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-5 mb-6 space-y-3", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Post a memory with photo" }),
      /* @__PURE__ */ jsx(Textarea, { value: body, onChange: (e) => setBody(e.target.value), rows: 3, placeholder: "Share a memory…" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Posted on behalf of / Batchmate name (optional)" }),
        /* @__PURE__ */ jsx(Input, { value: authorName, onChange: (e) => setAuthorName(e.target.value), placeholder: "e.g. Dr. Srilatha", className: "h-11" })
      ] }),
      /* @__PURE__ */ jsx(DropzoneUpload, { files, onFilesChange: setFiles, accept: "image/*", multiple: true, disabled: posting, progress: uploadQueue.progress }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(Button, { onClick: post, disabled: posting || !body.trim(), className: "h-11", children: posting ? "Posting…" : "Post memory" }),
        posting && files.length > 0 && /* @__PURE__ */ jsx("span", { className: "text-sm text-amber-700 font-semibold", children: "Uploading… please wait" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(MergeDuplicateMemories, {}),
    data?.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No memories yet." }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data?.map((m) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: m.title || "Untitled" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-1", children: m.body }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Shown as ",
          m.display_name,
          " · uploaded by ",
          m.profiles?.full_name ?? "Unknown",
          " · ",
          format(new Date(m.created_at), "PPP")
        ] }),
        editingAuthorId === m.id ? /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx(Input, { value: editingAuthorValue, onChange: (e) => setEditingAuthorValue(e.target.value), placeholder: "Leave blank to show uploader's profile name", className: "h-9 max-w-xs" }),
          /* @__PURE__ */ jsx(Button, { onClick: () => saveAuthor(m.id), disabled: savingAuthor, className: "h-9", children: "Save" }),
          /* @__PURE__ */ jsx(Button, { onClick: () => setEditingAuthorId(null), variant: "outline", className: "h-9", children: "Cancel" })
        ] }) : /* @__PURE__ */ jsx("button", { type: "button", onClick: () => startEditAuthor(m.id, m.author_name), className: "mt-1 text-xs font-medium text-amber-600 hover:text-amber-700", children: "Edit author name" })
      ] }),
      /* @__PURE__ */ jsx(Button, { onClick: () => del(m.id), variant: "outline", className: "h-10 text-destructive", children: "Delete" })
    ] }, m.id)) })
  ] });
}
function MergeDuplicateMemories() {
  const qc = useQueryClient();
  const {
    data: groups,
    isLoading
  } = useQuery({
    queryKey: ["admin-duplicate-memories"],
    queryFn: () => adminFindDuplicateMemories()
  });
  const [mergingKey, setMergingKey] = useState(null);
  const merge = async (keepId, duplicateIds, key) => {
    if (!confirm(`Merge ${duplicateIds.length} duplicate post(s) into one memory? Their photos will be combined and the duplicates deleted.`)) return;
    setMergingKey(key);
    try {
      await adminMergeMemories({
        data: {
          keepId,
          duplicateIds
        }
      });
      toast.success("Duplicates merged");
      qc.invalidateQueries({
        queryKey: ["admin-duplicate-memories"]
      });
      qc.invalidateQueries({
        queryKey: ["admin-memories"]
      });
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Merge failed");
    } finally {
      setMergingKey(null);
    }
  };
  if (isLoading || !groups || groups.length === 0) return null;
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-amber-300 bg-amber-50 p-5 mb-6 space-y-3", children: [
    /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Merge duplicate memories" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "These posts have the same title, story, and author, created within minutes of each other — likely one memory split into several posts. Merging combines all their photos into the first post and removes the duplicates." }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: groups.map((g, gi) => {
      const key = `${g.user_id}-${gi}`;
      const [keep, ...dupes] = g.memories;
      return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-amber-200 bg-white p-3 flex flex-wrap justify-between gap-3 items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold", children: g.title || "Untitled" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-1", children: g.body }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "By ",
            g.full_name ?? "Unknown",
            " · ",
            g.memories.length,
            " posts, ",
            g.memories.reduce((n, m) => n + m.image_count, 0),
            " total photos"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { onClick: () => merge(keep.id, dupes.map((d) => d.id), key), disabled: mergingKey === key, className: "h-10", children: mergingKey === key ? "Merging…" : "Merge into one post" })
      ] }, key);
    }) })
  ] });
}
function EventFormModal({
  title: modalTitle,
  initial,
  onClose,
  onSave,
  saving,
  coverFiles,
  setCoverFiles,
  uploadProgress,
  defaultEventType
}) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({
    ...f,
    [k]: v
  }));
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6", children: [
    /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg mb-4", children: modalTitle }),
    /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      onSave(form);
    }, className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Title *" }),
          /* @__PURE__ */ jsx(Input, { value: form.title, onChange: (e) => set("title", e.target.value), required: true, className: "h-11 mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Event date *" }),
          /* @__PURE__ */ jsx(Input, { type: "datetime-local", value: form.event_date, onChange: (e) => set("event_date", e.target.value), required: true, className: "h-11 mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "End date / time (optional)" }),
          /* @__PURE__ */ jsx(Input, { type: "datetime-local", value: form.end_date, onChange: (e) => set("end_date", e.target.value), className: "h-11 mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Venue / Location" }),
          /* @__PURE__ */ jsx(Input, { value: form.location, onChange: (e) => set("location", e.target.value), placeholder: "Hotel name, city, address…", className: "h-11 mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Description" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.description, onChange: (e) => set("description", e.target.value), rows: 3, className: "mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Event type" }),
          /* @__PURE__ */ jsxs(Select, { value: form.event_type, onValueChange: (v) => set("event_type", v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-11 mt-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "upcoming", children: "Upcoming" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "past", children: "Past / Old event" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Published" }),
          /* @__PURE__ */ jsxs(Select, { value: form.is_published ? "yes" : "no", onValueChange: (v) => set("is_published", v === "yes"), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-11 mt-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "yes", children: "Published (visible to members)" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "no", children: "Draft (admin only)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "RSVP enabled" }),
          /* @__PURE__ */ jsxs(Select, { value: form.rsvp_enabled ? "yes" : "no", onValueChange: (v) => set("rsvp_enabled", v === "yes"), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-11 mt-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "yes", children: "Yes — show RSVP buttons" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "no", children: "No" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "External link (optional)" }),
          /* @__PURE__ */ jsx(Input, { value: form.external_link, onChange: (e) => set("external_link", e.target.value), placeholder: "https://…", className: "h-11 mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Cover image (optional)" }),
          /* @__PURE__ */ jsx(DropzoneUpload, { files: coverFiles, onFilesChange: setCoverFiles, accept: "image/*", multiple: false, disabled: saving, className: "mt-1", progress: uploadProgress })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, className: "h-10", disabled: saving, children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: saving, className: "h-10", children: saving ? "Saving…" : "Save event" })
      ] })
    ] })
  ] }) });
}
const EMPTY_EVENT_FORM = (eventType = "upcoming") => ({
  title: "",
  description: "",
  location: "",
  event_date: "",
  end_date: "",
  event_type: eventType,
  rsvp_enabled: false,
  external_link: "",
  is_published: true
});
function fromEventRow(e) {
  return {
    title: e.title,
    description: e.description ?? "",
    location: e.location ?? "",
    event_date: e.event_date ? e.event_date.slice(0, 16) : "",
    end_date: e.end_date ? e.end_date.slice(0, 16) : "",
    event_type: e.event_type ?? "upcoming",
    rsvp_enabled: e.rsvp_enabled ?? false,
    external_link: e.external_link ?? "",
    is_published: e.is_published ?? true
  };
}
function EventsTab() {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError
  } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => adminListEvents()
  });
  const [mode, setMode] = useState("idle");
  const [editTarget, setEditTarget] = useState(null);
  const [coverFiles, setCoverFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const uploadQueue = useUploadQueue();
  const invalidate = () => {
    qc.invalidateQueries({
      queryKey: ["admin-events"]
    });
    qc.invalidateQueries({
      queryKey: ["events"]
    });
  };
  const openAdd = (type) => {
    setEditTarget(null);
    setCoverFiles([]);
    uploadQueue.reset();
    setMode(type);
  };
  const closeModal = () => {
    setMode("idle");
    setEditTarget(null);
    setCoverFiles([]);
    uploadQueue.reset();
  };
  const uploadCoverIfNeeded = async (file) => {
    if (!file || !user) return null;
    if (file.size > MAX_ADMIN_UPLOAD_BYTES) throw new Error("File too large. Please upload a smaller image.");
    uploadQueue.init([file]);
    uploadQueue.setStatus(file, "uploading", 0);
    const compressed = await compressImage(file);
    const uploaded = await uploadToFirebaseStorageResumable(compressed, "event-covers", user.id, (pct) => uploadQueue.setPct(file, pct));
    uploadQueue.setStatus(file, "completed", 100);
    return {
      url: uploaded.url,
      path: uploaded.path,
      name: compressed.name,
      type: compressed.type,
      size: compressed.size
    };
  };
  const handleSave = async (form) => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.event_date) {
      toast.error("Event date is required");
      return;
    }
    setSaving(true);
    try {
      const cover = await uploadCoverIfNeeded(coverFiles[0]).catch((err) => {
        throw err;
      });
      const payload = {
        title: form.title.trim(),
        description: form.description || void 0,
        location: form.location || void 0,
        event_date: new Date(form.event_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : void 0,
        event_type: form.event_type,
        rsvp_enabled: form.rsvp_enabled,
        external_link: form.external_link || void 0,
        is_published: form.is_published,
        ...cover ? {
          url: cover.url,
          storagePath: cover.path,
          fileName: cover.name,
          mimeType: cover.type,
          fileSize: cover.size
        } : {}
      };
      if (mode === "edit" && editTarget) {
        await adminEditEvent({
          data: {
            id: editTarget.id,
            ...payload
          }
        });
        toast.success("Event updated");
      } else {
        await adminCreateEvent({
          data: payload
        });
        toast.success("Event created");
      }
      closeModal();
      invalidate();
    } catch (err) {
      if (coverFiles[0]) uploadQueue.setStatus(coverFiles[0], "error");
      toast.error(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  };
  const del = async (id) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      const res = await adminDeleteEvent({
        data: {
          id
        }
      });
      toast.success("Event deleted");
      invalidate();
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) => console.error("[admin/events] storage delete failed:", err));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };
  const togglePublished = async (e) => {
    const newVal = !(e.is_published ?? true);
    try {
      await adminToggleEventPublished({
        data: {
          id: e.id,
          published: newVal
        }
      });
      toast.success(newVal ? "Event published" : "Event unpublished (draft)");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const modalInitial = mode === "edit" && editTarget ? fromEventRow(editTarget) : mode === "add-past" ? EMPTY_EVENT_FORM("past") : EMPTY_EVENT_FORM("upcoming");
  const modalTitle = mode === "edit" ? "Edit Event" : mode === "add-past" ? "Add Old / Past Event" : "Add Upcoming Event";
  return /* @__PURE__ */ jsxs("div", { children: [
    mode !== "idle" && /* @__PURE__ */ jsx(EventFormModal, { title: modalTitle, initial: modalInitial, onClose: closeModal, onSave: handleSave, saving, coverFiles, setCoverFiles, uploadProgress: uploadQueue.progress }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 mb-6", children: [
      /* @__PURE__ */ jsx(Button, { type: "button", onClick: () => openAdd("add-upcoming"), className: "h-11", children: "+ Add Upcoming Event" }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => openAdd("add-past"), className: "h-11", children: "+ Add Old / Past Event" })
    ] }),
    eventsLoading && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground py-4", children: "Loading events…" }),
    eventsError && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-destructive/40 bg-destructive/5 p-4 mb-4", children: [
      /* @__PURE__ */ jsx("p", { className: "font-semibold text-destructive text-sm", children: "Failed to load events" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: eventsError instanceof Error ? eventsError.message : "Unknown error" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "If this is a new deployment, run the Neon migration SQL below on your database, then refresh." }),
      /* @__PURE__ */ jsx("pre", { className: "text-xs bg-muted rounded p-2 mt-2 overflow-x-auto whitespace-pre-wrap", children: `ALTER TABLE events ADD COLUMN IF NOT EXISTS is_published boolean;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'upcoming';
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rsvp_enabled boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_link text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();` })
    ] }),
    !eventsLoading && !eventsError && !events?.length && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground py-8 text-center", children: "No events yet. Add your first event above." }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: events?.map((e) => {
      const isPublished = e.is_published ?? true;
      const isPast = (e.event_type ?? "upcoming") === "past";
      return /* @__PURE__ */ jsxs("div", { className: `rounded-lg border bg-card p-4 flex flex-wrap justify-between gap-3 items-start ${isPublished ? "border-border" : "border-amber-200 bg-amber-50/30"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [
          e.cover_url && /* @__PURE__ */ jsx("img", { src: e.cover_url, alt: e.title, className: "h-14 w-14 rounded-lg object-cover shrink-0", loading: "lazy" }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold truncate", children: e.title }),
              /* @__PURE__ */ jsx("span", { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${isPast ? "bg-gray-100 text-gray-500" : "bg-emerald-100 text-emerald-700"}`, children: isPast ? "Past" : "Upcoming" }),
              !isPublished && /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700", children: "Draft" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-0.5", children: [
              format(new Date(e.event_date), "PPP p"),
              e.location && ` · ${e.location}`
            ] }),
            e.rsvp_enabled && /* @__PURE__ */ jsx("p", { className: "text-xs text-emerald-600 mt-0.5", children: "RSVP enabled" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 shrink-0", children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", className: "h-9 text-sm", onClick: () => {
            setEditTarget(e);
            setMode("edit");
            setCoverFiles([]);
          }, children: "Edit" }),
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", className: "h-9 text-sm", onClick: () => togglePublished(e), children: isPublished ? "Unpublish" : "Publish" }),
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", className: "h-9 text-sm text-destructive hover:text-destructive", onClick: () => del(e.id), children: "Delete" })
        ] })
      ] }, e.id);
    }) })
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
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function downloadCsv(rows, filename) {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
  const blob = new Blob([csv], {
    type: "text/csv"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function OwnerOnlyBadge() {
  return /* @__PURE__ */ jsx("span", { className: "inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-semibold text-amber-800", children: "Owner Only" });
}
function BackupTab() {
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const exportMembers = async () => {
    setLoadingMembers(true);
    try {
      const rows = await ownerExportMembers();
      downloadCsv(rows, `simcosa-members-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
      toast.success("Members CSV downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoadingMembers(false);
    }
  };
  const exportMedia = async () => {
    setLoadingMedia(true);
    try {
      const rows = await ownerExportMediaList();
      downloadCsv(rows, `simcosa-media-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
      toast.success("Media list CSV downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoadingMedia(false);
    }
  };
  const exportFull = async () => {
    setLoadingFull(true);
    try {
      const data = await ownerExportFullBackup();
      downloadJson(data, `simcosa-full-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`);
      toast.success("Full backup downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoadingFull(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-2xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800", children: [
      /* @__PURE__ */ jsx("strong", { children: "Warning:" }),
      " This backup may contain member personal information. Keep it safely and do not share it publicly."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Members CSV Export" }),
        /* @__PURE__ */ jsx(OwnerOnlyBadge, {})
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Downloads all member profiles including names, emails, phones, locations, and approval status." }),
      /* @__PURE__ */ jsx(Button, { onClick: exportMembers, disabled: loadingMembers, className: "h-10", children: loadingMembers ? "Exporting…" : "Download Members CSV" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Media File List Export" }),
        /* @__PURE__ */ jsx(OwnerOnlyBadge, {})
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Downloads a CSV listing all media files (gallery, memory images, blog covers, event covers) with their storage paths and sizes." }),
      /* @__PURE__ */ jsx(Button, { onClick: exportMedia, disabled: loadingMedia, className: "h-10", children: loadingMedia ? "Exporting…" : "Download Media List CSV" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-destructive", children: "Full Website Data Backup" }),
        /* @__PURE__ */ jsx(OwnerOnlyBadge, {})
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Downloads a complete JSON backup of all website data: members, memories, gallery, blogs, events, announcements, donations, and expenses. This file contains sensitive personal information — store it securely." }),
      /* @__PURE__ */ jsx(Button, { onClick: exportFull, disabled: loadingFull, variant: "destructive", className: "h-10", children: loadingFull ? "Exporting…" : "Download Full Backup (JSON)" })
    ] })
  ] });
}
function MediaTab() {
  const qc = useQueryClient();
  const [source, setSource] = useState("all");
  const [mediaType, setMediaType] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const PAGE_SIZE = 50;
  const {
    data: stats
  } = useQuery({
    queryKey: ["admin-media-stats"],
    queryFn: () => adminGetMediaStats()
  });
  const {
    data: items,
    isFetching
  } = useQuery({
    queryKey: ["admin-media", source, mediaType, sort, page],
    queryFn: () => adminListMedia({
      data: {
        source: source === "all" ? "all" : source,
        media_type: mediaType === "all" ? void 0 : mediaType,
        sort,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      }
    })
  });
  const del = async (id, itemSource, fbPath) => {
    if (!confirm("Delete this media item?")) return;
    setDeletingId(id);
    try {
      await adminDeleteMediaItem({
        data: {
          id,
          source: itemSource
        }
      });
      if (fbPath) {
        deleteFromFirebaseStorage(fbPath).catch((err) => console.error("[admin/media] failed to delete storage object:", err));
      }
      toast.success("Deleted");
      qc.invalidateQueries({
        queryKey: ["admin-media"]
      });
      qc.invalidateQueries({
        queryKey: ["admin-media-stats"]
      });
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setDeletingId(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    stats && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3", children: [{
      label: "Total Files",
      value: stats.total_files
    }, {
      label: "Gallery",
      value: stats.gallery.count
    }, {
      label: "Photos (gallery)",
      value: stats.gallery.images
    }, {
      label: "Videos (gallery)",
      value: stats.gallery.videos
    }, {
      label: "Memories",
      value: stats.memory_images.count
    }, {
      label: "Total Storage",
      value: formatFileSize(stats.total_size)
    }].map(({
      label,
      value
    }) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold", children: value }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: label })
    ] }, label)) }),
    stats && stats.gallery.missing > 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm text-amber-700 font-medium", children: [
      "⚠ ",
      stats.gallery.missing,
      " gallery item(s) have no accessible file URL."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs(Select, { value: source, onValueChange: (v) => {
        setSource(v);
        setPage(0);
      }, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-10 w-40", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Source" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All sources" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "gallery", children: "Gallery" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "memory_image", children: "Memories" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "blog", children: "Blogs" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "event", children: "Events" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: mediaType, onValueChange: (v) => {
        setMediaType(v);
        setPage(0);
      }, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-10 w-36", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Type" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All types" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "image", children: "Images" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "video", children: "Videos" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "document", children: "Documents" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: sort, onValueChange: (v) => {
        setSort(v);
        setPage(0);
      }, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-10 w-40", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Sort" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "newest", children: "Newest first" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "oldest", children: "Oldest first" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "largest", children: "Largest first" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "smallest", children: "Smallest first" })
        ] })
      ] }),
      isFetching && /* @__PURE__ */ jsx("span", { className: "self-center text-sm text-muted-foreground", children: "Loading…" })
    ] }),
    items?.length === 0 && !isFetching && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No media found." }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: items?.map((item) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-3 flex flex-wrap sm:flex-nowrap items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "shrink-0", children: item.file_url && item.media_type === "image" ? /* @__PURE__ */ jsx("img", { src: item.file_url, alt: item.file_name ?? "", className: "h-12 w-12 rounded-md object-cover", loading: "lazy" }) : item.media_type === "video" ? /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground", children: "Video" }) : /* @__PURE__ */ jsx("div", { className: `h-12 w-12 rounded-md flex items-center justify-center text-[10px] text-center px-1 ${item.file_available ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`, children: item.file_available ? "Doc" : "Missing" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium", children: item.title ?? item.file_name ?? "—" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "capitalize", children: item.source.replace("_", " ") }),
          " · ",
          item.media_type,
          item.file_size ? ` · ${formatFileSize(item.file_size)}` : "",
          item.uploaded_by_name ? ` · ${item.uploaded_by_name}` : "",
          " · ",
          format(new Date(item.created_at), "PP")
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", className: "h-9 text-destructive shrink-0", disabled: deletingId === item.id, onClick: () => del(item.id, item.source, item.fb_storage_path), children: deletingId === item.id ? "Deleting…" : "Delete" })
    ] }, `${item.source}-${item.id}`)) }),
    (items?.length === PAGE_SIZE || page > 0) && /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setPage((p) => Math.max(0, p - 1)), disabled: page === 0, className: "h-10", children: "Previous" }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setPage((p) => p + 1), disabled: (items?.length ?? 0) < PAGE_SIZE, className: "h-10", children: "Next" }),
      /* @__PURE__ */ jsxs("span", { className: "self-center text-sm text-muted-foreground", children: [
        "Page ",
        page + 1
      ] })
    ] })
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
