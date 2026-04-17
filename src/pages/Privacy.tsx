import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const section = (title: string, body: string) => (
  <div key={title} className="mb-6">
    <h2 className="text-sm font-semibold text-foreground mb-2">{title}</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background flex flex-col">

      {/* Header */}
      <div className="relative flex items-center px-4 py-3 border-b border-border/20 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="absolute inset-x-14 text-center text-sm font-semibold text-foreground pointer-events-none">
          Privacy Policy
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-2xl mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-6">Last updated: April 2025</p>

        {section("1. Information We Collect",
          "We collect information you provide directly to us when you create an account (name and email address) and the prompts you submit to generate video scripts. We do not collect payment information."
        )}
        {section("2. How We Use Your Information",
          "We use the information we collect to provide, maintain, and improve the service, to personalize your experience, and to communicate with you about updates or important notices."
        )}
        {section("3. Data Storage",
          "Your account information and conversation history are stored locally on your device. We do not transmit or store your personal data on external servers in the current version of the app."
        )}
        {section("4. Cookies and Tracking",
          "We do not use cookies or third-party tracking technologies. Your preferences and session data are stored only in your browser's local storage."
        )}
        {section("5. Data Sharing",
          "We do not sell, trade, or otherwise transfer your personal information to third parties. We may share anonymized, aggregated data that cannot reasonably be used to identify you."
        )}
        {section("6. Children's Privacy",
          "Our service is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13."
        )}
        {section("7. Your Rights",
          "You may access, update, or delete your account information at any time through the Settings page. Deleting your account will remove all associated data from your device."
        )}
        {section("8. Changes to This Policy",
          "We may update this Privacy Policy from time to time. We will notify you of any significant changes. Your continued use of the service after changes are posted constitutes acceptance."
        )}
        {section("9. Contact Us",
          "If you have questions or concerns about this Privacy Policy, please reach out through the app's support channel."
        )}
      </div>
    </div>
  );
};

export default Privacy;
