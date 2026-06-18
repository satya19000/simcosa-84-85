import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Clock, XCircle, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pending-approval")({
  head: () => ({ meta: [{ title: "Approval Pending — SIMCOSA 84–85" }] }),
  component: PendingApprovalPage,
});

function PendingApprovalPage() {
  const { profile, isAdmin } = useAuth();
  const status = profile?.approval_status ?? "pending";

  const content = (() => {
    if (isAdmin || status === "approved") {
      return {
        icon: <Clock className="h-10 w-10 text-amber-500" />,
        title: "You're all set!",
        message: "Your account is approved. You can now access the members area.",
      };
    }
    if (status === "rejected") {
      return {
        icon: <XCircle className="h-10 w-10 text-red-500" />,
        title: "Membership not approved",
        message: "Your membership request was not approved. Please contact admin.",
      };
    }
    if (status === "needs_clarification") {
      return {
        icon: <HelpCircle className="h-10 w-10 text-amber-500" />,
        title: "More details needed",
        message:
          "Admin needs more details from you before approving your membership. Please update your profile or contact admin.",
      };
    }
    return {
      icon: <Clock className="h-10 w-10 text-amber-500" />,
      title: "Awaiting admin approval",
      message:
        "Your account has been created. Please wait for admin approval. You'll be able to access members-only pages once an admin approves your account.",
    };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-8 max-w-md w-full text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          {content.icon}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
        <p className="text-gray-500 mt-3 text-base">{content.message}</p>

        {profile && (
          <div className="mt-6 rounded-xl bg-amber-50/60 border border-amber-100 p-4 text-left text-sm text-gray-600 space-y-1">
            <p><span className="font-semibold text-gray-700">Name:</span> {profile.full_name}</p>
            {profile.email && <p><span className="font-semibold text-gray-700">Email:</span> {profile.email}</p>}
            {profile.phone && <p><span className="font-semibold text-gray-700">Phone:</span> {profile.phone}</p>}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <a href="/profile">
            <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl">
              Edit my profile
            </Button>
          </a>
          <a href="/">
            <Button variant="outline" className="w-full h-12 rounded-xl">
              Back to Home
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
