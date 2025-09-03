import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

type CourseResponse = {
  id: string;
  code: string;
  name: string;
  url: string;
  term: {
    name: string;
    year: number;
    semester: string;
    isActive: boolean;
    termNumber: number;
  };
  teacher: {
    name: string;
    email: string;
    title: string;
  };
  credits?: number;
  level?: "undergraduate" | "graduate";
  section: string;
  url2?: string;
  airbase?: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: CourseResponse[];
  count?: number;
  error?: string;
};

// Helper function to determine course level based on course code
function determineCourseLevel(code: string): "undergraduate" | "graduate" {
  // Extract numeric part of course code
  const numericMatch = code.match(/(\d+)/);
  if (numericMatch) {
    const courseNumber = parseInt(numericMatch[1]);
    // Graduate courses typically 500+ or 600+
    return courseNumber >= 500 ? "graduate" : "undergraduate";
  }
  return "undergraduate"; // default
}

// Helper function to extract semester from term name
function extractSemesterInfo(termName: string, termNumber: number): { 
  semester: string; 
  year: number; 
} {
  // Extract year from term name (e.g., "Fall 2013/14" -> 2013)
  const yearMatch = termName.match(/(\d{4})/);
  let year = yearMatch ? parseInt(yearMatch[1]) : 2000;
  
  // If term name contains "/", it spans academic years, use first year
  if (termName.includes('/')) {
    year = yearMatch ? parseInt(yearMatch[1]) : 2000;
  }
  
  // Determine semester from term name
  let semester = "Fall"; // default
  if (termName.toLowerCase().includes('fall')) {
    semester = "Fall";
  } else if (termName.toLowerCase().includes('spring')) {
    semester = "Spring";
  } else if (termName.toLowerCase().includes('summer')) {
    semester = "Summer";
  } else {
    // Fallback: determine from term number pattern
    // KFUPM uses: 1st digit = decade, 2nd digit = year, 3rd digit = semester
    // e.g., 251 = 2025, semester 1 (Fall)
    const termStr = termNumber.toString();
    if (termStr.length === 3) {
      const semesterCode = parseInt(termStr.charAt(2));
      switch (semesterCode) {
        case 1: semester = "Fall"; break;
        case 2: semester = "Spring"; break;
        case 3: semester = "Summer"; break;
        default: semester = "Fall";
      }
      
      // Extract year from term number: 251 -> 20(2)5 + (1) -> 2025
      const decade = parseInt(termStr.charAt(0)) * 10;
      const yearDigit = parseInt(termStr.charAt(1));
      year = 2000 + decade + yearDigit;
    }
  }
  
  return { semester, year };
}

export const GET: APIRoute = async ({ url }) => {
  const searchParams = url.searchParams;
  const activeFilter = searchParams.get('active') === 'true';
  const termFilter = searchParams.get('term');
  const levelFilter = searchParams.get('level') as "undergraduate" | "graduate" | null;
  const codeFilter = searchParams.get('code');
  const limit = searchParams.get('limit');
  const sortBy = searchParams.get('sort') || 'term'; // term, code, name
  const order = searchParams.get('order') || 'desc'; // asc, desc

  try {
    // Get all collections
    const [courses, terms, teachers] = await Promise.all([
      getCollection("course"),
      getCollection("term"),
      getCollection("teacher")
    ]);

    // Create lookup maps using the file IDs
    const termMap = new Map(terms.map(term => [term.id, term.data]));
    const teacherMap = new Map(teachers.map(teacher => [teacher.id, teacher.data]));

    // Transform course data
    let transformedCourses = courses
      .map(course => {
        // Extract the term and teacher IDs from the reference objects
        const termRef = course.data["term._ref"];
        const teacherRef = course.data["teacher._ref"];
        
        // Handle both string and object references
        const termId = typeof termRef === 'string' ? termRef : termRef?.id;
        const teacherId = typeof teacherRef === 'string' ? teacherRef : teacherRef?.id;
        
        const termData = termMap.get(termId);
        const teacherData = teacherMap.get(teacherId);

        if (!termData) {
          console.log(`Missing term data for course ${course.id}, looking for term: ${termId}`);
          return null;
        }
        
        if (!teacherData) {
          console.log(`Missing teacher data for course ${course.id}, looking for teacher: ${teacherId}`);
          return null;
        }

        const level = determineCourseLevel(course.data.code);
        const { semester, year } = extractSemesterInfo(termData.name, termData.term_num);

        return {
          id: course.id,
          code: course.data.code,
          name: course.data.name,
          url: course.data.url,
          term: {
            name: termData.name,
            year: year,
            semester: semester,
            isActive: termData.isActive,
            termNumber: termData.term_num,
          },
          teacher: {
            name: teacherData.teacher_name,
            email: teacherData.email,
            title: teacherData.title,
          },
          level: level,
          section: course.data.section,
          url2: course.data.url2,
          airbase: course.data.airbase,
        } as CourseResponse;
      })
      .filter((course): course is CourseResponse => course !== null);

    // Apply filters
    if (activeFilter) {
      transformedCourses = transformedCourses.filter(course => course.term.isActive);
    }

    if (termFilter) {
      transformedCourses = transformedCourses.filter(course => 
        course.term.name.toLowerCase().includes(termFilter.toLowerCase()) ||
        course.term.termNumber.toString() === termFilter
      );
    }

    if (levelFilter) {
      transformedCourses = transformedCourses.filter(course => course.level === levelFilter);
    }

    if (codeFilter) {
      transformedCourses = transformedCourses.filter(course => 
        course.code.toLowerCase().includes(codeFilter.toLowerCase())
      );
    }

    // Sort courses
    transformedCourses.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'term':
          comparison = a.term.termNumber - b.term.termNumber;
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = a.term.termNumber - b.term.termNumber;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        transformedCourses = transformedCourses.slice(0, limitNum);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Retrieved ${transformedCourses.length} course(s)`,
        count: transformedCourses.length,
        data: transformedCourses,
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
    console.error("Error fetching courses data:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching courses data",
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