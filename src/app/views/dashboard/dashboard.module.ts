import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { WebCamModule } from 'ack-angular-webcam';
import { ControllerDataset } from '../../models/controller-dataset';
import { HttpClientModule } from '@angular/common/http';
import { HttpModule } from '@angular/http';
import { ChartComponent } from '../chart/chart.component';

import { ChartModule } from '@rijine/ngx-highcharts';

declare var require: any


@NgModule({
  imports: [
    FormsModule,
    DashboardRoutingModule,
    // ChartsModule,
    BsDropdownModule,
    ButtonsModule.forRoot(),
    WebCamModule,
    HttpModule,
    HttpClientModule,
    ChartModule.forRoot(require('highcharts'))
  ],
  declarations: [ DashboardComponent, ChartComponent],
  providers: [ControllerDataset]
})
export class DashboardModule { }
