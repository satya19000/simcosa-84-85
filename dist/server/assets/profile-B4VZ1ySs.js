import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { c as createSsrRpc } from "./createSsrRpc-B0E5FiUZ.js";
import { a as requireAuth } from "./middleware-CoxskvJW.js";
import { c as createServerFn } from "./server-DZvL4NrQ.js";
import { u as useAuth, B as Button } from "./router-YwtD5LNI.js";
import { I as Input } from "./input-Bzri1R4A.js";
import { L as Label } from "./label-BZHIJmLh.js";
import { T as Textarea } from "./textarea-BtYP_hGx.js";
import { User, Phone, MessageCircle, MapPin, Briefcase, Save } from "lucide-react";
import { toast } from "sonner";
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
import "@tanstack/react-query";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
const updateMyProfile = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(createSsrRpc("f9d52e4aeeff58384a28de1e963c08045faa37f05a3aef0d7e0d21d6d85acbde"));
function ProfilePage() {
  const {
    profile,
    user,
    refresh
  } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    location: "",
    profession: "",
    bio: ""
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      location: profile.location ?? "",
      profession: profile.profession ?? "",
      bio: profile.bio ?? ""
    });
  }, [profile]);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({
        data: form
      });
      toast.success("Profile updated! 🎉");
      await refresh();
      router.navigate({
        to: "/directory"
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Account" }),
      /* @__PURE__ */ jsx("h1", { children: "My Profile" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Keep your details up to date so classmates can find and connect with you." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl px-4 sm:px-6 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm p-6 mb-6 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center font-display text-3xl font-bold text-amber-700 shrink-0", children: form.full_name.charAt(0) || user?.email?.charAt(0).toUpperCase() || "M" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold text-gray-900 text-xl", children: form.full_name || "Your Name" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm", children: user?.email }),
          /* @__PURE__ */ jsx("p", { className: "text-amber-600 text-sm font-semibold mt-0.5", children: "SIMCOSA 1984–85 Batch" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: save, className: "bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(User, { className: "h-4 w-4 text-amber-500" }),
            "Full name *"
          ] }),
          /* @__PURE__ */ jsx(Input, { value: form.full_name, onChange: (e) => setForm({
            ...form,
            full_name: e.target.value
          }), required: true, placeholder: "Dr. Your Name", className: "h-12 text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4 text-amber-500" }),
              "Phone"
            ] }),
            /* @__PURE__ */ jsx(Input, { value: form.phone, onChange: (e) => setForm({
              ...form,
              phone: e.target.value
            }), placeholder: "+91 98765 43210", className: "h-12 text-base mt-1 border-amber-200 rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4 text-emerald-500" }),
              "WhatsApp"
            ] }),
            /* @__PURE__ */ jsx(Input, { value: form.whatsapp, onChange: (e) => setForm({
              ...form,
              whatsapp: e.target.value
            }), placeholder: "+91 98765 43210", className: "h-12 text-base mt-1 border-amber-200 rounded-xl" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4 text-amber-500" }),
              "City / Location"
            ] }),
            /* @__PURE__ */ jsx(Input, { value: form.location, onChange: (e) => setForm({
              ...form,
              location: e.target.value
            }), placeholder: "Vijayawada, AP", className: "h-12 text-base mt-1 border-amber-200 rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Briefcase, { className: "h-4 w-4 text-amber-500" }),
              "Profession / Speciality"
            ] }),
            /* @__PURE__ */ jsx(Input, { value: form.profession, onChange: (e) => setForm({
              ...form,
              profession: e.target.value
            }), placeholder: "Cardiologist, Hyderabad", className: "h-12 text-base mt-1 border-amber-200 rounded-xl" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "About you" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.bio, onChange: (e) => setForm({
            ...form,
            bio: e.target.value
          }), rows: 4, placeholder: "A short bio — your practice, city, family, hobbies… anything you'd like batchmates to know.", className: "text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl resize-none" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-2", children: /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Save, { className: "h-4 w-4" }),
          " ",
          saving ? "Saving…" : "Save Profile"
        ] }) })
      ] })
    ] })
  ] });
}
export {
  ProfilePage as component
};
