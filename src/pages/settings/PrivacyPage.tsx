import { useNavigate } from "react-router-dom";
import { SettingsPage } from "@/components/settings/shared";

const S = (title: string, body: string) => (
  <div key={title} className="mb-6">
    <h2 className="text-sm font-semibold text-foreground mb-2">{title}</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

const PrivacyPage = () => {
  const navigate = useNavigate();
  return (
    <SettingsPage title="Privacy Policy" onBack={() => navigate("/settings")}>
      <div className="px-5 py-6 max-w-2xl mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-6">Last updated: April 2025</p>
        {S("1. Information We Collect", "We collect information you provide when creating an account (name and email) and the prompts you submit. We do not collect payment information.")}
        {S("2. How We Use Your Information", "We use collected information to provide, maintain, and improve the service, personalize your experience, and communicate important updates.")}
        {S("3. Data Storage", "Your account information and conversations are stored securely via Supabase with industry-standard encryption and access controls.")}
        {S("4. Cookies and Tracking", "We do not use third-party tracking technologies. Your preferences are stored in your browser's local storage only.")}
        {S("5. Data Sharing", "We do not sell, trade, or transfer your personal information to third parties under any circumstances.")}
        {S("6. Children's Privacy", "Our service is not directed to children under 13. We do not knowingly collect information from children under 13.")}
        {S("7. Your Rights", "You may access, update, or request deletion of your account information at any time through the Settings page.")}
        {S("8. Changes to Policy", "We may update this Privacy Policy from time to time. Your continued use of the service after changes are posted constitutes acceptance.")}
        {S("9. Contact Us", "For privacy-related questions, please reach out through the app's support channel.")}
      </div>
    </SettingsPage>
  );
};

export default PrivacyPage;
