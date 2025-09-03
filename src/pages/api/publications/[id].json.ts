import { getEntry } from "astro:content";
import type { APIRoute } from "astro";

type PublicationDetail = {
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

type DetailApiResponse = {
  success: boolean;
  message: string;
  data?: PublicationDetail;
  error?: string;
};

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Publication ID is required",
        error: "MISSING_PUBLICATION_ID",
      } as DetailApiResponse),
      {
        status: 400,
        statusText: "Bad Request",
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get specific paper by ID
    const paper = await getEntry("papers", id);

    if (!paper) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Publication not found",
          error: "PUBLICATION_NOT_FOUND",
        } as DetailApiResponse),
        {
          status: 404,
          statusText: "Not Found",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Transform to detailed publication format
    const publication: PublicationDetail = {
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
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Publication retrieved successfully",
        data: publication,
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
    console.error("Error fetching publication:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error while fetching publication",
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