import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Our Batch — SIMCOSA 84–85" },
      { name: "description", content: "The story of the SIMCOSA 1984–85 batch — our school years, journeys, and the bond we still share." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <p className="text-gold font-semibold tracking-widest uppercase text-sm">About</p>
      <h1 className="mt-2">Our Batch</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        We are the 1984–85 batch of SIMCOSA. Decades later, we are still bound by the friendships, the
        teachers, the playgrounds, and the small daily moments that shaped who we became.
      </p>
      <p className="mt-4 text-lg text-muted-foreground">
        This portal is our quiet corner of the internet — a place to keep in touch, plan reunions,
        share old photographs, celebrate each other's achievements, remember those we have lost, and
        be there for each other when life gets difficult.
      </p>

      <div className="mt-10 grid sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3>Our promise</h3>
          <p className="mt-2 text-muted-foreground">
            Privacy first. Your phone number and personal details are visible only to other approved
            batchmates — never to the public.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3>How to join</h3>
          <p className="mt-2 text-muted-foreground">
            Sign up with your name and email. An admin will verify you are from our batch and approve
            access — usually within a day.
          </p>
        </div>
      </div>

      <div className="mt-10 aspect-[16/10] rounded-xl border-2 border-dashed border-primary/30 bg-secondary flex items-center justify-center text-center p-6">
        <div>
          <p className="font-display text-2xl text-primary">School / College Photo</p>
          <p className="text-muted-foreground mt-2">A picture of our alma mater goes here.</p>
        </div>
      </div>
    </div>
  );
}
