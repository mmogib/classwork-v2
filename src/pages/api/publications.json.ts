import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

type Publication = {
  id: string;
  key: string;
  title: string;
  authors: string[];
  journal?: string;
  volume?: number | string;
  number?: number | string;
  pages?: string | number;
  year?: number;
  article_id?: string;
  published?: boolean;
  accepted?: boolean;
  doi?: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: Publication[];
  count?: number;
  error?: string;
};

export const GET: APIRoute = async ({ url }) => {
  const searchParams = url.searchParams;
  const yearFilter = searchParams.get('year');
  const publishedFilter = searchParams.get('published'); // 'true', 'false'
  const acceptedFilter = searchParams.get('accepted'); // 'true', 'false'
  const authorFilter = searchParams.get('author');
  const journalFilter = searchParams.get('journal');
  const limit = searchParams.get('limit');
  const sortBy = searchParams.get('sort') || 'year'; // year, title, key
  const order = searchParams.get('order') || 'desc'; // asc, desc

  try {
    // Get all papers from the content collection
    const papers = await getCollection("papers");

    // Transform papers to publication format
    let publications: Publication[] = papers.map(paper => ({
      id: paper.id,
      key: paper.data.key,
      title: paper.data.title,
      authors: paper.data.authors,
      journal: paper.data.journal,
      volume: paper.data.volume,
      number: paper.data.number,
      pages: paper.data.pages,
      year: paper.data.year,
      article_id: paper.data.article_id,
      published: paper.data.published,
      accepted: paper.data.accepted,
      doi: paper.data.doi,
    }));

    // Apply filters
    if (yearFilter) {
      const year = parseInt(yearFilter);
      if (!isNaN(year)) {
        publications = publications.filter(pub => pub.year === year);
      }
    }

    if (publishedFilter !== null) {
      const isPublished = publishedFilter === 'true';
      publications = publications.filter(pub => pub.published === isPublished);
    }

    if (acceptedFilter !== null) {
      const isAccepted = acceptedFilter === 'true';
      publications = publications.filter(pub => pub.accepted === isAccepted);
    }

    if (authorFilter) {
      publications = publications.filter(pub => 
        pub.authors.some(author => 
          author.toLowerCase().includes(authorFilter.toLowerCase())
        )
      );
    }

    if (journalFilter) {
      publications = publications.filter(pub => 
        pub.journal?.toLowerCase().includes(journalFilter.toLowerCase())
      );
    }

    // Sort publications
    publications.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'year':
          comparison = (a.year || 0) - (b.year || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'key':
          comparison = a.key.localeCompare(b.key);
          break;
        default:
          comparison = (a.year || 0) - (b.year || 0);
      }
      
      return order === 'desc' ? -comparison : comparison;
    });

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        publications = publications.slice(0, limitNum);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Retrieved ${publications.length} publication(s)`,
        count: publications.length,
        data: publications,
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
    console.error("Error fetching publications:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching publications",
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