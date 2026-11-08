"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/shared/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMe } from "@/features/auth/api";
import { AlertsCard } from "@/features/profile/alerts-card";
import { PreferencesForm } from "@/features/profile/preferences-form";
import { ProfileForm } from "@/features/profile/profile-form";
import { SecurityCard } from "@/features/profile/security-card";
import { ShareLinkCard } from "@/features/profile/share-link-card";
import { T } from "@/components/shared/t";

export default function SettingsPage() {
  const { data: user } = useMe();
  if (!user) return <PageLoader />;

  return (
    <>
      <PageHeader title={<T en="Settings" bn="সেটিংস" />} description={<T en="Profile, accessibility, sharing and security." bn="প্রোফাইল, সহজ ব্যবহার, শেয়ারিং ও নিরাপত্তা।" />} />
      <Tabs defaultValue="profile">
        <TabsList className="mb-4 flex h-auto flex-wrap">
          <TabsTrigger value="profile"><T en="Profile" bn="প্রোফাইল" /></TabsTrigger>
          <TabsTrigger value="preferences"><T en="Accessibility & voice" bn="ভাষা ও ভয়েস" /></TabsTrigger>
          {(user.role === "PATIENT" || user.role === "CAREGIVER") && <TabsTrigger value="alerts"><T en="SMS & call alerts" bn="SMS ও কল অ্যালার্ট" /></TabsTrigger>}
          {user.role === "PATIENT" && <TabsTrigger value="share"><T en="Doctor sharing" bn="ডাক্তারকে শেয়ার" /></TabsTrigger>}
          <TabsTrigger value="security"><T en="Security" bn="নিরাপত্তা" /></TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileForm key={user.id} user={user} />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesForm user={user} />
        </TabsContent>
        {(user.role === "PATIENT" || user.role === "CAREGIVER") && (
          <TabsContent value="alerts">
            <AlertsCard user={user} />
          </TabsContent>
        )}
        {user.role === "PATIENT" && (
          <TabsContent value="share">
            <ShareLinkCard user={user} />
          </TabsContent>
        )}
        <TabsContent value="security">
          <SecurityCard user={user} />
        </TabsContent>
      </Tabs>
    </>
  );
}
