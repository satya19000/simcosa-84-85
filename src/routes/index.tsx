import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users, Calendar, Camera, BookOpen, MessageCircle, Heart,
  HelpCircle, Trophy, ArrowRight, Star, MapPin, Briefcase, Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SIMCOSA 84–85 Batch Portal — Home" },
      { name: "description", content: "Welcome to the official online home of the SIMCOSA 1984–85 batch. Reconnect. Celebrate. Support." },
    ],
  }),
  component: Home,
});

const STATS = [
  { value: "186+", label: "Registered Members" },
  { value: "12", label: "Reunions Held" },
  { value: "1,250+", label: "Photos Uploaded" },
  { value: "500+", label: "Memories Shared" },
];

const FEATURES = [
  { icon: Users, label: "Members Directory", desc: "Find and connect with your classmates.", color: "bg-amber-50 text-amber-600", link: "/directory" },
  { icon: Calendar, label: "Events & Reunions", desc: "Stay updated on upcoming events.", color: "bg-emerald-50 text-emerald-600", link: "/events" },
  { icon: Camera, label: "Photo Gallery", desc: "Browse old memories and recent moments.", color: "bg-sky-50 text-sky-600", link: "/gallery" },
  { icon: BookOpen, label: "Memories Wall", desc: "Share your stories and cherished memories.", color: "bg-purple-50 text-purple-600", link: "/memories" },
  { icon: MessageCircle, label: "Batch Chat", desc: "Chat with batchmates in real time.", color: "bg-rose-50 text-rose-600", link: "/announcements" },
  { icon: Heart, label: "Donations", desc: "Support our batch community fund.", color: "bg-pink-50 text-pink-600", link: "/donations" },
  { icon: HelpCircle, label: "Help & Support", desc: "Reach out privately for any support.", color: "bg-orange-50 text-orange-600", link: "/support" },
  { icon: Trophy, label: "Achievements", desc: "Celebrate our batch's proud moments.", color: "bg-yellow-50 text-yellow-600", link: "/about" },
];

const TIMELINE = [
  { year: "1985", label: "Graduation", desc: "Our proud batch graduated from Govt. Siddhartha Medical College" },
  { year: "2000", label: "Reunion", desc: "First major reunion — 15 years of friendship celebrated" },
  { year: "2010", label: "Reunion", desc: "Silver jubilee gathering with 100+ batchmates" },
  { year: "2020", label: "Reunion", desc: "Virtual and in-person celebration during challenging times" },
  { year: "2025", label: "Grand Reunion", desc: "40 years together — the grandest celebration yet!" },
];

function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background photo */}
        <img
          src="/assets/simcosa-stage.jpeg"
          alt="SIMCOSA Reunion"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Warm bright overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/75 via-amber-800/60 to-yellow-700/50" />

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-500/90 text-amber-950 font-bold text-sm px-4 py-1.5 rounded-full mb-6 shadow-lg">
            <Star className="h-4 w-4 fill-amber-950" />
            Alumni Portal · Est. 1984–85
          </div>
          <h1 className="text-white drop-shadow-xl" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', lineHeight: 1.1 }}>
            SIMCOSA <span className="text-amber-300">1984–85</span> Batch
          </h1>
          <p className="mt-4 text-2xl sm:text-3xl font-display font-semibold text-amber-200 drop-shadow">
            Reconnect. Celebrate. Support.
          </p>
          <p className="mt-4 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Friends for life since Govt. Siddhartha Medical College, Vijayawada.
            Our private space to relive memories, plan reunions, and stand by each other.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold h-14 px-8 text-lg rounded-2xl shadow-xl transition-all hover:scale-105">
                <Users className="h-5 w-5 mr-2" /> Join Community
              </Button>
            </Link>
            <Link to="/_authenticated/memories">
              <Button size="lg" variant="outline" className="bg-white/15 border-white/50 text-white hover:bg-white/25 font-bold h-14 px-8 text-lg rounded-2xl backdrop-blur-sm">
                <BookOpen className="h-5 w-5 mr-2" /> View Memories
              </Button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/15 backdrop-blur-md rounded-2xl py-4 px-3 border border-white/20">
                <p className="text-2xl sm:text-3xl font-display font-bold text-amber-300">{s.value}</p>
                <p className="text-xs text-white/80 mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 animate-bounce text-sm">↓</div>
      </section>

      {/* ── QUICK FEATURES ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-amber-50/60 to-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Everything in One Place</p>
            <h2>Your Batch Portal Features</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-lg">
              A private, members-only space built with love for our batch — everything you need to stay connected.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, label, desc, color, link }) => (
              <Link to={link} key={label} className="group bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{label}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                <div className="mt-4 flex items-center gap-1 text-amber-600 text-sm font-semibold group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── REUNION HIGHLIGHTS ── */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Our Journey Together</p>
            <h2>Celebrating Friendship Since 1985</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-lg">Four decades of bonds, laughter, and love — a glimpse of our journey together.</p>
          </div>

          {/* Stage photo */}
          <div className="relative rounded-3xl overflow-hidden mb-12 shadow-2xl">
            <img
              src="/assets/hero-reunion.jpeg"
              alt="SIMCOSA 85 Celebration"
              className="w-full h-72 sm:h-96 object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="font-display text-2xl font-bold">SIMCOSA 85 — Celebrating Friendship</p>
              <p className="text-white/80 mt-1">Our latest grand gathering</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="hidden sm:block absolute top-7 left-0 right-0 h-0.5 bg-amber-200 z-0" />
            <div className="grid sm:grid-cols-5 gap-6 relative z-10">
              {TIMELINE.map((t, i) => (
                <div key={t.year} className="flex flex-col items-center text-center">
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center font-display font-bold text-lg shadow-lg border-4 ${i === TIMELINE.length - 1 ? 'bg-amber-500 text-white border-amber-300' : 'bg-white text-amber-700 border-amber-400'}`}>
                    {t.year.slice(2)}
                  </div>
                  <p className="mt-3 font-bold text-gray-900 text-base">{t.year}</p>
                  <p className="text-amber-600 font-semibold text-sm">{t.label}</p>
                  <p className="mt-1 text-gray-500 text-sm leading-snug">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MEMBER SPOTLIGHT ── */}
      <section className="py-20 px-4 bg-amber-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Member Spotlight</p>
            <h2>Faces of Our Batch</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-lg">Proud batchmates from Govt. Siddhartha Medical College — doctors, leaders, and lifelong friends.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Real member card */}
            {/* Placeholder cards with photos */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-amber-100 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="relative h-56">
                <img src="/assets/simcosa-stage.jpeg" alt="Reunion" className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-amber-900/40 flex items-center justify-center">
                  <p className="text-white font-display text-xl font-bold text-center px-4">Join to See All Members</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-gray-900">186+ Batchmates</h3>
                <p className="text-amber-600 font-semibold text-sm mt-1">Registered & Connected</p>
                <p className="text-gray-500 mt-3 text-sm">Doctors, professors, entrepreneurs and more — all from our beloved batch.</p>
                <Link to="/auth" className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-sm hover:gap-3 transition-all">
                  Join to Connect <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Birthday/event card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-amber-100 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="relative h-56">
                <img src="/assets/birthday-event.jpeg" alt="Celebration" className="w-full h-full object-cover object-center" />
                <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">Celebration</div>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-gray-900">Batch Celebrations</h3>
                <p className="text-amber-600 font-semibold text-sm mt-1">Birthdays, Milestones & More</p>
                <p className="text-gray-500 mt-3 text-sm">We celebrate every moment together — from birthdays to achievements and special milestones.</p>
                <Link to="/_authenticated/events" className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-sm hover:gap-3 transition-all">
                  View Events <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALLERY PREVIEW ── */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Moments That Last Forever</p>
              <h2>A Glimpse of Our Journey</h2>
            </div>
            <Link to="/gallery">
              <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50 font-bold rounded-xl px-6">
                View Full Gallery <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Row 1 — large feature + 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="col-span-2 sm:col-span-1 row-span-2">
              <div className="rounded-2xl overflow-hidden h-72 sm:h-full shadow-md">
                <img src="/assets/hero-reunion.jpeg" alt="Yellow shirt reunion" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md">
              <img src="/assets/batch-wedding.jpeg" alt="Batch wedding celebration" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md">
              <img src="/assets/batch-formal.jpeg" alt="Batchmates formal" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md">
              <img src="/assets/madhavi-latha.jpeg" alt="Dr. Madhavi Latha" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md">
              <img src="/assets/batchmates-porch.jpeg" alt="Batchmates" className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          {/* Row 2 — remaining photos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md">
              <img src="/assets/simcosa-stage.jpeg" alt="SIMCOSA 85" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md">
              <img src="/assets/family-moment.jpeg" alt="Family moment" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md">
              <img src="/assets/batch-friends.jpeg" alt="Batchmates together" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="rounded-2xl overflow-hidden h-36 sm:h-44 shadow-md">
              <img src="/assets/batch-event.jpeg" alt="Batch event" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          <div className="text-center mt-8">
            <Link to="/gallery">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 h-12 rounded-2xl shadow-md">
                <Camera className="h-5 w-5 mr-2" /> View Full Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── MEMORIES PREVIEW ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-amber-50 to-orange-50/50">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Memories Wall</p>
            <h2>Stories That Warm Our Hearts</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">Batchmates sharing their most cherished memories from our college days and beyond.</p>
          </div>

          <div className="space-y-5">
            {[
              { name: "Dr. Ravi Kumar", time: "2 days ago", text: "I still remember our first day in the anatomy lab — we were terrified but we laughed so much. Those days at Siddhartha shaped everything I became as a doctor.", likes: 24, comments: 8 },
              { name: "Dr. Sunitha Rao", time: "5 days ago", text: "The reunions we have every few years remind me why medicine wasn't just a career — it was a journey we took together. Missing everyone today. 💛", likes: 41, comments: 15 },
            ].map(m => (
              <div key={m.name} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center font-display text-xl font-bold text-amber-700 shrink-0">
                    {m.name.charAt(3)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.time}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{m.text}</p>
                <div className="mt-4 flex items-center gap-6 text-gray-400 text-sm">
                  <span className="flex items-center gap-1.5 cursor-pointer hover:text-rose-500"><Heart className="h-4 w-4" /> {m.likes} Likes</span>
                  <span className="flex items-center gap-1.5 cursor-pointer hover:text-amber-600"><MessageCircle className="h-4 w-4" /> {m.comments} Comments</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/auth">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 h-12 rounded-2xl shadow-md">
                <BookOpen className="h-5 w-5 mr-2" /> Share Your Memory
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-4 bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-white" style={{ fontFamily: '"Playfair Display", serif' }}>Ready to Reconnect with Your Batchmates?</h2>
          <p className="mt-4 text-amber-100 text-lg max-w-xl mx-auto">
            Create an account and get approved to access the full members portal — directory, gallery, memories and more.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50 font-bold h-14 px-10 text-lg rounded-2xl shadow-xl">
                Join the Portal
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="border-white/60 text-white hover:bg-white/15 font-bold h-14 px-8 text-lg rounded-2xl">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
