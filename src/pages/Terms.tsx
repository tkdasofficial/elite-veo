import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const section = (title: string, body: string) => (
  <div key={title} className="mb-6">
    <h2 className="text-sm font-semibold text-foreground mb-2">{title}</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

const Terms = () => {
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
          Terms & Conditions
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-2xl mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-6">Last updated: April 2025</p>

        {section("1. Acceptance of Terms",
          "By accessing or using Elite Veo, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our service."
        )}
        {section("2. Use of Service",
          "Elite Veo provides AI-assisted video script generation tools. You agree to use the service only for lawful purposes and in a manner that does not infringe the rights of others."
        )}
        {section("3. User Content",
          "You retain ownership of any content you create using our platform. By using the service, you grant Elite Veo a limited license to process your inputs solely for the purpose of generating your requested output."
        )}
        {section("4. Intellectual Property",
          "All trademarks, logos, and service names displayed in the app are the property of Elite Veo or their respective owners. Unauthorized use is strictly prohibited."
        )}
        {section("5. Disclaimer of Warranties",
          "The service is provided on an 'as is' and 'as available' basis without warranties of any kind, either express or implied. We do not guarantee the accuracy, completeness, or usefulness of any AI-generated content."
        )}
        {section("6. Limitation of Liability",
          "Elite Veo shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service."
        )}
        {section("7. Changes to Terms",
          "We reserve the right to modify these terms at any time. We will provide notice of significant changes. Your continued use of the service after changes constitutes your acceptance of the revised terms."
        )}
        {section("8. Contact",
          "If you have questions about these Terms & Conditions, please contact us through the app's support channel."
        )}
      </div>
    </div>
  );
};

export default Terms;
