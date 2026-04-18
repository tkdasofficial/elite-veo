import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";

import ChatPage        from "./pages/ChatPage";
import Login           from "./pages/auth/Login";
import Signup          from "./pages/auth/Signup";
import ForgotPassword  from "./pages/auth/ForgotPassword";
import ResetPassword   from "./pages/auth/ResetPassword";
import MyCreations     from "./pages/MyCreations";
import Terms           from "./pages/Terms";
import Privacy         from "./pages/Privacy";
import NotFound        from "./pages/NotFound";

/* Settings */
import Settings            from "./pages/Settings";
import Profile             from "./pages/settings/Profile";
import Personalization     from "./pages/settings/Personalization";
import CustomInstructions  from "./pages/settings/CustomInstructions";
import MemoryPage          from "./pages/settings/Memory";
import Notifications       from "./pages/settings/Notifications";
import Language            from "./pages/settings/Language";
import FontSize            from "./pages/settings/FontSize";
import Password            from "./pages/settings/Password";
import Security            from "./pages/settings/Security";
import DataControls        from "./pages/settings/DataControls";
import BugReport           from "./pages/settings/BugReport";
import DeleteAccount       from "./pages/settings/DeleteAccount";
import TermsPage           from "./pages/settings/TermsPage";
import PrivacyPage         from "./pages/settings/PrivacyPage";
import About               from "./pages/settings/About";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/"                         element={<ChatPage />} />
                <Route path="/login"                    element={<Login />} />
                <Route path="/signup"                   element={<Signup />} />
                <Route path="/forgot-password"          element={<ForgotPassword />} />
                <Route path="/reset-password"           element={<ResetPassword />} />
                <Route path="/my-creations"             element={<MyCreations />} />
                <Route path="/terms"                    element={<Terms />} />
                <Route path="/privacy"                  element={<Privacy />} />

                {/* Settings — main + all sub-pages as dedicated routes */}
                <Route path="/settings"                       element={<Settings />} />
                <Route path="/settings/profile"               element={<Profile />} />
                <Route path="/settings/personalization"       element={<Personalization />} />
                <Route path="/settings/custom-instructions"   element={<CustomInstructions />} />
                <Route path="/settings/memory"                element={<MemoryPage />} />
                <Route path="/settings/notifications"         element={<Notifications />} />
                <Route path="/settings/language"              element={<Language />} />
                <Route path="/settings/font-size"             element={<FontSize />} />
                <Route path="/settings/password"              element={<Password />} />
                <Route path="/settings/security"              element={<Security />} />
                <Route path="/settings/data"                  element={<DataControls />} />
                <Route path="/settings/bug-report"            element={<BugReport />} />
                <Route path="/settings/delete-account"        element={<DeleteAccount />} />
                <Route path="/settings/terms"                 element={<TermsPage />} />
                <Route path="/settings/privacy"               element={<PrivacyPage />} />
                <Route path="/settings/about"                 element={<About />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
