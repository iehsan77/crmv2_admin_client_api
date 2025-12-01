"use client";

import Link from "next/link";
import SignupForm from "@/partials/auth/signup/SignupForm";

export default function SignupPage() {

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Get started with SaaS CRM to transform your customer relationships
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 md:p-6 shadow-sm">
      
        <SignupForm />

      </div>

      <Links />

    </>
  );
}

const Links = () => {
  return (
    <div className="items-center">
      <div className="text-sm text-center">
        <span className="text-muted-foreground">
          Already have an account?
        </span>{" "}
        <Link href="/login" className="font-medium underline underline-offset-4 hover:text-primary transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
};
