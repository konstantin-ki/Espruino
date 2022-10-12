/**
 * Класс ClassBaseSDcard реализует базовые операции с SD картой.
 * Задачи класса динамически создавать объекты для работы с SD картами и обеспечивать
 * прикладные классы  операциями чтения, записи, системными и др.
 * 
 * ВНИМАНИЕ: данный класс как и все последующие работающие с цифровыми шинами -
 * SPI, I2C, OneWire, UART в своем коде опирается на наличие в RUNTIME объекта-
 * контейнера данных шин. То есть при создании экземпляров класса им не передаются
 * объекты шин, ни в конструкторе ни в в одном из методов, при этом считается что на
 * момент создания объектов таких прикладных классов как ClassBaseSDcard, и производных
 * от них, объекты шин созданы и доступны по ФИКСИРОВАННЫМ именам. При этом объекты
 * таких шин-контейнеров построены по паттерну SINGLETON, и в RUNTIME находится
 * ровно один такой объект.
 * В данном классе используется контейнер SPI шин, с именем объекта - SPIbus
 * 
 * Аргументы конструктора:
 * @param {Object}              _spiOpt     1 - объект содержащий Pin-ы шины SPI, объект типа ObjectSPIBusParam, см. модуль ModuleBaseSPI
 * @param {Object}              _csPin      2 - Pin отвечающий за сигнал CS карты  SD
 */
class ClassBaseSDcard {
    constructor(_spiOpt, _csPin) {
        //***************************Блок объявления полей класса****************************
        this.ClassErrorAppUser = require('ErrorAppUser'); //импортируем прикладной класс ошибок

        /*проверить переданные аргументы на валидность*/
        if ( typeof(_csPin) === undefined ) {
            throw new ClassErrorAppUser(ClassBaseSDcard.ERROR_MSG_ARG_NOT_DEFINED + ". Arg error: _csPin",
                                        ClassBaseSDcard.ERROR_CODE_ARG_NOT_DEFINED);
        }
        /*аргументы относящиеся к SPI шине проверяются на валидность в модуле ClassBaseSPIBus*/
        try{
            this.SD.SPIBus = SPIbus.AddBus(_spiOpt); //сгенерировать объект SPI
        } catch(e){
            console.log(e.message); //описание исключения см. в модуле ModuleBaseSPI
        }
        this.SD.CSpin = _csPin; //объект Pin для формирования сигнала CS карты SD

        /*TRANSFER ВНИМАНИЕ: код подлежит переносу в класс ClassMidleSDcard
        this.StatusButton = _butInd; //Pin кнопки, для ручного action unmount
        this.StatusInd = _ledPin; //Pin светодиода, отображение статуса unmount
        */

        this._FlagStatusSD = false; //флаг характеризующий состояние SD карты mount/unmount

        //***************************Блок инициализирующих методов конструктора***************
        this.ConnectSD(); //смонтировать SD карту
        /*TRANSFER ВНИМАНИЕ: код подлежит переносу в класс ClassMidleSDcard
        this.CompleteWorkSD(); //запустить мониторинг кнопки управления статусом SD карты (смонтирована/размонтирована)
        */
    }
    /***********************************************КОНСТАНТЫ КЛАССА***********************************************/

    /**
     * Константа класса ERROR_CODE_ARG_NOT_DEFINED определяет КОД ошибки, которая может
     * произойти если при передачи в конструктор не корректных аргументов
     */
    static get ERROR_CODE_ARG_NOT_DEFINED() { return 10; }
    /**
     * Константа класса ERROR_MSG_ARG_NOT_DEFINED определяет СООБЩЕНИЕ ошибки, которая может
     * произойти если при передачи в конструктор не корректных аргументов
     */
    static get ERROR_MSG_ARG_NOT_DEFINED() { return 'Error -> invalid arguments the constructor'; }
    /**
     * Константа класса ERROR_CODE_SD_UNMOUNTED определяет КОД ошибки, которая
     * возникает при попытке вызвать операцию чтения/записи при размонтированной карте
     */
    static get ERROR_CODE_SD_UNMOUNTED() { return 11; }
    /**
     * Константа класса ERROR_MSG_SD_UNMOUNTED определяет СООБЩЕНИЕ ошибки, которая
     * возникает при попытке вызвать операцию чтения/записи при размонтированной карте
     */
    static get ERROR_MSG_SD_UNMOUNTED() { return 'Error -> accessing the unmounted SD'; }
    /**
     * 
     */
    get FlagStatusSD() {
        return this._FlagStatusSD;
    }
    /**
     * 
     */
    set FlagStatusSD(_flag) {
        this._FlagStatusSD = _flag;
    }
    /***
     * Метод ConnectSD "монтирует" карту SD
     */
    ConnectSD() {
        E.connectSDCard(this.SD.SPIBusParam, this.SD.CSpin); //инициализация SD карты в системе Espruino
            this.FlagStatusSD = true; //карта смонтирована
    }
    /**
     * Метод DisconnectSD "размонтирует" карту SD, готовя ее к извлечению
     */
    DisconnectSD() {
        E.unmountSD();
            this.FlagStatusSD = false; //карта размонтирована
        /*TRANSFER ВНИМАНИЕ: код подлежит переносу в класс ClassMidleSDcard
        digitalWrite(this.StatusInd, 1); //включить светодиод сигнализирующий о размонтировании SD карты
        TRANSFER*/

        //*DEBUG*/ console.log(`DEBUG-> SD card unmount`);
        //*DEBUG*/ Terminal.println(`SD card umount`);
    }
    /*TRANSFER ВНИМАНИЕ: метод CompleteWorkSD ПОЛНОСТЬЮ подлежит переносу в класс ClassMidleSDcard
    /**
     * Метод CompleteWorkSD позволяет размонтировать карту в ручном режиме, нажав кнопку.
     * Для работы необходимо передать порт на котором работает кнопка
     
    CompleteWorkSD() {
        //мониторим кнопку, сработка при отпускании кнопки
        setWatch(this.DisconnectSD.bind(this), this.StatusButton, {
            edge: "falling",
            debounce: 50,
            repeat: true
        });
    }*/
    
    /**
     * Метод <ViewListFiles> перенести в класс ClassBaseSDcard
     */
    ViewListFiles() {
        if (this.FlagStatusSD) {
            //*DEBUG*/console.log(this.FS.readdirSync()); //вывести список файлов в консоль
            return require("fs").readdirSync(); //вернуть список файлов/директорий
        } else {
            //выбросить исключение, SD карта размонтирована
            throw new ClassErrorAppUser(ClassBaseSDcard.ERROR_MSG_SD_UNMOUNTED,
                                        ClassBaseSDcard.ERROR_CODE_SD_UNMOUNTED);
        }
    }
}
exports = ClassBaseSDcard; //экспортируем класс, ВНИМАНИЕ - именно класс а не объект!