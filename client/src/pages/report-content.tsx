import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, 
  AlertTriangle, 
  Flag, 
  CheckCircle, 
  Clock, 
  Eye,
  MessageSquare,
  FileText,
  User,
  Lock,
  Zap
} from "lucide-react";
import { useState } from "react";

export default function ReportContent() {
  const [reportType, setReportType] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const reportCategories = [
    {
      value: "inappropriate-content",
      label: "Inappropriate Content",
      description: "Sexual, violent, or offensive material",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-red-500"
    },
    {
      value: "harassment",
      label: "Harassment or Bullying",
      description: "Targeted harassment or bullying behavior",
      icon: <Shield className="h-5 w-5" />,
      color: "text-orange-500"
    },
    {
      value: "spam",
      label: "Spam or Repetitive Content",
      description: "Repetitive, promotional, or off-topic content",
      icon: <Zap className="h-5 w-5" />,
      color: "text-yellow-500"
    },
    {
      value: "hate-speech",
      label: "Hate Speech or Discrimination",
      description: "Content promoting hate or discrimination",
      icon: <Flag className="h-5 w-5" />,
      color: "text-red-600"
    },
    {
      value: "personal-info",
      label: "Personal Information",
      description: "Sharing of private or personal information",
      icon: <Lock className="h-5 w-5" />,
      color: "text-purple-500"
    },
    {
      value: "copyright",
      label: "Copyright Violation",
      description: "Unauthorized use of copyrighted material",
      icon: <FileText className="h-5 w-5" />,
      color: "text-blue-500"
    },
    {
      value: "impersonation",
      label: "Impersonation",
      description: "Pretending to be someone else",
      icon: <User className="h-5 w-5" />,
      color: "text-indigo-500"
    },
    {
      value: "other",
      label: "Other Violation",
      description: "Other community guideline violations",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "text-gray-500"
    }
  ];

  const reportStats = [
    {
      title: "Reports Resolved",
      value: "1,247",
      description: "In the last 30 days",
      icon: <CheckCircle className="h-6 w-6 text-green-500" />
    },
    {
      title: "Average Response Time",
      value: "< 24h",
      description: "For urgent reports",
      icon: <Clock className="h-6 w-6 text-blue-500" />
    },
    {
      title: "Community Safety Score",
      value: "98.2%",
      description: "Based on user feedback",
      icon: <Shield className="h-6 w-6 text-orange-500" />
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert("Report submitted successfully. Our moderation team will review it within 24 hours.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-orange-500 mr-3" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 dark:text-gray-200 heading-glow">
              Report Content
            </h1>
            <Shield className="h-8 w-8 text-orange-500 ml-3" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Help us maintain a safe and respectful community. Report content that violates our 
            community guidelines and we'll review it promptly.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          {reportStats.map((stat) => (
            <Card key={stat.title} className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {stat.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Report Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
              <CardContent className="p-8">
                <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-6">
                  Submit a Report
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Report Type */}
                  <div>
                    <Label htmlFor="report-type" className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                      What type of violation are you reporting?
                    </Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a violation type" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center">
                              <div className={`mr-3 ${category.color}`}>
                                {category.icon}
                              </div>
                              <div>
                                <div className="font-medium">{category.label}</div>
                                <div className="text-sm text-gray-500">{category.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content URL or Reference */}
                  <div>
                    <Label htmlFor="content-url" className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Content URL or Reference
                    </Label>
                    <Input
                      id="content-url"
                      placeholder="e.g., story ID, user profile, or room name"
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Provide a link or reference to help us locate the content
                    </p>
                  </div>

                  {/* Detailed Description */}
                  <div>
                    <Label htmlFor="description" className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Detailed Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide specific details about the violation, including context and any relevant information..."
                      rows={5}
                      className="w-full"
                    />
                  </div>

                  {/* Additional Evidence */}
                  <div>
                    <Label htmlFor="evidence" className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Additional Evidence (Optional)
                    </Label>
                    <Input
                      id="evidence"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.txt"
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Screenshots, documents, or other supporting evidence
                    </p>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <Label htmlFor="contact-email" className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Contact Email (Optional)
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      We may contact you if we need more information
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="urgent"
                        checked={isUrgent}
                        onCheckedChange={(checked) => setIsUrgent(checked === true)}
                      />
                      <Label htmlFor="urgent" className="text-sm text-gray-700 dark:text-gray-300">
                        This is an urgent safety concern requiring immediate attention
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="anonymous"
                        checked={isAnonymous}
                        onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                      />
                      <Label htmlFor="anonymous" className="text-sm text-gray-700 dark:text-gray-300">
                        Submit this report anonymously
                      </Label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={!reportType}
                    >
                      <Flag className="h-5 w-5 mr-2" />
                      Submit Report
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Block User
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Report Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-700"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Safety Center
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card className="bg-gradient-to-r from-orange-100 via-pink-50 to-purple-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-orange-200/30 dark:border-gray-600/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Before You Report
                </h3>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Review our community guidelines to understand what constitutes a violation</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Provide specific details and evidence when possible</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Use the appropriate category for faster processing</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Consider blocking users for personal safety</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-6">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-200">
                    Emergency?
                  </h3>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  For immediate safety concerns or threats, contact law enforcement or our emergency support line.
                </p>
                <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Emergency Contact
                </Button>
              </CardContent>
            </Card>

            {/* Status Updates */}
            <Card className="bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Your Report Status
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Track the status of your submitted reports in your account settings.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-700"
                >
                  View My Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
