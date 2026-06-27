import { jsx, jsxs } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { updateMyProfile } from "./profile-DYmsYEAl.js";
import { u as useAuth, B as Button } from "./router-ByRAmPMo.js";
import { I as Input } from "./input-2tfoJBUV.js";
import { L as Label } from "./label-ECY14BIi.js";
import { T as Textarea } from "./textarea-CXFxFPuk.js";
import { User, Phone, MessageCircle, MapPin, Briefcase, Save } from "lucide-react";
import { toast } from "sonner";
import "./middleware-BymfKMq5.js";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
import "./server-B3JlQD99.js";
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
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [errors, setErrors] = useState({});
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
  const handlePhoneChange = (v) => {
    setForm((f) => ({
      ...f,
      phone: v,
      whatsapp: sameAsPhone ? v : f.whatsapp
    }));
  };
  const handleSameAsPhone = (checked) => {
    setSameAsPhone(checked);
    if (checked) setForm((f) => ({
      ...f,
      whatsapp: f.phone
    }));
  };
  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    const phone = form.phone.trim();
    if (!phone) {
      e.phone = "Mobile number is required";
    } else if (phone.replace(/\D/g, "").length < 7) {
      e.phone = "Enter a valid mobile number";
    }
    if (!form.location.trim()) e.location = "City / Location is required";
    if (!form.country_state.trim()) e.country_state = "Country / State is required";
    if (!form.profession.trim()) e.profession = "Profession / Speciality is required";
    return e;
  };
  const save = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
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
  const field = (name) => errors[name] ? /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors[name] }) : null;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Account" }),
      /* @__PURE__ */ jsx("h1", { children: "My Profile" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Please complete your profile details so your batchmates can find and connect with you." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl px-4 sm:px-6 py-8", children: [
      statusBanner,
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 mb-5 text-amber-800 text-sm", children: [
        "All fields marked ",
        /* @__PURE__ */ jsx("span", { className: "font-bold text-red-500", children: "*" }),
        " are mandatory."
      ] }),
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
            "Full name ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(Input, { value: form.full_name, onChange: (e) => {
            setForm({
              ...form,
              full_name: e.target.value
            });
            setErrors((er) => ({
              ...er,
              full_name: void 0
            }));
          }, placeholder: "Dr. Your Name", className: `h-12 text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl ${errors.full_name ? "border-red-400" : ""}` }),
          field("full_name")
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4 text-amber-500" }),
              "Mobile ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(Input, { value: form.phone, onChange: (e) => {
              handlePhoneChange(e.target.value);
              setErrors((er) => ({
                ...er,
                phone: void 0
              }));
            }, placeholder: "+91 98765 43210", className: `h-12 text-base mt-1 border-amber-200 rounded-xl ${errors.phone ? "border-red-400" : ""}` }),
            field("phone")
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4 text-emerald-500" }),
              "WhatsApp"
            ] }),
            /* @__PURE__ */ jsx(Input, { value: form.whatsapp, onChange: (e) => setForm({
              ...form,
              whatsapp: e.target.value
            }), placeholder: "+91 98765 43210", disabled: sameAsPhone, className: "h-12 text-base mt-1 border-amber-200 rounded-xl" }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 mt-1.5 text-sm text-gray-500 cursor-pointer select-none", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: sameAsPhone, onChange: (e) => handleSameAsPhone(e.target.checked), className: "accent-amber-500" }),
              "Same as mobile"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4 text-amber-500" }),
              "City / Location ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(Input, { value: form.location, onChange: (e) => {
              setForm({
                ...form,
                location: e.target.value
              });
              setErrors((er) => ({
                ...er,
                location: void 0
              }));
            }, placeholder: "Vijayawada, AP", className: `h-12 text-base mt-1 border-amber-200 rounded-xl ${errors.location ? "border-red-400" : ""}` }),
            field("location")
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Briefcase, { className: "h-4 w-4 text-amber-500" }),
              "Profession / Speciality ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(Input, { value: form.profession, onChange: (e) => {
              setForm({
                ...form,
                profession: e.target.value
              });
              setErrors((er) => ({
                ...er,
                profession: void 0
              }));
            }, placeholder: "Cardiologist", className: `h-12 text-base mt-1 border-amber-200 rounded-xl ${errors.profession ? "border-red-400" : ""}` }),
            field("profession")
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700", children: [
            "Current country / state ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(Input, { value: form.country_state, onChange: (e) => {
            setForm({
              ...form,
              country_state: e.target.value
            });
            setErrors((er) => ({
              ...er,
              country_state: void 0
            }));
          }, placeholder: "India / Andhra Pradesh", className: `h-12 text-base mt-1 border-amber-200 rounded-xl ${errors.country_state ? "border-red-400" : ""}` }),
          field("country_state")
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
