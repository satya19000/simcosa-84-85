import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Heart, Users, BookOpen, Star, MapPin } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Our Batch — SIMCOSA 84–85" },
      { name: "description", content: "The story of the SIMCOSA 1984–85 batch of Govt. Siddhartha Medical College, Vijayawada — our college years, journeys, and the bond we still share." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div>
      {/* Hero banner */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/assets/college-logo.png"
              alt="SIMCOSA Logo"
              className="h-24 w-24 rounded-full object-cover ring-4 ring-amber-400 shadow-xl"
            />
          </div>
          <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-3">About Our Batch</p>
          <h1>SIMCOSA <span className="text-amber-500">1984–85</span> Batch</h1>
          <p className="text-amber-700 font-display text-xl mt-2">Govt. Siddhartha Medical College, Vijayawada</p>
          <p className="mt-5 text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            We are the proud 1984–85 alumni of Government Siddhartha Medical College. Decades later,
            we are still bound by the friendships, the teachers, the corridors, and the countless
            moments that shaped who we became.
          </p>
          <p className="mt-4 text-xl font-display italic text-amber-700">"Once Siddhartha, Always Siddhartha."</p>
        </div>
      </section>

      {/* About the college */}
      <section className="py-16 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-3">Our Alma Mater</p>
              <h2>Govt. Siddhartha Medical College</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Government Siddhartha Medical College, Vijayawada — established in 1959 — is one of
                the premier medical institutions of Andhra Pradesh. Named after the founder of Buddhism,
                the college has produced thousands of distinguished doctors who serve across India and the world.
              </p>
              <p className="mt-3 text-gray-600 leading-relaxed">
                For our batch, this was more than a college — it was our home, our training ground,
                and the place where lifelong bonds were forged in the fires of rigorous medical education.
              </p>
              <div className="mt-4 flex items-center gap-2 text-gray-500">
                <MapPin className="h-5 w-5 text-amber-500" />
                <span>Vijayawada, Andhra Pradesh, India</span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img src="/assets/simcosa-stage.jpeg" alt="SIMCOSA Celebration" className="w-full h-72 object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* About SIMCOSA batch */}
      <section className="py-16 px-4 bg-amber-50">
        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl overflow-hidden shadow-xl order-2 md:order-1">
              <img src="/assets/hero-reunion.jpeg" alt="SIMCOSA Reunion" className="w-full h-72 object-cover" />
            </div>
            <div className="order-1 md:order-2">
              <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-3">Our Story</p>
              <h2>The SIMCOSA 84–85 Story</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                SIMCOSA 1984–85 is the alumni batch of Govt. Siddhartha Medical College, Vijayawada.
                We entered college in 1984 and graduated as doctors in 1989–90 — five years of shared
                struggle, laughter, learning, and unforgettable memories.
              </p>
              <p className="mt-3 text-gray-600 leading-relaxed">
                This portal is our digital home — a place to keep in touch, plan reunions, share old
                photographs, celebrate each other's achievements, remember those we have lost, and
                be there for each other when life gets difficult.
              </p>
              <p className="mt-3 text-gray-600 leading-relaxed font-semibold">
                186+ batchmates strong. 12 reunions. Thousands of memories. One family.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-3">Our Mission</p>
            <h2>What We Stand For</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Heart, color: "bg-rose-50 text-rose-500", title: "Reconnect", desc: "Bridge distances and decades. Find your batchmates, share phone numbers, and reignite friendships that shaped your life." },
              { icon: BookOpen, color: "bg-amber-50 text-amber-500", title: "Remember", desc: "Preserve and celebrate our shared history — the professors who inspired us, the moments that defined us, the friends we'll never forget." },
              { icon: Users, color: "bg-emerald-50 text-emerald-500", title: "Support", desc: "Be there for each other through life's challenges. Medical advice, moral support, or just a friendly voice — we have each other's backs." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-7 shadow-sm border border-amber-100 hover:shadow-md transition-shadow text-center">
                <div className={`inline-flex p-4 rounded-2xl ${color} mb-5`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900">{title}</h3>
                <p className="mt-3 text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key facts */}
      <section className="py-16 px-4 bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "186+", label: "Registered Members" },
              { value: "12", label: "Reunions Held" },
              { value: "40+", label: "Years of Friendship" },
              { value: "1984", label: "Year We Met" },
            ].map(s => (
              <div key={s.label}>
                <p className="font-display text-4xl font-bold text-white">{s.value}</p>
                <p className="text-amber-100 mt-1 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy and join */}
      <section className="py-16 px-4 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-amber-50 rounded-2xl p-7 border border-amber-200">
              <div className="inline-flex p-3 bg-amber-100 rounded-xl mb-4">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900">Our Promise</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Privacy first. Your phone number and personal details are visible only to other approved
                batchmates — never to the public. Your data stays within our trusted community.
              </p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-7 border border-emerald-200">
              <div className="inline-flex p-3 bg-emerald-100 rounded-xl mb-4">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900">How to Join</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Sign up with your name and email. An admin will verify you are from our batch and
                approve your access — usually within a day. Once approved, you'll have full access.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link to="/auth">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-14 px-10 text-lg rounded-2xl shadow-lg">
                Join Our Batch Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
