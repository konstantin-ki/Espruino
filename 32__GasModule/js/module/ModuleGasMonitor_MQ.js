/* Copyright (c) 2022 Konstantin Kukushkin, Pur3 Ltd. See the file LICENSE for copying permission. */

/*
  Модуль содержит классы и другие ресурсы для работы с датчиками газа серии MQ.
  Пример для использования
```


```
*/
 


/**
 * Класс < GasMonitorError > наследует и расширяет возможности базового класса ошибок.
 * Класс предназначен для поддержки ошибок класса < ClassGasMonitor_MQ >
 * Коды ошибок - см.константы класса < ClassGasMonitor_MQ >
 */
class GasMonitorError extends Error {
    constructor(_message, _code) {
        //super(_message); //наследует поле с описанием ошибки
        this.message = _message;
        this.name = "GasMonitorError"; //переопределяем имя типа
        this.Code = _code || 0; //поле с кодом ошибки
    }
}

/**
 * Для работы класса <ClassGasMonitor_MQ> требуется объект типа <ObjectClassGasMonitor_MQ>, 
 * необходимый в качестве передачи основного аргумента конструктору классса <ClassGasMonitor_MQ>
 * Для этого вводится пользовательский тип в соответствии с синтаксисом JSDoc
 * @typedef  {Object} ObjectClassGasMonitor_MQ
 * @property {Object} portADC         - порт получения данных //обязательное поле
 * @property {Object} portHeat        - порт управления нагревателем
 * @property {string} model           - модель датчика (например MQ4)
 * @property {number} timeHeat        - время прогрева датчика перед измерением
 * @property {number} timeMeasurement - интервал опроса датчика _timeMeasurement
 * @property {number} startV          - значение напряжение для первоначального заполнения массива
 * @property {number} num             - длина массива данных датчика
 * @property {number} vref            - опорное значение напряжения АЦП
 */


/**
 * Класс <ClassGasMonitor_MQ> обеспечивает контроль концентрации метана
 * в помещении
 * @param {ObjectClassGasMonitor_MQ} _ops - обект с инициализирующими данными :
 * 
 */
class ClassGasMonitor_MQ {
    constructor( _ops)
     {
        this.PortADC = _ops.portADC;//порт АЦП для считывания данных с датчика
        this.PortHeat = _ops.portHeat;//порт ШИМ для управления нагревателем 
        this.Model = _ops.model;//одель датчика
        this.TimeHeat = _ops.timeHeat;//время прогрева датчика
        this.TimeMeasurement = _ops.timeMeasurement;
        this.StartV = _ops.startV; //стартовое значение для заполнения массива
        this.Num = _ops.num; //длина массива
        this.Vref = _ops.vref || E.getValueVref;

        this._Value = 0; //значение датчика - концентрации газа
        this.Arr = []; //массив данных датчика, для вычисления среднего значения
        this.IdTimerCycleReadValue = null; //id таймера опроса датчика
        
        /*  Флаг <FlagRead> определяет фазу работы с датчиком:
            <FlagRead = true> - фаза считывание запущено
            <FlagRead = false> - фаза считывание остановлено */
        this.FlagRead = false;


        this.GasSensor = require('gas-sensor').connect({
            dataPin: this.PortADC, //порт данных
            heatPin: this.PortHeat, //порт управления нагревом
            model: this.Model
        }); //подключаем библиотеку Амперки для работы с датчиком
        this.Math = require('TMath v1.13').connect(this.Arr, this.Num); //подключаем математическую библиотеку

        /**
         * Поле < ReadValueBind > является Bind версией метода <ReadValue>.
         * Поле предназначено для внутренних по отношению к модулю
         * вызовов в асинхронном коде, например setTimeout(...), setInterval(...).
         * Посредством поля запускает аналогичный метод <ReadValue> с привязкой к контексту 
         * экземпляра класса
         */
        this.ReadValueBind = this.ReadValue.bind(this);
        
        /**
         * Поле <CycleReadValueBind> является Bind версией метода <CycleReadValue> .
         * Поле предназначено для внутренних по отношению к модулю
         * вызовов в асинхронном коде, например setTimeout(...), setInterval(...).
         * Посредством поля запускает аналогичный метод < CycleReadValue > с привязкой к контексту
         * экземпляра класса
         */ 
        this.CycleReadValueBind = this.CycleReadValue.bind(this);
        if (typeof(_ops.portADC) === undefined) {
            console.log ("the portADC argument is not specified");
        }
        else  if (typeof(_ops) === undefined) {
            console.log ("required argument is missing");
        }
        else  if (typeof(_ops.portHeat) === undefined) {
            console.log ("the portHeat argument is not specified");
        }
        else if (typeof(_ops.model) === undefined) {
            console.log ("the model argument is not specified");
        }
        else if (typeof(_ops.vref) === undefined) {
            console.log ("the vref argument is not specified");
        }
        else if (typeof(_ops.num) === undefined) {
            console.log ("the num argument is not specified");
        }
        else if (typeof(_ops.startV) === undefined) {
            console.log ("the startV argument is not specified");
        }
        else if (typeof(_ops.timeHeat) === undefined) {
            console.log ("the timeHeat argument is not specified");
        }
        else if (typeof(_ops.timeMeasurement) === undefined) {
            console.log ("the timeMeasurement argument is not specified");
        }
    }
    /***********************************************КОНСТАНТЫ КЛАССА***********************************************/
    /**
     * Константа класса < HEATING_TIME > определяет время ожидания прогрева датчика в ms
     */
    static get HEATING_TIME() {
        return 30000;
    }
    /**
     * Константа класса < ERROR_CODE_HEATING_IS_NOT_COMPLETED > определяет КОД ошибки
     * при запросе данных датчика в то время как прогрев датчика не был завершен
     */
    static get ERROR_CODE_HEATING_IS_NOT_COMPLETED() {
        return 10;
    }
    /**
     * Константа класса < ERROR_MSG_HEATING_IS_NOT_COMPLETED > определяет СООБЩЕНИЕ ошибки
     * при запросе данных датчика в то время как прогрев датчика не был завершен
     */
    static get ERROR_MSG_HEATING_IS_NOT_COMPLETED() {
        return 'Error -> Heating is not completed';
    }
    /**
     * Константа класса < ERROR_CODE_DATA_READING_STOPPED > определяет КОД ошибки
     * при запросе данных датчика в то время как фаза циклического опроса датчика
     * остановлена, т.е. с датчика не поступают данные
     */
    static get ERROR_CODE_DATA_READING_STOPPED(){
        return 11;
    }
    /**
     * Константа класса < ERROR_MSG_DATA_READING_STOPPED > определяет СООБЩЕНИЕ ошибки
     * при запросе данных датчика в то время как фаза циклического опроса датчика
     * остановлена, т.е. с датчика не поступают данные
     */
    static get ERROR_MSG_DATA_READING_STOPPED() {
        return 'Error -> Data reading stopped';
    }
    /**
     * 
     */
    static get ERROR_MSG_ () {
        return Msg;
    }
    /***********************************************END КОНСТАНТЫ*************************************************/
    /**
     * Геттер < Value > возвращает текущее значение показаний датчика
     */
    get Value() {
        if(this.FlagRead){
             if (this.IdTimerCycleReadValue === null){
                 /* выбросить исключение - прогрев датчика не завершен */
                 throw new GasMonitorError(   ClassGasMonitor_MQ.ERROR_MSG_HEATING_IS_NOT_COMPLETED
                                             ,ClassGasMonitor_MQ.ERROR_CODE_HEATING_IS_NOT_COMPLETED);
            }
            
            return this._Value; //вернуть значение датчика
            }
        if(!this.FlagRead){
            /* выбросить исключение - опрос датчика остановлен */
             throw new GasMonitorError(  ClassGasMonitor_MQ.ERROR_MSG_DATA_READING_STOPPED
                                        ,ClassGasMonitor_MQ.ERROR_CODE_DATA_READING_STOPPED);
        }
    }

    /**
     * Метод <GetValue>  возвращает текущее значение напряжение.
     * Данный метод фактически дублирует геттер (см. выше), это потребовалось для 
     * случаев когда строиться более сложная конструкция из нескольких классов
     * и присвоение геттера приводит к потере эффекта генерации, в таких случаях 
     * необходимо воспользоваться методом
     */
    GetValue() {
        if (this.FlagRead) {
            if (this.IdTimerCycleReadValue === null) {
                /* выбросить исключение - прогрев датчика не завершен */
                throw new GasMonitorError(   ClassGasMonitor_MQ.ERROR_MSG_HEATING_IS_NOT_COMPLETED
                                            ,ClassGasMonitor_MQ.ERROR_CODE_HEATING_IS_NOT_COMPLETED);
            }

            return this._Value; //вернуть значение датчика
        }
        if (!this.FlagRead) {
            /* выбросить исключение - опрос датчика остановлен */
            throw new GasMonitorError(   ClassGasMonitor_MQ.ERROR_MSG_DATA_READING_STOPPED
                                        ,ClassGasMonitor_MQ.ERROR_CODE_DATA_READING_STOPPED);
        }
    }

    /**
     * Сеттер <Value> записывает полю класса <_Value> заданное значение концентрации газа 
     * @param {number} _val 1- значение напряжения
     *
     */
    set Value(_val){
        this._Value = _val;
    }
    
    /**
     * Геттер <ValueAVG> возвращает среднее значение концентрации газа
     */
    get ValueAVG() {
        if (this.FlagRead) {
            if (this.IdTimerCycleReadValue === null) {
                /* выбросить исключение - прогрев датчика не завершен */
                throw new GasMonitorError(   ClassGasMonitor_MQ.ERROR_MSG_HEATING_IS_NOT_COMPLETED
                                            ,ClassGasMonitor_MQ.ERROR_CODE_HEATING_IS_NOT_COMPLETED);
            }

            return this.Math.AVG(); //вернуть усредненное значение датчика
        }
        if (!this.FlagRead) {
            /* выбросить исключение - опрос датчика остановлен */
            throw new GasMonitorError(   ClassGasMonitor_MQ.ERROR_MSG_DATA_READING_STOPPED
                                        ,ClassGasMonitor_MQ.ERROR_CODE_DATA_READING_STOPPED);
        }
    }

    /**
     * Метод <GetValueAVG> возвращает среднее значение напряжения.
     * Данный метод фактически дублирует геттер (см. выше), это потребовалось для 
     * случаев когда строиться более сложная конструкция из нескольких классов
     * и присвоение геттера приводит к потере эффекта генерации, в таких случаях 
     * необходимо воспользоваться методом
     */
    GetValueAVG(){
        if (this.FlagRead) {
            if (this.IdTimerCycleReadValue === null) {
                /* выбросить исключение - прогрев датчика не завершен */
                throw new GasMonitorError(   ClassGasMonitor_MQ.ERROR_MSG_HEATING_IS_NOT_COMPLETED
                                            ,ClassGasMonitor_MQ.ERROR_CODE_HEATING_IS_NOT_COMPLETED);
            }

            return this.Math.AVG(); //вернуть усредненное значение датчика
        }
        if (!this.FlagRead) {
            /* выбросить исключение - опрос датчика остановлен */
            throw new GasMonitorError(   ClassGasMonitor_MQ.ERROR_MSG_DATA_READING_STOPPED
                                        ,ClassGasMonitor_MQ.ERROR_CODE_DATA_READING_STOPPED);
        }
    }

    /**
     * Метод <HeatOn> включает нагрев датчика
     */
    HeatOn() {
        this.GasSensor.heat(true); //включить нагреватель
    }
    /**
     * Метод <HeatOff> выключает нагрев датчика
     */
    HeatOff() {
        this.GasSensor.heat(false); //включить нагреватель
    }

    /**
     * Метод <ReadValue> считывает концентрацию газа и присваивает её соответствующему полю.
     * Считывание производиться с использованием внешнего модуля
     */
    ReadValue() {
        this.Value = this.GasSensor.read('LPG');
            this.Math.Rotation(this.Value); //вызываем метод для записи напряжения в массив
    }

    /**
     * Метод <CycleReadValue> запускает периодическое считывание показаний датчика
     */
    CycleReadValue () {
         this.IdTimerCycleReadValue = setInterval(this.ReadValueBind, this.TimeMeasurement);
    }

    /**
     * Метод <StartReadValue> запускает периодическое считывание показаний датчика
     */
    StartReadValue () {
        if(this.FlagRead)
            return 1; //фаза запуска считывания уже запущена
        
        this.FlagRead = !this.FlagRead; //инвертировать флаг фазы работы с датчиком
        
        if(this.Arr.length == 0){
            //заполнение массива измеренных величин базовой величиной
            for(let i= 0; i<this.Num; i++) this.Arr.push(this.StartV); //первое заполнение
        }else{
            for (let i = 0; i < this.Num; i++) this.Arr[i] = this.StartV; //очередное заполнение
        }
        
        this.HeatOn(); //включить нагрев датчика
        
        /* после ПРОГРЕВА запустить метод циклического считывания данных датчика */
        setTimeout(this.CycleReadValueBind, this.TimeHeat);
    }

     /**
     * Метод <StopReadValue> ОСТАНАВЛИВАЕТ циклическое считывания данных датчика
     */
    StopReadValue(){
        if (!this.FlagRead)
            return 1; //фаза остановки считывания уже запущена

        this.FlagRead = !this.FlagRead; //инвертировать флаг фазы работы с датчиком
            this.HeatOff(); //выключить нагрев датчика
        
        clearInterval(this.IdTimerCycleReadValue); // остановить циклическое считывание данных датчика
            this.IdTimerCycleReadValue = null;
        
        this.Value = null; //"обнулить" поле-значение датчика
    }
}

exports = ClassGasMonitor_MQ; //экспортируем класс (ВНИМАНИЕ - именно класс а не экземпляр класса!)