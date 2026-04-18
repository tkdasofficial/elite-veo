import { useNavigate } from "react-router-dom";
import { SettingsPage } from "@/components/settings/shared";

const S = (title: string, body: string) => (
  <div key={title} className="mb-6">
    <h2 className="text-sm font-semibold text-foreground mb-2">{title}</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

const TermsPage = () => {
  const navigate = useNavigate();
  return (
    <SettingsPage title="Terms of Service" onBack={() => navigate("/settings")}>
      <div className="px-5 py-6 max-w-2xl mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-6">Last updated: April 2025</p>
        {S("1. Acceptance of Terms", "By accessing or using Elite Veo, you agree to be bound by these Terms and Conditions. If you do not agree, you may not use our service.")}
        {S("2. Use of Service", "Elite Veo provides AI-assisted tools. You agree to use the service only for lawful purposes and in a manner that does not infringe the rights of others.")}
        {S("3. User Content", "You retain ownership of any content you create. By using the service, you grant Elite Veo a limited license to process your inputs solely to generate your requested output.")}
        {S("4. Intellectual Property", "All trademarks, logos, and service names displayed are the property of Elite Veo or their respective owners. Unauthorized use is strictly prohibited.")}
        {S("5. Disclaimer of Warranties", "The service is provided 'as is' without warranties of any kind. We do not guarantee the accuracy or usefulness of any AI-generated content.")}
        {S("6. Limitation of Liability", "Elite Veo shall not be liable for any indirect, incidental, or consequential damages resulting from your use or inability to use the service.")}
        {S("7. Changes to Terms", "We reserve the right to modify these terms at any time. Continued use after changes constitutes your acceptance.")}
        {S("8. Contact", "If you have questions about these Terms, please contact us through the app's support channel.")}
      </div>
    </SettingsPage>
  );
};

export default TermsPage;
