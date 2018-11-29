import { Component, OnInit } from "@angular/core";
import { ForexQuoteService } from "../../services/forex-quote.service";
import { TimerObservable } from "rxjs/observable/TimerObservable";
import "rxjs/add/operator/takeWhile";

@Component({
  selector: "app-chart",
  templateUrl: "./chart.component.html",
  styleUrls: ["./chart.component.scss"]
})
export class ChartComponent implements OnInit {
  options: any;
  chart: any;

  timeStamps: any[] = [];

  constructor(private forexQuoteService: ForexQuoteService) {
    this.options = {
      title: { text: "Price Chart GBP/USD" },
      xAxis: {
        categories: []
      },
      series: [
        {
          name: "BID",
          color: "#4DBD74",
          data: []
        },
        {
          name: "ASK",
          color: "#F86C6B",
          data: []
        }
      ],
      plotOptions: {
        line: {
          marker: {
            enabled: false
          }
        }
      }
    };
  }

  ngOnInit() {
    TimerObservable.create(0, 5000)
      .takeWhile(() => true)
      .subscribe(() => {
        this.forexQuoteService
          .getForexQuote(['GBPUSD'])
          .subscribe(forexQuote => {
            let bid = this.chart.series[0].data.map(dataValue => dataValue.y);
            let ask = this.chart.series[1].data.map(dataValue => dataValue.y);

            bid.push(forexQuote[0].bid);
            ask.push(forexQuote[0].ask);

            this.chart.series[0].setData(bid);
            this.chart.series[1].setData(ask);

            this.timeStamps.push(this.getCurrentTime());
            this.chart.xAxis[0].update({categories: this.timeStamps}, true)
          });
      });
  }

  getCurrentTime(): string {
    let currentDate = new Date();
    return `${currentDate.getHours().toString()}:${currentDate.getMinutes().toString()}:${currentDate.getSeconds().toString()}`;
  }

  saveInstance(chartInstance) {
    this.chart = chartInstance;

  }
}
