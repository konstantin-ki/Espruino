/*
    Класс gasSensorMQ4 - 
*/
function gasSensorMQ4(_pinIn, _heatPin, _model ) {
    this.DriverMQ4 = undefined;
    this.Pin = _pinIn;
    this.HeatPin = _heatPin;
    this.Model = _model;
    this.BasePPM = 0.0; //_r0
    this.DataPPM = 0.0;
    this.DataProcent = 0.0;

    this.FlagRun = false;
}
/*

*/
gasSensorMQ4.prototype.init = function(){
    this.DriverMQ4 = require('@amperka/gas-sensor').connect({
        dataPin: this.Pin,
        heatPin: this.HeatPin,
        model: this.Model,
        r0: this.BasePPM
     });

    this.DriverMQ4.preheat( ()=> {
        this.BasePPM = this.DriverMQ4.calibrate();
        this.FlagRun = true;
    });
};
/*

*/
gasSensorMQ4.prototype.run = function(){
    //Запускаем считывание данных с сенсора
    setInterval( ()=> {
        if (this.FlagRun){
            this.DataPPM = this.DriverMQ4.read("CH4");
            this.DataProcent = this.DataPPM*0.0001;
        }
    }, 1000);
    
    //Запускаем вывод на консоль показаний сенсора
    setInterval( ()=>{
        this.dataPrint();
    }, 1000);
};
/*

*/
gasSensorMQ4.prototype.dataPrint = function(){
    //console.log("Calibration value:                 " + this.BasePPM.toFixed(2));
    console.log("The value of natural gas <PPM>:    " + this.DataPPM.toFixed(2));
    console.log("The value of natural gas <%>:      " + this.DataProcent.toFixed(2));
    console.log("*********************************************************");
    console.log(" ");
};
/*------------------------------------------------------------------------------------*/
//let status = 30;
//let work = false;

let SensorMQ4 = new gasSensorMQ4(A0, P13, "MQ4"/*, 7624.6977*/);
SensorMQ4.init();
SensorMQ4.run();