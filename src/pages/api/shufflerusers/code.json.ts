import { getAirBase } from "@utils/airtable_fns";
import type { APIRoute } from "astro";
const base_id = "appOdGSj0GN5tVeks";

type ShufflerUser = {
  name: string;
  email: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: ShufflerUser;
  error?: string;
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  console.log("Request body:", body);
  const { code } = body;
  // const { code } = params;
  // Validate code parameter
  if (!code || typeof code !== "string") {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Invalid code format",
        error: "INVALID_CODE",
      } as ApiResponse),
      {
        status: 400,
        statusText: "Bad Request",
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const base = getAirBase(base_id);
    const assignmentsTable = base("Users");

    // Get assignments where is_current=true AND Status="released"
    const assignmentRecords = await assignmentsTable
      .select({
        filterByFormula: `AND(IS_AFTER({expirationDate}, '${today}'),{Status}="active", {Code}="${code}")`,
      })
      .all();
    if (!assignmentRecords || assignmentRecords.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No current assignments available",
          data: {},
        } as ApiResponse),
        {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build response data
    const users: ShufflerUser = assignmentRecords.map((record) => {
      const user: ShufflerUser = {
        name: record.get("FullName") as string,
        email: record.get("Email") as string,
      };

      return user;
    })[0];

    return new Response(
      JSON.stringify({
        success: true,
        message: `Found one user`,
        data: users,
      } as ApiResponse),
      {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching users:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching users",
        error: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse),
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
