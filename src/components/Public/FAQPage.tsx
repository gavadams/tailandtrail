/**
 * FAQ page with common questions about the game
 */

import React from 'react';
import { HelpCircle, Clock, Key, Users, Smartphone, RefreshCw } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const faqs = [
    {
      icon: Key,
      question: "How do I get an access code?",
      answer: "Purchase an access code through our Purchase page. You'll receive your unique code via email immediately after payment. Each code is valid for 12 hours from first use."
    },
    {
      icon: Clock,
      question: "How long do I have to complete the game?",
      answer: "Once you activate your access code, you have 12 full hours to complete all puzzles. You can take breaks and resume anytime within this window."
    },
    {
      icon: Users,
      question: "Can I play with friends?",
      answer: "Absolutely! The game is perfect for teams. You can work together to solve puzzles, discuss clues, and share the adventure. One access code works for your entire group."
    },
    {
      icon: Smartphone,
      question: "What devices can I use?",
      answer: "The game works on any device with a web browser - smartphones, tablets, laptops, or desktop computers. The interface is fully responsive and optimized for mobile play."
    },
    {
      icon: HelpCircle,
      question: "What if I get stuck on a puzzle?",
      answer: "Don't worry! Wrong answers reveal progressive clues to help guide you. The more you try, the more hints you'll unlock. Every puzzle is solvable with the clues provided."
    },
    {
      icon: RefreshCw,
      question: "Can I restart or get a new code?",
      answer: "Each access code is single-use and expires after 12 hours. If you need a new code, you'll need to make a new purchase. However, you can resume your progress anytime within the 12-hour window."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-100 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-amber-200 mb-12">
            Everything you need to know about Tale and Trail
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-amber-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {faqs.map((faq, index) => {
              const Icon = faq.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-start space-x-4">
                    <div className="bg-amber-100 p-3 rounded-full flex-shrink-0">
                      <Icon className="h-6 w-6 text-amber-800" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-amber-900 mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-amber-800 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-amber-100 mb-6">
            Still Have Questions?
          </h2>
          <p className="text-xl text-amber-200 mb-8">
            We're here to help! Contact us if you need additional support.
          </p>
          <a
            href="/contact"
            className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg inline-flex items-center space-x-2"
          >
            <HelpCircle className="h-5 w-5" />
            <span>Contact Support</span>
          </a>
        </div>
      </section>
    </div>
  );
};