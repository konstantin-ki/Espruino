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
 * Класс < ClassGasMonitor_MQ > обеспечивает контроль концентрации метана
 * в помещении
 * @param {string} _portADC         1- порт получения данных
 * @param {string} _portHeat        2- порт управления нагревателем
 * @param {string} _model           3- модель датчика (например MQ4)
 * @param {number} _timeHeat        4- время прогрева датчика перед измерением
 * @param {number} _timeMeasurement 5- интервал опроса датчика _timeMeasurement
 * @param {number} _startV          6- значение напряжение для первоначального заполнения массива
 * @param {number} _num             7- длина массива данных датчика
 * @param {number} _vref            8- опорное значение напряжения АЦП
 * 
 */
class ClassGasMonitor_MQ {
    constructor( _portADC
                ,_portHeat
                ,_model
                ,_timeHeat
                ,_timeMeasurement
                ,_startV
                ,_num
                ,_vref
    ) {
        this.PortADC =  _portADC;
        this.PortHeat = _portHeat;
        this.Model = _model;
        this.TimeHeat = _timeHeat;//время прогрева датчика
        this.TimeMeasurement = _timeMeasurement;
        this.StartV = _startV; //стартовое значение для заполнения массива
        this.Num = _num; //длина массива
        this.Vref = _vref || 3.3;

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