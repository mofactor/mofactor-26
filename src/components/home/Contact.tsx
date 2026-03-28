"use client";

import { useActionState } from "react";
import { Mail, Send } from "lucide-react";
import DualLineHeading from "@/components/ui/DualLineHeading";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { submitContact, type ContactState } from "@/app/actions/contact";

export default function Contact() {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    submitContact,
    null,
  );

  return (
    <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-12 md:gap-16">
      {/* Left column */}
      <div className="md:col-span-5 flex flex-col gap-6">
        <DualLineHeading topLine="Get in touch." bottomLine="Let's talk." />

        <p className=" text-body py-4">
          Have a project in mind, want to collaborate, or just say hi? Drop me a
          message and I&apos;ll get back to you.
        </p>

        <a
          href="mailto:echoes-weld-7g@icloud.com"
          className="inline-flex items-center gap-3 text-[15px] text-black hover:opacity-75 transition-opacity dark:text-white"
        >
          <Mail className="size-5 text-body" />
          echoes-weld-7g@icloud.com
        </a>
      </div>

      {/* Right column — form */}
      <div className="md:col-span-6 md:col-start-7">
        {state?.success ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-zinc-200 p-12 dark:border-zinc-800">
            <div className="text-center">
              <p className="text-[20px] font-semibold text-black dark:text-white">
                Thanks for reaching out!
              </p>
              <p className="mt-2 text-body">
                I&apos;ll get back to you as soon as I can.
              </p>
            </div>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-5">
            <input
              type="text"
              name="company_url"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your name here..."
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email here..."
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">Your Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Enter your subject here..."
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Type here"
                required
              />
            </div>

            {state?.message && !state.success && (
              <p className="text-sm text-red-500">{state.message}</p>
            )}

            <div>
              <Button type="submit" className="gap-3" size="lg" disabled={pending}>
                {pending ? "Sending..." : "Send Message"}
                <Send className="size-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
