import { getEntry } from "astro:content";
import type { APIRoute } from "astro";
import type { Employment } from "@mytypes/content_types";

type EmploymentDetail = {
  id: string;
  position: string;
  address: string;
  startYear: string;
  endYear: string;
  duration: string;
  isCurrent: boolean;
  yearsOfService?: number;
  createdAt: string;
  updatedAt: string;
  internalId: string;
  revision: string;
};

type DetailApiResponse = {
  success: boolean;
  message: string;
  data?: EmploymentDetail;
  error?: string;
};

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Employment ID is required",
        error: "MISSING_EMPLOYMENT_ID",
      } as DetailApiResponse),
      {
        status: 400,
        statusText: "Bad Request",
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get specific employment record by ID
    const employmentRecord = await getEntry("employment", id);

    if (!employmentRecord) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Employment record not found",
          error: "EMPLOYMENT_NOT_FOUND",
        } as DetailApiResponse),
        {
          status: 404,
          statusText: "Not Found",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Transform to detailed employment format
    const startYear = employmentRecord.data.startYear;
    const endYear = employmentRecord.data.endYear;
    const isCurrent = endYear.toLowerCase() === 'now' || endYear.toLowerCase() === 'present' || endYear.toLowerCase() === 'current';
    
    // Calculate years of service
    let yearsOfService: number | undefined;
    if (startYear && endYear && !isCurrent) {
      const start = parseInt(startYear);
      const end = parseInt(endYear);
      if (!isNaN(start) && !isNaN(end)) {
        yearsOfService = end - start;
      }
    } else if (startYear && isCurrent) {
      const start = parseInt(startYear);
      const currentYear = new Date().getFullYear();
      if (!isNaN(start)) {
        yearsOfService = currentYear - start;
      }
    }

    const displayEndYear = isCurrent ? 'Present' : endYear;

    const employment: EmploymentDetail = {
      id: employmentRecord.id,
      position: employmentRecord.data.position,
      address: employmentRecord.data.address,
      startYear: employmentRecord.data.startYear,
      endYear: employmentRecord.data.endYear,
      duration: `${startYear} - ${displayEndYear}`,
      isCurrent,
      yearsOfService,
      createdAt: employmentRecord.data._createdAt,
      updatedAt: employmentRecord.data._updatedAt,
      internalId: employmentRecord.data._id,
      revision: employmentRecord.data._rev,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Employment record retrieved successfully",
        data: employment,
      } as DetailApiResponse),
      {
        status: 200,
        statusText: "OK",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600" // Cache for 1 hour
        },
      }
    );

  } catch (error) {
    console.error("Error fetching employment record:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching employment record",
        error: error instanceof Error ? error.message : "Unknown error",
      } as DetailApiResponse),
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};