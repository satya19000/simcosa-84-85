import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { B as Button } from "./router-DnWeEP9U.js";
import { MapPin, Heart, BookOpen, Users, Star } from "lucide-react";
import "@tanstack/react-query";
import "react";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "sonner";
function About() {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("section", { className: "relative py-20 px-4 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx("img", { src: "/assets/college-logo.png", alt: "SIMCOSA Logo", className: "h-24 w-24 rounded-full object-cover ring-4 ring-amber-400 shadow-xl" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-3", children: "About Our Batch" }),
      /* @__PURE__ */ jsxs("h1", { children: [
        "SIMCOSA ",
        /* @__PURE__ */ jsx("span", { className: "text-amber-500", children: "1984–85" }),
        " Batch"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-amber-700 font-display text-xl mt-2", children: "Govt. Siddhartha Medical College, Vijayawada" }),
      /* @__PURE__ */ jsx("p", { className: "mt-5 text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed", children: "We are the proud 1984–85 alumni of Government Siddhartha Medical College. Decades later, we are still bound by the friendships, the teachers, the corridors, and the countless moments that shaped who we became." }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-xl font-display italic text-amber-700", children: '"Once Siddhartha, Always Siddhartha."' })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16 px-4 bg-white", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-5xl", children: /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-10 items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-3", children: "Our Alma Mater" }),
        /* @__PURE__ */ jsx("h2", { children: "Govt. Siddhartha Medical College" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-600 leading-relaxed", children: "Government Siddhartha Medical College, Vijayawada — established in 1959 — is one of the premier medical institutions of Andhra Pradesh. Named after the founder of Buddhism, the college has produced thousands of distinguished doctors who serve across India and the world." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-600 leading-relaxed", children: "For our batch, this was more than a college — it was our home, our training ground, and the place where lifelong bonds were forged in the fires of rigorous medical education." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2 text-gray-500", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "h-5 w-5 text-amber-500" }),
          /* @__PURE__ */ jsx("span", { children: "Vijayawada, Andhra Pradesh, India" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden shadow-xl", children: /* @__PURE__ */ jsx("img", { src: "/assets/simcosa-stage.jpeg", alt: "SIMCOSA Celebration", className: "w-full h-72 object-cover" }) })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16 px-4 bg-amber-50", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-5xl", children: /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-10 items-center", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden shadow-xl order-2 md:order-1", children: /* @__PURE__ */ jsx("img", { src: "/assets/hero-reunion.jpeg", alt: "SIMCOSA Reunion", className: "w-full h-72 object-cover" }) }),
      /* @__PURE__ */ jsxs("div", { className: "order-1 md:order-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-3", children: "Our Story" }),
        /* @__PURE__ */ jsx("h2", { children: "The SIMCOSA 84–85 Story" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-600 leading-relaxed", children: "SIMCOSA 1984–85 is the alumni batch of Govt. Siddhartha Medical College, Vijayawada. We entered college in 1984 and graduated as doctors in 1989–90 — five years of shared struggle, laughter, learning, and unforgettable memories." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-600 leading-relaxed", children: "This portal is our digital home — a place to keep in touch, plan reunions, share old photographs, celebrate each other's achievements, remember those we have lost, and be there for each other when life gets difficult." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-600 leading-relaxed font-semibold", children: "186+ batchmates strong. 12 reunions. Thousands of memories. One family." })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16 px-4 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-3", children: "Our Mission" }),
        /* @__PURE__ */ jsx("h2", { children: "What We Stand For" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-3 gap-6", children: [{
        icon: Heart,
        color: "bg-rose-50 text-rose-500",
        title: "Reconnect",
        desc: "Bridge distances and decades. Find your batchmates, share phone numbers, and reignite friendships that shaped your life."
      }, {
        icon: BookOpen,
        color: "bg-amber-50 text-amber-500",
        title: "Remember",
        desc: "Preserve and celebrate our shared history — the professors who inspired us, the moments that defined us, the friends we'll never forget."
      }, {
        icon: Users,
        color: "bg-emerald-50 text-emerald-500",
        title: "Support",
        desc: "Be there for each other through life's challenges. Medical advice, moral support, or just a friendly voice — we have each other's backs."
      }].map(({
        icon: Icon,
        color,
        title,
        desc
      }) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-7 shadow-sm border border-amber-100 hover:shadow-md transition-shadow text-center", children: [
        /* @__PURE__ */ jsx("div", { className: `inline-flex p-4 rounded-2xl ${color} mb-5`, children: /* @__PURE__ */ jsx(Icon, { className: "h-8 w-8" }) }),
        /* @__PURE__ */ jsx("h3", { className: "font-display text-2xl font-bold text-gray-900", children: title }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-500 leading-relaxed", children: desc })
      ] }, title)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16 px-4 bg-gradient-to-r from-amber-500 to-orange-500", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-4xl", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-6 text-center", children: [{
      value: "186+",
      label: "Registered Members"
    }, {
      value: "12",
      label: "Reunions Held"
    }, {
      value: "40+",
      label: "Years of Friendship"
    }, {
      value: "1984",
      label: "Year We Met"
    }].map((s) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "font-display text-4xl font-bold text-white", children: s.value }),
      /* @__PURE__ */ jsx("p", { className: "text-amber-100 mt-1 font-semibold", children: s.label })
    ] }, s.label)) }) }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16 px-4 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-6 mb-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 rounded-2xl p-7 border border-amber-200", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex p-3 bg-amber-100 rounded-xl mb-4", children: /* @__PURE__ */ jsx(Star, { className: "h-6 w-6 text-amber-600" }) }),
          /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900", children: "Our Promise" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-600 leading-relaxed", children: "Privacy first. Your phone number and personal details are visible only to other approved batchmates — never to the public. Your data stays within our trusted community." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 rounded-2xl p-7 border border-emerald-200", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex p-3 bg-emerald-100 rounded-xl mb-4", children: /* @__PURE__ */ jsx(Users, { className: "h-6 w-6 text-emerald-600" }) }),
          /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900", children: "How to Join" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-600 leading-relaxed", children: "Sign up with your name and email. An admin will verify you are from our batch and approve your access — usually within a day. Once approved, you'll have full access." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsx(Button, { size: "lg", className: "bg-amber-500 hover:bg-amber-600 text-white font-bold h-14 px-10 text-lg rounded-2xl shadow-lg", children: "Join Our Batch Portal" }) }) })
    ] }) })
  ] });
}
export {
  About as component
};
