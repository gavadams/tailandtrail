/**
 * Contact page for customer support
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Instagram } from 'lucide-react';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>();

  const handleContactSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
      
      if (!accessKey) {
        throw new Error('Web3Forms access key not configured');
      }

      const formData = new FormData();
      formData.append('access_key', accessKey);
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('subject', data.subject);
      formData.append('message', data.message);
      formData.append('from_name', 'Tale and Trail Contact Form');
      formData.append('replyto', data.email);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        reset();
        
        // Reset success message after 5 seconds
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
      
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
      
      // Clear error message after 5 seconds
      setTimeout(() => setSubmitError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-100 mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-amber-200 mb-12">
            Need help? Have questions? We're here to assist you!
          </p>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-amber-900 mb-8">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-amber-800 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-amber-100" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900">Email</h3>
                     <p className="text-amber-700">gav.adams@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-amber-800 p-3 rounded-full">
                    <Instagram className="h-6 w-6 text-amber-100" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900">Instagram</h3>
                    <p className="text-amber-700">@Playtailandtrail</p>
                  </div>
                </div>

                {/*<div className="flex items-center space-x-4">
                  <div className="bg-amber-800 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-amber-100" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900">Address</h3>
                    <p className="text-amber-700">123 Puzzle Street<br />Adventure City, AC 12345</p>
                  </div>
                </div>*/}
              </div>

              {/*<div className="mt-8 p-6 bg-amber-100 rounded-lg">
                <h3 className="font-bold text-amber-900 mb-3">Business Hours</h3>
                <div className="space-y-1 text-amber-800">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 10:00 AM - 4:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>*/}
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-amber-900 mb-6">Send us a Message</h2>
              
              {isSubmitted && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <p className="text-green-700 font-medium">Message sent successfully! We'll get back to you soon.</p>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-red-700 font-medium">{submitError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(handleContactSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    Name
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    Email
                  </label>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    Subject
                  </label>
                  <input
                    {...register('subject', { required: 'Subject is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  {errors.subject && (
                    <p className="text-red-600 text-sm mt-1">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    Message
                  </label>
                  <textarea
                    {...register('message', { required: 'Message is required' })}
                    rows={5}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                  />
                  {errors.message && (
                    <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};