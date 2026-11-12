import type { Category } from "@/lib/requests";

// Common requests, shared by the staff form and the AI (which picks one when it fits).
export const PRESETS: { id: string; label: string; text: string; category: Category }[] = [
  { id: "towels", label: "Towels", text: "Extra towels", category: "Housekeeping" },
  { id: "pillows", label: "Pillows", text: "Extra pillows", category: "Housekeeping" },
  { id: "cleaning", label: "Cleaning", text: "Room cleaning", category: "Housekeeping" },
  { id: "shower", label: "Shower / water", text: "Shower or hot water problem", category: "Maintenance" },
  { id: "heating", label: "Heating / AC", text: "Heating or air con problem", category: "Maintenance" },
  { id: "tv", label: "TV / Wi-Fi", text: "TV or Wi-Fi not working", category: "Maintenance" },
  { id: "broken", label: "Broken item", text: "Something is broken", category: "Maintenance" },
  { id: "checkout", label: "Late checkout", text: "Late checkout", category: "Front desk" },
  { id: "taxi", label: "Taxi", text: "Book a taxi", category: "Front desk" },
];
