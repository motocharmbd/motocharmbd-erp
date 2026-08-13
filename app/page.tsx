import { redirect } from "next/navigation";

export default function Home() {
  // কেউ আপনার মেইন ডোমেইনে (যেমন: moto-charm.vercel.app) আসলে সরাসরি লগইন পেজে নিয়ে যাবে
  redirect("/login");
}