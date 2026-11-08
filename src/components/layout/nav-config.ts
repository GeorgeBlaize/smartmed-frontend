import {
  Bell,
  Bot,
  CreditCard,
  FileText,
  FlaskConical,
  HeartHandshake,
  LayoutDashboard,
  LineChart,
  Package,
  Pill,
  CalendarClock,
  Settings,
  Shield,
  Users,
  ScrollText,
  Receipt,
  FilePlus2,
  ScanLine,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  labelBn: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title?: string;
  titleBn?: string;
  items: NavItem[];
}

const ACCOUNT: NavGroup = {
  title: "Account", titleBn: "অ্যাকাউন্ট",
  items: [
    { href: "/dashboard/notifications", label: "Notifications", labelBn: "নোটিফিকেশন", icon: Bell },
    { href: "/dashboard/billing", label: "Billing", labelBn: "বিলিং", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", labelBn: "সেটিংস", icon: Settings },
  ],
};

export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  PATIENT: [
    {
      items: [
        { href: "/dashboard", label: "Today", labelBn: "আজকের ওষুধ", icon: LayoutDashboard },
        { href: "/dashboard/prescriptions", label: "Prescriptions", labelBn: "প্রেসক্রিপশন", icon: FileText },
        { href: "/dashboard/medicines", label: "Medicines", labelBn: "ওষুধসমূহ", icon: Pill },
        { href: "/dashboard/schedule", label: "Dose history", labelBn: "ওষুধ খাওয়ার ইতিহাস", icon: CalendarClock },
        { href: "/dashboard/cabinet", label: "Medicine cabinet", labelBn: "ওষুধের বাক্স", icon: Package },
        { href: "/dashboard/care", label: "Care circle", labelBn: "কেয়ার সার্কেল", icon: HeartHandshake },
      ],
    },
    {
      title: "AI tools", titleBn: "এআই টুলস",
      items: [
        { href: "/dashboard/assistant", label: "Health assistant", labelBn: "স্বাস্থ্য সহকারী", icon: Bot },
        { href: "/dashboard/ai-tools", label: "Medicine check", labelBn: "ওষুধ যাচাই", icon: FlaskConical },
        { href: "/dashboard/insights", label: "Insights", labelBn: "রিপোর্ট ও পরামর্শ", icon: LineChart },
      ],
    },
    ACCOUNT,
  ],
  CAREGIVER: [
    {
      items: [
        { href: "/dashboard", label: "My patients", labelBn: "আমার রোগীরা", icon: Users },
        { href: "/dashboard/care", label: "Invitations", labelBn: "আমন্ত্রণ", icon: HeartHandshake },
      ],
    },
    {
      title: "AI tools", titleBn: "এআই টুলস",
      items: [
        { href: "/dashboard/assistant", label: "Health assistant", labelBn: "স্বাস্থ্য সহকারী", icon: Bot },
        { href: "/dashboard/ai-tools", label: "Medicine check", labelBn: "ওষুধ যাচাই", icon: FlaskConical },
      ],
    },
    ACCOUNT,
  ],
  DOCTOR: [
    {
      items: [
        { href: "/dashboard", label: "Overview", labelBn: "সারসংক্ষেপ", icon: LayoutDashboard },
        { href: "/dashboard/issue/new", label: "Write prescription", labelBn: "প্রেসক্রিপশন লিখুন", icon: FilePlus2 },
        { href: "/dashboard/issue", label: "My prescriptions", labelBn: "আমার প্রেসক্রিপশন", icon: ClipboardList },
      ],
    },
    {
      title: "AI tools", titleBn: "এআই টুলস",
      items: [
        { href: "/dashboard/ai-tools", label: "Medicine check", labelBn: "ওষুধ যাচাই", icon: FlaskConical },
        { href: "/dashboard/assistant", label: "Health assistant", labelBn: "স্বাস্থ্য সহকারী", icon: Bot },
      ],
    },
    ACCOUNT,
  ],
  PHARMACY: [
    {
      items: [
        { href: "/dashboard", label: "Overview", labelBn: "সারসংক্ষেপ", icon: LayoutDashboard },
        { href: "/dashboard/issue/new", label: "Scan prescription", labelBn: "প্রেসক্রিপশন স্ক্যান", icon: ScanLine },
        { href: "/dashboard/issue", label: "Handed to customers", labelBn: "গ্রাহকদের দেওয়া", icon: ClipboardList },
      ],
    },
    {
      title: "AI tools", titleBn: "এআই টুলস",
      items: [{ href: "/dashboard/ai-tools", label: "Medicine check", labelBn: "ওষুধ যাচাই", icon: FlaskConical }],
    },
    ACCOUNT,
  ],
  ADMIN: [
    {
      title: "Administration", titleBn: "অ্যাডমিন",
      items: [
        { href: "/admin", label: "Overview", labelBn: "সারসংক্ষেপ", icon: Shield },
        { href: "/admin/users", label: "Users", labelBn: "ইউজার", icon: Users },
        { href: "/admin/prescriptions", label: "Prescriptions", labelBn: "প্রেসক্রিপশন", icon: FileText },
        { href: "/admin/payments", label: "Payments", labelBn: "পেমেন্ট", icon: Receipt },
        { href: "/admin/logs", label: "AI & audit logs", labelBn: "এআই ও অডিট লগ", icon: ScrollText },
      ],
    },
    {
      title: "Account", titleBn: "অ্যাকাউন্ট",
      items: [
        { href: "/dashboard/assistant", label: "Health assistant", labelBn: "স্বাস্থ্য সহকারী", icon: Bot },
        { href: "/dashboard/notifications", label: "Notifications", labelBn: "নোটিফিকেশন", icon: Bell },
        { href: "/dashboard/settings", label: "Settings", labelBn: "সেটিংস", icon: Settings },
      ],
    },
  ],
};
