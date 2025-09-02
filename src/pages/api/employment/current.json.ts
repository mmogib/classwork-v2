import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import type { Employment } from "@mytypes/content_types";

type CurrentEmployment = {
  id: string;
  position: string;
  address: string;
  startYear: string;
  yearsOfService: number;
  duration: string;
};

type CurrentApiResponse = {
  success: boolean;
  message: string;
  data?: CurrentEmployment[];
  count?: number;
  error?: string;
};

export const GET: APIRoute = async () => {
  try {
    // Get all employment records from the content collection
    const employmentRecords = await getCollection("employment");

    // Filter for current positions (endYear = 'now')
    const currentEmployments: CurrentEmployment[] = employmentRecords
      .filter(record => {
        const endYear = record.data.endYear.toLowerCase();
        return endYear === 'now' || endYear === 'present' || endYear === 'current';
      })
      .map(record => {
        const startYear = record.data.startYear;
        const currentYear = new Date().getFullYear();
        const start = parseInt(startYear);
        const yearsOfService = !isNaN(start) ? currentYear - start : 0;

        return {
          id: record.id,
          position: record.data.position,
          address: record.data.address,
          startYear: record.data.startYear,
          yearsOfService,
          duration: `${startYear} - Present`,
        };
      })
      .sort((a, b) => parseInt(b.startYear) - parseInt(a.startYear)); // Most recent first

    return new Response(
      JSON.stringify({
        success: true,
        message: `Retrieved ${currentEmployments.length} current employment record(s)`,
        count: currentEmployments.length,
        data: currentEmployments,
      } as CurrentApiResponse),
      {
        status: 200,
        statusText: "OK",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=1800" // Cache for 30 minutes
        },
      }
    );

  } catch (error) {
    console.error("Error fetching current employment data:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching current employment data",
        error: error instanceof Error ? error.message : "Unknown error",
      } as CurrentApiResponse),
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};