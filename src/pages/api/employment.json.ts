import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

type EmploymentResponse = {
  id: string;
  position: string;
  address: string;
  startYear: string;
  endYear: string;
  duration: string;
  isCurrent: boolean;
  yearsOfService?: number;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: EmploymentResponse[];
  count?: number;
  error?: string;
};

export const GET: APIRoute = async ({ url }) => {
  const searchParams = url.searchParams;
  const currentOnly = searchParams.get('current_only') === 'true';
  const sortBy = searchParams.get('sort') || 'startYear'; // startYear, endYear, position
  const order = searchParams.get('order') || 'desc'; // asc, desc
  const limit = searchParams.get('limit');

  try {
    // Get all employment records from the content collection
    const employmentRecords = await getCollection("employment");

    // Transform employment data
    let employments: EmploymentResponse[] = employmentRecords.map(record => {
      const startYear = record.data.startYear;
      const endYear = record.data.endYear;
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

      return {
        id: record.id,
        position: record.data.position,
        address: record.data.address,
        startYear: record.data.startYear,
        endYear: record.data.endYear, // Keep original value
        duration: `${startYear} - ${displayEndYear}`,
        isCurrent,
        yearsOfService,
      };
    });

    // Apply filters
    if (currentOnly) {
      employments = employments.filter(emp => emp.isCurrent);
    }

    // Sort employments
    employments.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'startYear':
          const startA = parseInt(a.startYear) || 0;
          const startB = parseInt(b.startYear) || 0;
          comparison = startA - startB;
          break;
        case 'endYear':
          // Handle 'now'/'present'/'current' as current year for sorting
          const endA = a.isCurrent ? new Date().getFullYear() : (parseInt(a.endYear) || 0);
          const endB = b.isCurrent ? new Date().getFullYear() : (parseInt(b.endYear) || 0);
          comparison = endA - endB;
          break;
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
        default:
          const defaultStartA = parseInt(a.startYear) || 0;
          const defaultStartB = parseInt(b.startYear) || 0;
          comparison = defaultStartA - defaultStartB;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        employments = employments.slice(0, limitNum);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Retrieved ${employments.length} employment record(s)`,
        count: employments.length,
        data: employments,
      } as ApiResponse),
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
    console.error("Error fetching employment data:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching employment data",
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