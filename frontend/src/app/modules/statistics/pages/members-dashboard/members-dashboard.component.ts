import { Component, OnInit } from "@angular/core";
import { MemberRoles } from "src/app/config/member-roles";
import { ApiService } from "src/app/services/api.service";
import { SDK } from "src/sdk";

interface ChartData {
  labels: string[];
  datasets: { data: number[]; label?: string }[];
}

@Component({
  selector: "members-dashboard",
  templateUrl: "./members-dashboard.component.html",
  styleUrls: ["./members-dashboard.component.scss"],
  standalone: false,
})
export class MembersDashboardComponent implements OnInit {
  report?: SDK.MembersReportResponse;

  cities?: string[];

  roles = MemberRoles;

  agesData?: ChartData;

  agesOptions = {
    scales: {
      xAxes: [
        {
          stacked: true,
        },
      ],
      yAxes: [
        {
          stacked: true,
        },
      ],
    },
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadReport();
  }

  async loadReport() {
    this.report = await this.api.StatisticsApi.getMembersReport().then((res) => res.data);

    this.updateAgesData();
  }

  fillMissingKeys(data: { [key: string]: number }, min: number, max: number) {
    for (let i = min; i <= max; i++) data[i] = data[i] || 0;
  }

  updateAgesData() {
    if (!this.report || !this.report.ages) return (this.agesData = undefined);

    const min = Math.min(
      ...Object.values(this.report.ages).map((roleAges) =>
        Math.min(...Object.keys(roleAges).map((age) => Number(age))),
      ),
    );
    const max = Math.max(
      ...Object.values(this.report.ages).map((roleAges) =>
        Math.max(...Object.keys(roleAges).map((age) => Number(age))),
      ),
    );

    const agesData: ChartData = {
      labels: [],
      datasets: [],
    };

    for (let i = min; i <= max; i++) agesData.labels.push(String(i));

    for (let role of Object.entries(this.report.ages)) {
      for (let i = min; i <= max; i++) role[1][i] = role[1][i] || 0;
      agesData.datasets.push({ data: Object.values(role[1]), label: role[0] });
    }

    agesData.datasets.sort((a, b) => (a.label && b.label ? a.label.localeCompare(b.label) : 0));

    this.agesData = agesData;
  }

  getRolesColClass(rolesCount: number): string {
    return "col-" + Math.max(1, Math.floor(12 / (rolesCount + 1)));
  }

  getRoleValue(id: string) {
    return this.report?.rolesCount?.[id] || "-";
  }
}
