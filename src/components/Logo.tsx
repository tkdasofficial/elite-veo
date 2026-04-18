import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  alt?: string;
}

/**
 * In-app logo. Shows the black logo in light theme and the white logo in dark theme.
 */
const Logo = ({ className, alt = "Elite Veo" }: LogoProps) => (
  <>
    <img
      src={logoDark}
      alt={alt}
      className={cn("block dark:hidden h-full w-full object-contain", className)}
    />
    <img
      src={logoLight}
      alt={alt}
      className={cn("hidden dark:block h-full w-full object-contain", className)}
    />
  </>
);

export default Logo;
