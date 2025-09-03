import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import type { Education } from "@mytypes/content_types";

type EducationResponse = {
  id: string;
  institution: string;
  year: number;
  degree: string;
  description: string;
  location: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: EducationResponse[];
  count?: number;
  error?: string;
};

// Helper function to extract degree from content
function extractDegreeInfo(content: string): { degree: string; location: string } {
  // Extract degree (e.g., "M.Sc. in Mathematics" or "B.Sc. in Mathematics")
  const degreeMatch = content.match(/^([^,]+)/);
  const degree = degreeMatch ? degreeMatch[1].trim() : "Degree";
  
  // Extract location - typically at the end after institution name
  const locationMatch = content.match(/,\s*([^,]+(?:,\s*[^,]+)*)\s*(?:Thesis:|$)/i);
  let location = "";
  
  if (locationMatch) {
    // Clean up the location by removing institution name if it's repeated
    location = locationMatch[1].trim();
  } else {
    // Fallback: look for country patterns
    const countryMatch = content.match(/,\s*([^,]*(?:Saudi Arabia|USA|United States|Canada|UK|United Kingdom)[^,]*)/i);
    location = countryMatch ? countryMatch[1].trim() : "";
  }
  
  return { degree, location };
}

export const GET: APIRoute = async ({ url }) => {
  const searchParams = url.searchParams;
  const yearFilter = searchParams.get('year');
  const institutionFilter = searchParams.get('institution');
  const limit = searchParams.get('limit');
  const sortBy = searchParams.get('sort') || 'year'; // year, institution
  const order = searchParams.get('order') || 'desc'; // asc, desc

  try {
    // Get all education records from the content collection
    const educationRecords = await getCollection("education");

    // Transform education data
    let educations: EducationResponse[] = educationRecords.map(record => {
      const year = parseInt(record.data.year);
      const { degree, location } = extractDegreeInfo(record.data.content);

      return {
        id: record.id,
        institution: record.data.institution,
        year: isNaN(year) ? 0 : year,
        degree,
        description: record.data.content, // Rich text content
        location,
      };
    });

    // Apply filters
    if (yearFilter) {
      const year = parseInt(yearFilter);
      if (!isNaN(year)) {
        educations = educations.filter(edu => edu.year === year);
      }
    }

    if (institutionFilter) {
      educations = educations.filter(edu => 
        edu.institution.toLowerCase().includes(institutionFilter.toLowerCase())
      );
    }

    // Sort educations
    educations.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'year':
          comparison = a.year - b.year;
          break;
        case 'institution':
          comparison = a.institution.localeCompare(b.institution);
          break;
        default:
          comparison = a.year - b.year;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        educations = educations.slice(0, limitNum);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Retrieved ${educations.length} education record(s)`,
        count: educations.length,
        data: educations,
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
    console.error("Error fetching education data:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching education data",
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