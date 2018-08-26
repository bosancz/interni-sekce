export class EventRecurring{
  recurring:string;
  startDate:Date;
  endDate:Date;
  instances:any[];
}

export class Event {
  
  _id:string;
  status:string;
  
  name:string;
  type:string;
  subtype:string;
  place:string;
  description:string;
  
  dateFrom:Date;
  dateTill:Date;
  recurring?:EventRecurring;
  
  order?:number;
  
  meeting: {
    start:string,
    end:string
  };
  
  attendees:any[];
  leaders:any[];
  
  groups?:string[];
  leadersEvent?:boolean;
}