import { redirect } from "next/navigation";

// The proxy sends guests to /login; everyone else starts on their projects.
export default function Home() {
  redirect("/projects");
}
