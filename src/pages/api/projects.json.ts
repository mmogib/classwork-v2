import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

type ProjectResponse = {
  id: string;
  title: string;
  description: string;
  status: "proposed" | "in-progress" | "completed" | "active" | "ongoing";
  startDate: string | null;
  endDate: string | null;
  url?: string;
  collaborators?: string[];
  keywords?: string[];
  order: number;
  duration?: number; // in months
  grantInfo?: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: ProjectResponse[];
  count?: number;
  error?: string;
};

// Helper function to extract project details from title field
function extractProjectInfo(title: string): {
  cleanTitle: string;
  startDate: string | null;
  endDate: string | null;
  collaborators: string[];
  grantInfo: string;
  duration: number | undefined;
} {
  let cleanTitle = title;
  let startDate: string | null = null;
  let endDate: string | null = null;
  let collaborators: string[] = [];
  let grantInfo = "";
  let duration: number | undefined;

  // Extract grant/project ID and title
  const titleMatch = title.match(/^([^:]+):\s*Title:\s*'([^']+)'/);
  if (titleMatch) {
    grantInfo = titleMatch[1].trim();
    cleanTitle = titleMatch[2].trim();
  }

  // Extract members/collaborators
  const membersMatch = title.match(/Members:\s*([^,]+(?:,\s*[^,]+)*?)(?:,\s*Grant:|$)/);
  if (membersMatch) {
    collaborators = membersMatch[1]
      .split(',')
      .map(member => member.trim().replace(/\((?:PI|CO-I)\)/g, '').trim())
      .filter(member => member.length > 0);
  }

  // Extract start date
  const startMatch = title.match(/Start:\s*([^,]+)/);
  if (startMatch) {
    const startStr = startMatch[1].trim();
    // Convert to ISO format (approximate)
    if (startStr.includes('Feb') || startStr.includes('February')) {
      const yearMatch = startStr.match(/\d{4}/);
      startDate = yearMatch ? `${yearMatch[0]}-02-01` : null;
    } else if (startStr.includes('Mar') || startStr.includes('March')) {
      const yearMatch = startStr.match(/\d{4}/);
      startDate = yearMatch ? `${yearMatch[0]}-03-01` : null;
    }
    // Add more month parsing as needed
  }

  // Extract end date
  const endMatch = title.match(/End:\s*([^,]+)/);
  if (endMatch) {
    const endStr = endMatch[1].trim();
    if (endStr.includes('Aug') || endStr.includes('August')) {
      const yearMatch = endStr.match(/\d{4}/);
      endDate = yearMatch ? `${yearMatch[0]}-08-31` : null;
    } else if (endStr.includes('Feb') || endStr.includes('February')) {
      const yearMatch = endStr.match(/\d{4}/);
      endDate = yearMatch ? `${yearMatch[0]}-02-29` : null;
    }
    // Add more month parsing as needed
  }

  // Extract duration
  const durationMatch = title.match(/duration:\s*(\d+)/);
  if (durationMatch) {
    duration = parseInt(durationMatch[1]);
  }

  return {
    cleanTitle,
    startDate,
    endDate,
    collaborators,
    grantInfo,
    duration,
  };
}

export const GET: APIRoute = async ({ url }) => {
  const searchParams = url.searchParams;
  const statusFilter = searchParams.get('status');
  const yearFilter = searchParams.get('year');
  const limit = searchParams.get('limit');
  const sortBy = searchParams.get('sort') || 'order'; // order, startDate, title, status
  const order = searchParams.get('order') || 'asc'; // asc, desc

  try {
    // Get all project records from the content collection
    const projectRecords = await getCollection("project");

    // Transform project data
    let projects: ProjectResponse[] = projectRecords.map(record => {
      const projectInfo = extractProjectInfo(record.data.title);
      
      // Map status - normalize "in-progress" to "active" or "ongoing" as requested
      let normalizedStatus: "proposed" | "in-progress" | "completed" | "active" | "ongoing" = record.data.status;
      if (record.data.status === "in-progress") {
        normalizedStatus = "ongoing"; // or "active" - choose your preference
      }

      return {
        id: record.id,
        title: projectInfo.cleanTitle,
        description: record.data.title, // Full original text as description
        status: normalizedStatus,
        startDate: projectInfo.startDate,
        endDate: projectInfo.endDate,
        collaborators: projectInfo.collaborators.length > 0 ? projectInfo.collaborators : undefined,
        order: record.data.order,
        duration: projectInfo.duration,
        grantInfo: projectInfo.grantInfo || undefined,
      };
    });

    // Apply filters
    if (statusFilter) {
      // Support both old and new status values
      const statusesToMatch = [statusFilter];
      if (statusFilter === "active" || statusFilter === "ongoing") {
        statusesToMatch.push("in-progress", "active", "ongoing");
      }
      projects = projects.filter(proj => statusesToMatch.includes(proj.status));
    }

    if (yearFilter) {
      const year = parseInt(yearFilter);
      if (!isNaN(year)) {
        projects = projects.filter(proj => {
          if (proj.startDate) {
            const startYear = parseInt(proj.startDate.split('-')[0]);
            return startYear === year;
          }
          return false;
        });
      }
    }

    // Sort projects
    projects.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'order':
          comparison = a.order - b.order;
          break;
        case 'startDate':
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = a.order - b.order;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        projects = projects.slice(0, limitNum);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Retrieved ${projects.length} project(s)`,
        count: projects.length,
        data: projects,
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
    console.error("Error fetching projects data:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching projects data",
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