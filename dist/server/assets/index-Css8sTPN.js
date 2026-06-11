import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Star, Users, BookOpen, Calendar, Camera, MessageCircle, Heart, HelpCircle, Trophy, ArrowRight } from "lucide-react";
import { B as Button } from "./router-CpAwBtLZ.js";
import "@tanstack/react-query";
import "react";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "sonner";
const STATS = [{
  value: "186+",
  label: "Registered Members"
}, {
  value: "12",
  label: "Reunions Held"
}, {
  value: "1,250+",
  label: "Photos Uploaded"
}, {
  value: "500+",
  label: "Memories Shared"
}];
const FEATURES = [{
  icon: Users,
  label: "Members Directory",
  desc: "Find and connect with your classmates.",
  color: "bg-amber-50 text-amber-600",
  link: "/directory"
}, {
  icon: Calendar,
  label: "Events & Reunions",
  desc: "Stay updated on upcoming events.",
  color: "bg-emerald-50 text-emerald-600",
  link: "/events"
}, {
  icon: Camera,
  label: "Photo Gallery",
  desc: "Browse old memories and recent moments.",
  color: "bg-sky-50 text-sky-600",
  link: "/gallery"
}, {
  icon: BookOpen,
  label: "Memories Wall",
  desc: "Share your stories and cherished memories.",
  color: "bg-purple-50 text-purple-600",
  link: "/memories"
}, {
  icon: MessageCircle,
  label: "Batch Chat",
  desc: "Chat with batchmates in real time.",
  color: "bg-rose-50 text-rose-600",
  link: "/announcements"
}, {
  icon: Heart,
  label: "Donations",
  desc: "Support our batch community fund.",
  color: "bg-pink-50 text-pink-600",
  link: "/donations"
}, {
  icon: HelpCircle,
  label: "Help & Support",
  desc: "Reach out privately for any support.",
  color: "bg-orange-50 text-orange-600",
  link: "/support"
}, {
  icon: Trophy,
  label: "Achievements",
  desc: "Celebrate our batch's proud moments.",
  color: "bg-yellow-50 text-yellow-600",
  link: "/about"
}];
const TIMELINE = [{
  year: "1985",
  label: "Graduation",
  desc: "Our proud batch graduated from Govt. Siddhartha Medical College"
}, {
  year: "2000",
  label: "Reunion",
  desc: "First major reunion — 15 years of friendship celebrated"
}, {
  year: "2010",
  label: "Reunion",
  desc: "Silver jubilee gathering with 100+ batchmates"
}, {
  year: "2020",
  label: "Reunion",
  desc: "Virtual and in-person celebration during challenging times"
}, {
  year: "2025",
  label: "Grand Reunion",
  desc: "40 years together — the grandest celebration yet!"
}];
function Home() {
  return /* @__PURE__ */ jsxs("div", { className: "overflow-x-hidden", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative min-h-[92vh] flex items-center justify-center overflow-hidden", children: [
      /* @__PURE__ */ jsx("img", { src: "/assets/simcosa-stage.jpeg", alt: "SIMCOSA Reunion", className: "absolute inset-0 w-full h-full object-cover object-center" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-amber-900/75 via-amber-800/60 to-yellow-700/50" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 text-center text-white px-4 max-w-4xl mx-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 bg-amber-500/90 text-amber-950 font-bold text-sm px-4 py-1.5 rounded-full mb-6 shadow-lg", children: [
          /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-amber-950" }),
          "Alumni Portal · Est. 1984–85"
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-white drop-shadow-xl", style: {
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
          lineHeight: 1.1
        }, children: [
          "SIMCOSA ",
          /* @__PURE__ */ jsx("span", { className: "text-amber-300", children: "1984–85" }),
          " Batch"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-2xl sm:text-3xl font-display font-semibold text-amber-200 drop-shadow", children: "Reconnect. Celebrate. Support." }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed", children: "Friends for life since Govt. Siddhartha Medical College, Vijayawada. Our private space to relive memories, plan reunions, and stand by each other." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col sm:flex-row items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold h-14 px-8 text-lg rounded-2xl shadow-xl transition-all hover:scale-105", children: [
            /* @__PURE__ */ jsx(Users, { className: "h-5 w-5 mr-2" }),
            " Join Community"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/memories", children: /* @__PURE__ */ jsxs(Button, { size: "lg", variant: "outline", className: "bg-white/15 border-white/50 text-white hover:bg-white/25 font-bold h-14 px-8 text-lg rounded-2xl backdrop-blur-sm", children: [
            /* @__PURE__ */ jsx(BookOpen, { className: "h-5 w-5 mr-2" }),
            " View Memories"
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto", children: STATS.map((s) => /* @__PURE__ */ jsxs("div", { className: "bg-white/15 backdrop-blur-md rounded-2xl py-4 px-3 border border-white/20", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xl sm:text-3xl font-display font-bold text-amber-300", children: s.value }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-white/80 mt-1 leading-tight", children: s.label })
        ] }, s.label)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 animate-bounce text-sm", children: "↓" })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-4 bg-gradient-to-b from-amber-50/60 to-white", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Everything in One Place" }),
        /* @__PURE__ */ jsx("h2", { children: "Your Batch Portal Features" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-500 max-w-xl mx-auto text-lg", children: "A private, members-only space built with love for our batch — everything you need to stay connected." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-5", children: FEATURES.map(({
        icon: Icon,
        label,
        desc,
        color,
        link
      }) => /* @__PURE__ */ jsxs(Link, { to: link, className: "group bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200", children: [
        /* @__PURE__ */ jsx("div", { className: `inline-flex p-3 rounded-xl ${color} mb-4`, children: /* @__PURE__ */ jsx(Icon, { className: "h-7 w-7" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900 mb-2", children: label }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm leading-relaxed", children: desc }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-1 text-amber-600 text-sm font-semibold group-hover:gap-2 transition-all", children: [
          "Explore ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
        ] })
      ] }, label)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-4 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Our Journey Together" }),
        /* @__PURE__ */ jsx("h2", { children: "Celebrating Friendship Since 1985" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-500 max-w-xl mx-auto text-lg", children: "Four decades of bonds, laughter, and love — a glimpse of our journey together." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative rounded-3xl overflow-hidden mb-12 shadow-2xl", children: [
        /* @__PURE__ */ jsx("img", { src: "/assets/hero-reunion.jpeg", alt: "SIMCOSA 85 Celebration", className: "w-full h-72 sm:h-96 object-cover object-top" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent" }),
        /* @__PURE__ */ jsxs("div", { className: "absolute bottom-6 left-6 text-white", children: [
          /* @__PURE__ */ jsx("p", { className: "font-display text-2xl font-bold", children: "SIMCOSA 85 — Celebrating Friendship" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/80 mt-1", children: "Our latest grand gathering" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("div", { className: "hidden sm:block absolute top-7 left-0 right-0 h-0.5 bg-amber-200 z-0" }),
        /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-5 gap-6 relative z-10", children: TIMELINE.map((t, i) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: `h-14 w-14 rounded-full flex items-center justify-center font-display font-bold text-lg shadow-lg border-4 ${i === TIMELINE.length - 1 ? "bg-amber-500 text-white border-amber-300" : "bg-white text-amber-700 border-amber-400"}`, children: t.year.slice(2) }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 font-bold text-gray-900 text-base", children: t.year }),
          /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-semibold text-sm", children: t.label }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-gray-500 text-sm leading-snug", children: t.desc })
        ] }, t.year)) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-4 bg-amber-50", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Member Spotlight" }),
        /* @__PURE__ */ jsx("h2", { children: "Faces of Our Batch" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-500 max-w-xl mx-auto text-lg", children: "Proud batchmates from Govt. Siddhartha Medical College — doctors, leaders, and lifelong friends." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl overflow-hidden shadow-md border border-amber-100 hover:shadow-xl hover:-translate-y-1 transition-all", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative h-56", children: [
            /* @__PURE__ */ jsx("img", { src: "/assets/simcosa-stage.jpeg", alt: "Reunion", className: "w-full h-full object-cover object-center" }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-amber-900/40 flex items-center justify-center", children: /* @__PURE__ */ jsx("p", { className: "text-white font-display text-xl font-bold text-center px-4", children: "Join to See All Members" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900", children: "186+ Batchmates" }),
            /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-semibold text-sm mt-1", children: "Registered & Connected" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-3 text-sm", children: "Doctors, professors, entrepreneurs and more — all from our beloved batch." }),
            /* @__PURE__ */ jsxs(Link, { to: "/auth", className: "mt-4 flex items-center gap-2 text-amber-600 font-bold text-sm hover:gap-3 transition-all", children: [
              "Join to Connect ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl overflow-hidden shadow-md border border-amber-100 hover:shadow-xl hover:-translate-y-1 transition-all", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative h-56", children: [
            /* @__PURE__ */ jsx("img", { src: "/assets/birthday-event.jpeg", alt: "Celebration", className: "w-full h-full object-cover object-center" }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full", children: "Celebration" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900", children: "Batch Celebrations" }),
            /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-semibold text-sm mt-1", children: "Birthdays, Milestones & More" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-3 text-sm", children: "We celebrate every moment together — from birthdays to achievements and special milestones." }),
            /* @__PURE__ */ jsxs(Link, { to: "/events", className: "mt-4 flex items-center gap-2 text-amber-600 font-bold text-sm hover:gap-3 transition-all", children: [
              "View Events ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-4 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Moments That Last Forever" }),
          /* @__PURE__ */ jsx("h2", { children: "A Glimpse of Our Journey" })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/gallery", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "border-amber-400 text-amber-700 hover:bg-amber-50 font-bold rounded-xl px-6", children: [
          "View Full Gallery ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 ml-2" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "col-span-2 sm:col-span-1 row-span-2", children: /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden h-72 sm:h-full shadow-md", children: /* @__PURE__ */ jsx("img", { src: "/assets/hero-reunion.jpeg", alt: "Yellow shirt reunion", className: "w-full h-full object-cover hover:scale-105 transition-transform duration-500" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md", children: /* @__PURE__ */ jsx("img", { src: "/assets/batch-wedding.jpeg", alt: "Batch wedding celebration", className: "w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md", children: /* @__PURE__ */ jsx("img", { src: "/assets/batch-formal.jpeg", alt: "Batchmates formal", className: "w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md", children: /* @__PURE__ */ jsx("img", { src: "/assets/madhavi-latha.jpeg", alt: "Dr. Madhavi Latha", className: "w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md", children: /* @__PURE__ */ jsx("img", { src: "/assets/batchmates-porch.jpeg", alt: "Batchmates", className: "w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md", children: /* @__PURE__ */ jsx("img", { src: "/assets/simcosa-stage.jpeg", alt: "SIMCOSA 85", className: "w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md", children: /* @__PURE__ */ jsx("img", { src: "/assets/family-moment.jpeg", alt: "Family moment", className: "w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md", children: /* @__PURE__ */ jsx("img", { src: "/assets/batch-friends.jpeg", alt: "Batchmates together", className: "w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md", children: /* @__PURE__ */ jsx("img", { src: "/assets/batch-event.jpeg", alt: "Batch event", className: "w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-center mt-8", children: /* @__PURE__ */ jsx(Link, { to: "/gallery", children: /* @__PURE__ */ jsxs(Button, { className: "bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 h-12 rounded-2xl shadow-md", children: [
        /* @__PURE__ */ jsx(Camera, { className: "h-5 w-5 mr-2" }),
        " View Full Gallery"
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-4 bg-gradient-to-b from-amber-50 to-orange-50/50", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Memories Wall" }),
        /* @__PURE__ */ jsx("h2", { children: "Stories That Warm Our Hearts" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-500 max-w-xl mx-auto", children: "Batchmates sharing their most cherished memories from our college days and beyond." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-5", children: [{
        name: "Dr. Ravi Kumar",
        time: "2 days ago",
        text: "I still remember our first day in the anatomy lab — we were terrified but we laughed so much. Those days at Siddhartha shaped everything I became as a doctor.",
        likes: 24,
        comments: 8
      }, {
        name: "Dr. Sunitha Rao",
        time: "5 days ago",
        text: "The reunions we have every few years remind me why medicine wasn't just a career — it was a journey we took together. Missing everyone today. 💛",
        likes: 41,
        comments: 15
      }].map((m) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-6 shadow-sm border border-amber-100", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center font-display text-xl font-bold text-amber-700 shrink-0", children: m.name.charAt(3) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-gray-900", children: m.name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: m.time })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-700 leading-relaxed", children: m.text }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-6 text-gray-400 text-sm", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 cursor-pointer hover:text-rose-500", children: [
            /* @__PURE__ */ jsx(Heart, { className: "h-4 w-4" }),
            " ",
            m.likes,
            " Likes"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 cursor-pointer hover:text-amber-600", children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4" }),
            " ",
            m.comments,
            " Comments"
          ] })
        ] })
      ] }, m.name)) }),
      /* @__PURE__ */ jsx("div", { className: "text-center mt-8", children: /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxs(Button, { className: "bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 h-12 rounded-2xl shadow-md", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "h-5 w-5 mr-2" }),
        " Share Your Memory"
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-4 bg-gradient-to-r from-amber-500 to-orange-500", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-white", style: {
        fontFamily: '"Playfair Display", serif'
      }, children: "Ready to Reconnect with Your Batchmates?" }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-amber-100 text-lg max-w-xl mx-auto", children: "Create an account and get approved to access the full members portal — directory, gallery, memories and more." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col sm:flex-row items-center justify-center gap-4", children: [
        /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsx(Button, { size: "lg", className: "bg-white text-amber-700 hover:bg-amber-50 font-bold h-14 px-10 text-lg rounded-2xl shadow-xl", children: "Join the Portal" }) }),
        /* @__PURE__ */ jsx(Link, { to: "/about", children: /* @__PURE__ */ jsx(Button, { size: "lg", variant: "outline", className: "border-white/60 text-white hover:bg-white/15 font-bold h-14 px-8 text-lg rounded-2xl", children: "Learn More" }) })
      ] })
    ] }) })
  ] });
}
export {
  Home as component
};
