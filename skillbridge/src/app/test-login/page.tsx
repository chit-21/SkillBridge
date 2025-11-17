"use client";

import React from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "@/lib/firebase";

export default function TestLoginPage() {
  async function testLogin() {
    try {
      console.log("Firebase config in clientAuth:", (clientAuth as any)?.app?.options);
      const userCred = await signInWithEmailAndPassword(
        clientAuth,
        "schitranshu040@gmail.com",
        "Chit@21102002"
      );
      const idToken = await userCred.user.getIdToken();
      console.log("ID TOKEN:", idToken);
      alert("Login success! Check console for ID token.");
    } catch (err: any) {
      // Print full error info to console
      console.error("LOGIN ERROR - full:", err);
      if (err?.code) console.error("Error code:", err.code);
      if (err?.message) console.error("Error message:", err.message);
      alert(`Login failed: ${err?.code || err?.message || "unknown error"}. See console.`);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-4">Test Login</h1>
      <button
        onClick={testLogin}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md"
      >
        Test Login
      </button>
    </div>
  );
}
