import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit, Eye, EyeOff, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface EditProfileDialogProps {
  user: User & { hearts?: number; contributions?: number; experience?: number };
  onUpdate: (updatedUser: Partial<User>) => void;
}

export function EditProfileDialog({ user, onUpdate }: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    nickname: user.nickname || user.username || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nickname.trim()) {
      newErrors.nickname = "Nickname is required";
    } else if (formData.nickname.length < 2) {
      newErrors.nickname = "Nickname must be at least 2 characters";
    } else if (formData.nickname.length > 20) {
      newErrors.nickname = "Nickname must be less than 20 characters";
    }

    // If changing password
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Current password is required to change password";
      }
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = "New password must be at least 8 characters";
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.newPassword)) {
        newErrors.newPassword = "Password must contain uppercase, lowercase, number, and special character";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        nickname: formData.nickname.trim()
      };

      // Only include password if changing
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        throw new Error('Server returned invalid response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Update the user data
      onUpdate({ ...user, nickname: formData.nickname.trim() });
      
      toast({
        title: "Profile Updated! ✨",
        description: "Your changes have been saved successfully.",
      });

      // Reset form and close dialog
      setFormData({
        nickname: formData.nickname.trim(),
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-orange-500" />
            Edit Your Profile
          </DialogTitle>
          <DialogDescription>
            Update your display nickname and password. Changes will be saved to your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nickname Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Label htmlFor="nickname" className="text-sm font-medium">
                  Display Nickname
                  <span className="text-xs text-gray-500 block">This will appear when you contribute to stories</span>
                </Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  placeholder="Your storytelling nickname"
                  className={errors.nickname ? "border-red-500" : ""}
                />
                {errors.nickname && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">{errors.nickname}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Change Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Change Password (Optional)</Label>
                
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    placeholder="Current password"
                    className={errors.currentPassword ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.currentPassword && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">{errors.currentPassword}</AlertDescription>
                  </Alert>
                )}

                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="New password"
                    className={errors.newPassword ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.newPassword && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">{errors.newPassword}</AlertDescription>
                  </Alert>
                )}

                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">{errors.confirmPassword}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
