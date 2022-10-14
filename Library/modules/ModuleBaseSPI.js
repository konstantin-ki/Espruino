/**
 * @class
 * Класс ClassBaseSPIBus реализует базовые операции по созданию общего для проекта
 * хранилища объектов SPI шины.
 * Задачи класса динамически создавать и добавлять в контейнер новый объект SPI шины и предоставлять
 * прикладным классам экземпляры объектов, а также хранить информацию о том - занята данная, конкретная
 * шина или нет.
 * Класс хранит экземпляры предопределенных в Espruino SPI шин (SPI1, SPI2, SPI3),
 * а также создает soft шины SPI. При создании возвращается объект типа SPI шина.
 * Класс реализует паттерн - синглтон, т.е. экземпляр класса может быть только один.
 * 
 * 
 * Для работы класса понадобятся пользовательские типы данных, в том числе для передачи параметров.
 * Далее представлены определения этих типов в соответствии с синтаксисом JSDoc.
 * 
 * тип для передачи аргументов для генерации SPI объекта
 * @typedef  {Object} ObjectSPIBusParam - тип аргумента метода AddBus
 * @property {Object} mosi      1 - порт MOSI шины SPI, обязательное поле
 * @property {Object} miso      2 - порт MISO шины SPI, обязательное поле
 * @property {Object} sck       3 - порт SCK шины SPI, обязательное поле
 * Пример объекта с аргументами для генерации SPI объекта:
 * { mosi: D2, miso: D7, sck: A5 }
 * 
 * Тип для хранения сгенерированных объектов-шин SPI в экземпляре класса ClassBaseSPIBus
 * Фактически это тип поля SPIbus
 * @typedef  {Object} ObjectSPIcontainer     - тип контейнер хранящий сгенерированные шины
 * @property {Object} BusObjName            - ДИНАМИЧЕСКИ генерируемый ключ записи объекта.
 * Значение  * ключа представляет собой объект хранящий собственно генерируемую SPI шину а также
 * ряд прикладных характеристик, например используется ли в RUNTIME данная шина или свободна.
 * Имя ключа генерируется на основе паттерна SPIxx, т.е. итоговые имена могут быть: SPI10, SPI11...SPI19...
 * количество шин не ограничено.
 * Далее представлена структура объекта - значения:
 * {
 *  IDbus: <spi bus object those - result new SPI()>, //сгенерированный экземпляр шины SPI
 *  Used: true/false //состояние шины используется (true), не используется (false)
 * }
 * 
  */
class ClassBaseSPIBus {
    /**
     * @constructor
     */
    constructor() {
        this.Instance = null; //поле на основе которого реализуется синглтон

        this.SPIbus = {}; //контейнер объектов-шин SPI
        this.Pattern = 'SPI'; //базовая часть всех ключей объектов-шин SPI, полное название получается конкатенацией с текущим индексом
        this.IndexBus = 10; //начальный индекс soft шин, полный индекс будет вида SPI11, SPI12, SPI13 и т.д.

        //далее инициализируем контейнер первыми тремя шинами которые предустановлены в Espruino
        //это SPI1, SI2, SPI3. Свойство Used это индикатор использования шины
        this.SPIbus.SPI1= {IDbus: SPI1, Used: false}; 
        //this.SPIbus['SPI2'] = {IDbus: SPI2, Used: false};
        //this.SPIbus['SPI3'] = {IDbus: SPI3, Used: false};

        //реализация паттерна синглтон
        if (this.Instance) {
            return this.Instance;
        } else {
            ClassBaseSPIBus.prototype.Instance = this;
        }
    }
    /***********************************************КОНСТАНТЫ КЛАССА***********************************************/
    /**
     * Константа ERROR_CODE_ARG_MOSI_MISO_SCK_NOT_DEFINED определяет КОД ошибки,
     * которая может произойти при вызове метода AddBus в том случае если не был
     * передан один или более портов MOSI, MISO, SCK необходимых для создания SPI шины
     */
    static get ERROR_CODE_ARG_MOSI_MISO_SCK_NOT_DEFINED() { return 10; } 
    /**
     * Константа ERROR_MSG_ARG_MOSI_MISO_SCK_NOT_DEFINED определяет СООБЩЕНИЕ ошибки,
     * которая может      * произойти при вызове метода AddBus в том случае если не был
     * передан один или более портов MOSI, MISO, SCK необходимых для создания SPI шины
     */
    static get ERROR_MSG_ARG_MOSI_MISO_SCK_NOT_DEFINED() { return 'Error -> The MOSI, MISO, SCK port is not defined'; }
    /**
     * Константа ERROR_CODE_SPI_PIN_NOT_EXISTING определяет КОД ошибки, которая может
     * произойти в случае если для создания SPI шины были переданы не существующие порты
     * микроконтроллера, или занятые другими объектами
     */
    static get ERROR_CODE_SPI_PIN_NOT_EXISTING() { return 20;}
    /**
     * Константа ERROR_MSG_SPI_PIN_NOT_EXISTING определяет СООБЩЕНИЕ ошибки, которая может
     * произойти в случае если для создания SPI шины были переданы не существующие порты
     * микроконтроллера, или занятые другими объектами
     */
    static get ERROR_MSG_SPI_PIN_NOT_EXISTING() { return 'Error -> The SPI pin not existing'; }
    /**
     * Метод AddBus создает объект экземпляр класса SPI, как soft реализацию SPI шины.
     * Методу передается в качестве аргумента объект с параметрами создаваемой шины.
     * @param {ObjectSPIBusParam}   _opt        1 - объект с параметрами шины SPI
     * @returns {Object}            _retVal     1 - возвращаемый объект вида:
     *                                          { NameBus: bus_name, //имя созданной шины
     *                                            IDbus:   this.SPIbus.bus_name.IDbus //объект шина SPI
     *                                          }
     */
    AddBus(_opt) {
        /* данную конструкцию конструкцию расскоментировать в случае скачивания проекта с гитхаба, в таком случае
           локальна библиотека будет недоступна*/
        //const ClassErrorAppUser = require('https://github.com/konstantin-ki/Physics-heat-capacity/blob/main/js/module/ModuleAppError.js'); //импортируем прикладной класс ошибок
        
        const ClassErrorAppUser = require('ModuleAppError');
        /*проверить переданные параметры шины на валидность*/
        if ((typeof (_opt.mosi) === undefined) || (typeof (_opt.miso) === undefined) || (typeof (_opt.sck) === undefined)) {
            throw new ClassErrorAppUser(ClassBaseSPIBus.ERROR_MSG_ARG_MOSI_MISO_SCK_NOT_DEFINED,
                                        ClassBaseSPIBus.ERROR_CODE_ARG_MOSI_MISO_SCK_NOT_DEFINED);
        }

        if (!(_opt.mosi instanceof Pin) || !(_opt.miso instanceof Pin) || !(_opt.sck instanceof Pin)){
            throw new ClassErrorAppUser(ClassBaseSPIBus.ERROR_MSG_SPI_PIN_NOT_EXISTING,
                                        ClassBaseSPIBus.ERROR_CODE_SPI_PIN_NOT_EXISTING);
        }

        /*все необходимые для создания шины параметры переданы -> создать и инициализировать новую шину*/
        let bus_name = this.Pattern + this.IndexBus; //полное имя ключа текущей шины
        
        this.SPIbus.bus_name = {
            IDbus: new SPI(), //сгенерировать шину
            Used: true //индикатор использования шины в true
        };
        this.SPIbus.bus_name.IDbus.setup(_opt); //инициализировать шину
        
        ++this.IndexBus; //увеличить индекс шины
        
        return {
                NameBus: bus_name, //имя созданной шины
                IDbus:   this.SPIbus.bus_name.IDbus //объект шина SPI
            };
    }
}
exports = ClassBaseSPIBus; //экспортируем класс, ВНИМАНИЕ - именно класс а не объект!