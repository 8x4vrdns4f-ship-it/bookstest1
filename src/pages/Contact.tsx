import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Mail, Clock, LifeBuoy } from "lucide-react";

const MAX = { name: 100, email: 255, subject: 150, message: 2000 };

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", company: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();
    if (!name) return "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Please enter a valid email address.";
    if (!subject) return "Please add a subject.";
    if (message.length < 10) return "Please write at least 10 characters so we can help.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      toast({ title: "Check your details", description: problem, variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-contact", {
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          company: form.company,
        },
      });
      const errMsg = (data as any)?.error;
      if (error || errMsg) throw new Error(errMsg || error?.message);
      setSent(true);
    } catch (err) {
      toast({
        title: "Message not sent",
        description:
          err instanceof Error && err.message
            ? err.message
            : "Something went wrong. Please email help@booksuite.online.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Contact BookSuite Support"
        description="Questions about bookings, deposits, billing or setup? Message the BookSuite team and get a reply within one business day."
        path="/contact"
      />
      <Navbar />

      <main className="flex-1 px-6 md:px-16 py-14 max-w-4xl mx-auto w-full text-foreground">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Contact us</h1>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl">
          Setup questions, billing, bug reports or feature ideas — send it over and a real
          person will get back to you.
        </p>

        <div className="grid md:grid-cols-[1.4fr_1fr] gap-8 items-start">
          <div className="rounded-[16px] border border-border bg-card p-6">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-success/15 text-success grid place-items-center mx-auto mb-4">
                  <CheckCircle2 size={26} />
                </div>
                <h2 className="text-xl font-semibold mb-1.5">Message sent</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  We've emailed you a copy. Expect a reply within one business day.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSent(false);
                    setForm({ name: "", email: "", subject: "", message: "", company: "" });
                  }}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-name">Your name</Label>
                    <Input id="contact-name" value={form.name} onChange={set("name")} maxLength={MAX.name} autoComplete="name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" type="email" value={form.email} onChange={set("email")} maxLength={MAX.email} autoComplete="email" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-subject">Subject</Label>
                  <Input id="contact-subject" value={form.subject} onChange={set("subject")} maxLength={MAX.subject} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea id="contact-message" rows={6} value={form.message} onChange={set("message")} maxLength={MAX.message} />
                  <p className="text-[11px] text-muted-foreground text-right">
                    {form.message.length}/{MAX.message}
                  </p>
                </div>

                {/* Honeypot — hidden from real users */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="contact-company">Company</label>
                  <input id="contact-company" tabIndex={-1} autoComplete="off" value={form.company} onChange={set("company")} />
                </div>

                <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                  {sending ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[16px] border border-border bg-card p-5">
              <div className="flex items-center gap-2.5 mb-1.5 text-primary">
                <Mail size={18} />
                <h2 className="font-semibold text-foreground text-[15px]">Email us directly</h2>
              </div>
              <a href="mailto:help@booksuite.online" className="text-sm text-primary underline">
                help@booksuite.online
              </a>
            </div>

            <div className="rounded-[16px] border border-border bg-card p-5">
              <div className="flex items-center gap-2.5 mb-1.5 text-primary">
                <Clock size={18} />
                <h2 className="font-semibold text-foreground text-[15px]">Response time</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Within one business day, Monday to Friday.
              </p>
            </div>

            <div className="rounded-[16px] border border-border bg-card p-5">
              <div className="flex items-center gap-2.5 mb-1.5 text-primary">
                <LifeBuoy size={18} />
                <h2 className="font-semibold text-foreground text-[15px]">Already a customer?</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Include your business name so we can find your account faster.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
