"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/Button";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/register");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">SkillBridge</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="h-10 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
              ) : user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6">
              Connect. Learn. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Grow.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              A peer-to-peer skill exchange platform where learners and teachers connect for meaningful learning experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleGetStarted} size="lg" variant="primary" className="text-lg px-8 py-4">
                Get Started Free
              </Button>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Three simple steps to start your learning journey</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Create Profile</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Set up your profile with skills you want to teach and learn. Our AI will find your perfect match.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Find Matches</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get matched with learners or teachers based on skills, availability, and learning preferences.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-100 dark:border-green-800">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Start Learning</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Schedule sessions, connect via video call, and start your learning journey with real-time feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose SkillBridge?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">The best platform for peer-to-peer learning</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Matching</h4>
              <p className="text-gray-600 dark:text-gray-400">AI-powered algorithm finds the best matches for your learning goals</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-3xl mb-3">⭐</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Points & Rewards</h4>
              <p className="text-gray-600 dark:text-gray-400">Earn points for teaching and use them to learn new skills</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-3xl mb-3">💬</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Video Sessions</h4>
              <p className="text-gray-600 dark:text-gray-400">Built-in video calling for seamless learning experiences</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-3xl mb-3">📊</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Track Progress</h4>
              <p className="text-gray-600 dark:text-gray-400">Monitor your learning journey with detailed analytics and reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Learning?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of learners and teachers already on SkillBridge
          </p>
          <Button onClick={handleGetStarted} size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">SkillBridge</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Connecting learners and teachers worldwide for meaningful skill exchange.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h5>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-blue-600">Features</Link></li>
                <li><Link href="#" className="hover:text-blue-600">How It Works</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h5>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-blue-600">About</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Blog</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h5>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-blue-600">Privacy</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Terms</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
            © 2025 SkillBridge. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
