import { getAirBase } from "@utils/airtable_fns";
import type { APIRoute } from "astro";

type Assignment = {
  assignment_id: string;
  title: string;
  assignment_url: string;
  due_date: string;
  points_max: number;
  solution_released: boolean;
  solution_url?: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: Assignment[];
  error?: string;
};

export const GET: APIRoute = async ({ params }) => {
  const { base_id } = params;

  // Validate base_id parameter
  if (!base_id || !/^app[a-zA-Z0-9]{14}$/.test(base_id)) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Invalid base ID format",
        error: "INVALID_BASE_ID",
      } as ApiResponse),
      {
        status: 400,
        statusText: "Bad Request",
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const base = getAirBase(base_id);
    const assignmentsTable = base("Assignments");

    // Get assignments where is_current=true AND Status="released"
    const assignmentRecords = await assignmentsTable
      .select({
        filterByFormula: `AND({is_current}=1, {Status}="released")`,
        sort: [{ field: "Due_Date", direction: "asc" }],
      })
      .all();

    if (!assignmentRecords || assignmentRecords.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No current assignments available",
          data: [],
        } as ApiResponse),
        {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build response data
    const assignments: Assignment[] = assignmentRecords.map((record) => {
      const solutionReleased = record.get("solution_released") === 1;

      const assignment: Assignment = {
        assignment_id: record.get("Assignment_ID") as string,
        title: record.get("Title") as string,
        assignment_url: record.get("Assignment_URL") as string,
        due_date: record.get("Due_Date") as string,
        points_max: record.get("Points_Max") as number,
        solution_released: solutionReleased,
      };

      // Only include solution_url if solution is released
      if (solutionReleased && record.get("Solution_URL")) {
        assignment.solution_url = record.get("Solution_URL") as string;
      }

      return assignment;
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Found ${assignments.length} current assignment(s)`,
        data: assignments,
      } as ApiResponse),
      {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching assignments:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching assignments",
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
