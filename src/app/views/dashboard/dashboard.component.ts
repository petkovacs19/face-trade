import { Component, OnInit } from '@angular/core';
import { WebCamComponent } from 'ack-angular-webcam';
import * as tf from '@tensorflow/tfjs';
import { ForexQuoteService } from '../../services/forex-quote.service';
import { ControllerDataset } from '../../models/controller-dataset';
import { Http } from '@angular/http';
import { getStyle, hexToRgba } from '@coreui/coreui/dist/js/coreui-utilities';
import { CustomTooltips } from '@coreui/coreui-plugin-chartjs-custom-tooltips';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  webcam: WebCamComponent//will be populated by <ack-webcam [(ref)]="webcam">
  mobileNet;
  model;
  truncatedMobileNet;
  learningRate = 0.001;
  batchSizeFraction = 0.4;
  epochs = 20;
  hiddenUnits = 100;
  NUM_CLASSES = 2;
  mouseIsDown = false;
  loss = -1;
  isPredicting = false;
  actions = ['BUY', 'SELL'];
  lastAction = '';
  usd = 500;
  gbp = 500;
  transactionCounter = 0;

  counters: Map<Number, any> = new Map<Number, any>();


  constructor(public http: Http,
    private controllerDataset: ControllerDataset,
    private forexQuoteService: ForexQuoteService) {
    this.counters.set(0, 0)
    this.counters.set(1, 0);

  }

  ngOnInit(): void {
    this.mobileNet = this.loadMobileNet();
    for (let i = 0; i <= this.mainChartElements; i++) {
      this.mainChartData1.push(this.random(50, 200));
    }
  }

  onCamSuccess(event) {

  }
  onCamError(event) {

  }

  mouseDown(label) {
    this.mouseIsDown = true;
    this.handler(label);
  }

  mouseUp() {
    this.mouseIsDown = false;
  }

  async handler(label) {
    while (this.mouseIsDown) {
      this.addExample(label);
      await tf.nextFrame();
    }
  }

  addExample(label: Number) {
    tf.tidy(() => {
      this.webcam.getBase64().then(
        base64 => {
          const imageData = tf.fromPixels(this.drawThumb(base64, label));
          const croppedImage = this.cropImage(imageData).resizeBilinear([224, 224]);
          const batchedImage = croppedImage.expandDims(0);
          const norm = batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
          this.controllerDataset.addExample(this.truncatedMobileNet.predict(norm), label);
        }
      )
      this.counters.set(label, this.counters.get(label) + 1);
    });
  }

  draw(base64, canvas: HTMLCanvasElement): HTMLCanvasElement {
    let newImage = new Image();
    newImage.onload = function () {
      canvas.width = newImage.width;
      canvas.height = newImage.height;
      let context = canvas.getContext('2d');
      context.drawImage(newImage, 0, 0);
    };
    newImage.src = base64;
    return canvas;
  }

  drawThumb(img: string, label: Number): HTMLCanvasElement {
    const thumbCanvas: HTMLCanvasElement = document.getElementById('thumb-' + label) as HTMLCanvasElement;
    return this.draw(img, thumbCanvas);
  }

  loadMobileNet() {
    this.mobileNet = tf.loadModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json').then(
      (model) => {
        const layer = model.getLayer('conv_pw_13_relu');
        this.truncatedMobileNet = tf.model({ inputs: model.inputs, outputs: layer.output });
        console.log("Model loaded");
        return model;
      }
    );

  }


  train() {
    if (this.controllerDataset.isEmpty()) {
      throw new Error('Add some examples before training!');
    }

    // Creates a 2-layer fully connected model. By creating a separate model,
    // rather than adding layers to the mobilenet model, we "freeze" the weights
    // of the mobilenet model, and only train weights from the new model.
    this.model = tf.sequential({
      layers: [
        // Flattens the input to a vector so we can use it in a dense layer. While
        // technically a layer, this only performs a reshape (and has no training
        // parameters).
        tf.layers.flatten({
          inputShape: this.truncatedMobileNet.outputs[0].shape.slice(1)
        }),
        // Layer 1.
        tf.layers.dense({
          units: this.hiddenUnits,
          activation: 'relu',
          kernelInitializer: 'varianceScaling',
          useBias: true
        }),
        // Layer 2. The number of units of the last layer should correspond
        // to the number of classes we want to predict.
        tf.layers.dense({
          units: this.NUM_CLASSES,
          kernelInitializer: 'varianceScaling',
          useBias: false,
          activation: 'softmax'
        })
      ]
    });

    // Creates the optimizers which drives training of the model.
    const optimizer = tf.train.adam(this.learningRate);
    // We use categoricalCrossentropy which is the loss function we use for
    // categorical classification which measures the error between our predicted
    // probability distribution over classes (probability that an input is of each
    // class), versus the label (100% probability in the true class)>
    this.model.compile({ optimizer: optimizer, loss: 'categoricalCrossentropy' });

    // We parameterize batch size as a fraction of the entire dataset because the
    // number of examples that are collected depends on how many examples the user
    // collects. This allows us to have a flexible batch size.
    const batchSize =
      Math.floor(this.controllerDataset.getSize() * this.batchSizeFraction);
    if (!(batchSize > 0)) {
      throw new Error(
        `Batch size is 0 or NaN. Please choose a non-zero fraction.`);
    }

    // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
    this.model.fit(this.controllerDataset.getX(), this.controllerDataset.getY(), {
      batchSize,
      epochs: this.epochs,
      callbacks: {
        onBatchEnd: async (batch, logs) => {
          this.loss = logs.loss.toFixed(5);
        }
      }
    });
  }

  placeTrade(predictedClass: number) {
    this.transactionCounter +=1;
    this.lastAction = this.actions[predictedClass];

    this.mainChartData1.push(this.random(50, 200));
    this.mainChartLabels.push(1);
    this.mainChartElements += 1;
  }

  predictPressed() {
    this.isPredicting = !this.isPredicting;
  }

  async predict() {
    this.predictPressed();
    while (this.isPredicting) {
      const base64 = await this.webcam.getBase64(base64 => { return base64 });
      const canvas: HTMLCanvasElement = this.drawThumb(base64, 5);
      const predictedClass = tf.tidy(() => {
        const imageData = tf.fromPixels(canvas);
        const croppedImage = this.cropImage(imageData).resizeBilinear([224, 224]);
        const batchedImage = croppedImage.expandDims(0);
        const norm = batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
        const embeddings = this.truncatedMobileNet.predict(norm);
        const predictions = this.model.predict(embeddings);
        return predictions.as1D().argMax();
      });
      const classId = (await predictedClass.data())[0];
      this.placeTrade(classId);
      predictedClass.dispose();
      await tf.nextFrame();
    }
  }

  /**
  * Crops an image tensor so we get a square image with no white space.
  * @param {Tensor4D} img An input image Tensor to crop.
  */
  cropImage(img) {
    const size = Math.min(img.shape[0], img.shape[1]);
    const centerHeight = img.shape[0] / 2;
    const beginHeight = centerHeight - (size / 2);
    const centerWidth = img.shape[1] / 2;
    const beginWidth = centerWidth - (size / 2);
    return img.slice([beginHeight, beginWidth, 0], [size, size, 3]);
  }

  createModel() {
    const model = tf.sequential({
      layers: [
        // Flattens the input to a vector so we can use it in a dense layer. While
        // technically a layer, this only performs a reshape (and has no training
        // parameters).
        tf.layers.flatten({ inputShape: [7, 7, 256] }),
        tf.layers.dense({
          units: this.hiddenUnits,
          activation: 'relu',
          kernelInitializer: 'varianceScaling',
          useBias: true
        }),
        // The number of units of the last layer should correspond
        // to the number of classes we want to predict.
        tf.layers.dense({
          units: this.NUM_CLASSES,
          kernelInitializer: 'varianceScaling',
          useBias: false,
          activation: 'softmax'
        })
      ]
    });
  }

  async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }



  // mainChart

  public mainChartElements = 27;
  public mainChartData1: Array<number> = [];

  public mainChartData: Array<any> = [
    {
      data: this.mainChartData1,
      label: 'Current'
    }
  ];
  /* tslint:disable:max-line-length */
  public mainChartLabels: Array<any> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Thursday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  public mainChartOptions: any = {
    tooltips: {
      enabled: false,
      custom: CustomTooltips,
      intersect: true,
      mode: 'index',
      position: 'nearest',
      callbacks: {
        labelColor: function(tooltipItem, chart) {
          return { backgroundColor: chart.data.datasets[tooltipItem.datasetIndex].borderColor };
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        gridLines: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return value.charAt(0);
          }
        }
      }],
      yAxes: [{
        ticks: {
          beginAtZero: true,
          maxTicksLimit: 5,
          stepSize: Math.ceil(250 / 5),
          max: 250
        }
      }]
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
        hoverBorderWidth: 3,
      }
    },
    legend: {
      display: false
    }
  };
  public mainChartColours: Array<any> = [
    { // brandInfo
      backgroundColor: hexToRgba(getStyle('--info'), 10),
      borderColor: getStyle('--info'),
      pointHoverBackgroundColor: '#fff'
    },
    { // brandSuccess
      backgroundColor: 'transparent',
      borderColor: getStyle('--success'),
      pointHoverBackgroundColor: '#fff'
    },
    { // brandDanger
      backgroundColor: 'transparent',
      borderColor: getStyle('--danger'),
      pointHoverBackgroundColor: '#fff',
      borderWidth: 1,
      borderDash: [8, 5]
    }
  ];
  public mainChartLegend = false;
  public mainChartType = 'line';


  public random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }


  
}
