import type { GradeItem } from "@mytypes/classwork";
import { getAirBase } from "@utils/airtable_fns";

export async function getActiveCLWItems(basename: string) {
  // const base = getAirBase(basename);
  // const coursecBase = await base("courses");
  // const records = await coursecBase
  //   .select({
  //     maxRecords: 1,
  //     filterByFormula: `Name='${course}'`,
  //   })
  // .all();
  // const courseBaseKey = records[0].fields.Base;
  const courseBase = getAirBase(basename);
  const table = courseBase("GradesFields");
  const recs = await table
    .select({
      maxRecords: 100,
      filterByFormula: `AND(Display='yes')`,
      sort: [{ field: "Order", direction: "asc" }],
    })
    .all();
  const items = recs.map((rec) => {
    return {
      label: rec.fields.Label,
      field: rec.fields.Field,
      category: rec.fields.Category,
      order: rec.fields.Order,
    };
  });
  return items as GradeItem[];
}

export async function checkStudentCode(student_code: string, basename: string) {
  try {
    const courseBase = getAirBase(basename);
    const table = courseBase("Grades");
    const records = await table.find(student_code);
    if (records) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}
export async function getStudentCLW(
  basename: string,
  id: string,
  items: GradeItem[]
) {
  const courseBase = getAirBase(basename);
  const table = courseBase("Grades");
  const record = await table.find(id);
  const grades = items.map((item) => {
    // const value =
    //   record.fields && Array.isArray(record.fields[item.field])
    //     ? record.fields[item.field][0]
    //     : record.fields[item.field];
    const value = (record.fields[item.field || ""] || "") as string;
    const val =
      item.category !== "grade" || isNaN(parseFloat(value))
        ? value
        : Math.round(parseFloat(value) * 100) / 100;
    return {
      label: item.label,
      category: item.category,
      value: val,
      order: item.order,
    };
  });
  return grades;
}
