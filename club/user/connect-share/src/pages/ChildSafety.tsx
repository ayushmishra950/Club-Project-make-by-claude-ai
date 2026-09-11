import React from "react";

export default function ChildSafety() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8">

        <h1 className="text-3xl font-bold text-gray-900">
          Child Safety Standards – Club App
        </h1>

        <p className="text-sm text-gray-500 mt-2 mb-6">
          Last Updated: 12 June 2026
        </p>

        <Section title="Our Commitment to Child Safety">
          Club App is committed to providing a safe and respectful online
          environment for all users. We have zero tolerance for child sexual
          abuse and exploitation (CSAE), child sexual abuse material (CSAM),
          grooming, or any activity that threatens the safety of children.
        </Section>

        <Section title="Prohibited Content">
          The following content and activities are strictly prohibited on Club App:
          {"\n\n"}
          • Child Sexual Abuse Material (CSAM)
          {"\n"}
          • Child sexual exploitation
          {"\n"}
          • Grooming or attempting to exploit minors
          {"\n"}
          • Sexualization of children in any form
          {"\n"}
          • Human trafficking or exploitation involving minors
          {"\n"}
          • Any illegal or abusive content targeting children
        </Section>

        <Section title="Reporting Unsafe Content">
          Users can report inappropriate users, posts, messages, groups, or any
          other content directly within the app using the built-in Report feature.
          Every report is reviewed by our moderation team as quickly as possible.
        </Section>

        <Section title="Blocking Users">
          Club App allows users to block other users. Once blocked, the blocked
          user cannot continue normal interactions as permitted by the application's
          blocking functionality.
        </Section>

        <Section title="Content Moderation">
          We actively review reported content and take appropriate action when
          content violates our policies. Depending on the severity of the
          violation, actions may include:
          {"\n\n"}
          • Removing posts or content
          {"\n"}
          • Removing groups or discussions
          {"\n"}
          • Suspending accounts
          {"\n"}
          • Permanently banning users
          {"\n"}
          • Reporting illegal activity to the appropriate authorities when required
        </Section>

        <Section title="Compliance with Laws">
          Club App complies with applicable child safety laws and regulations.
          Where legally required, we cooperate with law enforcement agencies and
          appropriate government authorities regarding reports involving child
          exploitation or abuse.
        </Section>

        <Section title="User Responsibilities">
          Every user is responsible for ensuring that the content they upload,
          share, or communicate complies with applicable laws and the Club App
          Community Standards. Users must not upload, distribute, request, or
          promote illegal or harmful content.
        </Section>

        <Section title="Safety Measures">
          To help maintain a safe platform, Club App implements:
          {"\n\n"}
          • User reporting system
          {"\n"}
          • User blocking functionality
          {"\n"}
          • Content moderation
          {"\n"}
          • Community guideline enforcement
          {"\n"}
          • Administrative review of reported content
        </Section>

        <Section title="Contact Us">
          If you discover content involving child exploitation or have any child
          safety concerns, please contact us immediately.
          {"\n\n"}
          Email:
          {"\n"}
          <span className="font-semibold text-gray-800">
            infonicsolutions@gmail.com
          </span>
        </Section>

        <div className="mt-8 border-t pt-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            Club App maintains a zero-tolerance policy against child sexual abuse
            and exploitation. Any violation of these standards may result in
            immediate removal of content, permanent suspension of user accounts,
            and reporting to the appropriate legal authorities where applicable.
          </p>
        </div>

      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">
        {title}
      </h2>

      <p className="text-gray-700 leading-8 whitespace-pre-line">
        {children}
      </p>
    </div>
  );
}