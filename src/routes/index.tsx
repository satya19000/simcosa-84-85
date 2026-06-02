import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Camera, Heart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SIMCOSA 84–85 Batch Portal — Home" },
      { name: "description", content: "Welcome to the official online home of the SIMCOSA 1984–85 batch." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-gold font-semibold tracking-widest uppercase text-sm">Alumni Portal</p>
            <h1 className="mt-3 text-primary-foreground">SIMCOSA <span className="text-gold">1984–85</span> Batch</h1>
            <p className="mt-5 text-lg text-primary-foreground/85 max-w-xl">
              Our private space to stay connected, plan reunions, share old photos, and stand by each
              other through life's moments — big and small.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth"><Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 h-12 px-6 text-base">Join the Portal</Button></Link>
              <Link to="/about"><Button size="lg" variant="outline" className="h-12 px-6 text-base bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-white/10">About Our Batch</Button></Link>
            </div>
          </div>
          <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gold/30 to-white/10 border-2 border-dashed border-gold/40 flex items-center justify-center text-primary-foreground/70 text-center p-6">
            <div>
              <p className="font-display text-2xl text-gold">Batch Photo</p>
              <p className="mt-2 text-sm">Admins can upload the official batch group photo here.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <h2 className="text-center">What's inside</h2>
        <p className="text-center text-muted-foreground mt-2 max-w-2xl mx-auto">A private, members-only space built for our batch.</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Users, t: "Members Directory", d: "Find any classmate's phone, WhatsApp, email & city." },
            { icon: Calendar, t: "Events & Reunions", d: "RSVP for the next get-together with one tap." },
            { icon: Camera, t: "Photo Gallery", d: "Share old school photos and recent reunion snaps." },
            { icon: Heart, t: "Help & Support", d: "Reach out privately for medical, family or other help." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <Icon className="h-8 w-8 text-gold" />
              <h3 className="mt-3 text-xl">{t}</h3>
              <p className="text-muted-foreground mt-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Photos placeholder */}
      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid md:grid-cols-2 gap-6">
          {[
            { t: "Our School & College", d: "A picture of where it all began." },
            { t: "Reunion Memories", d: "From our last get-together." },
          ].map((x) => (
            <div key={x.t} className="aspect-[16/10] rounded-xl border-2 border-dashed border-primary/30 bg-card flex items-center justify-center text-center p-6">
              <div>
                <p className="font-display text-2xl text-primary">{x.t}</p>
                <p className="text-muted-foreground mt-2">{x.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
        <h2>Ready to reconnect?</h2>
        <p className="mt-3 text-muted-foreground">Create an account and an admin will approve you shortly.</p>
        <Link to="/auth"><Button size="lg" className="mt-6 h-12 px-8 text-base">Login or Signup</Button></Link>
      </section>
    </div>
  );
}
