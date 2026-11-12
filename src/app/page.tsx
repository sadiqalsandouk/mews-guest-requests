import { redirect } from "next/navigation";

// Two apps only: staff (/staff) and guest (/guest?room=…). Home opens staff.
export default function Home() {
  redirect("/staff");
}
