"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getUserRole } from "@/lib/api";

interface RoleContextType {
  role: "ADMIN" | "EMPLOYEE" | null;
  email: string | null;
  loading: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  email: null,
  loading: true,
  isAdmin: false,
  isEmployee: false,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<"ADMIN" | "EMPLOYEE" | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
          const data = await getUserRole(user.email);
          setRole(data.role);
        }
      } catch (err) {
        console.error("Failed to fetch role:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        setEmail(session.user.email);
        try {
          const data = await getUserRole(session.user.email);
          setRole(data.role);
        } catch {
          setRole("EMPLOYEE");
        }
      } else {
        setRole(null);
        setEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <RoleContext.Provider
      value={{
        role,
        email,
        loading,
        isAdmin: role === "ADMIN",
        isEmployee: role === "EMPLOYEE",
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
