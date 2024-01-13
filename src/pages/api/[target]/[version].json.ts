import { getAirBase } from "@utils/airtable_fns";
import type { APIRoute } from "astro";
// try {
//     const records = await releases_table
//       .select({
//         filterByFormula: `AND({key}="${version}",{target}="${target}")`,
//       })
//       .all();
//     if (!records || records.length == 0) {
//       return res.status(NO_CONTENT).send("SUCCsESS");
//     }
//     const record = records[0];
//     const new_version: UpdaterResponse = {
//       url: record.get("url") as string,
//       version: record.get("version") as string,
//       notes: record.get("notes") as string,
//       pub_date: new Date(record.get("date") as string).toISOString(),
//       signature: record.get("signature") as string,
//     };

//     return res.status(OK).json({ ...new_version });
//   } catch (error) {
//     return res.status(NO_CONTENT).send("SUCCsESS");
//   }

type NEW_MC_RANDOMIZER_VERSION = {
  url: string;
  version: string;
  notes: string;
  pub_date: string;
  signature: string;
};
export const GET: APIRoute = async ({ params }) => {
  const { target, version } = params;
  let resp: {
    payload: NEW_MC_RANDOMIZER_VERSION | {};
    status: number;
    message: string;
  } = { payload: {}, status: 200, message: "Success" };
  try {
    // const app6gXRLg4WycmEgA
    const releases_table = getAirBase(import.meta.env.MCR_AIRTABLE_BASE)(
      "Releases"
    );
    const records = await releases_table
      .select({
        filterByFormula: `AND({key}="${version}",{target}="${target}")`,
      })
      .all();
    if (!records || records.length == 0) {
      resp.status = 204;
      resp.message = "No Content";
    }
    const record = records[0];
    resp.payload = {
      url: record.get("url") as string,
      version: record.get("version") as string,
      notes: record.get("notes") as string,
      pub_date: new Date(record.get("date") as string).toISOString(),
      signature: record.get("signature") as string,
    };
  } catch (error) {
    resp.status = 500;
    resp.message = error as string;
  }

  return new Response(JSON.stringify(resp.payload), {
    status: resp.status, // 204
    statusText: resp.message,
  });
};
