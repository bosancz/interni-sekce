import { formatDate } from "@angular/common";
import { Pipe, PipeTransform } from "@angular/core";
// (value: string | number | Date, format: string, locale: string, timezone?: string): string

@Pipe({
  name: "dateRange",
})
export class DateRangePipe implements PipeTransform {
  transform(
    value: [string | Date | undefined | null, string | Date | undefined | null],
    format1: string = "d. M. y",
    format2: string = "d. M.",
    format3: string = "d.",
    separator: string = " – ",
  ): string {
    if (value[0] && value[1]) {
      let dateFrom = new Date(value[0]);
      let dateTill = new Date(value[1]);

      if (dateFrom.getFullYear() !== dateTill.getFullYear())
        return formatDate(dateFrom, format1, "cs") + separator + formatDate(dateTill, format1, "cs");
      if (dateFrom.getMonth() !== dateTill.getMonth())
        return formatDate(dateFrom, format2, "cs") + separator + formatDate(dateTill, format1, "cs");
      if (dateFrom.getDate() !== dateTill.getDate())
        return formatDate(dateFrom, format3, "cs") + separator + formatDate(dateTill, format1, "cs");
      return formatDate(dateFrom, format1, "cs");
    }

    if (value[0]) {
      return "?" + separator + formatDate(new Date(value[0]), format1, "cs");
    }

    if (value[1]) {
      return formatDate(new Date(value[1]), format1, "cs") + separator + "?";
    }

    return "?" + separator + "?";
  }
}
