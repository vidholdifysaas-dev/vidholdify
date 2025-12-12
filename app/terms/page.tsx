import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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

                <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
                <p className="text-gray-400 mb-8">Last Updated: 12th Dec 2025</p>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Acceptance</h2>
                        <p>
                            Using <strong className="text-white">Vidholdify</strong> (&quot;the Service&quot;) constitutes your agreement to these Terms of Service.
                        </p>
                        <p className="mt-2">If you do not agree, please do not use the platform.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Service</h2>
                        <p>
                            Vidholdify provides an AI-powered platform that creates AI avatar marketing videos based on the content, inputs, and media you provide.
                        </p>
                        <p className="mt-2">Features, availability, pricing, and functionality may change at any time.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Accounts</h2>
                        <p className="mb-2">You are responsible for:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Maintaining the confidentiality of your login credentials</li>
                            <li>All actions taken under your account</li>
                            <li>Providing accurate, up-to-date information</li>
                        </ul>
                        <p className="mt-2">We may suspend accounts that contain misleading information or violate these Terms.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">User Content</h2>
                        <p className="mb-2">You retain full ownership of the content you upload or generate through the Service.</p>
                        <p className="mb-2">
                            By using Vidholdify, you grant us a <strong className="text-white">worldwide, non-exclusive, royalty-free license</strong> to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Use</li>
                            <li>Host</li>
                            <li>Process</li>
                            <li>Reproduce</li>
                            <li>Display</li>
                        </ul>
                        <p className="mt-2">—solely for the purpose of operating, improving, and providing the Service.</p>
                        <p className="mt-4 mb-2">You confirm that:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>You have the rights to upload any content you provide</li>
                            <li>Your content does not violate intellectual property rights, privacy rights, or any applicable laws</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Acceptable Use</h2>
                        <p className="mb-2">You agree <strong className="text-white">not</strong> to upload or generate content that is:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Illegal or infringing</li>
                            <li>Defamatory, hateful, abusive, or harassing</li>
                            <li>Pornographic or sexually explicit</li>
                            <li>Violent, harmful, or malicious</li>
                            <li>Misleading, fraudulent, or used for impersonation</li>
                            <li>Designed to exploit, harm, or deceive others</li>
                        </ul>
                        <p className="mt-2">We may remove content and suspend or terminate accounts for violations of these rules.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Fees & Payment</h2>
                        <p className="mb-2">Where applicable:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Fees are listed at the time of purchase</li>
                            <li>Subscriptions renew automatically unless cancelled</li>
                            <li>You may cancel your subscription at any time</li>
                            <li>Refunds follow Vidholdify&apos;s published refund policy</li>
                        </ul>
                        <p className="mt-2">We may change pricing with reasonable notice.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Disclaimer</h2>
                        <p className="mb-2">To the fullest extent permitted by law:</p>
                        <p className="mb-2">
                            Vidholdify is provided <strong className="text-white">&quot;as is&quot;</strong> and <strong className="text-white">&quot;as available.&quot;</strong>
                        </p>
                        <p className="mb-2">We do not guarantee uninterrupted service, accuracy of results, or suitability for any specific purpose.</p>
                        <p>No warranties are provided beyond those required by law.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
                        <p className="mb-2">To the maximum extent permitted:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Vidholdify is not liable for indirect, incidental, special, or consequential damages</li>
                            <li>We are not responsible for loss of revenue, profits, data, reputation, or business opportunities</li>
                            <li>Our total liability is limited to the amount paid by you in the last 3 months (if any)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Termination</h2>
                        <p className="mb-2">We may suspend or terminate your access if:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>You violate these Terms</li>
                            <li>Your account is inactive for an extended period</li>
                            <li>We are required by law or operational necessity</li>
                        </ul>
                        <p className="mt-2">You may cancel your account via your dashboard or billing portal.</p>
                        <p>Termination does not affect obligations incurred prior to termination.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of <strong className="text-white">New South Wales, Australia</strong>, excluding conflict-of-law principles.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Changes</h2>
                        <p>We may update these Terms from time to time.</p>
                        <p>Material updates will be posted here along with an updated &quot;Last Updated&quot; date.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
