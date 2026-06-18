import { jsx, jsxs } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { updateMyProfile } from "./profile-DZbIqkf8.js";
import { u as useAuth, B as Button } from "./router-CyY0f645.js";
import { I as Input } from "./input-C7ZJMpTM.js";
import { L as Label } from "./label-BETYOFz3.js";
import { T as Textarea } from "./textarea-CLwSIZqO.js";
import { User, Phone, MessageCircle, MapPin, Briefcase, Save } from "lucide-react";
import { toast } from "sonner";
import "./createSsrRpc-Bh6xqWfa.js";
import "./server-D92VZGxk.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "./middleware-Cssh-g3c.js";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
import "@tanstack/react-query";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
function ProfilePage() {
  const {
    profile,
    user,
    isAdmin,
    refresh
  } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    location: "",
    profession: "",
    bio: "",
    spouse_name: "",
    clinic_or_hospital: "",
    country_state: ""
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      location: profile.location ?? "",
      profession: profile.profession ?? "",
      bio: profile.bio ?? "",
      spouse_name: profile.spouse_name ?? "",
      clinic_or_hospital: profile.clinic_or_hospital ?? "",
      country_state: profile.country_state ?? ""
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
      if (isAdmin || profile?.approval_status === "approved") {
        router.navigate({
          to: "/directory"
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };
  const statusBanner = (() => {
    if (isAdmin || profile?.approval_status === "approved" || !profile) return null;
    const status = profile.approval_status;
    const text = status === "rejected" ? "Your membership request was not approved. Please contact admin." : status === "needs_clarification" ? "Admin needs more details from you. Please update your profile below." : "Your account is awaiting admin approval.";
    return /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 text-amber-800 text-sm font-medium", children: text });
  })();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Account" }),
      /* @__PURE__ */ jsx("h1", { children: "My Profile" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Keep your details up to date so classmates can find and connect with you." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl px-4 sm:px-6 py-8", children: [
      statusBanner,
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
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Spouse name" }),
            /* @__PURE__ */ jsx(Input, { value: form.spouse_name, onChange: (e) => setForm({
              ...form,
              spouse_name: e.target.value
            }), className: "h-12 text-base mt-1 border-amber-200 rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Clinic / Hospital" }),
            /* @__PURE__ */ jsx(Input, { value: form.clinic_or_hospital, onChange: (e) => setForm({
              ...form,
              clinic_or_hospital: e.target.value
            }), className: "h-12 text-base mt-1 border-amber-200 rounded-xl" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Current country / state" }),
          /* @__PURE__ */ jsx(Input, { value: form.country_state, onChange: (e) => setForm({
            ...form,
            country_state: e.target.value
          }), className: "h-12 text-base mt-1 border-amber-200 rounded-xl" })
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
