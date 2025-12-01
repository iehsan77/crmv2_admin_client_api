"use client";

import Link from "next/link";

import LineSeparator from "@/components/LineSeparator";
import SocialBtns from "@/partials/auth/login/SocialBtns";
import LoginForm from "@/partials/auth/login/LoginForm";

export default function LoginPage() {

  const columns=["name", "email", "phone", "status", "created_at"];

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to sign in to your account
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 md:p-6 shadow-sm">
      
        <LoginForm />


        {/* <LineSeparator comments="Or continue with" />        
        <SocialBtns />
         */}

      </div>

      <Links />

    </>
  );
}



const Links = () => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2">
      <div className="text-sm">
        <Link
          href="/reset-password"
          className="text-sm underline underline-offset-4 hover:text-primary transition-colors"
        >
          Forgot password?
        </Link>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">
          Don&apos;t have an account?
        </span>{" "}

        <Link href="/signup" className="font-medium underline underline-offset-4 hover:text-primary transition-colors">
          Sign up
        </Link>

      </div>
    </div>
  );
};
