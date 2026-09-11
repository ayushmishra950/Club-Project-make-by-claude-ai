import React from "react";

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8">

        <h1 className="text-3xl font-bold text-gray-900">
          Delete Account & Data Policy – Jain Social Group Online
        </h1>

        <p className="text-sm text-gray-500 mt-2">
          Effective Date: 11 June 2026
        </p>

        <p className="text-sm text-gray-500 mb-6">
          Last Updated: 11 June 2026
        </p>

        <Section title="1. How Account Deletion Works">
          When you request to delete your Jain Social Group Online account,
          your account is immediately deactivated. You will no longer be able
          to access your profile or use features such as posts, chat,
          notifications, business listings, friend requests, or events.

          {"\n\n"}

          Your account will enter a retention period of up to 30 days.
          During this period, you may contact our support team to request
          account reactivation.
        </Section>

        <Section title="2. How to Request Account Deletion">
          You can request account deletion by contacting our support team.

          {"\n\n"}

          <strong>Email:</strong>
          {"\n"}
          infonicsolutions@gmail.com  

          {"\n\n"}

          Please include the following details:

          {"\n"}
          • Registered Email Address

          {"\n"}
          • Registered Mobile Number (if available)

          {"\n"}
          • Username (if applicable)

          {"\n"}
          • Request Type (Account Deletion / Reactivation)
        </Section>

        <Section title="3. What Happens to Your Data">
          Once your deletion request is received:

          {"\n\n"}

          • Your profile becomes inaccessible.

          {"\n"}
          • Your posts, photos, videos, and comments are removed from public view.

          {"\n"}
          • Your chat access is disabled.

          {"\n"}
          • Friend connections and social interactions are deactivated.

          {"\n"}
          • Notifications are stopped.

          {"\n"}
          • Business listings associated with your account may be disabled.

          {"\n\n"}

          Certain information may be retained temporarily where required for
          legal obligations, fraud prevention, dispute resolution, or security
          purposes.
        </Section>

        <Section title="4. 30-Day Recovery Period">
          If you change your mind, you may request account reactivation within
          30 days from the date of your deletion request.

          {"\n\n"}

          After the 30-day retention period expires, your account and associated
          personal data will be permanently deleted and cannot be restored.
        </Section>

        <Section title="5. Important Information">
          Account deletion permanently removes your access to Jain Social Group
          Online after the retention period.

          {"\n\n"}

          Please ensure that you have backed up any important information before
          requesting account deletion.

          {"\n\n"}

          Some records may be retained only where required by applicable laws,
          regulatory requirements, or to protect the security and integrity of
          our platform.
        </Section>

        <Section title="6. Developer Information">
          <strong>Application Name:</strong>

          {"\n"}
          Jain Social Group Online

          {"\n\n"}

          <strong>Developer Name:</strong>

          {"\n"}
          Priyank Dadhich

          {"\n\n"}

          <strong>Email:</strong>

          {"\n"}
          infonicsolutions@gmail.com

          {"\n\n"}

          <strong>Mobile:</strong>

          {"\n"}
          +91 80786 44758
        </Section>

        <div className="mt-6 border-t pt-4">
          <p className="font-semibold text-gray-800 text-lg">
            Contact Support
          </p>

          <div className="mt-3 space-y-2 text-gray-600">
            <p>
              <strong>Application:</strong> Jain Social Group Online
            </p>

            <p>
              <strong>Developer:</strong> Priyank Dadhich
            </p>

            <p>
              <strong>Email:</strong> infonicsolutions@gmail.com
            </p>

            <p>
              <strong>Mobile:</strong> +91 80786 44758
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* Reusable Section Component */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        {title}
      </h2>

      <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
        {children}
      </p>
    </div>
  );
}