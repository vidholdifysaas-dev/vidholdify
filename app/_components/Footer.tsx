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
            <div className="max-w-7xl mx-auto grid grid-cols-3 md:grid-cols-4 gap-6 md:gap-10">
                {/* Logo - Full width on mobile, 1 col on md+ */}
                <div className="col-span-3 md:col-span-1">
                    <Image
                        src="/Full_logo.svg"
                        alt="Vidholdify Logo"
                        width={150}
                        height={0}
                        className="object-contain"
                    />
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
                <div className="col-span-1">
                    <h4 className="font-semibold mb-3">Product</h4>
                    <ul className="text-gray-400 text-sm space-y-2">
                        <li>
                            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors">
                                How it works
                            </button>
                        </li>
                        <li>
                            <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors">
                                Features
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
                <div className="col-span-1">
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

                {/* Features Column */}
                <div className="col-span-1">
                    <h4 className="font-semibold mb-3">Features</h4>
                    <ul className="text-gray-400 text-sm space-y-2">
                        <li>
                            <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors">
                                AI UGC
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
