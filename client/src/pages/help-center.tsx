import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  HelpCircle, 
  BookOpen, 
  Users, 
  MessageCircle, 
  Settings, 
  Shield, 
  Star, 
  Mail, 
  Phone,
  Search,
  Lightbulb,
  Clock,
  CheckCircle
} from "lucide-react";

export default function HelpCenter() {
  const helpCategories = [
    {
      title: "Getting Started",
      icon: <BookOpen className="h-6 w-6" />,
      articles: 12,
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    },
    {
      title: "Story Creation",
      icon: <Users className="h-6 w-6" />,
      articles: 18,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    },
    {
      title: "Community & Collaboration",
      icon: <MessageCircle className="h-6 w-6" />,
      articles: 15,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    },
    {
      title: "Account & Settings",
      icon: <Settings className="h-6 w-6" />,
      articles: 9,
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    },
    {
      title: "Safety & Moderation",
      icon: <Shield className="h-6 w-6" />,
      articles: 7,
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    },
    {
      title: "Features & Tips",
      icon: <Star className="h-6 w-6" />,
      articles: 21,
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }
  ];

  const faqs = [
    {
      question: "How do I start my first collaborative story?",
      answer: "Getting started is easy! Simply go to the home page and use the story input box to begin a new story chain. You can also join existing story rooms or create your own private room to collaborate with friends. Check out our 'How to Play' section for a detailed walkthrough."
    },
    {
      question: "What are the content guidelines for stories?",
      answer: "We encourage creative, respectful storytelling. Stories should be appropriate for all ages, free from hate speech, and foster positive collaboration. Avoid personal information, offensive content, or spam. Our community guidelines provide detailed information about what's welcome in our storytelling space."
    },
    {
      question: "How does the story continuation system work?",
      answer: "Each story is built line by line by different contributors. When you add to a story, you're continuing where the previous person left off. Stories can branch into different directions, creating multiple narrative paths. The most engaging continuations often get highlighted by the community."
    },
    {
      question: "Can I edit or delete my story contributions?",
      answer: "You can edit your contributions within the first 5 minutes after posting. After that, edits are limited to maintain story continuity. However, you can always report your own content if you need it removed for any reason."
    },
    {
      question: "How do I report inappropriate content?",
      answer: "Click the flag icon next to any story line or use the 'Report Content' button. Our moderation team reviews all reports within 24 hours. You can also contact us directly at justufor11@gmail.com for urgent matters."
    },
    {
      question: "What are story rooms and how do they work?",
      answer: "Story rooms are collaborative spaces where groups can work on stories together. You can create public rooms for community collaboration or private rooms for friends. Room creators can set themes, rules, and moderate the content."
    },
    {
      question: "How do I earn badges and achievements?",
      answer: "Badges are earned through various activities: contributing to stories, receiving likes, completing story chains, participating in community events, and helping other writers. Check your profile to see your progress and available achievements."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Currently, Echoes Cafe is a web-based platform optimized for both desktop and mobile browsers. We're working on dedicated mobile apps for iOS and Android - stay tuned for updates!"
    },
    {
      question: "How do I backup or export my stories?",
      answer: "You can export your contributions and completed stories from your profile page. We offer PDF, text, and EPUB formats. Premium users get additional export options and cloud backup features."
    },
    {
      question: "Can I collaborate with specific friends?",
      answer: "Absolutely! Create a private story room and invite your friends using their usernames or email addresses. You can also form writing groups and set up recurring collaborative sessions."
    }
  ];

  const quickActions = [
    {
      title: "Search Help Articles",
      description: "Find answers to specific questions",
      icon: <Search className="h-5 w-5" />,
      action: "Search"
    },
    {
      title: "Contact Support",
      description: "Get personalized help from our team",
      icon: <Mail className="h-5 w-5" />,
      action: "Contact"
    },
    {
      title: "Report a Bug",
      description: "Help us improve the platform",
      icon: <Settings className="h-5 w-5" />,
      action: "Report"
    },
    {
      title: "Feature Request",
      description: "Suggest new features",
      icon: <Lightbulb className="h-5 w-5" />,
      action: "Suggest"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <HelpCircle className="h-8 w-8 text-orange-500 mr-3" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 dark:text-gray-200 heading-glow">
              Help Center
            </h1>
            <HelpCircle className="h-8 w-8 text-orange-500 ml-3" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Welcome to our comprehensive help center. Find answers, learn about features, 
            and get the most out of your storytelling experience at Echoes Cafe.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickActions.map((action) => (
            <Card key={action.title} className="card-scale-hover cursor-pointer bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="text-orange-600 dark:text-orange-400">
                    {action.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{action.description}</p>
                <Button size="sm" variant="outline" className="border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-700">
                  {action.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-serif font-bold text-gray-800 dark:text-gray-200 text-center mb-8 heading-glow">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category) => (
              <Card key={category.title} className="card-scale-hover cursor-pointer bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-4">
                      <div className="text-orange-600 dark:text-orange-400">
                        {category.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{category.title}</h3>
                      <Badge className={category.color}>
                        {category.articles} articles
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Get help with {category.title.toLowerCase()} and related topics.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-serif font-bold text-gray-800 dark:text-gray-200 text-center mb-8 heading-glow">
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-orange-200/30 dark:border-gray-600/30 px-6"
                >
                  <AccordionTrigger className="text-left font-medium text-gray-800 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Contact Support Section */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-orange-100 via-pink-50 to-purple-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-orange-200/30 dark:border-gray-600/30">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Still Need Help?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                Our support team is here to help you with any questions or issues you might have. 
                We typically respond within 24 hours.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <Mail className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Email Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Get detailed help via email
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mb-4">
                    justufor11@gmail.com
                  </p>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" asChild>
                    <a href="mailto:justufor11@gmail.com">Email Us</a>
                  </Button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <Phone className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Phone Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Talk to our team directly
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mb-4">
                    +92 3340784840
                  </p>
                  <Button size="sm" variant="outline" className="border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-700" asChild>
                    <a href="tel:+923340784840">Call Now</a>
                  </Button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <MessageCircle className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Live Chat</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Instant help during business hours
                  </p>
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-green-600 dark:text-green-400">Online</span>
                  </div>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    Start Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status & Updates */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 text-center mb-6">
            System Status & Updates
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">All Systems Operational</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2 minutes ago</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-orange-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Scheduled Maintenance</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Next maintenance: Sunday, 2 AM EST (3 hours)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
