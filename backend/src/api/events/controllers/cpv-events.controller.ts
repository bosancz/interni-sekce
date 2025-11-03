import { Controller, Get, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { CPVEventsListPermission } from "../acl/cpv-events.acl";
import { CPVEventResponse } from "../dto/cpv-event.dto";

@Controller("cpv-events")
@AcController()
@ApiTags("Events")
export class CPVEventsController {
	@Get("")
	@AcLinks(CPVEventsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(CPVEventResponse), isArray: true })
	async getCPVEvents(@Req() req: Request): Promise<CPVEventResponse[]> {
		// CPVEventsListPermission.canOrThrow(req);
		// const events = [];
		//   let i = 1;

		//   while (i <= 10) {
		// 	try {
		// 	  var padlerResponse = await axios(
		// 		`https://www.padler.cz/kalendar-akci/mesic/vse/rok/vse/lokalita/vse/typ-akce/1-2-5-9-17/strana/${i}/`,
		// 		{ responseType: "text" }
		// 	  );

		// 	  const $ = cheerio.load(padlerResponse.data, { xmlMode: true });

		// 	  $("a.trailLink").each((i, el) => {
		// 		const name = $(el).find(".trailLink__title").text().trim();
		// 		const link = $(el).attr("href");
		// 		const dateFrom = $(el).find(".trailLink__date").attr("datetime");

		// 		events.push({
		// 		  source: "padler",
		// 		  name,
		// 		  dateFrom,
		// 		  dateTill: dateFrom,
		// 		  link,
		// 		});
		// 	  });

		// 	  i++;
		// 	} catch (err) {
		// 	  break;
		// 	}
		//   }

		//   res.json(events);

		return [];
	}
}
