'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AboutUs() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-light-gray relative">
      {/* Header section with pattern background */}
      <section className="relative bg-white py-12 mb-8">
        <div className="absolute inset-0 pattern-circuit opacity-[0.03]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl py-2 font-bold mb-4 text-primary-light">Emerging Technologies at ValueMomentum</h1>
          <p className="text-medium-gray max-w-3xl mb-8">
            Driving innovation through AI and emerging technologies to transform the future of P&C insurance.
          </p>
        </div>
      </section>

      {/* Main content */}
      <div className="container mx-auto px-0 pb-6">
        {/* Data points decoration */}
        <div className="data-points">
          {[...Array(10)].map((_, i) => (
            <div 
              key={i}
              className="data-point"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="ai-card p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="mb-4">
                The Emerging Technologies team at ValueMomentum is dedicated to exploring, developing, and implementing cutting-edge technologies that solve real business challenges in the P&C insurance industry. We serve as the innovation hub for ValueMomentum's clients, helping them navigate the rapidly evolving technological landscape.
              </p>
              <p>
                Our mission is to transform abstract technological concepts into practical, impactful solutions that drive business value for insurers across claims processing, underwriting, customer support, and enterprise IT operations.
              </p>
            </div>

            <div className="ai-card p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
              <p className="mb-4">
                We envision a future where P&C insurers leverage AI and emerging technologies to create more efficient operations, better risk assessment, enhanced customer experiences, and innovative products. Our team aims to be the trusted partner that helps insurers bridge the gap between technological potential and practical implementation.
              </p>
              <p>
                By 2030, we aim to have fundamentally transformed how the insurance industry operates through the strategic application of AI, machine learning, RAG systems, and other emerging technologies.
              </p>
            </div>

            <div className="ai-card p-6">
              <h2 className="text-2xl font-bold mb-4">Our Approach</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Research & Discovery</h3>
                  <p className="text-medium-gray mb-4">
                    We continuously monitor technological advancements and evaluate their potential applications in insurance.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Proof of Concept Development</h3>
                  <p className="text-medium-gray mb-4">
                    We create working prototypes that demonstrate the practical value of emerging technologies.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Client Collaboration</h3>
                  <p className="text-medium-gray mb-4">
                    We work closely with insurance clients to understand their specific challenges and tailor solutions accordingly.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Implementation Support</h3>
                  <p className="text-medium-gray mb-4">
                    We provide expertise and guidance for the successful deployment of innovative solutions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="ai-card p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Focus Areas</h2>
              <ul className="space-y-4">
                <li>
                  <div className="flex items-start">
                    <div className="bg-primary/20 text-primary rounded-full p-2 mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Claims Processing</h3>
                      <p className="text-medium-gray text-sm">AI-powered claims assessment, fraud detection, and automated processing</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-start">
                    <div className="bg-primary/20 text-primary rounded-full p-2 mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Underwriting</h3>
                      <p className="text-medium-gray text-sm">Risk assessment tools, automated underwriting, and data-driven decision support</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-start">
                    <div className="bg-primary/20 text-primary rounded-full p-2 mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Customer Support</h3>
                      <p className="text-medium-gray text-sm">AI chatbots, virtual assistants, and personalized customer experiences</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-start">
                    <div className="bg-primary/20 text-primary rounded-full p-2 mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Enterprise IT</h3>
                      <p className="text-medium-gray text-sm">Cloud solutions, data analytics, and system integration for insurance operations</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-start">
                    <div className="bg-primary/20 text-primary rounded-full p-2 mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Sales</h3>
                      <p className="text-medium-gray text-sm">AI solutions to drive sales efficiency</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold mb-4">Our Team</h2>
              <p className="mb-4">
                Led by David Kuhn, AVP and Head of AI and Emerging Technologies, our team consists of AI Architects, System Architects, AI engineers, software developers, and insurance domain experts working together to create innovative solutions.
              </p>
              <p className="text-sm text-medium-gray">
                We are part of ValueMomentum's broader team of 4000+ P&C-focused experts serving over 100 insurers worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Studio Section */}
        <div className="ai-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">About the Studio</h2>
          <p className="mb-6">
            The Emerging Tech Studio showcases our latest Proofs of Concept (PoCs) across different insurance domains. These demonstrations represent our ongoing work to solve real business challenges through innovative technology applications.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Link href="/pocs/claims" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-normal border-t-2 border-gradient overflow-hidden p-4 text-center">
              <h3 className="font-semibold text-primary">Claims</h3>
            </Link>
            <Link href="/pocs/underwriting" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-normal border-t-2 border-gradient overflow-hidden p-4 text-center">
              <h3 className="font-semibold text-primary">Underwriting</h3>
            </Link>
            <Link href="/pocs/customer_support" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-normal border-t-2 border-gradient overflow-hidden p-4 text-center">
              <h3 className="font-semibold text-primary">Support</h3>
            </Link>
            <Link href="/pocs/enterprise_it" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-normal border-t-2 border-gradient overflow-hidden p-4 text-center">
              <h3 className="font-semibold text-primary">Enterprise IT</h3>
            </Link>
            <Link href="/pocs/sales" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-normal border-t-2 border-gradient overflow-hidden p-4 text-center">
              <h3 className="font-semibold text-primary">Sales</h3>
            </Link>
          </div>
          
          <p>
            Each PoC in our portal demonstrates a practical application of emerging technologies to solve specific insurance industry challenges. We invite you to explore these demos and envision how similar solutions could benefit your organization.
          </p>
        </div>

        {/* Contact Section */}
        {/* <div className="cta-gradient p-6 rounded-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Interested in learning more about our Emerging Technologies initiatives or discussing how we can help your organization? Reach out to our team.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="mailto:emergingtech@valuemomentum.com" className="btn-ai">
                Contact Our Team
              </a>
              <button onClick={() => router.push('/pocs')} className="btn-secondary">
                Explore Our PoCs
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
