"use client";

import { useState } from "react";
import { CheckCircle, Store, Phone, Mail, MapPin, Bell, Shield, CreditCard } from "lucide-react";
import { DEMO_VENDOR } from "@/lib/data/demo-data";

export default function SettingsPage() {
  const v = DEMO_VENDOR;
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl text-vodium-black">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your shop profile and preferences.</p>
      </div>

      {/* Business profile */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center">
            <Store size={16} className="text-vodium-gold" />
          </div>
          <div>
            <h2 className="font-semibold text-vodium-black text-sm">Business profile</h2>
            <p className="text-xs text-muted-foreground">How your shop appears to students</p>
          </div>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Business name">
              <input type="text" defaultValue={v.businessName} className="input-premium" />
            </Field>
            <Field label="Owner name">
              <input type="text" defaultValue={v.ownerName} className="input-premium" />
            </Field>
          </div>
          <Field label="Campus location">
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" defaultValue={v.campusLocation} className="input-premium pl-9" />
            </div>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Phone number">
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="tel" defaultValue={v.phone} className="input-premium pl-9" />
              </div>
            </Field>
            <Field label="Email address">
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" defaultValue={v.email ?? ""} className="input-premium pl-9" />
              </div>
            </Field>
          </div>
          <div className="flex items-center justify-between pt-2">
            {saved && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle size={15} /> Changes saved
              </div>
            )}
            <div className="ml-auto">
              <button type="submit" className="btn-gold px-6 py-2.5 rounded-xl text-sm">
                Save changes
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center">
            <Bell size={16} className="text-vodium-gold" />
          </div>
          <div>
            <h2 className="font-semibold text-vodium-black text-sm">Notifications</h2>
            <p className="text-xs text-muted-foreground">WhatsApp and SMS alert preferences</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Auto-reminders to students",    sub: "2 days before due date",            defaultOn: true },
            { label: "Overdue alerts to you",          sub: "When a credit passes its due date",  defaultOn: true },
            { label: "Payment confirmations",          sub: "When a student marks credit paid",   defaultOn: true },
            { label: "Weekly summary report",          sub: "Every Monday — overview of your book", defaultOn: false },
          ].map((n) => (
            <Toggle key={n.label} label={n.label} sub={n.sub} defaultChecked={n.defaultOn} />
          ))}
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center">
            <CreditCard size={16} className="text-vodium-gold" />
          </div>
          <div>
            <h2 className="font-semibold text-vodium-black text-sm">Subscription</h2>
            <p className="text-xs text-muted-foreground">Your current plan and billing</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-vodium-black">Growth plan</p>
              <p className="text-sm text-muted-foreground mt-1">₦5,000/month · Up to 200 students · Cross-vendor scores</p>
              <p className="text-xs text-muted-foreground mt-1">Renews May 1, 2026</p>
            </div>
            <span className="badge badge-active">Active</span>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="btn-gold px-5 py-2.5 rounded-xl text-sm">Upgrade to Campus Pro</button>
            <button className="btn-outline-dark px-5 py-2.5 rounded-xl text-sm">Manage billing</button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center">
            <Shield size={16} className="text-vodium-gold" />
          </div>
          <div>
            <h2 className="font-semibold text-vodium-black text-sm">Security & privacy</h2>
            <p className="text-xs text-muted-foreground">Account protection settings</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-vodium-black">Phone verification</p>
              <p className="text-xs text-muted-foreground">{v.phone}</p>
            </div>
            <span className="badge badge-active text-xs">Verified</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-vodium-black">Data isolation</p>
              <p className="text-xs text-muted-foreground">Other vendors cannot see your customers</p>
            </div>
            <span className="badge badge-active text-xs">Enabled</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-vodium-black">NDPR compliance</p>
              <p className="text-xs text-muted-foreground">Nigeria Data Protection Regulation</p>
            </div>
            <span className="badge badge-active text-xs">Compliant</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="border border-danger/20 rounded-2xl p-6">
        <h2 className="font-semibold text-danger mb-2 text-sm">Danger zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting your account will permanently remove all your credit records and customer data. This cannot be undone.
        </p>
        <button className="text-sm text-danger border border-danger/30 px-4 py-2 rounded-lg hover:bg-danger/5 transition-colors">
          Request account deletion
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-vodium-black mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, sub, defaultChecked }: { label: string; sub: string; defaultChecked: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-vodium-black">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${on ? "bg-vodium-gold" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
