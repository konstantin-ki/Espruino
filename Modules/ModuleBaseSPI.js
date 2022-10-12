/**
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
 * @typedef  {Object} ObjectSPIBusParam - тип аргумента метода AddBus
 * @property {Object} mosi      1 - порт MOSI шины SPI, обязательное поле
 * @property {Object} miso      2 - порт MISO шины SPI, обязательное поле
 * @property {Object} sck       3 - порт SCK шины SPI, обязательное поле
 */
class ClassBaseSPIBus {
    constructor() {
        this.Instance = null; //поле на основе которого реализуется синглтон

        this.SPIbus = {}; //контейнер объектов-шин SPI
        this.KeyName = 'SPI1'; //базовая часть всех ключей объектов-шин SPI, полное название получается конкатенацией с текущим индексом
        this.IndexBus = 1; //начальный индекс soft шин, полный индекс будет вида SPI11, SPI12, SPI13 и т.д.

        //далее инициализируем контейнер первыми тремя шинами которые предустановлены в Espruino
        //это SPI1, SI2, SPI3. Свойство used это индикатор использования шины
        this.SPIbus['SPI1'] = {idbus: SPI1, used: false}; 
        this.SPIbus['SPI2'] = {idbus: SPI2, used: false};
        this.SPIbus['SPI3'] = {idbus: SPI3, used: false};

        //реализация паттерна синглтон
        if (this.Instance) {
            return this.Instance;
        } else {
            ClassBaseSPIBus.prototype.Instance = this;
        }
    }
    /***********************************************КОНСТАНТЫ КЛАССА***********************************************/

    /**
     * Константа класса ERROR_CODE_MOSI_NOT_DEFINED определяет КОД ошибки, которая может
     * произойти при вызове метода AddBus в том случае если не был передан порт MOSI для
     * создания шины
     */
    static get ERROR_CODE_MOSI_NOT_DEFINED() { return 10; }
    /**
     * Константа класса ERROR_MSG_MOSI_NOT_DEFINED определяет СООБЩЕНИЕ ошибки, которая может
     * произойти при вызове метода AddBus в том случае если не был передан порт MOSI для
     * создания шины
     */
    static get ERROR_MSG_MOSI_NOT_DEFINED() { return 'Error -> The MOSI port is not defined'; }
    /**
     * Константа класса ERROR_CODE_MISO_NOT_DEFINED определяет КОД ошибки, которая может
     * произойти при вызове метода AddBus в том случае если не был передан порт MISO для
     * создания шины
     */
    static get ERROR_CODE_MISO_NOT_DEFINED() { return 20; }
    /**
     * Константа класса ERROR_MSG_MISO_NOT_DEFINED определяет СООБЩЕНИЕ ошибки, которая может
     * произойти при вызове метода AddBus в том случае если не был передан порт MISO для
     * создания шины
     */
    static get ERROR_MSG_MISO_NOT_DEFINED() { return 'Error -> The MISO port is not defined'; }
    /**
     * Константа класса ERROR_CODE_SCK_NOT_DEFINED определяет КОД ошибки, которая может
     * произойти при вызове метода AddBus в том случае если не был передан порт SCK для
     * создания шины
     */
    static get ERROR_CODE_SCK_NOT_DEFINED() { return 30;}
    /**
     * Константа класса ERROR_MSG_SCK_NOT_DEFINED определяет СООБЩЕНИЕ ошибки, которая может
     * произойти при вызове метода AddBus в том случае если не был передан порт SCK для
     * создания шины
     */
    static get ERROR_MSG_SCK_NOT_DEFINED() {return 'Error -> The SCK port is not defined'; }
    /**
     * Метод AddBus создает объект экземпляр класса SPI, как soft реализацию SPI шины.
     * Методу передается в качестве аргумента объект с параметрами создаваемой шины.
     * @param {ObjectSPIBusParam} _opt      1 - объект с параметрами шины SPI
     */
    AddBus(_opt) {
        const ClassErrorAppUser = require('ErrorAppUser'); //импортируем прикладной класс ошибок
        /*проверить переданные параметры шины на валидность*/
        if (typeof (_opt.mosi) === undefined) { 
            throw new ClassErrorAppUser(ClassBaseSPIBus.ERROR_MSG_MOSI_NOT_DEFINED,
                                        ClassBaseSPIBus.ERROR_CODE_MOSI_NOT_DEFINED);
        }
        if (typeof (_opt.miso) === undefined) {
            throw new ClassErrorAppUser(ClassBaseSPIBus.ERROR_MSG_MISO_NOT_DEFINED,
                                        ClassBaseSPIBus.ERROR_CODE_MISO_NOT_DEFINED);
        }
        if (typeof (_opt.sck) === undefined) {
            throw new ClassErrorAppUser(ClassBaseSPIBus.ERROR_MSG_SCK_NOT_DEFINED,
                                        ClassBaseSPIBus.ERROR_CODE_SCK_NOT_DEFINED);
        }
        
        /*все необходимые для создания шины параметры переданы -> создать и инициализировать новую шину*/
        let bus_name = this.KeyName + this.IndexBus; //полное имя ключа текущей шины
        
        this.SPIbus[bus_name] = {
            idbus: new SPI(), //сгенерировать шину
            used: true //индикатор использования шины в true
        };
        this.SPIbus.bus_name.idbus.setup(_opt); //инициализировать шину
        
        ++this.IndexBus; //увеличить индекс шины
        
        return {
                BusName: bus_name, //имя созданной шины
                IdBus:   this.SPIbus.bus_name.idbus //объект шина SPI
            } 
    }
}
exports = ClassBaseSPIBus; //экспортируем класс, ВНИМАНИЕ - именно класс а не объект!