import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-[#0d0d12] text-white py-20 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 mb-8 text-white/70 hover:text-white text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to home</span>
                </Link>

                <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
                <p className="text-gray-400 mb-8">Last Updated: 12th Dec 2025</p>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">What Are Cookies</h2>
                        <p>
                            Cookies are small data files stored on your device to recognise you, remember preferences, and enhance your experience on Vidholdify.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Types of Cookies We Use</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong className="text-white">Essential Cookies</strong>
                                <br />
                                Required for the platform to function (login, authentication, session stability).
                            </li>
                            <li>
                                <strong className="text-white">Performance & Analytics Cookies</strong>
                                <br />
                                Help us understand how users interact with Vidholdify, identify errors, and improve speed and performance.
                            </li>
                            <li>
                                <strong className="text-white">Functional Cookies</strong>
                                <br />
                                Remember your preferences (language, settings, saved choices) to provide a smoother experience.
                            </li>
                            <li>
                                <strong className="text-white">Marketing Cookies</strong>
                                <br />
                                Optional third-party cookies used to personalise communication, track conversions, and show relevant content.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Consent</h2>
                        <p>
                            On your first visit, we request your consent for any <strong className="text-white">non-essential</strong> cookies.
                        </p>
                        <p className="mt-2">You can adjust or withdraw your cookie preferences at any time through the cookie settings panel.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Third Parties</h2>
                        <p>
                            Some cookies may be placed by trusted third-party providers for analytics, embedded services, or marketing.
                        </p>
                        <p className="mt-2">Their usage is governed by their respective privacy and cookie policies.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Managing Cookies</h2>
                        <p>You may disable or delete cookies through your browser settings.</p>
                        <p className="mt-2">
                            Please note: disabling essential cookies may limit certain features or prevent parts of Vidholdify from working properly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Updates to This Policy</h2>
                        <p>We may update this Cookie Policy to reflect changes in cookie usage or legal requirements.</p>
                        <p className="mt-2">The latest revision date will always be shown at the top of this page.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
