import {
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  HeartHandshake,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type TabItem = {
  id: string
  label: string
  somaliLabel: string
  icon: LucideIcon
  badge?: number
}

export const ADMIN_TABS: TabItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    somaliLabel: 'Xogtaada',
    icon: LayoutDashboard,
  },
  { id: 'players', label: 'Players', somaliLabel: 'Ciyaartoy', icon: Users },
  {
    id: 'attendance',
    label: 'Attendance',
    somaliLabel: 'Xaadiris',
    icon: CheckCircle,
  },
  { id: 'stats', label: 'Stats', somaliLabel: 'Natiijo', icon: TrendingUp },
  { id: 'requests', label: 'Requests', somaliLabel: 'Codsi', icon: Inbox },
  { id: 'schedule', label: 'Schedule', somaliLabel: 'Jadwal', icon: Calendar },
  { id: 'chat', label: 'Chat', somaliLabel: 'Wadahadal', icon: MessageSquare },
  { id: 'gallery', label: 'Gallery', somaliLabel: 'Sawiro', icon: ImageIcon },
  {
    id: 'finance',
    label: 'Finance',
    somaliLabel: 'Lacagta',
    icon: HeartHandshake,
  },
  { id: 'tips', label: 'Tips', somaliLabel: 'Waano', icon: Lightbulb },
  { id: 'rules', label: 'Rules', somaliLabel: 'Sharci', icon: BookOpen },
]

export const PLAYER_TABS: TabItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    somaliLabel: 'Xogtaada',
    icon: LayoutDashboard,
  },
  {
    id: 'attendance',
    label: 'Attendance',
    somaliLabel: 'Xaadiris',
    icon: CheckCircle,
  },
  { id: 'schedule', label: 'Schedule', somaliLabel: 'Jadwal', icon: Calendar },
  { id: 'leaves', label: 'Leaves', somaliLabel: 'Fasax', icon: FileText },
  {
    id: 'suggestions',
    label: 'Suggestions',
    somaliLabel: 'Fikrad',
    icon: Lightbulb,
  },
  { id: 'chat', label: 'Chat', somaliLabel: 'Wadahadal', icon: MessageSquare },
  { id: 'gallery', label: 'Gallery', somaliLabel: 'Sawiro', icon: ImageIcon },
  {
    id: 'finance',
    label: 'Finance',
    somaliLabel: 'Lacagta',
    icon: HeartHandshake,
  },
  { id: 'tips', label: 'Tips', somaliLabel: 'Waano', icon: Lightbulb },
  { id: 'rules', label: 'Rules', somaliLabel: 'Sharci', icon: BookOpen },
]
