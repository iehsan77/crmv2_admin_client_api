//import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
//import { LoginForm } from "@/components/auth/login-form";
import React from "react";




// Dashboard preview as a data URL for guaranteed loading
const DASHBOARD_PREVIEW = `data:image/svg+xml,%3Csvg width='800' height='500' viewBox='0 0 800 500' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='500' rx='8' fill='%231E293B'/%3E%3Crect width='800' height='60' fill='%230F172A'/%3E%3Ccircle cx='30' cy='30' r='20' fill='%233B82F6'/%3E%3Crect x='70' y='20' width='100' height='20' rx='4' fill='%23334155'/%3E%3Crect x='650' y='20' width='120' height='20' rx='4' fill='%23334155'/%3E%3Crect width='200' height='440' y='60' fill='%231E293B'/%3E%3Crect x='20' y='90' width='160' height='12' rx='2' fill='%23475569'/%3E%3Crect x='20' y='120' width='160' height='12' rx='2' fill='%23334155'/%3E%3Crect x='20' y='150' width='160' height='12' rx='2' fill='%23334155'/%3E%3Crect x='20' y='180' width='160' height='12' rx='2' fill='%23334155'/%3E%3Crect x='20' y='210' width='160' height='12' rx='2' fill='%23334155'/%3E%3Crect x='20' y='240' width='160' height='12' rx='2' fill='%23334155'/%3E%3Crect x='220' y='80' width='550' height='100' rx='4' fill='%230F172A'/%3E%3Crect x='240' y='100' width='180' height='16' rx='2' fill='%23475569'/%3E%3Crect x='240' y='130' width='120' height='12' rx='2' fill='%23334155'/%3E%3Crect x='240' y='150' width='120' height='12' rx='2' fill='%23334155'/%3E%3Crect x='220' y='200' width='170' height='120' rx='4' fill='%230F172A'/%3E%3Crect x='240' y='220' width='100' height='16' rx='2' fill='%23475569'/%3E%3Crect x='240' y='245' width='60' height='24' rx='2' fill='%233B82F6'/%3E%3Crect x='240' y='280' width='120' height='12' rx='2' fill='%23334155'/%3E%3Crect x='410' y='200' width='170' height='120' rx='4' fill='%230F172A'/%3E%3Crect x='430' y='220' width='100' height='16' rx='2' fill='%23475569'/%3E%3Crect x='430' y='245' width='60' height='24' rx='2' fill='%2310B981'/%3E%3Crect x='430' y='280' width='120' height='12' rx='2' fill='%23334155'/%3E%3Crect x='600' y='200' width='170' height='120' rx='4' fill='%230F172A'/%3E%3Crect x='620' y='220' width='100' height='16' rx='2' fill='%23475569'/%3E%3Crect x='620' y='245' width='60' height='24' rx='2' fill='%23F59E0B'/%3E%3Crect x='620' y='280' width='120' height='12' rx='2' fill='%23334155'/%3E%3Crect x='220' y='340' width='550' height='140' rx='4' fill='%230F172A'/%3E%3Crect x='240' y='360' width='150' height='16' rx='2' fill='%23475569'/%3E%3Crect x='240' y='390' width='120' height='12' rx='2' fill='%23334155'/%3E%3Crect x='380' y='390' width='120' height='12' rx='2' fill='%23334155'/%3E%3Crect x='520' y='390' width='120' height='12' rx='2' fill='%23334155'/%3E%3Crect x='660' y='390' width='80' height='12' rx='2' fill='%23334155'/%3E%3Crect x='240' y='420' width='120' height='12' rx='2' fill='%231E293B'/%3E%3Crect x='380' y='420' width='120' height='12' rx='2' fill='%231E293B'/%3E%3Crect x='520' y='420' width='120' height='12' rx='2' fill='%231E293B'/%3E%3Crect x='660' y='420' width='80' height='12' rx='2' fill='%231E293B'/%3E%3Crect x='240' y='450' width='120' height='12' rx='2' fill='%231E293B'/%3E%3Crect x='380' y='450' width='120' height='12' rx='2' fill='%231E293B'/%3E%3Crect x='520' y='450' width='120' height='12' rx='2' fill='%231E293B'/%3E%3Crect x='660' y='450' width='80' height='12' rx='2' fill='%231E293B'/%3E%3C/svg%3E`;

// Grid pattern as a data URL
const GRID_PATTERN = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0H100V100H0V0Z' fill='white' fill-opacity='0.05'/%3E%3Cpath d='M50 0V100' stroke='white' stroke-opacity='0.1'/%3E%3Cpath d='M0 50H100' stroke='white' stroke-opacity='0.1'/%3E%3Ccircle cx='50' cy='50' r='2' fill='white' fill-opacity='0.4'/%3E%3C/svg%3E`;

// Background pattern styles
const backgroundPattern = {
  backgroundImage: `url("${GRID_PATTERN}")`,
  backgroundSize: '100px 100px',
  backgroundRepeat: 'repeat',
  opacity: 0.2
};


export default function Layout({children}) {
  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden">
      {/* Left section (40% width) - Hidden on mobile, visible on desktop */}
      <div className="relative hidden h-full flex-col bg-primary p-6 md:p-10 text-white dark:border-r lg:flex lg:w-[40%] overflow-auto">
        <div className="absolute inset-0 bg-primary">
          <div className="absolute inset-0" style={backgroundPattern} />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary to-primary/80" />
        </div>
        
        {/* Logo and app name */}
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Image src="/images/short-logo.png" width={40} height={40} alt="Logo" className="me-2" />
          <div className="text-2xl">Businessify</div>
          <span className="ms-2 text-light text-2xl">SaaS CRM</span>
        </div>
        
        {/* Featured image - Increased size */}
        <div className="relative z-10 mx-auto my-8 flex h-[250px] md:h-[350px] w-full max-w-[450px] items-center justify-center">
          <Image 
            src={DASHBOARD_PREVIEW}
            alt="CRM Dashboard Preview" 
            className="object-contain rounded-lg shadow-2xl border border-primary-foreground/10"
            width={600}
            height={400}
            priority
          />
        </div>
        
        {/* Description and testimonial */}
        <div className="relative z-20 mt-auto space-y-6">
          <div className="flex flex-col space-y-4">
            <h2 className="text-xl md:text-2xl font-bold">Streamline Your Customer Relationships</h2>
            <p className="text-primary-foreground/80 text-sm md:text-base">
              Manage contacts, track deals, and boost your team's productivity with our all-in-one CRM solution.
            </p>
          </div>
          <blockquote className="space-y-2 border-l-2 border-primary-foreground/30 pl-4">
            <p className="text-base md:text-lg italic text-primary-foreground/90">
              &ldquo;This CRM has completely transformed how we manage our customer relationships and sales pipeline. It&apos;s intuitive, powerful, and remarkably flexible.&rdquo;
            </p>
            <footer className="text-xs md:text-sm font-medium text-primary-foreground/70">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">NR</div>
                <div>Noshad Rehmani, CEO at HatchTechs</div>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>
      
      {/* Right section (60% width) with integrated footer */}
      <div className="w-full lg:w-[60%] flex flex-col h-screen overflow-auto">
        <div className="flex-1 px-4 lg:px-8 py-8 flex items-center justify-center">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 max-w-sm md:max-w-md lg:max-w-lg">

            {/* Logo on mobile */}
            <div className="flex flex-col items-center space-y-2 text-center lg:hidden">
              <div className="flex items-center text-lg font-medium mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-6 w-6 text-primary"
                >
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                </svg>
                SaaS CRM
              </div>
            </div>

            {children}

          </div>
        </div>
        
        {/* Footer integrated within right panel */}
        <footer className="py-4 px-4 mt-auto border-t border-border bg-background">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-xs text-muted-foreground">
            <p>© 2023 SaaS CRM. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/contact" className="hover:underline hover:text-primary transition-colors">Contact</Link>
              <Link href="/help" className="hover:underline hover:text-primary transition-colors">Support</Link>
              <Link href="/privacy-policy" className="hover:underline hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:underline hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 