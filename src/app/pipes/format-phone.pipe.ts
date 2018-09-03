import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatPhone'
})
export class FormatPhonePipe implements PipeTransform {

  transform(value: string, type:string = "short", spaces:boolean = true): string {
    var p = value.match(/(\+420 ?)?(\d{3}) ?(\d{3}) ?(\d{3})/);
    
    var number = spaces ? p.slice(2,5).join(" ") : p.slice(2,5).join("");

    if(type === "short") return number;
    if(type === "long") return p[1] + " " + number;

  }

}
