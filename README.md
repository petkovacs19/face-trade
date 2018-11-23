# Trade with your face

Use your face as a controller for trading the market. With this simple web application, you can train a neural network in the browser using the webcam as input and market instructions as an output. Check it out, add some training samples, train your network and you are ready to trade.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

You need to node in order install dependencies and run the app on your machine.
Go to this [link](https://nodejs.org/en/download/) and install it on your hardware.


### Installing

To install the packages needed for the project, go to the root folder and type:


```
npm install
```

This will install all the packages specified in the package.json file in the project directory.

## Set your API key

Sign up for an API-KEY at https://forex.1forge.com. This will give you free 1000 requests per day.
Add your API-KEY in in app/services/forex-quote.service.ts.

```
  pairs = ['GBPUSD', 'EURUSD', 'GBPEUR']
  API_URL = 'https://forex.1forge.com/1.0.3/quotes'
  API_KEY = 'INSERT_YOUR_API_KEY_HERE'
```


## Start the application

```
ng serve
```

## Authors

* **Peter Kovacs** - *Initial work*
See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* This project is based on [PacMan](https://js.tensorflow.org/tutorials/webcam-transfer-learning.html) toy example of tensorflow.js 
