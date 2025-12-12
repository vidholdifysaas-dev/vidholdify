"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <footer className="w-full border-t border-white/10 py-5 pt-5 px-6 text-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
                {/* Logo */}
                <div>
                    <div className="flex items-center gap-1 mb-3">
                        <Image
                            src="/removebg-logo-white.png"
                            alt="VidShortify Logo"
                            width={30}
                            height={30}
                            className="object-contain"
                        />
                        <h3 className="text-xl font-bold">Vidholdify</h3>
                    </div>
                    <p className="text-white/70 text-sm mb-4">
                        The fastest AI Avatar marketing video generator.
                    </p>

                    {/* Solid Button */}
                    <Link href="/dashboard">
                        <button
                            className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-brand-primary/80"
                        >
                            Get started
                        </button>
                    </Link>
                </div>

                {/* Product Column */}
                <div>
                    <h4 className="font-semibold mb-3">Product</h4>
                    <ul className="text-gray-400 text-sm space-y-2">
                        <li>
                            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors">
                                How it works
                            </button>
                        </li>
                        <li>
                            <button onClick={() => scrollToSection("use-cases")} className="hover:text-white transition-colors">
                                Use cases
                            </button>
                        </li>
                        <li>
                            <button onClick={() => scrollToSection("pricing")} className="hover:text-white transition-colors">
                                Pricing
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Company Column */}
                <div>
                    <h4 className="font-semibold mb-3">Company</h4>
                    <ul className="text-gray-400 text-sm space-y-2">
                        <li>
                            <Link href="/privacy-policy" className="hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link href="/terms" className="hover:text-white transition-colors">
                                Terms of Service
                            </Link>
                        </li>
                        <li>
                            <Link href="/cookie-policy" className="hover:text-white transition-colors">
                                Cookie Policy
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-3">Features</h4>
                    <ul className="text-gray-400 text-sm space-y-2">
                        <li>
                            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors">
                                AI Shorts
                            </button>
                        </li>
                        <li>
                            <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors">
                                AI UGC
                            </button>
                        </li>
                        <li>
                            <button onClick={() => scrollToSection("pricing")} className="hover:text-white transition-colors">
                                Avatar marketing Video
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom */}
            <div className="text-center text-xs mt-10">
                © 2025 Vidholdify — All rights reserved.
            </div>
        </footer>
    );
}
