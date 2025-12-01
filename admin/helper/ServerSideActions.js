"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { auth_endpoints } from "@/utils/auth_endpoints";

// Remove session
export const Logout = async () => {
  (await cookies()).delete("session");
  redirect("/login");
};

// Get session token
export async function fetchToken() {
  const cookieStore = await cookies();
  return cookieStore.get("session")?.value;
}

export const LOGIN = async (body) => {

  try {
    /*
    const res = await fetch(auth_endpoints?.auth?.login, {
      method: "POST",
      //headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    */

    const formData = new FormData();
    formData.append("email", body.email);
    formData.append("password", body.password);

    const res = await fetch(auth_endpoints?.auth?.login, {
      method: "POST",
      body: formData,
    });

    const response = await res.json();
    if (response?.status === 403) Logout();
    if (response?.status !== 200) return response;
    const { token } = response;
    const cookieStore = await cookies();
    cookieStore.set({
      name: "session",
      value: token,
      httpOnly: true,
      path: "/",
    });

    return response;
  } catch (error) {
    return { status: 500, message: "Internal Server Error" };
  }
};

// Generic GET
export const GET = async (endpoint, tags) => {
  try {
    const token = await fetchToken();
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
      next: { tags },
    });

    return await res.json();
  } catch (error) {
    console.error("GET error:", error);
  }
};

// Generic POST with FormData
/*
export const POST = async (endpoint, formData, tags) => {
  try {
    const token = await fetchToken();
    const body = new FormData();
    if(formData){
      Object.entries(formData).forEach(([k, v]) => body.append(k, v));
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    const data = await res.json();
    if ([200, 201].includes(data?.status) && tags) revalidateTag(tags);
    return data;
  } catch (error) {
    console.error("POST error:", error);
  }
};
*/
export const POST = async (endpoint, formData = {}, tags) => {
  try {
    const token = await fetchToken();
    const body = new FormData();

    for (const [key, value] of Object.entries(formData)) {
      body.append(key, value);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    const data = await response.json();

    if ([200, 201].includes(response?.status) && tags) {
      revalidateTag(tags);
    }

    return data;
  } catch (error) {
    console.error("POST error:", error);
    return { error: true, message: error?.message };
  }
};

// POST JSON
export const POST_JSON = async (endpoint, body, tags, tag) => {
  try {
    const token = await fetchToken();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      next: { tags },
    });

    const data = await res.json();
    if (data?.status === 200) revalidateTag(tag);
    return data;
  } catch (error) {
    console.error("POST_JSON error:", error);
  }
};

// POST already-formed FormData
export const POST_WITH_FORMDATA = async (endpoint, body, tags, tag) => {
  try {
    const token = await fetchToken();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
      next: { tags },
    });

    const data = await res.json();
    if (tag && data?.status === 200) revalidateTag(tag);
    return data;
  } catch (error) {
    console.error("POST_WITH_FORMDATA error:", error);
  }
};
