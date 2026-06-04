import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfile } from "@/components/user-profile";
import { useAuth } from "@/hooks/useAuth";

interface SharedHeaderProps {
  subtitle?: string;
  showAuthButton?: boolean;
}

export function SharedHeader({ subtitle = "Inspired by Cookie", showAuthButton = false }: SharedHeaderProps) {
  const { user: currentUser, isAuthenticated } = useAuth();

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-light-beige/50 dark:border-gray-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-warm-teal to-warm-brown rounded-full flex items-center justify-center text-white text-xl float-animation">
              <Cookie className="w-5 h-5 icon-animate" />
            </div>
            <div>
              <h1 className="font-serif font-semibold text-xl text-gray-800 dark:text-white">
                Cookie's
              </h1>
              <p className="font-serif text-sm text-gray-600 dark:text-gray-300 -mt-1">
                Someone Somewhere
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {subtitle}
              </p>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <div className="theme-toggle">
              <ThemeToggle />
            </div>
            {isAuthenticated && currentUser ? (
              <div className="flex items-center space-x-3">
                <UserProfile user={currentUser} compact />
              </div>
            ) : showAuthButton ? (
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-orange-600 text-white hover:bg-orange-700 btn-animate"
              >
                Sign In to Join
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
