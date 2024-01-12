import Airtable from "airtable";
Airtable.configure({
  // endpointUrl: 'https://api.airtable.com',
  apiKey: import.meta.env.AIRTABLE_TOKEN,
});

export const getAirBase = (base: string) => Airtable.base(base);
