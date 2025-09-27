import { getAirBase } from "@utils/airtable_fns";
import type { APIRoute } from "astro";
import type { GradeItem } from "@mytypes/classwork";

type ApiResponse = {
  success: boolean;
  message: string;
  data?: GradeItem[];
  error?: string;
  debugInfo?: any;
};

export const GET: APIRoute = async ({ params }) => {
  const { base_id, hid } = params;

  // Validate required parameters
  if (!base_id || !hid) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing required parameters: base_id and hid",
        error: "Invalid request",
      } as ApiResponse),
      {
        status: 400,
        statusText: "Bad Request",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    console.log(`Attempting to connect to base: ${base_id} for HID: ${hid}`);

    const base = getAirBase(base_id);
    console.log("Base connection established");

    // Get table references
    const gradesTable = base("Grades");
    const gradesFieldsTable = base("GradesFields");

    // Step 1: Check if HID exists in Grades table
    console.log("Checking HID in Grades table...");
    const studentGradesRecords = await gradesTable
      .select({
        filterByFormula: `{HID}="${hid}"`,
        maxRecords: 1,
      })
      .all();

    if (!studentGradesRecords || studentGradesRecords.length === 0) {
      console.log("No student found with provided HID");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid HID or student not found",
          error: "Student not found",
          debugInfo: { base_id, hid, step: "HID_verification" },
        } as ApiResponse),
        {
          status: 404,
          statusText: "Not Found",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`Found student record: ${studentGradesRecords[0].id}`);
    const studentRecord = studentGradesRecords[0];
    // Step 2: Get field names from GradesFields where Display=yes
    console.log("Fetching GradesFields...");
    const gradeFieldsRecords = await gradesFieldsTable
      .select({
        filterByFormula: `{Display}="yes"`,
        sort: [{ field: "Order", direction: "asc" }],
      })
      .all();

    console.log(`Found ${gradeFieldsRecords.length} grade fields to display`);

    if (!gradeFieldsRecords || gradeFieldsRecords.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No grades configured for display yet",
          data: [],
        } as ApiResponse),
        {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Step 3: Build the response data
    const gradeItems: GradeItem[] = [];
    let hasUnpublishedGrades = false;

    for (const fieldRecord of gradeFieldsRecords) {
      const fieldName = fieldRecord.get("Field") as string;
      const label = fieldRecord.get("Label") as string;
      const category = fieldRecord.get("Category") as string;
      const order = fieldRecord.get("Order") as number;

      console.log(`Processing field: ${fieldName} (${label})`);

      // Get the value from the student's grades record
      let rawValue = studentRecord.get(fieldName);
      rawValue = Array.isArray(rawValue) ? rawValue[0] : rawValue; // Handle Airtable array values
      rawValue =
        typeof rawValue === "number"
          ? parseFloat(rawValue.toFixed(2))
          : rawValue; // Round numbers to 2 decimal places
      console.log(`Raw value for ${fieldName}:`, rawValue);
      // Check if grade is not yet published (field doesn't exist or is null/undefined)
      let value: string | number | undefined;
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        hasUnpublishedGrades = true;
        value = "Grades not published yet";
      } else if (typeof rawValue === "string" || typeof rawValue === "number") {
        value = rawValue;
      } else {
        // For any other type (boolean, object, array, etc.), treat as unpublished
        hasUnpublishedGrades = true;
        value = "Grades not published yet";
      }

      gradeItems.push({
        field: fieldName,
        label: label,
        category: category,
        value: value,
        order: order,
      });
    }

    const response: ApiResponse = {
      success: true,
      message: hasUnpublishedGrades
        ? "Some grades not published yet"
        : "Grades retrieved successfully",
      data: gradeItems,
    };

    console.log("Successfully processed grades");
    return new Response(JSON.stringify(response), {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching grades:", error);

    // More detailed error information
    let errorMessage = "Unknown error";
    let errorStack = "";

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || "";
    } else {
      errorMessage = String(error);
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching grades",
        error: errorMessage,
        debugInfo: {
          baseId: base_id,
          hid: hid,
          timestamp: new Date().toISOString(),
          stack: errorStack,
        },
      } as ApiResponse),
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
