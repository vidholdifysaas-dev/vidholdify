"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/10 bg-transparent backdrop-blur-md">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                {/* Left: Logo */}
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                        <Image
                            src="/Full_logo.svg"
                            alt="Vidholdify Logo"
                            width={130}
                            height={40}
                            className="object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* Center: Desktop Navigation */}
                <div className="hidden lg:flex lg:gap-x-8">
                    <button onClick={() => scrollToSection("features")} className="text-sm font-semibold leading-6 text-foreground/80 hover:text-foreground transition-colors">
                      Features
                    </button>
                    <button onClick={() => scrollToSection("how-it-works")} className="text-sm font-semibold leading-6 text-foreground/80 hover:text-foreground transition-colors">
                        How it works
                    </button>
                    <button onClick={() => scrollToSection("pricing")} className="text-sm font-semibold leading-6 text-foreground/80 hover:text-foreground transition-colors">
                        Pricing
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-1 items-center justify-end gap-x-4">
                    <SignedOut>
                        <Link
                            href="/sign-in"
                            className="hidden lg:block px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-white/5 transition text-foreground"
                        >
                            Sign in
                        </Link>
                        <Link href="/sign-up">
                            <button className="hidden lg:block btn-primary px-4 py-2 rounded-lg text-sm cursor-pointer font-semibold">
                                Sign up
                            </button>
                        </Link>
                    </SignedOut>

                    <SignedIn>
                        <div className="hidden lg:flex lg:items-center lg:gap-x-4">
                            <Link href="/dashboard">
                                <button className="px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-white/5 transition text-foreground">
                                    Dashboard
                                </button>
                            </Link>
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9 ring-2 ring-brand-primary/40 hover:ring-brand-primary transition-all",
                                        userButtonPopoverActionButton__manageAccount: "!text-white",
                                        userButtonPopoverActionButton__signOut: "!text-white",
                                        userButtonPopoverCard: "bg-black/95 backdrop-blur-xl border border-brand-primary/30 shadow-2xl",
                                        userButtonPopoverActionButton: "text-white hover:bg-brand-primary/20 px-3 py-2 rounded-md transition",
                                        userButtonPopoverActionButtonText: "text-white",
                                        userButtonPopoverActionButtonIcon: "text-white",
                                        userButtonPopoverFooter: "bg-black/95 border-t border-brand-primary/20",
                                        userPreviewMainIdentifier: "text-white",
                                        userPreviewSecondaryIdentifier: "text-white/60",
                                        card: "bg-black/95 backdrop-blur-xl text-white border border-brand-primary/30 shadow-2xl",
                                        headerTitle: "text-white",
                                        headerSubtitle: "text-white/60",
                                        navbar: "bg-black/90 backdrop-blur-xl border-r border-brand-primary/20",
                                        navbarButton: "text-white hover:bg-brand-primary/20 transition",
                                        pageScrollBox: "bg-black/95 backdrop-blur-xl text-white",
                                        scrollBox: "bg-black/95",
                                        formFieldLabel: "text-white",
                                        formFieldInput: "bg-black border border-brand-primary/40 text-white placeholder-white/40 focus:border-brand-primary",
                                        formButtonPrimary: "bg-brand-primary hover:bg-brand-primary-dark text-white shadow",
                                        badge: "bg-brand-primary/20 text-brand-primary",
                                        menuList: "bg-black/95 backdrop-blur-xl border border-brand-primary/30",
                                        menuItem: "text-white hover:bg-brand-primary/20",
                                        menuButton: "text-white hover:bg-brand-primary/20",
                                        userButtonPopoverMain: "bg-black/95",
                                        userButtonPopoverActions: "bg-black/95",
                                        footerAction: "text-white hover:bg-brand-primary/20",
                                        footerActionLink: "text-white hover:text-brand-primary",
                                        footerActionText: "text-white",
                                    },
                                    variables: {
                                        colorPrimary: "#413BFA",
                                        colorText: "white",
                                        colorBackground: "#0a0a0a",
                                        colorInputBackground: "black",
                                        colorInputText: "white",
                                        colorTextSecondary: "rgba(255,255,255,0.7)",
                                        colorDanger: "#ef4444",
                                        colorTextOnPrimaryBackground: "white",
                                    }
                                }}
                            />
                        </div>
                    </SignedIn>

                    {/* Mobile UserButton - visible only on mobile */}
                    <SignedIn>
                        <div className="lg:hidden">
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9 ring-2 ring-brand-primary/40 hover:ring-brand-primary transition-all",
                                        userButtonPopoverActionButton__manageAccount: "!text-white",
                                        userButtonPopoverActionButton__signOut: "!text-white",
                                        userButtonPopoverCard: "bg-black/95 backdrop-blur-xl border border-brand-primary/30 shadow-2xl",
                                        userButtonPopoverActionButton: "text-white hover:bg-brand-primary/20 px-3 py-2 rounded-md transition",
                                        userButtonPopoverActionButtonText: "text-white",
                                        userButtonPopoverActionButtonIcon: "text-white",
                                        userButtonPopoverFooter: "bg-black/95 border-t border-brand-primary/20",
                                        userPreviewMainIdentifier: "text-white",
                                        userPreviewSecondaryIdentifier: "text-white/60",
                                        card: "bg-black/95 backdrop-blur-xl text-white border border-brand-primary/30 shadow-2xl",
                                        headerTitle: "text-white",
                                        headerSubtitle: "text-white/60",
                                        navbar: "bg-black/90 backdrop-blur-xl border-r border-brand-primary/20",
                                        navbarButton: "text-white hover:bg-brand-primary/20 transition",
                                        pageScrollBox: "bg-black/95 backdrop-blur-xl text-white",
                                        scrollBox: "bg-black/95",
                                        formFieldLabel: "text-white",
                                        formFieldInput: "bg-black border border-brand-primary/40 text-white placeholder-white/40 focus:border-brand-primary",
                                        formButtonPrimary: "bg-brand-primary hover:bg-brand-primary-dark text-white shadow",
                                        badge: "bg-brand-primary/20 text-brand-primary",
                                        menuList: "bg-black/95 backdrop-blur-xl border border-brand-primary/30",
                                        menuItem: "text-white hover:bg-brand-primary/20",
                                        menuButton: "text-white hover:bg-brand-primary/20",
                                        userButtonPopoverMain: "bg-black/95",
                                        userButtonPopoverActions: "bg-black/95",
                                        footerAction: "text-white hover:bg-brand-primary/20",
                                        footerActionLink: "text-white hover:text-brand-primary",
                                        footerActionText: "text-white",
                                    },
                                    variables: {
                                        colorPrimary: "#413BFA",
                                        colorText: "white",
                                        colorBackground: "#0a0a0a",
                                        colorInputBackground: "black",
                                        colorInputText: "white",
                                        colorTextSecondary: "rgba(255,255,255,0.7)",
                                        colorDanger: "#ef4444",
                                        colorTextOnPrimaryBackground: "white",
                                    }
                                }}
                            />
                        </div>
                    </SignedIn>

                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground lg:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span className="sr-only">Open main menu</span>
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" aria-hidden="true" />
                        ) : (
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-black/70 backdrop-blur-xl z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu */}
            <div
                className={`lg:hidden fixed top-20 left-4 right-4 rounded-2xl border border-white/30 p-5 shadow-2xl bg-black/95 backdrop-blur-2xl z-50 transition-all duration-300 ease-in-out origin-top ${isMobileMenuOpen
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
                    }`}
            >
                <div className="space-y-4">
                    <button onClick={() => scrollToSection("features")} className="block w-full text-left text-base font-semibold leading-7 text-foreground hover:bg-white/5 p-2 rounded-lg transition-colors">
                      Features
                    </button>
                    <button onClick={() => scrollToSection("how-it-works")} className="block w-full text-left text-base font-semibold leading-7 text-foreground hover:bg-white/5 p-2 rounded-lg transition-colors">
                        How it works
                    </button>
                    <button onClick={() => scrollToSection("pricing")} className="block w-full text-left text-base font-semibold leading-7 text-foreground hover:bg-white/5 p-2 rounded-lg transition-colors">
                        Pricing
                    </button>

                    <div className="border-t border-border/10">
                        <SignedOut>
                            <Link href="/sign-in" className="block px-4 mb-3 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-white/5 transition text-foreground text-center">
                                Sign in
                            </Link>
                            <Link href="/sign-up" className="block w-full">
                                <button className="btn-primary w-full px-4 py-3 rounded-lg text-sm font-semibold shadow-lg">
                                    Sign up
                                </button>
                            </Link>
                        </SignedOut>
                        <SignedIn>
                            <Link href="/dashboard" className="block w-full mb-4">
                                <button className="btn-primary w-full px-4 py-3 rounded-lg text-sm font-semibold shadow-lg">
                                    Dashboard
                                </button>
                            </Link>
                        </SignedIn>
                    </div>
                </div>
            </div>
        </header>
    );
}