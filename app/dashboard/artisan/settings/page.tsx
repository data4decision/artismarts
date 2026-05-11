




'use client';

import Link from 'next/link';
import React from 'react';
import { FaCog, FaTachometerAlt, FaUser, FaLock, FaBell, FaCreditCard, FaLifeRing } from 'react-icons/fa';

const settingsInfo = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Update your profile details and contact information',
    href: '/dashboard/artisan/settings/personal',
    icon: FaUser,
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Password and account security settings',
    href: '/dashboard/artisan/settings/reset-password',
    icon: FaLock,
  },
  {
    id: 'notifications',
    title: 'Notifications Sound',
    description: 'Manage your notification preferences',
    href: '/dashboard/artisan/settings/notifications',
    icon: FaBell,
  },
  // {
  //   id: 'billing',
  //   title: 'Billing & Payment',
  //   description: 'Manage payment methods and billing history',
  //   href: '/dashboard/artisan/settings/billing',
  //   icon: FaCreditCard,
  // },
];

const helpInfo = [
  {
    id: 'help',
    title: 'Help and Support',
    description: 'Update your profile details and contact information',
    href: '/dashboard/artisan/settings/help',
    icon: FaUser,
  },
  {
    id: 'privacy',
    title: 'Privacy and Policy',
    description: 'Password and account security settings',
    href: '/dashboard/artisan/settings/privacy',
    icon: FaLock,
  },
  {
    id: 'disable',
    title: 'Disable Account',
    description: 'Manage your notification preferences',
    href: '/dashboard/artisan/settings/disable-account',
    icon: FaBell,
  },
  // {
  //   id: 'billing',
  //   title: 'Billing & Payment',
  //   description: 'Manage payment methods and billing history',
  //   href: '/dashboard/artisan/settings/billing',
  //   icon: FaCreditCard,
  // },
];

const SettingsPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <FaCog size={28} className="text-[var(--blue)]" />
        <h1 className="text-3xl font-bold text-[var(--blue)]">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsInfo.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group bg-white border border-gray-200 hover:border-[var(--orange)] p-6 rounded-2xl transition-all duration-200 hover:shadow-md flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="text-2xl text-[var(--orange)]" />
              </div>

              <div>
                <h3 className="font-semibold text-lg text-[var(--blue)] group-hover:text-[var(--orange)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[var(--blue)] text-sm mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mb-4 mt-4">
        <FaLifeRing size={28} className="text-[var(--blue)]" />
        <h1 className="text-3xl font-bold text-[var(--blue)]">Support & Legal</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {helpInfo.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group bg-white border border-gray-200 hover:border-[var(--orange)] p-6 rounded-2xl transition-all duration-200 hover:shadow-md flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="text-2xl text-[var(--orange)]" />
              </div>

              <div>
                <h3 className="font-semibold text-lg text-[var(--blue)] group-hover:text-[var(--orange)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsPage;

