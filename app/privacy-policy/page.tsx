import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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

                <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-gray-400 mb-8">Last Updated: 12th Dec 2025</p>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <p>
                            {"Vidholdify (\"we\", \"us\", \"our\") collects and uses personal information to operate the platform, generate AI avatar marketing videos, enhance user experience, and fulfil service requests. We comply with applicable privacy laws, including the Australian Privacy Principles and GDPR where relevant."}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Data We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong className="text-white">Identity & Contact Information:</strong> Name, email address, organisation (when provided).
                            </li>
                            <li>
                                <strong className="text-white">Content Inputs:</strong> Uploaded videos, audio files, images, scripts, prompts, preferences, and other content required to generate videos.
                            </li>
                            <li>
                                <strong className="text-white">Usage Data:</strong> IP address, device/browser details, session logs, activity data, and interaction history within the product.
                            </li>
                            <li>
                                <strong className="text-white">Cookies & Tracking Technologies:</strong> Used for analytics, authentication, and improving performance. See our Cookie Policy for details.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Purpose of Processing</h2>
                        <p className="mb-2">We use personal data to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Provide, operate, and improve the Vidholdify video-generation service</li>
                            <li>Authenticate and manage user accounts</li>
                            <li>Process video generation requests</li>
                            <li>Respond to support enquiries</li>
                            <li>Personalise content, recommendations, and communication</li>
                            <li>Monitor security, detect fraud, and prevent misuse</li>
                            <li>Analyse usage to enhance product performance</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Legal Basis (GDPR – where applicable)</h2>
                        <p className="mb-2">For users in the EU/UK/EEA, our processing is based on:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white">Consent:</strong> analytics, marketing, optional cookies</li>
                            <li><strong className="text-white">Performance of a Contract:</strong> providing video generation and account services</li>
                            <li><strong className="text-white">Legitimate Interests:</strong> service improvement, security, troubleshooting—balanced with user rights</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Sharing & Disclosure</h2>
                        <p className="mb-2">We <strong className="text-white">do not sell</strong> personal data.</p>
                        <p className="mb-2">We may share data with:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white">Service Providers:</strong> hosting, analytics, cloud storage, payment processors—strictly under contractual obligations</li>
                            <li><strong className="text-white">Legal Authorities:</strong> where required by law</li>
                            <li><strong className="text-white">Business Transfers:</strong> if Vidholdify undergoes a merger, acquisition, or similar event (with prior notice where required)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
                        <p className="mb-2">We retain personal data only as long as necessary to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Provide services</li>
                            <li>Meet legal obligations</li>
                            <li>Resolve disputes</li>
                            <li>Maintain secure backups</li>
                        </ul>
                        <p className="mt-2">Users may request deletion at any time.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
                        <p className="mb-2">Depending on your jurisdiction, you may:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Access, correct, or delete your information</li>
                            <li>Restrict or object to certain processing</li>
                            <li>Withdraw consent for optional processing (e.g., marketing)</li>
                            <li>Request a portable copy of your data</li>
                            <li>Lodge a complaint with a data protection authority (for GDPR regions)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">International Transfers</h2>
                        <p className="mb-2">Your data may be stored or processed in countries outside your own.</p>
                        <p className="mb-2">Where GDPR applies, we use appropriate safeguards such as:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Standard Contractual Clauses (SCCs)</li>
                            <li>Equivalent protective measures</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
                        <p>For requests, concerns, or data-related questions:</p>
                        <p className="mt-2">
                            📩 <a href="mailto:vidholdify@gmail.com" className="text-brand-primary hover:underline">vidholdify@gmail.com</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
                        <p>We may update this Privacy Policy occasionally. Material changes will be posted here with an updated date.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
