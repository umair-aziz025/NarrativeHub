import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  Eye, 
  Download, 
  Trash2, 
  Settings, 
  CheckCircle,
  Clock,
  FileText,
  Globe,
  UserCheck,
  AlertCircle,
  Bell
} from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "January 15, 2025";
  
  const dataTypes = [
    {
      type: "Account Information",
      description: "Username, email, profile settings",
      retention: "Account lifetime",
      purpose: "User authentication and communication",
      icon: <UserCheck className="h-5 w-5" />
    },
    {
      type: "Story Content",
      description: "Stories, contributions, comments",
      retention: "Permanently stored",
      purpose: "Platform functionality and community building",
      icon: <FileText className="h-5 w-5" />
    },
    {
      type: "Usage Analytics",
      description: "Page views, feature usage, session data",
      retention: "24 months",
      purpose: "Platform improvement and analytics",
      icon: <Globe className="h-5 w-5" />
    },
    {
      type: "Device Information",
      description: "Browser type, IP address, device ID",
      retention: "12 months",
      purpose: "Security and technical support",
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const userRights = [
    {
      right: "Access Your Data",
      description: "Download a copy of all your personal data",
      action: "Request Export",
      icon: <Download className="h-5 w-5 text-blue-500" />
    },
    {
      right: "Correct Your Data",
      description: "Update or correct inaccurate information",
      action: "Edit Profile",
      icon: <Settings className="h-5 w-5 text-green-500" />
    },
    {
      right: "Delete Your Data",
      description: "Request permanent deletion of your account",
      action: "Delete Account",
      icon: <Trash2 className="h-5 w-5 text-red-500" />
    },
    {
      right: "Control Visibility",
      description: "Manage who can see your content and profile",
      action: "Privacy Settings",
      icon: <Eye className="h-5 w-5 text-purple-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-orange-500 mr-3" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 dark:text-gray-200 heading-glow">
              Privacy Policy
            </h1>
            <Lock className="h-8 w-8 text-orange-500 ml-3" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Your privacy is important to us. This policy explains how we collect, use, 
            and protect your information at Echoes Cafe.
          </p>
          <div className="flex items-center justify-center mt-4">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
          </div>
        </div>

        {/* Key Commitments */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 text-center mb-8 heading-glow">
            Our Privacy Commitments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30 text-center">
              <CardContent className="p-6">
                <Shield className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Data Protection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We use industry-standard encryption and security measures to protect your data.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30 text-center">
              <CardContent className="p-6">
                <Eye className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Transparency</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We're clear about what data we collect and how we use it.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30 text-center">
              <CardContent className="p-6">
                <UserCheck className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">User Control</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You have full control over your data and privacy settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Data We Collect */}
        <div className="mb-12">
          <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-6">
                Information We Collect
              </h2>
              <div className="space-y-6">
                {dataTypes.map((data) => (
                  <div key={data.type} className="border-l-4 border-orange-200 dark:border-orange-800 pl-6">
                    <div className="flex items-start">
                      <div className="text-orange-500 mr-3 mt-1">
                        {data.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          {data.type}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {data.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Purpose: </span>
                            <span className="text-gray-600 dark:text-gray-400">{data.purpose}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Retention: </span>
                            <span className="text-gray-600 dark:text-gray-400">{data.retention}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How We Use Your Data */}
        <div className="mb-12">
          <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-6">
                How We Use Your Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">
                    Essential Services
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Account authentication and security
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Story creation and collaboration features
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Community interaction and messaging
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Customer support and assistance
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">
                    Platform Improvement
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Analyzing usage patterns to improve features
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Personalizing your storytelling experience
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Maintaining platform security and safety
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Developing new community features
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Rights */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 text-center mb-8 heading-glow">
            Your Privacy Rights
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {userRights.map((right) => (
              <Card key={right.right} className="card-scale-hover cursor-pointer bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      {right.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {right.right}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {right.description}
                      </p>
                      <Button size="sm" variant="outline" className="border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-700">
                        {right.action}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Data Sharing */}
        <div className="mb-12">
          <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-6">
                Data Sharing and Third Parties
              </h2>
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                        We DO NOT sell your personal data
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your personal information is never sold to advertisers or third parties for commercial purposes.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    When we might share data:
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      With service providers who help us operate the platform (under strict confidentiality)
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      When required by law or to protect safety
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      In case of business transfer (with user notification)
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      With your explicit consent for specific purposes
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Measures */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-orange-100 via-pink-50 to-purple-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-orange-200/30 dark:border-gray-600/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
                Security Measures
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Encryption</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    End-to-end encryption for all data transmission and storage
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Access Control</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Strict access controls and regular security audits
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Compliance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    GDPR, CCPA, and other privacy regulation compliance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact & Updates */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
                Privacy Questions?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Have questions about our privacy practices? Our privacy team is here to help.
              </p>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Shield className="h-4 w-4 mr-2" />
                Contact Privacy Team
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
                Policy Updates
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We'll notify you of any significant changes to this privacy policy via email and platform notification.
              </p>
              <Button variant="outline" className="w-full border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-700">
                <Bell className="h-4 w-4 mr-2" />
                Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
